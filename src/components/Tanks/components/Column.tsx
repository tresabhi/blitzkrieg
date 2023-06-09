import { ReactNode } from 'react';

export interface ColumnProps {
  children: ReactNode;
}

export function Column({ children }: ColumnProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
      }}
    >
      {children}
    </div>
  );
}
