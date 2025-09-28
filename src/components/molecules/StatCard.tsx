import { Card, CardBody } from '@/components/atoms/Card';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
}

export const StatCard = ({ title, value, description }: StatCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-slate-50 to-white">
      <CardBody className="space-y-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </CardBody>
    </Card>
  );
};
