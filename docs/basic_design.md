# 基本設計書（ざっくり）

## 1. システム概要

同人誌やグッズの頒布部数を管理し、イベント参加履歴や売上を記録・分析できるWebアプリ。  
将来的にはReact Nativeでモバイル版も展開予定。

## 2. 主要機能

| 機能名             | 概要                                   |
| ------------------ | -------------------------------------- |
| 頒布記録管理       | イベント名、日付、頒布部数、売上を登録 |
| イベント管理       | イベント情報の登録・編集               |
| 部数集計・分析     | 月別・イベント別の部数・売上集計表示   |
| ユーザー認証       | Firebase Authenticationなどで対応      |
| データエクスポート | CSVなどで頒布データを出力可能          |

## 3. アーキテクチャ

- フロントエンド：React（Atomic Designベースのコンポーネント設計）、TypeScript、SWCで高速ビルド
- 状態管理：Context API または Zustandなど軽量ライブラリ
- バックエンド：Firebase Firestoreを利用（学習・無料枠活用のため）
- 認証：Firebase Authentication（メール/パスワード、SNSログイン対応）
- ホスティング：Firebase Hosting（無料枠利用）

## 4. 技術スタック

| 項目           | 技術・サービス          |
| -------------- | ----------------------- |
| フロントエンド | React, TypeScript, SWC  |
| 状態管理       | Context API / Zustand   |
| データベース   | Firebase Firestore      |
| 認証           | Firebase Authentication |
| ホスティング   | Firebase Hosting        |
| 開発ツール     | Vite, Prettier, ESLint  |
| バージョン管理 | Git, GitHub             |

## 5. 開発・運用方針

- まずはWeb版のコア機能を完成させる
- コードの品質を保つため、PrettierとESLintを導入
- GitHubリポジトリでバージョン管理とCI/CDは検討段階
- モバイル版React NativeはWeb版のコンポーネント設計を活かしつつ別途開発予定

## 6. セキュリティ・認証

- Firebase Authenticationを利用し、ユーザー管理を簡単に実装
- Firestoreのセキュリティルールでデータアクセス制限を設定
- HTTPS通信を標準利用
