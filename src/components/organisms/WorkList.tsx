'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card, CardBody, CardHeader } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { TextArea } from '@/components/atoms/TextArea';
import { useStore } from '@/store/useStore';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '@/utils/format';
import type { Event, Work } from '@/types';

interface ActionResult {
  success: boolean;
  message?: string;
  registeredQuantity?: number;
}

interface WorkItemProps {
  work: Work;
  events: Event[];
  onRegisterDistribution: (
    work: Work,
    quantity: number,
    eventId?: string,
    memo?: string
  ) => ActionResult;
  onRestock: (work: Work, quantity: number) => ActionResult;
  onDelete: (work: Work) => void;
}

const WorkItem = ({
  work,
  events,
  onRegisterDistribution,
  onRestock,
  onDelete,
}: WorkItemProps) => {
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [saleEventId, setSaleEventId] = useState('');
  const [saleMemo, setSaleMemo] = useState('');
  const [restockQuantity, setRestockQuantity] = useState('');
  const [feedback, setFeedback] = useState<
    { type: 'success' | 'info' | 'error'; message: string } | null
  >(null);

  const soldCount = Math.max(work.initialStock - work.currentStock, 0);
  const eventOptions = useMemo(
    () =>
      events
        .slice()
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        .map((event) => ({
          value: event.id,
          label: `${event.name}（${formatDate(new Date(event.date))}）`,
        })),
    [events]
  );

  const handleSale = (quantityOverride?: number) => {
    const parsedQuantity =
      quantityOverride !== undefined
        ? quantityOverride
        : Number(saleQuantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setFeedback({
        type: 'error',
        message: '頒布数には1以上の数値を指定してください',
      });
      return;
    }

    const result = onRegisterDistribution(
      work,
      Math.floor(parsedQuantity),
      saleEventId || undefined,
      saleMemo.trim() || undefined
    );

    if (!result.success) {
      setFeedback({
        type: 'error',
        message: result.message ?? '頒布登録に失敗しました',
      });
      return;
    }

    const registered = result.registeredQuantity ?? Math.floor(parsedQuantity);
    setFeedback({
      type: result.message ? 'info' : 'success',
      message:
        result.message ?? `${formatNumber(registered)}部の頒布を登録しました`,
    });
    setSaleQuantity('1');
    setSaleMemo('');
  };

  const handleRestock = () => {
    const parsedQuantity = Number(restockQuantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setFeedback({
        type: 'error',
        message: '補充数には1以上の数値を指定してください',
      });
      return;
    }

    const result = onRestock(work, Math.floor(parsedQuantity));
    if (!result.success) {
      setFeedback({
        type: 'error',
        message: result.message ?? '在庫補充に失敗しました',
      });
      return;
    }

    const added = result.registeredQuantity ?? Math.floor(parsedQuantity);
    setFeedback({
      type: 'success',
      message: result.message ?? `${formatNumber(added)}部を補充しました`,
    });
    setRestockQuantity('');
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `${work.title} を削除します。関連する頒布履歴も削除されます。よろしいですか？`
    );
    if (!confirmed) {
      return;
    }
    onDelete(work);
  };

  const feedbackClass =
    feedback?.type === 'error'
      ? 'text-red-600'
      : feedback?.type === 'info'
      ? 'text-sky-600'
      : 'text-emerald-600';

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{work.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>登録日 {formatDateTime(new Date(work.createdAt))}</span>
            <span>最終更新 {formatDateTime(new Date(work.updatedAt))}</span>
            {work.price !== undefined && (
              <span>単価 {formatCurrency(work.price)}</span>
            )}
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          作品を削除
        </Button>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">初期在庫</p>
            <p className="text-xl font-semibold text-slate-900">
              {formatNumber(work.initialStock)} 部
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">現在庫</p>
            <p
              className={`text-xl font-semibold ${
                work.currentStock > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatNumber(work.currentStock)} 部
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">累計頒布数</p>
            <p className="text-xl font-semibold text-slate-900">
              {formatNumber(soldCount)} 部
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">備考</p>
            <p className="text-sm text-slate-600">
              {work.memo ? work.memo : '—'}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">頒布を登録</h4>
            <span className="text-xs text-slate-500">
              在庫が不足している場合は補充後に登録してください
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              label="頒布数"
              type="number"
              min={1}
              value={saleQuantity}
              onChange={(event) => setSaleQuantity(event.target.value)}
            />
            <Select
              label="イベント（任意）"
              value={saleEventId}
              onChange={(event) => setSaleEventId(event.target.value)}
              options={eventOptions}
              placeholder="イベントを選択"
            />
            <div className="md:col-span-2">
              <TextArea
                label="メモ（任意）"
                rows={2}
                value={saleMemo}
                onChange={(event) => setSaleMemo(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => handleSale()}>
              頒布を登録
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSale(1)}
              disabled={work.currentStock <= 0}
            >
              1部頒布
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSale(5)}
              disabled={work.currentStock <= 0}
            >
              5部頒布
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-700">在庫を補充</h4>
          <div className="grid gap-4 md:grid-cols-[200px_auto]">
            <Input
              label="補充数"
              type="number"
              min={1}
              value={restockQuantity}
              onChange={(event) => setRestockQuantity(event.target.value)}
            />
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={handleRestock}>
                在庫を補充
              </Button>
            </div>
          </div>
        </div>

        {feedback && (
          <p className={`${feedbackClass} text-sm`}>{feedback.message}</p>
        )}
      </CardBody>
    </Card>
  );
};

export const WorkList = () => {
  const works = useStore((state) => state.works);
  const events = useStore((state) => state.events);
  const addDistributionRecord = useStore(
    (state) => state.addDistributionRecord
  );
  const updateWork = useStore((state) => state.updateWork);
  const deleteWork = useStore((state) => state.deleteWork);

  const sortedWorks = useMemo(
    () =>
      works
        .slice()
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [works]
  );

  const handleRegisterDistribution = (
    work: Work,
    quantity: number,
    eventId?: string,
    memo?: string
  ): ActionResult => {
    if (quantity <= 0) {
      return { success: false, message: '頒布数には1以上の数値を指定してください' };
    }
    if (work.currentStock <= 0) {
      return { success: false, message: '在庫がありません。先に補充してください' };
    }

    const eventName = eventId
      ? events.find((event) => event.id === eventId)?.name
      : undefined;
    const clampedQuantity = Math.min(quantity, work.currentStock);

    addDistributionRecord({
      workId: work.id,
      quantity: clampedQuantity,
      eventName,
      memo,
      distributedAt: new Date(),
    });

    if (clampedQuantity < quantity) {
      return {
        success: true,
        registeredQuantity: clampedQuantity,
        message: `在庫が不足していたため ${formatNumber(
          clampedQuantity
        )} 部を登録しました`,
      };
    }

    return { success: true, registeredQuantity: clampedQuantity };
  };

  const handleRestock = (work: Work, quantity: number): ActionResult => {
    if (quantity <= 0) {
      return { success: false, message: '補充数には1以上の数値を指定してください' };
    }
    const restockAmount = Math.floor(quantity);
    updateWork(work.id, {
      currentStock: work.currentStock + restockAmount,
      initialStock: work.initialStock + restockAmount,
    });
    return {
      success: true,
      registeredQuantity: restockAmount,
      message: `${formatNumber(restockAmount)}部を補充しました`,
    };
  };

  if (sortedWorks.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">
            まだ登録された作品がありません。上のフォームから作品を追加しましょう。
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedWorks.map((work) => (
        <WorkItem
          key={work.id}
          work={work}
          events={events}
          onRegisterDistribution={handleRegisterDistribution}
          onRestock={handleRestock}
          onDelete={(target) => deleteWork(target.id)}
        />
      ))}
    </div>
  );
};
