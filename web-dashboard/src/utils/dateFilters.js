const getRecordDate = (record) => {
    const rawDate =
        record?.createdAt ||
        record?.timestamp ||
        record?.transactionDate ||
        record?.transactionTime ||
        record?.date;

    if (!rawDate) return null;

    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const filterByDateRange = (rows, range) => {
    if (!Array.isArray(rows) || !range || range === "ALL") {
        return Array.isArray(rows) ? rows : [];
    }

    const now = new Date();
    const startDate = new Date(now);

    if (range === "24H") {
        startDate.setHours(now.getHours() - 24);
    } else if (range === "7D") {
        startDate.setDate(now.getDate() - 7);
    } else if (range === "30D") {
        startDate.setDate(now.getDate() - 30);
    } else {
        return rows;
    }

    return rows.filter((row) => {
        const rowDate = getRecordDate(row);
        return rowDate ? rowDate >= startDate && rowDate <= now : true;
    });
};
