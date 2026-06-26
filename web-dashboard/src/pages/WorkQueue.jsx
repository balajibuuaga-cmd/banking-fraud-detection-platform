import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { assignFraudCaseAnalyst, createAuditLog, getAllFraudCases } from "../services/analyticsService";
import { filterByDateRange } from "../utils/dateFilters";
import { getCasePriority, getCaseRiskScore, getCaseSla } from "../utils/caseSla";

export default function WorkQueue({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [cases, setCases] = useState([]);
    const [queueView, setQueueView] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
    const [assignmentCaseIds, setAssignmentCaseIds] = useState([]);
    const [assignmentAnalyst, setAssignmentAnalyst] = useState(localStorage.getItem("fullName") || "Balaji");
    const [assignmentReason, setAssignmentReason] = useState("");
    const [assignmentError, setAssignmentError] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const navigate = useNavigate();
    const analystName = localStorage.getItem("fullName") || "Balaji";
    const analystKey = analystName.toLowerCase();

    const loadQueue = async () => {
        const data = await getAllFraudCases();
        setCases(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const rows = useMemo(() => {
        return filterByDateRange(cases, dateRange)
            .filter((item) => {
                const sla = getCaseSla(item);
                const assignedAnalyst = item.assignedAnalyst || "";
                const matchesSearch = `${item.caseNumber} ${item.status} ${assignedAnalyst} ${item.notes}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

                if (!matchesSearch) return false;
                if (queueView === "MY") {
                    const assignedKey = assignedAnalyst.toLowerCase();
                    return assignedKey === analystKey || analystKey.includes(assignedKey) || assignedKey.includes(analystKey);
                }
                if (queueView === "UNASSIGNED") return !assignedAnalyst;
                if (queueView === "ESCALATED") return item.status === "ESCALATED";
                if (queueView === "OVERDUE") return sla.label === "Overdue";
                if (queueView === "CRITICAL") return getCaseRiskScore(item) >= 100;

                return item.status !== "CLOSED";
            })
            .map((item) => ({
                ...item,
                riskScore: getCaseRiskScore(item),
                priority: getCasePriority(item).label,
                slaLabel: getCaseSla(item).label,
                slaDetail: getCaseSla(item).detail
            }));
    }, [analystName, cases, dateRange, queueView, searchTerm]);

    const openCases = rows.filter((item) => item.status !== "CLOSED").length;
    const escalatedCases = rows.filter((item) => item.status === "ESCALATED").length;
    const overdueCases = rows.filter((item) => item.slaLabel === "Overdue").length;

    const getSelectionIds = (selectionModel) => {
        if (Array.isArray(selectionModel)) return selectionModel;
        if (selectionModel?.ids) return Array.from(selectionModel.ids);
        return [];
    };

    const openAssignmentDialog = (caseIds) => {
        setAssignmentCaseIds(caseIds);
        setAssignmentAnalyst(localStorage.getItem("fullName") || "Balaji");
        setAssignmentReason("");
        setAssignmentError("");
        setAssignmentDialogOpen(true);
    };

    const submitAssignment = async () => {
        if (!assignmentReason.trim()) {
            setAssignmentError("Assignment reason is required.");
            return;
        }

        await Promise.all(
            assignmentCaseIds.map(async (caseId) => {
                await assignFraudCaseAnalyst(caseId, assignmentAnalyst);
                await createAuditLog(
                    `Assigned case to ${assignmentAnalyst}: ${assignmentReason.trim()}`,
                    "FraudCase",
                    caseId
                );
            })
        );

        setAssignmentDialogOpen(false);
        setSelectedIds([]);
        setSnackbarOpen(true);
        await loadQueue();
    };

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadQueue}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Analyst Work Queue
                    </Typography>
                    <Typography color="text.secondary">
                        Prioritized workload with SLA status, assignment filters, and saved views.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    {selectedIds.length > 0 && (
                        <Button variant="outlined" onClick={() => openAssignmentDialog(selectedIds)}>
                            Assign Selected ({selectedIds.length})
                        </Button>
                    )}

                    <Button variant="contained" onClick={loadQueue}>
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <Stack direction="row" spacing={2} mb={3}>
                <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                    <Typography color="text.secondary">Assigned Analyst</Typography>
                    <Typography variant="h5" fontWeight={800}>
                        {analystName}
                    </Typography>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                    <Typography color="text.secondary">Open In View</Typography>
                    <Typography variant="h5" fontWeight={800}>{openCases}</Typography>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                    <Typography color="text.secondary">Escalated</Typography>
                    <Typography variant="h5" fontWeight={800}>{escalatedCases}</Typography>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                    <Typography color="text.secondary">Overdue SLA</Typography>
                    <Typography variant="h5" fontWeight={800}>{overdueCases}</Typography>
                </Paper>
            </Stack>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                    <ToggleButtonGroup
                        exclusive
                        value={queueView}
                        onChange={(_, value) => value && setQueueView(value)}
                        size="small"
                    >
                        <ToggleButton value="ALL">All Active</ToggleButton>
                        <ToggleButton value="MY">My Cases</ToggleButton>
                        <ToggleButton value="UNASSIGNED">Unassigned</ToggleButton>
                        <ToggleButton value="ESCALATED">Escalated</ToggleButton>
                    </ToggleButtonGroup>

                    <Stack direction="row" spacing={1}>
                        <Chip label="Critical Alerts" onClick={() => setQueueView("CRITICAL")} clickable />
                        <Chip label="Overdue SLA" color="error" onClick={() => setQueueView("OVERDUE")} clickable />
                        <Chip label="My Cases" color="primary" onClick={() => setQueueView("MY")} clickable />
                    </Stack>
                </Stack>
            </Paper>

            <Paper sx={{ height: 560, borderRadius: 3 }}>
                <DataGrid
                    rows={rows}
                    columns={[
                        {
                            field: "priority",
                            headerName: "Priority",
                            width: 130,
                            renderCell: (params) => {
                                const priority = getCasePriority(params.row);
                                return <Chip label={priority.label} color={priority.color} size="small" />;
                            }
                        },
                        { field: "caseNumber", headerName: "Case", width: 150 },
                        { field: "assignedAnalyst", headerName: "Analyst", width: 190 },
                        { field: "riskScore", headerName: "Risk", width: 110 },
                        {
                            field: "status",
                            headerName: "Status",
                            width: 150,
                            renderCell: (params) => (
                                <Chip
                                    label={params.row.status}
                                    color={params.row.status === "ESCALATED" ? "warning" : params.row.status === "CLOSED" ? "success" : "primary"}
                                    size="small"
                                />
                            )
                        },
                        {
                            field: "slaLabel",
                            headerName: "SLA",
                            width: 170,
                            renderCell: (params) => {
                                const sla = getCaseSla(params.row);
                                return <Chip label={`${sla.label} · ${sla.detail}`} color={sla.color} size="small" />;
                            }
                        },
                        {
                            field: "actions",
                            headerName: "Action",
                            width: 250,
                            sortable: false,
                            renderCell: (params) => (
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => openAssignmentDialog([params.row.id])}
                                    >
                                        Assign
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => navigate(`/cases/${params.row.id}`)}
                                    >
                                        Open
                                    </Button>
                                </Stack>
                            )
                        }
                    ]}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
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

            <Dialog
                open={assignmentDialogOpen}
                onClose={() => setAssignmentDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Assign {assignmentCaseIds.length} Case{assignmentCaseIds.length === 1 ? "" : "s"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            select
                            label="Analyst"
                            value={assignmentAnalyst}
                            onChange={(event) => setAssignmentAnalyst(event.target.value)}
                            fullWidth
                        >
                            <MenuItem value="Balaji">Balaji</MenuItem>
                            <MenuItem value="Senior Investigator">Senior Investigator</MenuItem>
                            <MenuItem value={localStorage.getItem("fullName") || "Balaji"}>
                                {localStorage.getItem("fullName") || "Balaji"}
                            </MenuItem>
                        </TextField>

                        <TextField
                            label="Assignment Reason"
                            value={assignmentReason}
                            onChange={(event) => {
                                setAssignmentReason(event.target.value);
                                setAssignmentError("");
                            }}
                            error={Boolean(assignmentError)}
                            helperText={assignmentError}
                            multiline
                            minRows={3}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignmentDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={submitAssignment}>
                        Save Assignment
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message="Case assignment saved"
            />
        </MainLayout>
    );
}
