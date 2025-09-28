# DouKeeper バックエンド詳細設計

## 1. 文書の目的
- 要件定義書・基本設計書に記載されたバックエンド要件を実装できる粒度まで分解する。
- Amplify/Lambda/API Gateway/Cognito/DynamoDB 構成における API 契約・データモデル・運用要件を網羅する。
- フロントエンドがサーバー API と連携する際の前提条件・インターフェースを明文化する。

## 2. 前提・全体構成
- デプロイ環境: AWS Amplify (dev/staging/prod)。
- REST API: API Gateway (HTTP API) + Lambda (Node.js 20) + Cognito JWT 認証。
- データ永続化: DynamoDB (オンデマンドモード)。
- 認証: Cognito User Pool + App Client (PKCE) + Hosted UI は任意。アクセストークンは Authorization ヘッダーで送信。
- ログ/監視: CloudWatch Logs, CloudWatch Metrics, Amplify Monitoring。

## 3. API 共通仕様
### 3.1 HTTP
- ベース URL: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}` ※ Amplify が生成。
- 全リクエスト: `Content-Type: application/json`, `Authorization: Bearer <JWT>`。
- レスポンスフォーマット:
  ```json
  {
    "data": <任意>,
    "error": null
  }
  ```
  エラー時:
  ```json
  {
    "data": null,
    "error": { "code": "STRING_CODE", "message": "ローカライズなしの英語メッセージ", "details": { ... } }
  }
  ```
- タイムゾーン: すべて UTC ISO8601 (`2025-09-08T03:21:54.123Z`)。
- 数値: 非負整数 (在庫関連), 通貨は整数円。

### 3.2 認証/認可
- Cognito Authorizer が JWT を検証。`sub` を `userId` として利用。
- Lambda 内で `event.requestContext.authorizer.jwt.claims.sub` を必須としてバリデーション。
- すべての DynamoDB 操作は `userId` をパーティションキーに含め、クロステナントアクセスを防止。

### 3.3 エラーコード
| コード | HTTP | 意味 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 入力不備 (zod で生成) |
| `NOT_FOUND` | 404 | リソース未存在 |
| `CONFLICT` | 409 | 在庫不足・重複などの整合性違反 |
| `UNAUTHORIZED` | 401 | JWT 無効 |
| `FORBIDDEN` | 403 | ユーザーID不一致 |
| `INTERNAL_ERROR` | 500 | 予期しない例外 |

## 4. エンドポイント詳細
### 4.1 `/works`
| メソッド | 概要 | 認可 |
| --- | --- | --- |
| POST | 作品を作成 | 必須 |
| GET | 作品一覧 (userId 単位) | 必須 |
| PATCH `/works/{id}` | 作品の部分更新 | 必須 |
| DELETE `/works/{id}` | 作品と関連頒布の削除 | 必須 |

#### POST /works
- リクエストボディ (zod):
  ```ts
  const schema = z.object({
    title: z.string().trim().min(1).max(120),
    initialStock: z.number().int().min(0),
    currentStock: z.number().int().min(0).optional(), // 未指定なら initialStock
    price: z.number().int().min(0).optional(),
    memo: z.string().max(500).optional(),
  });
  ```
- 処理: `currentStock` 未指定時は `initialStock` で初期化。`crypto.randomUUID()` で `workId` を生成。DynamoDB Put (ConditionExpression: `attribute_not_exists(userId)` OR `attribute_not_exists(workId)`)。
- レスポンス:
  ```json
  {
    "data": {
      "work": {
        "workId": "uuid",
        "title": "...",
        "initialStock": 100,
        "currentStock": 100,
        "price": 500,
        "memo": "",
        "createdAt": "...",
        "updatedAt": "..."
      }
    },
    "error": null
  }
  ```

#### GET /works
- クエリ: 無し。
- 処理: `Query` (PK=`userId`, SK begins with `WORK#` 等のスキーマ) もしテーブルに sortKey 無い場合は単純 query。
- レスポンス: `works: Work[]`。

#### PATCH /works/{id}
- リクエスト: 任意フィールドを部分更新。stock/price は非負整数。`currentStock` 更新時は `>=0` のチェック。
- 処理: DynamoDB Update (ConditionExpression: `attribute_exists(workId)`). `updatedAt` を更新。
- レスポンス: 更新後の Work。

#### DELETE /works/{id}
- 処理: TransactWriteItems
  1. `Works` テーブルから delete。
  2. `DistributionRecords` GSI (`workId-index`) で取得したレコードを batch delete (最大25件/トランザクション) → 多い場合はストリーム/Step Functions を検討。
