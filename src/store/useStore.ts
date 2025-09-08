import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Work, DistributionRecord, Event } from '@/types';

interface AppState {
  // データ
  works: Work[];
  distributionRecords: DistributionRecord[];
  events: Event[];

  // アクション
  addWork: (work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWork: (id: string, updates: Partial<Work>) => void;
  deleteWork: (id: string) => void;

  addDistributionRecord: (record: Omit<DistributionRecord, 'id'>) => void;
  updateDistributionRecord: (
    id: string,
    updates: Partial<DistributionRecord>
  ) => void;
  deleteDistributionRecord: (id: string) => void;

  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  // ユーティリティ関数
  getWorkById: (id: string) => Work | undefined;
  getDistributionRecordsByWorkId: (workId: string) => DistributionRecord[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初期状態
      works: [],
      distributionRecords: [],
      events: [],

      // 作品管理
      addWork: (workData) => {
        const newWork: Work = {
          ...workData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          works: [...state.works, newWork],
        }));
      },

      updateWork: (id, updates) => {
        set((state) => ({
          works: state.works.map((work) =>
            work.id === id
              ? { ...work, ...updates, updatedAt: new Date() }
              : work
          ),
        }));
      },

      deleteWork: (id) => {
        set((state) => ({
          works: state.works.filter((work) => work.id !== id),
          distributionRecords: state.distributionRecords.filter(
            (record) => record.workId !== id
          ),
        }));
      },

      // 頒布記録管理
      addDistributionRecord: (recordData) => {
        const newRecord: DistributionRecord = {
          ...recordData,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          distributionRecords: [...state.distributionRecords, newRecord],
        }));

        // 在庫数を更新
        const work = get().getWorkById(recordData.workId);
        if (work) {
          get().updateWork(recordData.workId, {
            currentStock: work.currentStock - recordData.quantity,
          });
        }
      },

      updateDistributionRecord: (id, updates) => {
        set((state) => ({
          distributionRecords: state.distributionRecords.map((record) =>
            record.id === id ? { ...record, ...updates } : record
          ),
        }));
      },

      deleteDistributionRecord: (id) => {
        set((state) => ({
          distributionRecords: state.distributionRecords.filter(
            (record) => record.id !== id
          ),
        }));
      },

      // イベント管理
      addEvent: (eventData) => {
        const newEvent: Event = {
          ...eventData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        set((state) => ({
          events: [...state.events, newEvent],
        }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
      },

      // ユーティリティ関数
      getWorkById: (id) => {
        return get().works.find((work) => work.id === id);
      },

      getDistributionRecordsByWorkId: (workId) => {
        return get().distributionRecords.filter(
          (record) => record.workId === workId
        );
      },
    }),
    {
      name: 'doukeeper-storage', // ローカルストレージのキー名
    }
  )
);
