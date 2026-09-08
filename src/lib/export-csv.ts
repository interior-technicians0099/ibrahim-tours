/**
 * Utility to export tabular data into RFC 4180 compliant CSV and trigger browser download.
 */
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns: { header: string; key: keyof T; formatter?: (val: any, row: T) => string }[]
) {
  if (!rows || rows.length === 0) {
    alert('No records available to export.');
    return;
  }

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // Header row
  const headerLine = columns.map((col) => escapeCell(col.header)).join(',');

  // Data rows
  const dataLines = rows.map((row) =>
    columns
      .map((col) => {
        const rawVal = row[col.key];
        const formatted = col.formatter ? col.formatter(rawVal, row) : rawVal;
        return escapeCell(formatted);
      })
      .join(',')
  );

  const csvContent = [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Browser download trigger
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