- レスポンス: `204 No Content` + 空 data。

### 4.2 `/distributions`
| メソッド | 概要 |
| --- | --- |
| POST | 頒布記録の登録 (在庫減算) |
| GET | 頒布履歴のページング取得 |
| DELETE `/distributions/{id}` | 頒布記録の削除 (在庫戻し) |

#### POST /distributions
- Request schema:
  ```ts
  const schema = z.object({
    workId: z.string().uuid(),
    quantity: z.number().int().min(1).max(10000),
    eventId: z.string().uuid().optional(),
    eventName: z.string().trim().max(120).optional(),
    memo: z.string().max(500).optional(),
    distributedAt: z.string().datetime().optional(),
  });
  ```
- 処理フロー:
  1. `workId` が `userId` 所有か確認。
  2. `quantity` <= `currentStock` → 超過時は 409 + 現在庫を返す。
  3. TransactWriteItems:
     - Update Works: `currentStock = currentStock - :qty`, ConditionExpression `currentStock >= :qty`。
     - Put DistributionRecord: PK=`userId`, SK=`recordId`, attributes include `workId`, `quantity`, `eventId`, `eventName` (記録時点で複製)、`memo`, `distributedAt` (default now), `createdAt`。
- レスポンス: 作成された record。

#### GET /distributions
- クエリ: `workId` (必須), `limit` (<= 100), `lastEvaluatedKey`。
- 処理: GSI `workId-index` (PK=`userId#workId`, SK=`distributedAt` DESC)。PageNation。
- レスポンス:
  ```json
  {
    "data": {
      "items": [...],
      "pageInfo": { "lastEvaluatedKey": "...", "hasMore": true }
    }
  }
  ```

#### DELETE /distributions/{id}
- 処理: 該当 record 取得 → TransactWriteItems で Works `currentStock += quantity`、DistributionRecords delete。
- レスポンス: 204。

### 4.3 `/restocks`
- POST のみ (MVP では履歴を保持するが一覧 API は任意)。
- Request: `{ workId, quantity, memo?, restockedAt? }`。
- 処理: Works `initialStock += quantity`, `currentStock += quantity`。
- レスポンス: 補充後の Works。

### 4.4 `/events`
| メソッド | 概要 |
| --- | --- |
| POST | イベント登録 |
| GET | イベント一覧 (date 昇順) |
| DELETE `/events/{id}` | イベント削除 |

- Request schema: `name (1-120)`, `date (datetime)`, `location? (<=120)`, `memo? (<=500)`。
- 削除時、頒布履歴は保持 (records 側に冗長な `eventName` を保存済み)。

## 5. DynamoDB 設計詳細
### 5.1 テーブル一覧
1. `Works`
   - PK: `userId` (string)
   - SK: `workId` (string, `WORK#<uuid>` 推奨)
   - 属性: `title`, `initialStock` (number), `currentStock` (number), `price` (number, optional), `memo` (string), `createdAt`, `updatedAt`。
   - GSI: `GSI1` (PK=`userId`, SK=`createdAt`) - 一覧順序用 (任意)。

2. `DistributionRecords`
   - PK: `userId`
   - SK: `recordId` (`DIST#<uuid>`)
   - 属性: `workId`, `workKey` = `userId#workId`, `quantity`, `eventId?`, `eventName?`, `memo?`, `distributedAt`, `createdAt`。
   - GSI `workId-index`: PK=`workKey`, SK=`distributedAt` (DESC 用に `#` プレフィックスを付けるか Reverse Timestamp を利用)。

3. `Events`
   - PK: `userId`
   - SK: `eventId` (`EVENT#<uuid>`)
   - 属性: `name`, `date`, `location?`, `memo?`, `createdAt`。
   - GSI (任意): `GSI-EventDate` (PK=`userId`, SK=`date`).

4. `RestockRecords` (将来)
   - PK: `userId`
   - SK: `restockId`
   - 属性: `workId`, `quantity`, `memo?`, `restockedAt`, `createdAt`。

