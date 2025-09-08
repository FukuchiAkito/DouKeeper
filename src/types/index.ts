// 作品（同人誌）の型定義
export interface Work {
  id: string;
  title: string;
  initialStock: number; // 初期在庫数
  currentStock: number; // 現在の在庫数
  price?: number; // 頒布価格（任意）
  memo?: string; // メモ（任意）
  createdAt: Date;
  updatedAt: Date;
}

// 頒布記録の型定義
export interface DistributionRecord {
  id: string;
  workId: string;
  quantity: number; // 頒布部数
  eventName?: string; // イベント名（任意）
  memo?: string; // メモ（任意）
  distributedAt: Date;
}

// イベントの型定義
export interface Event {
  id: string;
  name: string;
  date: Date;
  location?: string; // 開催場所（任意）
  memo?: string; // メモ（任意）
  createdAt: Date;
}

// アプリケーションの状態の型定義
export interface AppState {
  works: Work[];
  distributionRecords: DistributionRecord[];
  events: Event[];
}
