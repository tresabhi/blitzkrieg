import { Percentile } from '../../constants/percentiles';
import GenericStatsColumn from './components/GenericStatsColumn';

export type Stat =
  | [string, string | number | undefined]
  | [string, string | number | undefined, Percentile | undefined];

export interface GenericStatsProps {
  stats: Stat[];
  columnCount?: number;
}

export default function GenericStats({
  stats,
  columnCount = 2,
}: GenericStatsProps) {
  const filteredStats = stats.filter(([, value]) => value !== undefined);
  const itemsPerRow = Math.ceil(filteredStats.length / columnCount);
  const columns: Stat[][] = [];

  filteredStats.forEach((stat, index) => {
    const column = Math.floor(index / itemsPerRow);
    if (!columns[column]) columns[column] = [];
    columns[column].push(stat);
  });

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      {columns.map((stats) => (
        <GenericStatsColumn
          key={stats.map((stat) => stat[0]).join('-')}
          stats={stats}
        />
      ))}
    </div>
  );
}