### 5.2 アクセスパターン
| パターン | DynamoDB 操作 |
| --- | --- |
| 作品一覧 | Query Works by PK=userId (GSI1 で createdAt 降順) |
| 作品詳細 | GetItem Works (PK=userId, SK=workId) |
| 頒布一覧 (作品別) | Query DistributionRecords.GSI workId-index (PK=userId#workId) |
| 頒布削除 | GetItem + TransactWrite |
| イベント一覧 | Query Events by PK=userId ORDER BY date |

### 5.3 トランザクション設計
- **頒布登録**:
  - Update Works (Condition: `currentStock >= :qty`).
  - Put DistributionRecord。
- **頒布削除**:
  - Update Works (`currentStock = currentStock + :qty`, no upper bound but optional Condition `currentStock + :qty <= initialStock + buffer`).
  - Delete DistributionRecord。
- **作品削除**:
  - Delete Works。
  - GSI で DistributionRecords を取得 → 25件ずつ TransactWrite (Delete)。大量の場合は Step Functions or バッチ Lambda。

### 5.4 キャパシティ & コスト
- On-demand を基本設定。1件あたり 1KB 未満想定。
- 大量削除時はバッチで WCU 消費に注意。バックグラウンドジョブ設計を別途検討。

## 6. Lambda 実装指針
- 言語: TypeScript (esbuild bundling)。
- フォルダ構成 (例):
  ```
  amplify/
    backend/
      function/
        worksHandler/
          src/
            handlers/
              post.ts
              get.ts
              patch.ts
              delete.ts
            lib/
              dynamo.ts
              validation.ts
              auth.ts
              responses.ts
  ```
- 共通モジュール:
  - `assertUser(event)` : JWT から userId を取得。
  - `withErrorHandling(handler)` : 例外を error response に変換。
  - `validate(schema, payload)` : zod を利用。
  - `dynamo` : DocumentClient v3 (AWS SDK for JS v3) の薄いラッパ。
- ログ: `console.info` で構造化 JSON `{ level, userId, action, targetId, result }`。

## 7. インフラ & 環境変数
| 変数 | 用途 |
| --- | --- |
| `WORKS_TABLE_NAME` | Works テーブル名 |
| `DISTRIBUTIONS_TABLE_NAME` | DistributionRecords テーブル名 |
| `EVENTS_TABLE_NAME` | Events テーブル名 |
| `RESTOCKS_TABLE_NAME` | 将来用 |
| `LOG_LEVEL` | `info` / `debug` |
| `ALLOWED_ORIGINS` | CORS 許可ドメイン (dev/staging/prod で切り替え) |

- Amplify Secrets Manager に保存。フロントは `.env.local` に API URL・Cognito 設定 (User Pool ID, Client ID, Region)。
- IAM Policy: 各 Lambda が自身のテーブルに対して `dynamodb:GetItem/PutItem/UpdateItem/DeleteItem/Query/TransactWriteItems` のみ許可。`Condition` で `LeadingKeys` を userId に制限することも検討。

## 8. 運用・監視
- CloudWatch アラーム:
  - Lambda エラー数 > 0 (5分間隔)→Slack通知。
  - API Gateway 5xx > 0。
  - DynamoDB Throttle > 0。
- ログ保持期間: 90日。
- PITR: 全テーブルで有効化。
- デプロイフロー:
  1. ブランチ push → Amplify CI が lint/test/build。
  2. `dev` 環境へ自動デプロイ。
  3. QA 完了後 `staging`, `prod` へ手動プロモート。

## 9. ローカル開発
- Amplify CLI `amplify mock function` + DynamoDB Local を活用。
- `docker-compose` に DynamoDB Local (port 8000) を定義。
- `.env.development` にローカル用テーブル名を記載。テスト時はステージングとは別アカウント。
- Jest/Vitest で DynamoDB Local に対する統合テストを作成 (TransactWrite の条件式を検証)。

## 10. フロント連携メモ
- React Query のキー設計: `['works']`, `['distributions', workId]`, `['events']`。
- Optimistic UI: 頒布登録時に `currentStock` を減算 → API エラーならロールバック。
- オフライン時: IndexedDB or localStorage に差分キューを保存し、オンライン復帰時に順次 POST。

## 11. 未決定事項 / TODO
- 作品削除時の大量レコード削除は MVP では 25 件以内を前提 → 超過時の挙動 (分割実行 or 非同期削除) を決定する必要あり。
- RestockRecord API の提供範囲 (一覧・削除) を要件と照合。
- エラーメッセージのローカライズ方針 (フロントで翻訳するかサーバー側で日本語を返すか)。
- Cognito のメールテンプレート、パスワードポリシー詳細設定。
- CloudWatch Logs からの分析を想定したログ構造 (JSON フォーマット) の標準化。
