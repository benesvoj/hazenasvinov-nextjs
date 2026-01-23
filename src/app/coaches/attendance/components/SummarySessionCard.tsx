import {Card, CardBody} from '@heroui/react';

interface SummarySessionCardProps {
  title: string;
  value: string | number;
}

export const SummarySessionCard = ({title, value}: SummarySessionCardProps) => {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardBody>
    </Card>
  );
};
