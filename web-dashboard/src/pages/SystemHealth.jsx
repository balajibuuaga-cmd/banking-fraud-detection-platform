import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Grid,
    LinearProgress,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import {
    getAllAlerts,
    getAllFraudCases,
    getAllTransactions,
    getAuditLogs
} from "../services/analyticsService";

const buildServiceStatus = (name, result, details) => ({
    name,
    status: result.status === "fulfilled" ? "ONLINE" : "DEGRADED",
    details: result.status === "fulfilled" ? details(result.value) : "Service did not respond successfully",
});

export default function SystemHealth({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [services, setServices] = useState([]);
    const [lastChecked, setLastChecked] = useState(null);

    const loadHealth = async () => {
        const [transactions, alerts, cases, auditLogs] = await Promise.allSettled([
            getAllTransactions(),
            getAllAlerts(),
            getAllFraudCases(),
            getAuditLogs()
        ]);

        setServices([
            buildServiceStatus("Backend API", transactions, (data) => `${Array.isArray(data) ? data.length : 0} transactions reachable`),
            buildServiceStatus("Fraud Alerts API", alerts, (data) => `${Array.isArray(data) ? data.length : 0} alerts reachable`),
            buildServiceStatus("Investigation Cases API", cases, (data) => `${Array.isArray(data) ? data.length : 0} cases reachable`),
            buildServiceStatus("Audit Trail API", auditLogs, (data) => `${Array.isArray(data) ? data.length : 0} audit records reachable`),
            {
                name: "Kafka Event Stream",
                status: alerts.status === "fulfilled" ? "ONLINE" : "DEGRADED",
                details: "Fraud alert workflow is available through the dashboard data pipeline",
            },
            {
                name: "PostgreSQL",
                status: transactions.status === "fulfilled" && cases.status === "fulfilled" ? "ONLINE" : "DEGRADED",
                details: "Core transaction and case repositories are responding",
            }
        ]);
        setLastChecked(new Date().toLocaleString());
    };

    useEffect(() => {
        loadHealth();
    }, []);

    const onlineCount = services.filter((service) => service.status === "ONLINE").length;
    const healthScore = services.length === 0 ? 0 : Math.round((onlineCount / services.length) * 100);

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadHealth}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        System Health
                    </Typography>
                    <Typography color="text.secondary">
                        Operational status for APIs, data services, and fraud event processing.
                    </Typography>
                </Box>

                <Button variant="contained" onClick={loadHealth}>
                    Run Health Check
                </Button>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography color="text.secondary" fontWeight={700}>
                            Platform Health
                        </Typography>
                        <Typography variant="h3" fontWeight={900} mt={1}>
                            {healthScore}%
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={healthScore}
                            sx={{ mt: 2, height: 10, borderRadius: 999 }}
                            color={healthScore >= 90 ? "success" : "warning"}
                        />
                        <Typography color="text.secondary" mt={2}>
                            Last checked: {lastChecked || "Not checked yet"}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                        {services.map((service) => (
                            <Grid item xs={12} md={6} key={service.name}>
                                <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography fontWeight={900}>
                                            {service.name}
                                        </Typography>
                                        <Chip
                                            label={service.status}
                                            color={service.status === "ONLINE" ? "success" : "warning"}
                                            size="small"
                                        />
                                    </Stack>
                                    <Typography color="text.secondary" mt={2}>
                                        {service.details}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </MainLayout>
    );
}
