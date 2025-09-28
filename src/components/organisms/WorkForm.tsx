'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card, CardBody, CardHeader } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { useStore } from '@/store/useStore';

export const WorkForm = () => {
  const addWork = useStore((state) => state.addWork);
  const [title, setTitle] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [price, setPrice] = useState('');
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    initialStock?: string;
    price?: string;
  }>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors: typeof errors = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      validationErrors.title = '作品名を入力してください';
    }

    const parsedInitialStock = Number(initialStock);
    if (!Number.isFinite(parsedInitialStock) || parsedInitialStock < 0) {
      validationErrors.initialStock = '0以上の数値を入力してください';
    }

    let parsedPrice: number | undefined;
    if (price) {
      const priceValue = Number(price);
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        validationErrors.price = '0以上の数値を入力してください';
      } else {
        parsedPrice = priceValue;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const initialStockValue = Math.floor(Number(parsedInitialStock));

    addWork({
      title: trimmedTitle,
      initialStock: initialStockValue,
      currentStock: initialStockValue,
      price: parsedPrice,
      memo: memo.trim() || undefined,
    });

    setTitle('');
    setInitialStock('0');
    setPrice('');
    setMemo('');
    setErrors({});
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">作品を登録</h2>
          <p className="text-sm text-slate-500">
            タイトルと初期在庫数を入力すると管理リストに追加されます
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            label="作品名"
            placeholder="例）新刊『DouKeeper入門』"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={errors.title}
          />
          <Input
            label="初期在庫数"
            type="number"
            min={0}
            value={initialStock}
            onChange={(event) => setInitialStock(event.target.value)}
            error={errors.initialStock}
          />
          <Input
            label="頒布価格（任意）"
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            error={errors.price}
          />
          <TextArea
            label="メモ（任意）"
            rows={3}
            placeholder="イベント名や装丁メモなど"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
          <div className="md:col-span-2">
            <Button type="submit" className="w-full md:w-auto">
              作品を追加する
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
