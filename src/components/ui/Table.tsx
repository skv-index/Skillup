import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export function Table<T extends { id: string | number }>({
  columns,
  rows,
  emptyText = 'No data yet.',
}: {
  columns: TableColumn<T>[];
  rows: T[];
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <div className="state-block">{emptyText}</div>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => (
                <td key={c.key}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
