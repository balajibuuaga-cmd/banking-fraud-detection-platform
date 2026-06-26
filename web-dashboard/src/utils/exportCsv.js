export const exportToCsv = (filename, rows) => {
    if (!rows || rows.length === 0) return;

    const headers = Object.keys(rows[0]);

    const csv = [
        headers.join(","),
        ...rows.map((row) =>
            headers
                .map((field) => {
                    const value = row[field] ?? "";
                    return `"${String(value).replaceAll('"', '""')}"`;
                })
                .join(",")
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
};

export const exportToCsvWithAudit = async (
    filename,
    rows,
    createAuditLog,
    entityName = "CSV_EXPORT",
    entityId = 0
) => {
    exportToCsv(filename, rows);

    if (rows && rows.length > 0 && createAuditLog) {
        await createAuditLog(`Exported ${filename}`, entityName, entityId);
    }
};
