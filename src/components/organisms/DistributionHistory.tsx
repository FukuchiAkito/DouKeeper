'use client';

import { Button } from '@/components/atoms/Button';
import { Card, CardBody, CardHeader } from '@/components/atoms/Card';
import { useStore } from '@/store/useStore';
import { formatDateTime, formatNumber } from '@/utils/format';

export const DistributionHistory = () => {
  const distributionRecords = useStore((state) => state.distributionRecords);
  const works = useStore((state) => state.works);
  const deleteDistributionRecord = useStore(
    (state) => state.deleteDistributionRecord
  );

  const sortedRecords = distributionRecords
    .slice()
    .sort(
      (a, b) =>
        new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime()
    );

  const getWorkTitle = (workId: string) =>
    works.find((work) => work.id === workId)?.title ?? '不明な作品';

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('頒布記録を削除しますか？在庫数が戻されます。');
    if (!confirmed) {
      return;
    }
    deleteDistributionRecord(id);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">頒布履歴</h2>
          <p className="text-sm text-slate-500">
            最新の頒布から順に表示しています。不要な記録は削除できます。
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {sortedRecords.length === 0 ? (
          <p className="text-sm text-slate-600">
            まだ頒布履歴はありません。作品カードから頒布を登録するとここに表示されます。
          </p>
        ) : (
          sortedRecords.map((record) => (
            <div
              key={record.id}
              className="flex flex-col gap-2 border-b border-slate-200 pb-4 last:border-none last:pb-0"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {getWorkTitle(record.workId)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(new Date(record.distributedAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {formatNumber(record.quantity)} 部
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(record.id)}
                  >
                    記録を削除
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                {record.eventName && (
                  <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-600">
                    {record.eventName}
                  </span>
                )}
                {record.memo && <span>メモ: {record.memo}</span>}
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
};
