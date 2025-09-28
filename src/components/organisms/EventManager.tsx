'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card, CardBody, CardHeader } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/utils/format';

export const EventManager = () => {
  const addEvent = useStore((state) => state.addEvent);
  const deleteEvent = useStore((state) => state.deleteEvent);
  const events = useStore((state) => state.events);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('イベント名を入力してください');
      return;
    }
    if (!date) {
      setError('開催日を入力してください');
      return;
    }

    addEvent({
      name: trimmedName,
      date: new Date(date),
      location: location.trim() || undefined,
      memo: memo.trim() || undefined,
    });

    setName('');
    setDate('');
    setLocation('');
    setMemo('');
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('イベントを削除しますか？既存の頒布履歴には影響しません。');
    if (!confirmed) {
      return;
    }
    deleteEvent(id);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">イベント管理</h2>
          <p className="text-sm text-slate-500">
            よく参加するイベントを登録しておくと頒布登録時に選択できます
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
          <Input
            label="イベント名"
            placeholder="COMITIA 150"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="開催日"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Input
            label="会場（任意）"
            placeholder="東京ビッグサイト"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
          <TextArea
            label="メモ（任意）"
            rows={1}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
          <div className="md:col-span-4">
            <Button type="submit" className="w-full md:w-auto">
              イベントを追加
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="space-y-3">
          {sortedEvents.length === 0 ? (
            <p className="text-sm text-slate-600">
              登録済みのイベントはありません。フォームから追加すると一覧に表示されます。
            </p>
          ) : (
            sortedEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {event.name}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                    <span>{formatDate(new Date(event.date))}</span>
                    {event.location && <span>会場: {event.location}</span>}
                    {event.memo && <span>メモ: {event.memo}</span>}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                >
                  削除
                </Button>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};
