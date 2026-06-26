import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import {
    getAllAlerts,
    getAllFraudCases,
    getAuditLogs
} from "../services/analyticsService";
import { filterByDateRange } from "../utils/dateFilters";
import { getCaseSla } from "../utils/caseSla";

const formatTime = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Recent";
};

export default function Notifications({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [alerts, setAlerts] = useState([]);
    const [cases, setCases] = useState([]);
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const loadNotifications = async () => {
        const [alertData, caseData, auditData] = await Promise.allSettled([
            getAllAlerts(),
            getAllFraudCases(),
            getAuditLogs()
        ]);

        setAlerts(alertData.status === "fulfilled" && Array.isArray(alertData.value) ? alertData.value : []);
        setCases(caseData.status === "fulfilled" && Array.isArray(caseData.value) ? caseData.value : []);
        setLogs(auditData.status === "fulfilled" && Array.isArray(auditData.value) ? auditData.value : []);
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const notifications = useMemo(() => {
        const alertItems = filterByDateRange(alerts, dateRange)
            .filter((item) => item.severity === "CRITICAL" || item.status === "OPEN")
            .map((item) => ({
                id: `alert-${item.id}`,
                type: "Fraud Alert",
                message: item.description || `Alert #${item.id} requires review.`,
                severity: item.severity || "MEDIUM",
                time: formatTime(item.createdAt),
                sortDate: item.createdAt
            }));

        const caseItems = filterByDateRange(cases, dateRange)
            .filter((item) => item.status === "ESCALATED" || getCaseSla(item).label === "Overdue")
            .map((item) => ({
                id: `case-${item.id}`,
                type: "Case SLA",
                message: `${item.caseNumber} is ${item.status} with SLA ${getCaseSla(item).label}.`,
                severity: getCaseSla(item).label === "Overdue" ? "CRITICAL" : "MEDIUM",
                time: formatTime(item.createdAt),
                sortDate: item.createdAt
            }));

        const auditItems = filterByDateRange(logs, dateRange)
            .slice(0, 12)
            .map((item) => ({
                id: `audit-${item.id}`,
                type: "Audit Event",
                message: item.action,
                severity: "LOW",
                time: formatTime(item.createdAt),
                sortDate: item.createdAt
            }));

        return [...alertItems, ...caseItems, ...auditItems]
            .filter((item) => `${item.type} ${item.message} ${item.severity}`.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));
    }, [alerts, cases, dateRange, logs, searchTerm]);

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadNotifications}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Notification Center
                    </Typography>
                    <Typography color="text.secondary">
                        Live alert, case SLA, and audit activity generated from platform data.
                    </Typography>
                </Box>

                <Button variant="contained" onClick={loadNotifications}>
                    Refresh
                </Button>
            </Stack>

            <Stack spacing={2}>
                {notifications.length === 0 ? (
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography fontWeight={800}>No notifications found</Typography>
                        <Typography color="text.secondary">
                            Try changing the date range or clearing your search.
                        </Typography>
                    </Paper>
                ) : (
                    notifications.map((item) => (
                        <Paper key={item.id} sx={{ p: 3, borderRadius: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                                <Box>
                                    <Typography fontWeight={800}>
                                        {item.type}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {item.message}
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Chip
                                        label={item.severity}
                                        color={
                                            item.severity === "CRITICAL"
                                                ? "error"
                                                : item.severity === "MEDIUM"
                                                ? "warning"
                                                : "default"
                                        }
                                        size="small"
                                    />
                                    <Typography color="text.secondary">
                                        {item.time}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    ))
                )}
            </Stack>
        </MainLayout>
    );
}
