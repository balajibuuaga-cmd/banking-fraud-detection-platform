import { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Paper,
    Stack,
    Typography,
    Button
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import AnalyticsChart from "../components/AnalyticsChart";
import FraudTrendChart from "../components/FraudTrendChart";
import {
    getSeverityStats,
    getAllAlerts,
    getAllTransactions
} from "../services/analyticsService";
import { filterByDateRange } from "../utils/dateFilters";

export default function Analytics({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [severityData, setSeverityData] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const loadAnalytics = async () => {
        setSeverityData(await getSeverityStats());
        setAlerts(await getAllAlerts());
        setTransactions(await getAllTransactions());
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const filteredAlerts = filterByDateRange(alerts, dateRange);
    const filteredTransactions = filterByDateRange(transactions, dateRange);
    const visibleSeverityData = filteredAlerts.reduce((acc, alert) => {
        if (!alert.severity) return acc;
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
    }, {});
    const ruleHits = filteredTransactions.reduce((acc, tx) => {
        if (!tx.reasonCodes) return acc;

        tx.reasonCodes.split(",").forEach((reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
        });

        return acc;
    }, {});

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadAnalytics}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Analytics
                    </Typography>
                    <Typography color="text.secondary">
                        Fraud trends, severity distribution, and rule hit insights.
                    </Typography>
                </Box>

                <Button variant="contained" onClick={loadAnalytics}>
                    Refresh
                </Button>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: 320 }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>
                            Severity Distribution
                        </Typography>
                        <AnalyticsChart data={Object.keys(visibleSeverityData).length ? visibleSeverityData : severityData} />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: 320 }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>
                            Fraud Trend
                        </Typography>
                        <FraudTrendChart alerts={filteredAlerts} />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>
                            Rule Hit Analytics
                        </Typography>

                        {Object.entries(ruleHits).map(([reason, count]) => (
                            <Stack
                                key={reason}
                                direction="row"
                                justifyContent="space-between"
                                sx={{ py: 1, borderBottom: "1px solid #e5e7eb" }}
                            >
                                <Typography>{reason.replaceAll("_", " ")}</Typography>
                                <Typography fontWeight={800}>{count} hits</Typography>
                            </Stack>
                        ))}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>
                            AI Risk Insights
                        </Typography>

                        <Typography>
                            Critical fraud activity is primarily driven by high transaction amounts,
                            new devices, high-risk countries, and international transfer patterns.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </MainLayout>
    );
}
