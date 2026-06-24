export default function exportToCSV(data, columns, filename = 'export.csv') {
  if (!data || data.length === 0) return;

  const escapeCSV = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escapeCSV(c.label)).join(',');
  const rows = data.map((row) =>
    columns.map((c) => escapeCSV(c.accessor ? c.accessor(row) : row[c.key])).join(',')
  );

  const BOM = '\uFEFF';
  const csv = BOM + [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
