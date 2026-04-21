interface TableShimmerProps {
  rows?: number;
  columns: number;
  hasActionsColumn?: boolean;
}

export function TableShimmer({ rows = 6, columns, hasActionsColumn = true }: TableShimmerProps) {
  const getWidth = (colIndex: number, totalColumns: number) => {
    if (colIndex === 0) return 'w-32';
    if (colIndex === totalColumns - 1 && !hasActionsColumn) return 'w-32';
    if (colIndex === totalColumns - 1) return 'w-20';
    if (colIndex === 1 || colIndex === 2) return 'w-28';
    return 'w-24';
  };

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="hover:bg-slate-50">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              {colIndex === columns - 1 && hasActionsColumn ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-slate-200 rounded animate-shimmer" />
                  <div className="h-5 w-5 bg-slate-200 rounded animate-shimmer" 
                       style={{ animationDelay: '0.2s' }} 
                  />
                </div>
              ) : (
                <div 
                  className={`h-4 bg-slate-200 rounded animate-shimmer ${getWidth(colIndex, columns)}`}
                  style={{ animationDelay: `${rowIndex * 0.1 + colIndex * 0.05}s` }}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
