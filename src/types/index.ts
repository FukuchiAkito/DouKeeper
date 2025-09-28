// 作品（同人誌）の型定義
export interface Work {
  workId: string; // DynamoDBの主キー
  userId: string; // ユーザーID（Cognito sub）
  title: string;
  initialStock: number; // 初期在庫数
  currentStock: number; // 現在の在庫数
  price?: number; // 頒布価格（任意）
  memo?: string; // メモ（任意）
  createdAt: string; // ISO8601文字列
  updatedAt: string; // ISO8601文字列
}

// 頒布記録の型定義
export interface DistributionRecord {
  recordId: string; // DynamoDBの主キー
  userId: string; // ユーザーID（Cognito sub）
  workId: string;
  quantity: number; // 頒布部数
  eventId?: string; // イベントID（任意）
  eventName?: string; // イベント名（任意）
  memo?: string; // メモ（任意）
  distributedAt: string; // ISO8601文字列
  createdAt: string; // ISO8601文字列
}

// イベントの型定義
export interface Event {
  eventId: string; // DynamoDBの主キー
  userId: string; // ユーザーID（Cognito sub）
  name: string;
  date: string; // ISO8601文字列
  location?: string; // 開催場所（任意）
  memo?: string; // メモ（任意）
  createdAt: string; // ISO8601文字列
}

// API レスポンスの型定義
export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

// 認証関連の型定義
export interface AuthUser {
  userId: string;
  email: string;
  isAuthenticated: boolean;
}

// アプリケーションの状態の型定義
export interface AppState {
  works: Work[];
  distributionRecords: DistributionRecord[];
  events: Event[];
  auth: AuthUser | null;
}
