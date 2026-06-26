import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MainLayout from "../layouts/MainLayout";
import { createAuditLog, getAllTransactions } from "../services/analyticsService";
import { exportToCsvWithAudit } from "../utils/exportCsv";
import { filterByDateRange } from "../utils/dateFilters";

export default function Transactions({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const loadTransactions = async () => {
        const data = await getAllTransactions();
        setTransactions(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const filteredTransactions = filterByDateRange(transactions, dateRange).filter((tx) =>
        `${tx.id} ${tx.amount} ${tx.transactionType} ${tx.location} ${tx.riskLevel} ${tx.status}`
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
            onRefresh={loadTransactions}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Transactions
                    </Typography>
                    <Typography color="text.secondary">
                        Review processed banking transactions and fraud risk scores.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={() => exportToCsvWithAudit("transactions.csv", filteredTransactions, createAuditLog, "Transaction", 0)}
                    >
                        Export CSV
                    </Button>

                    <Button variant="contained" onClick={loadTransactions}>
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <Paper sx={{ height: 520, borderRadius: 3 }}>
                <DataGrid
                    rows={filteredTransactions}
                    columns={[
                        { field: "id", headerName: "ID", width: 90 },
                        { field: "amount", headerName: "Amount", width: 140 },
                        { field: "transactionType", headerName: "Type", width: 220 },
                        { field: "location", headerName: "Location", width: 160 },
                        { field: "riskLevel", headerName: "Risk", width: 140 },
                        { field: "riskScore", headerName: "Score", width: 120 },
                        { field: "status", headerName: "Status", width: 160 },
                        {
                            field: "actions",
                            headerName: "Actions",
                            width: 160,
                            sortable: false,
                            renderCell: () => (
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => navigate("/customer-360/1")}
                                >
                                    Customer 360
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
