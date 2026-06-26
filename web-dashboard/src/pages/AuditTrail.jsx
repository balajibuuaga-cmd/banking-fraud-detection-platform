import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MainLayout from "../layouts/MainLayout";
import { createAuditLog, getAuditLogs } from "../services/analyticsService";
import { exportToCsvWithAudit } from "../utils/exportCsv";
import { filterByDateRange } from "../utils/dateFilters";

export default function AuditTrail({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const loadLogs = async () => {
        const data = await getAuditLogs();
        setLogs(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const filteredLogs = filterByDateRange(logs, dateRange).filter((log) =>
        `${log.action} ${log.performedBy} ${log.entityName} ${log.entityId}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadLogs}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Audit Trail
                    </Typography>
                    <Typography color="text.secondary">
                        Track account actions, investigation updates, and analyst activity.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={() => exportToCsvWithAudit("audit-trail.csv", filteredLogs, createAuditLog, "AuditLog", 0)}
                    >
                        Export CSV
                    </Button>

                    <Button variant="contained" onClick={loadLogs}>
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <Paper sx={{ height: 560, borderRadius: 3 }}>
                <DataGrid
                    rows={filteredLogs}
                    columns={[
                        { field: "id", headerName: "ID", width: 90 },
                        { field: "action", headerName: "Action", flex: 1 },
                        { field: "performedBy", headerName: "Performed By", width: 180 },
                        { field: "entityName", headerName: "Entity", width: 160 },
                        { field: "entityId", headerName: "Entity ID", width: 130 },
                        { field: "createdAt", headerName: "Created At", width: 220 },
                    ]}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                    showToolbar
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
