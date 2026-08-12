const fs = require('fs');

let code = fs.readFileSync('apps/web/src/components/reports/report-builder.tsx', 'utf8');

const oldUseQuery = `  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.reportData(reportKey),
    queryFn: () => apiFetch(\`/reports/data?key=\${reportKey}\`),
  });`;

const newUseQuery = `  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: [...queryKeys.reportData(reportKey), search],
    queryFn: () => apiFetch(\`/reports/data?key=\${reportKey}&search=\${encodeURIComponent(search)}\`),
  });`;

code = code.replace(oldUseQuery, newUseQuery);

const oldExportMutation = `  const exportMutation = useMutation({
    mutationFn: async (format: "xlsx" | "pdf") => {
      return apiFetch("/reports/export", {
        method: "POST",
        body: JSON.stringify({ key: reportKey, format }),
      });
    },`;

const newExportMutation = `  const exportMutation = useMutation({
    mutationFn: async (format: "xlsx" | "pdf") => {
      return apiFetch("/reports/export", {
        method: "POST",
        body: JSON.stringify({ key: reportKey, format, filters: { search } }),
      });
    },`;

code = code.replace(oldExportMutation, newExportMutation);

fs.writeFileSync('apps/web/src/components/reports/report-builder.tsx', code);
console.log('Patched report-builder.tsx');
