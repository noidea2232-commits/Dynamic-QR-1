import React from 'react';

export interface Column<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  onRowClick,
  className = '',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden p-8 text-center text-slate-500">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded w-full"></div>
          <div className="h-6 bg-slate-50 rounded w-full"></div>
          <div className="h-6 bg-slate-50 rounded w-full"></div>
          <div className="h-6 bg-slate-50 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`w-full overflow-x-auto bg-white rounded-xl border border-slate-200/80 shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75">
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                  col.headerClassName || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {data.map(item => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick && onRowClick(item)}
              className={`transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'
              }`}
            >
              {columns.map((col, cIndex) => (
                <td key={cIndex} className={`py-3.5 px-4 whitespace-nowrap ${col.className || ''}`}>
                  {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                    ? (item[col.accessorKey] as unknown as React.ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
