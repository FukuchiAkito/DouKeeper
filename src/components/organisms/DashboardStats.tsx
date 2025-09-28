'use client';

import { useMemo } from 'react';
import { StatCard } from '@/components/molecules/StatCard';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatNumber } from '@/utils/format';

export const DashboardStats = () => {
  const works = useStore((state) => state.works);
  const distributionRecords = useStore((state) => state.distributionRecords);

  const stats = useMemo(() => {
    const totalWorks = works.length;
    const totalInitial = works.reduce(
      (sum, work) => sum + work.initialStock,
      0
    );
    const totalCurrent = works.reduce(
      (sum, work) => sum + work.currentStock,
      0
    );
    const totalSold = Math.max(totalInitial - totalCurrent, 0);
    const estimatedRevenue = works.reduce((sum, work) => {
      const sold = Math.max(work.initialStock - work.currentStock, 0);
      return sum + sold * (work.price ?? 0);
    }, 0);
    const soldRatio = totalInitial > 0 ? Math.round((totalSold / totalInitial) * 100) : 0;

    const lastDistribution = [...distributionRecords]
      .sort(
        (a, b) =>
          new Date(b.distributedAt).getTime() -
          new Date(a.distributedAt).getTime()
      )[0];

    return {
      totalWorks,
      totalCurrent,
      totalSold,
      estimatedRevenue,
      soldRatio,
      lastDistributionAt: lastDistribution
        ? new Date(lastDistribution.distributedAt)
        : undefined,
    };
  }, [distributionRecords, works]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="登録作品数"
        value={formatNumber(stats.totalWorks)}
        description="現在管理中の作品の合計"
      />
      <StatCard
        title="現在の在庫数"
        value={formatNumber(stats.totalCurrent)}
        description={`初期在庫 ${formatNumber(stats.totalCurrent + stats.totalSold)} 部`}
      />
      <StatCard
        title="累計頒布数"
        value={formatNumber(stats.totalSold)}
        description={stats.totalWorks > 0 ? `消化率 ${stats.soldRatio}%` : 'まずは作品を登録しましょう'}
      />
      <StatCard
        title="概算売上"
        value={formatCurrency(stats.estimatedRevenue)}
        description="単価未入力の作品は集計対象外"
      />
    </div>
  );
};
