import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { Work, DistributionRecord, Event } from '@/types';

interface AppState {
  works: Work[];
  distributionRecords: DistributionRecord[];
  events: Event[];
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
  getWorkById: (id: string) => Work | undefined;
  getDistributionRecordsByWorkId: (workId: string) => DistributionRecord[];
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};

const toPositiveInt = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
};

const toNonNegativeNumber = (value: number | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(0, Number(value));
};

const sanitizeOptionalString = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const reviveData = (
  state: Partial<Pick<AppState, 'works' | 'distributionRecords' | 'events'>>
): Pick<AppState, 'works' | 'distributionRecords' | 'events'> => ({
  works: (state.works ?? []).map((work) => ({
    ...work,
    createdAt: toDate(work.createdAt),
    updatedAt: toDate(work.updatedAt),
  })),
  distributionRecords: (state.distributionRecords ?? []).map((record) => ({
    ...record,
    distributedAt: toDate(record.distributedAt),
  })),
  events: (state.events ?? []).map((event) => ({
    ...event,
    date: toDate(event.date),
    createdAt: toDate(event.createdAt),
  })),
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      works: [],
      distributionRecords: [],
      events: [],

      addWork: (workData) => {
        const title = workData.title.trim();
        if (!title) {
          return;
        }
        const initialStock = toPositiveInt(workData.initialStock);
        const currentStock = toPositiveInt(workData.currentStock);
        const price = toNonNegativeNumber(workData.price);
        const newWork: Work = {
          ...workData,
          title,
          initialStock,
          currentStock,
          price,
          memo: sanitizeOptionalString(workData.memo),
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          works: [...state.works, newWork],
        }));
      },

      updateWork: (id, updates) => {
        const sanitizedUpdates: Partial<Work> = {
          ...updates,
        };
        if (updates.title !== undefined) {
          sanitizedUpdates.title = updates.title.trim();
        }
        if (updates.initialStock !== undefined) {
          sanitizedUpdates.initialStock = toPositiveInt(updates.initialStock);
        }
        if (updates.currentStock !== undefined) {
          sanitizedUpdates.currentStock = toPositiveInt(updates.currentStock);
        }
        if (updates.price !== undefined) {
          sanitizedUpdates.price = toNonNegativeNumber(updates.price);
        }
        if (updates.memo !== undefined) {
          sanitizedUpdates.memo = sanitizeOptionalString(updates.memo);
        }
        set((state) => ({
          works: state.works.map((work) =>
            work.id === id
              ? {
                  ...work,
                  ...sanitizedUpdates,
                  updatedAt: new Date(),
                }
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

      addDistributionRecord: (recordData) => {
        const work = get().getWorkById(recordData.workId);
        if (!work) {
          return;
        }
        const requestedQuantity = toPositiveInt(recordData.quantity);
        const allowedQuantity = Math.min(requestedQuantity, work.currentStock);
        if (allowedQuantity <= 0) {
          return;
        }
        const newRecord: DistributionRecord = {
          ...recordData,
          id: crypto.randomUUID(),
          quantity: allowedQuantity,
          eventName: sanitizeOptionalString(recordData.eventName),
          memo: sanitizeOptionalString(recordData.memo),
          distributedAt: toDate(recordData.distributedAt),
        };
        set((state) => ({
          distributionRecords: [...state.distributionRecords, newRecord],
        }));
        get().updateWork(work.id, {
          currentStock: work.currentStock - allowedQuantity,
        });
      },

      updateDistributionRecord: (id, updates) => {
        const existingRecord = get().distributionRecords.find(
          (record) => record.id === id
        );
        if (!existingRecord) {
          return;
        }
        const work = get().getWorkById(existingRecord.workId);
        if (!work) {
          return;
        }
        const restoredStock = work.currentStock + existingRecord.quantity;
        const requestedQuantity =
          updates.quantity !== undefined
            ? toPositiveInt(updates.quantity)
            : existingRecord.quantity;
        const allowedQuantity = Math.min(requestedQuantity, restoredStock);

        const nextRecord: DistributionRecord = {
          ...existingRecord,
          ...updates,
          quantity: allowedQuantity,
          eventName:
            updates.eventName !== undefined
              ? sanitizeOptionalString(updates.eventName)
              : existingRecord.eventName,
          memo:
            updates.memo !== undefined
              ? sanitizeOptionalString(updates.memo)
              : existingRecord.memo,
          distributedAt:
            updates.distributedAt !== undefined
              ? toDate(updates.distributedAt)
              : existingRecord.distributedAt,
        };

        set((state) => ({
          distributionRecords: state.distributionRecords.map((record) =>
            record.id === id ? nextRecord : record
          ),
        }));

        get().updateWork(work.id, {
          currentStock: Math.max(0, restoredStock - allowedQuantity),
        });
      },

      deleteDistributionRecord: (id) => {
        const record = get().distributionRecords.find(
          (item) => item.id === id
        );
        if (!record) {
          return;
        }
        set((state) => ({
          distributionRecords: state.distributionRecords.filter(
            (item) => item.id !== id
          ),
        }));
        const work = get().getWorkById(record.workId);
        if (work) {
          get().updateWork(work.id, {
            currentStock: work.currentStock + record.quantity,
          });
        }
      },

      addEvent: (eventData) => {
        const name = eventData.name.trim();
        if (!name) {
          return;
        }
        const newEvent: Event = {
          ...eventData,
          id: crypto.randomUUID(),
          name,
          date: toDate(eventData.date),
          location: sanitizeOptionalString(eventData.location),
          memo: sanitizeOptionalString(eventData.memo),
          createdAt: new Date(),
        };
        set((state) => ({
          events: [...state.events, newEvent],
        }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? {
                  ...event,
                  ...updates,
                  name:
                    updates.name !== undefined
                      ? updates.name.trim()
                      : event.name,
                  date:
                    updates.date !== undefined
                      ? toDate(updates.date)
                      : event.date,
                  location:
                    updates.location !== undefined
                      ? sanitizeOptionalString(updates.location)
                      : event.location,
                  memo:
                    updates.memo !== undefined
                      ? sanitizeOptionalString(updates.memo)
                      : event.memo,
                }
              : event
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
      },

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
      name: 'doukeeper-storage',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage
      ),
      merge: (persistedState, currentState) => {
        if (!persistedState) {
          return currentState;
        }
        const revived = reviveData(
          (persistedState as Partial<AppState>) ?? {}
        );
        return {
          ...currentState,
          ...revived,
        };
      },
    }
  )
);
