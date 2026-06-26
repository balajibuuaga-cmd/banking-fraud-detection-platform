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
import { getAllTransactions } from "../services/analyticsService";

const getSeverityColor = (riskLevel) => {
    if (riskLevel === "CRITICAL") return "error";
    if (riskLevel === "HIGH") return "warning";
    if (riskLevel === "MEDIUM") return "primary";
    return "success";
};

const getMarkerPosition = (location, index) => {
    const knownPositions = {
        Russia: { top: "31%", left: "68%" },
        Nigeria: { top: "57%", left: "51%" },
        Chicago: { top: "38%", left: "25%" },
        USA: { top: "39%", left: "24%" },
        India: { top: "49%", left: "67%" },
        China: { top: "43%", left: "73%" },
        UK: { top: "33%", left: "47%" },
    };

    const match = Object.entries(knownPositions).find(([key]) =>
        location?.toLowerCase().includes(key.toLowerCase())
    );

    if (match) return match[1];

    return {
        top: `${28 + (index * 13) % 42}%`,
        left: `${22 + (index * 17) % 58}%`,
    };
};

export default function FraudMap({ darkMode, setDarkMode }) {
    const [transactions, setTransactions] = useState([]);

    const loadMapData = async () => {
        const data = await getAllTransactions();
        setTransactions(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadMapData();
    }, []);

    const locations = Object.values(
        transactions.reduce((acc, tx) => {
            const location = tx.location || "Unknown";
            const riskScore = tx.riskScore || 0;

            if (!acc[location]) {
                acc[location] = {
                    id: location,
                    location,
                    count: 0,
                    totalRisk: 0,
                    maxRisk: 0,
                    highestRiskLevel: tx.riskLevel || "LOW",
                    totalAmount: 0,
                };
            }

            acc[location].count += 1;
            acc[location].totalRisk += riskScore;
            acc[location].maxRisk = Math.max(acc[location].maxRisk, riskScore);
            acc[location].totalAmount += tx.amount || 0;

            if (riskScore >= acc[location].maxRisk) {
                acc[location].highestRiskLevel = tx.riskLevel || "LOW";
            }

            return acc;
        }, {})
    ).sort((a, b) => b.maxRisk - a.maxRisk);

    const criticalLocations = locations.filter((item) => item.highestRiskLevel === "CRITICAL").length;
    const totalRisk = locations.reduce((sum, item) => sum + item.totalRisk, 0);
    const avgRisk = transactions.length === 0 ? 0 : Math.round(totalRisk / transactions.length);

    return (
        <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Fraud Map
                    </Typography>
                    <Typography color="text.secondary">
                        Geographic view of suspicious transaction activity and high-risk locations.
                    </Typography>
                </Box>

                <Button variant="contained" onClick={loadMapData}>
                    Refresh
                </Button>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography color="text.secondary">Tracked Locations</Typography>
                        <Typography variant="h4" fontWeight={900}>{locations.length}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography color="text.secondary">Critical Locations</Typography>
                        <Typography variant="h4" fontWeight={900} color="error">{criticalLocations}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography color="text.secondary">Average Risk Score</Typography>
                        <Typography variant="h4" fontWeight={900}>{avgRisk}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            minHeight: 520,
                            position: "relative",
                            overflow: "hidden",
                            background:
                                darkMode
                                    ? "radial-gradient(circle at 30% 30%, rgba(79,70,229,0.28), transparent 30%), linear-gradient(135deg, #111827, #020617)"
                                    : "radial-gradient(circle at 30% 30%, rgba(79,70,229,0.16), transparent 30%), linear-gradient(135deg, #eff6ff, #ffffff)",
                        }}
                    >
                        <Typography variant="h6" fontWeight={800}>
                            Global Risk View
                        </Typography>
                        <Typography color="text.secondary" mb={3}>
                            Marker size reflects transaction volume. Color reflects highest observed risk.
                        </Typography>

                        <Box
                            sx={{
                                position: "absolute",
                                inset: 90,
                                border: "1px dashed",
                                borderColor: "divider",
                                borderRadius: "50%",
                                opacity: 0.5,
                            }}
                        />

                        {locations.map((item, index) => {
                            const position = getMarkerPosition(item.location, index);
                            const size = Math.min(72, 34 + item.count * 8);

                            return (
                                <Box
                                    key={item.location}
                                    sx={{
                                        position: "absolute",
                                        top: position.top,
                                        left: position.left,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: size,
                                            height: size,
                                            borderRadius: "50%",
                                            bgcolor:
                                                item.highestRiskLevel === "CRITICAL"
                                                    ? "error.main"
                                                    : item.highestRiskLevel === "HIGH"
                                                        ? "warning.main"
                                                        : "primary.main",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 900,
                                            boxShadow: "0 18px 36px rgba(15, 23, 42, 0.22)",
                                        }}
                                    >
                                        {item.count}
                                    </Box>
                                    <Typography mt={1} fontWeight={800} textAlign="center">
                                        {item.location}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, borderRadius: 3, minHeight: 520 }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>
                            High-Risk Locations
                        </Typography>

                        <Stack spacing={2}>
                            {locations.length === 0 ? (
                                <Typography color="text.secondary">
                                    No transaction location data available.
                                </Typography>
                            ) : (
                                locations.map((item) => (
                                    <Paper key={item.location} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography fontWeight={800}>{item.location}</Typography>
                                            <Chip
                                                size="small"
                                                label={item.highestRiskLevel}
                                                color={getSeverityColor(item.highestRiskLevel)}
                                            />
                                        </Stack>

                                        <Typography color="text.secondary" fontSize={14}>
                                            {item.count} transactions · ${Math.round(item.totalAmount).toLocaleString()} total amount
                                        </Typography>

                                        <Box mt={1.5}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography fontSize={13}>Max Risk</Typography>
                                                <Typography fontSize={13} fontWeight={800}>{item.maxRisk}</Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(item.maxRisk, 100)}
                                                color={getSeverityColor(item.highestRiskLevel)}
                                                sx={{ height: 8, borderRadius: 999, mt: 0.75 }}
                                            />
                                        </Box>
                                    </Paper>
                                ))
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </MainLayout>
    );
}
