import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Paper,
    Stack,
    Typography,
    Button,
    TextField,
    MenuItem,
    Chip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MainLayout from "../layouts/MainLayout";
import {
    createAuditLog,
    getAllAlerts,
    updateAlertStatus,
    createFraudCase
} from "../services/analyticsService";
import { exportToCsvWithAudit } from "../utils/exportCsv";
import { filterByDateRange } from "../utils/dateFilters";

export default function Alerts({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [alerts, setAlerts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [severity, setSeverity] = useState(searchParams.get("severity") || "ALL");
    const [selectedIds, setSelectedIds] = useState([]);

    const loadAlerts = async () => {
        const data = await getAllAlerts();
        setAlerts(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    useEffect(() => {
        setSeverity(searchParams.get("severity") || "ALL");
    }, [searchParams]);

    const dateFilteredAlerts = filterByDateRange(alerts, dateRange);
    const filteredAlerts = dateFilteredAlerts.filter((alert) => {
        const matchesSearch =
            `${alert.description} ${alert.severity} ${alert.status}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesSeverity =
            severity === "ALL" || alert.severity === severity;

        return matchesSearch && matchesSeverity;
    });
    const selectedRows = filteredAlerts.filter((item) => selectedIds.includes(item.id));
    const severityLabel = severity === "ALL" ? "alerts" : `${severity.toLowerCase()} alerts`;

    const getSelectionIds = (selectionModel) => {
        if (Array.isArray(selectionModel)) return selectionModel;
        if (selectionModel?.ids) return Array.from(selectionModel.ids);
        return [];
    };

    const bulkResolve = async () => {
        await Promise.all(
            selectedIds.map(async (alertId) => {
                await updateAlertStatus(alertId, "RESOLVED");
                await createAuditLog("Bulk resolved fraud alert", "FraudAlert", alertId);
            })
        );
        setSelectedIds([]);
        await loadAlerts();
    };

    const bulkCreateCases = async () => {
        await Promise.all(
            selectedIds.map(async (alertId) => {
                const createdCase = await createFraudCase(alertId);
                await createAuditLog("Bulk created fraud case from alert", "FraudAlert", alertId);
                await createAuditLog("Created fraud case", "FraudCase", createdCase.id);
            })
        );
        setSelectedIds([]);
        await loadAlerts();
    };

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedSeverity={severity}
            setSelectedSeverity={setSeverity}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadAlerts}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Fraud Alerts
                    </Typography>
                    <Typography color="text.secondary">
                        Review, resolve, and convert alerts into investigation cases.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    {selectedIds.length > 0 && (
                        <>
                            <Button variant="outlined" onClick={bulkResolve}>
                                Resolve Selected ({selectedIds.length})
                            </Button>

                            <Button variant="outlined" onClick={bulkCreateCases}>
                                Create Cases
                            </Button>
                        </>
                    )}

                    <Button
                        variant="outlined"
                        onClick={() => exportToCsvWithAudit(
                            "alerts.csv",
                            selectedRows.length > 0 ? selectedRows : filteredAlerts,
                            createAuditLog,
                            "FraudAlert",
                            0
                        )}
                    >
                        Export {selectedRows.length > 0 ? "Selected" : "CSV"}
                    </Button>

                    <Button variant="contained" onClick={loadAlerts}>
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction="row" spacing={2}>
                    <TextField
                        label="Search alerts"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        select
                        label="Severity"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        sx={{ width: 220 }}
                    >
                        <MenuItem value="ALL">All</MenuItem>
                        <MenuItem value="CRITICAL">Critical</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="LOW">Low</MenuItem>
                    </TextField>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mt={2}>
                    <Chip
                        label={`${filteredAlerts.length} ${severityLabel}`}
                        color={severity === "CRITICAL" ? "error" : "primary"}
                    />
                    <Chip label={`${alerts.length} total alerts loaded`} variant="outlined" />
                    <Chip label="Use the page controls below the table to see more rows" variant="outlined" />
                    {selectedIds.length > 0 && (
                        <Chip label={`${selectedIds.length} selected`} color="secondary" />
                    )}
                </Stack>
            </Paper>

            <Paper sx={{ height: 650, borderRadius: 3 }}>
                <DataGrid
                    rows={filteredAlerts}
                    columns={[
                        { field: "id", headerName: "Alert ID", width: 100 },
                        { field: "severity", headerName: "Severity", width: 140 },
                        { field: "description", headerName: "Description", flex: 1 },
                        { field: "riskScore", headerName: "Risk Score", width: 130 },
                        { field: "status", headerName: "Status", width: 140 },
                        {
                            field: "actions",
                            headerName: "Actions",
                            width: 300,
                            sortable: false,
                            renderCell: (params) => (
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={async () => {
                                            await updateAlertStatus(params.row.id, "RESOLVED");
                                            await createAuditLog("Resolved fraud alert", "FraudAlert", params.row.id);
                                            await loadAlerts();
                                        }}
                                    >
                                        Resolve
                                    </Button>

                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={async () => {
                                            const createdCase = await createFraudCase(params.row.id);
                                            await createAuditLog("Created fraud case from alert", "FraudAlert", params.row.id);
                                            await createAuditLog("Created fraud case", "FraudCase", createdCase.id);
                                            await loadAlerts();
                                        }}
                                    >
                                        Case
                                    </Button>

                                    <Button
                                        size="small"
                                        color="secondary"
                                        variant="contained"
                                        onClick={() => navigate("/customer-360/1")}
                                    >
                                        Customer
                                    </Button>
                                </Stack>
                            )
                        }
                    ]}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 25, page: 0 },
                        },
                    }}
                    showToolbar
                    checkboxSelection
                    rowSelectionModel={{ type: "include", ids: new Set(selectedIds) }}
                    onRowSelectionModelChange={(newSelection) => setSelectedIds(getSelectionIds(newSelection))}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 400 }
                        }
                    }}
                    disableRowSelectionOnClick
                />
            </Paper>
        </MainLayout>
    );
}
