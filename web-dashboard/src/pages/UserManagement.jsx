import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MainLayout from "../layouts/MainLayout";
import {
    createAuditLog,
    getAllFraudCases,
    getUsers,
    updateUserActive,
    updateUserRole
} from "../services/analyticsService";

const rolePermissions = {
    ADMIN: "Full platform administration, rules, users, audit, and investigations",
    ANALYST: "Investigations, alerts, customer 360, queue, and case decisions",
    AUDITOR: "Read-only audit, reports, alerts, and compliance review"
};

export default function UserManagement({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [users, setUsers] = useState([]);
    const [cases, setCases] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const loadUsers = async () => {
        const [userData, caseData] = await Promise.allSettled([
            getUsers(),
            getAllFraudCases()
        ]);

        setUsers(userData.status === "fulfilled" && Array.isArray(userData.value) ? userData.value : []);
        setCases(caseData.status === "fulfilled" && Array.isArray(caseData.value) ? caseData.value : []);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const rows = useMemo(() => {
        return users
            .filter((user) => `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((user) => {
                const assignedCases = cases.filter((item) => item.assignedAnalyst === user.fullName);
                const openCases = assignedCases.filter((item) => item.status !== "CLOSED").length;

                return {
                    ...user,
                    active: user.active !== false,
                    assignedCases: assignedCases.length,
                    openCases,
                    permissions: rolePermissions[user.role] || "Limited platform access"
                };
            });
    }, [cases, searchTerm, users]);

    const analysts = rows.filter((user) => user.role === "ANALYST").length;
    const activeUsers = rows.filter((user) => user.active).length;
    const totalOpenWorkload = rows.reduce((sum, user) => sum + user.openCases, 0);

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadUsers}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        User Management
                    </Typography>
                    <Typography color="text.secondary">
                        Admin console for roles, user status, analyst workload, and permissions.
                    </Typography>
                </Box>

                <Button variant="contained" onClick={loadUsers}>
                    Refresh
                </Button>
            </Stack>

            <Stack direction="row" spacing={2} mb={3}>
                <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                    <Typography color="text.secondary">Active Users</Typography>
                    <Typography variant="h5" fontWeight={800}>{activeUsers}</Typography>
                </Paper>
                <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                    <Typography color="text.secondary">Analysts</Typography>
                    <Typography variant="h5" fontWeight={800}>{analysts}</Typography>
                </Paper>
                <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
                    <Typography color="text.secondary">Open Workload</Typography>
                    <Typography variant="h5" fontWeight={800}>{totalOpenWorkload}</Typography>
                </Paper>
            </Stack>

            <Paper sx={{ height: 590, borderRadius: 3 }}>
                <DataGrid
                    rows={rows}
                    columns={[
                        { field: "fullName", headerName: "User", width: 190 },
                        { field: "email", headerName: "Email", width: 240 },
                        {
                            field: "role",
                            headerName: "Role",
                            width: 170,
                            renderCell: (params) => (
                                <TextField
                                    select
                                    size="small"
                                    value={params.row.role}
                                    onChange={async (event) => {
                                        await updateUserRole(params.row.id, event.target.value);
                                        await createAuditLog(`Updated user role to ${event.target.value}`, "AppUser", params.row.id);
                                        await loadUsers();
                                    }}
                                    sx={{ width: 145 }}
                                >
                                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                                    <MenuItem value="ANALYST">ANALYST</MenuItem>
                                    <MenuItem value="AUDITOR">AUDITOR</MenuItem>
                                </TextField>
                            )
                        },
                        {
                            field: "active",
                            headerName: "Status",
                            width: 130,
                            renderCell: (params) => (
                                <Chip
                                    label={params.row.active ? "ACTIVE" : "INACTIVE"}
                                    color={params.row.active ? "success" : "default"}
                                    size="small"
                                />
                            )
                        },
                        { field: "assignedCases", headerName: "Assigned", width: 120 },
                        { field: "openCases", headerName: "Open", width: 100 },
                        { field: "permissions", headerName: "Permissions", flex: 1 },
                        {
                            field: "actions",
                            headerName: "Actions",
                            width: 150,
                            sortable: false,
                            renderCell: (params) => (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={async () => {
                                        await updateUserActive(params.row.id, !params.row.active);
                                        await createAuditLog(params.row.active ? "Deactivated user" : "Activated user", "AppUser", params.row.id);
                                        await loadUsers();
                                    }}
                                >
                                    {params.row.active ? "Deactivate" : "Activate"}
                                </Button>
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
