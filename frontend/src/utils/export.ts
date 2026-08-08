export function exportDataAsJSON(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDataAsCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const val = item[header];
        const str = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportAsPDF(title: string, contentHtml: string, _filename?: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px; color: #111; line-height: 1.6; }
          h1 { color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 8px; }
          h2 { color: #3b82f6; margin-top: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; background: #f9fafb; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; background: #e0e7ff; color: #3730a3; font-weight: bold; font-size: 12px; }
          footer { margin-top: 40px; font-size: 11px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        </style>
      </head>
      <body>
        <h1>🌿 MindMate CBT Companion — ${title}</h1>
        <div>Generated on ${new Date().toLocaleDateString()}</div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        ${contentHtml}
        <footer>Confidential Clinical Mental Health Companion Report</footer>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
