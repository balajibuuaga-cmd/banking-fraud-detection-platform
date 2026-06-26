import { useEffect, useState } from "react";
import {
    Box,
    Button,
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
    getFraudRules,
    createFraudRule,
    updateRuleStatus,
    deleteRule
} from "../services/analyticsService";
import { exportToCsvWithAudit } from "../utils/exportCsv";
import { filterByDateRange } from "../utils/dateFilters";

export default function FraudRules({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [rules, setRules] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [rule, setRule] = useState({
        ruleName: "",
        ruleType: "HIGH_AMOUNT",
        conditionValue: "",
        riskPoints: 10,
        active: true
    });

    const loadRules = async () => {
        const data = await getFraudRules();
        setRules(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadRules();
    }, []);

    const handleCreate = async () => {
        const createdRule = await createFraudRule(rule);
        await createAuditLog("Created fraud rule", "FraudRule", createdRule.id);
        setRule({
            ruleName: "",
            ruleType: "HIGH_AMOUNT",
            conditionValue: "",
            riskPoints: 10,
            active: true
        });
        loadRules();
    };

    const filteredRules = filterByDateRange(rules, dateRange).filter((item) =>
        `${item.ruleName} ${item.ruleType} ${item.conditionValue} ${item.active ? "ACTIVE" : "DISABLED"}`
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
            onRefresh={loadRules}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Fraud Rules
                    </Typography>
                    <Typography color="text.secondary">
                        Configure risk rules used by the fraud detection engine.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={() => exportToCsvWithAudit("fraud-rules.csv", filteredRules, createAuditLog, "FraudRule", 0)}
                    >
                        Export CSV
                    </Button>

                    <Button variant="contained" onClick={loadRules}>
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Stack direction="row" spacing={2}>
                    <TextField
                        label="Rule Name"
                        value={rule.ruleName}
                        onChange={(e) => setRule({ ...rule, ruleName: e.target.value })}
                        fullWidth
                    />

                    <TextField
                        select
                        label="Rule Type"
                        value={rule.ruleType}
                        onChange={(e) => setRule({ ...rule, ruleType: e.target.value })}
                        sx={{ width: 260 }}
                    >
                        <MenuItem value="HIGH_AMOUNT">High Amount</MenuItem>
                        <MenuItem value="NEW_DEVICE">New Device</MenuItem>
                        <MenuItem value="UNUSUAL_LOCATION">Unusual Location</MenuItem>
                        <MenuItem value="INTERNATIONAL_TRANSFER">International Transfer</MenuItem>
                        <MenuItem value="RAPID_TRANSACTION_PATTERN">Rapid Pattern</MenuItem>
                        <MenuItem value="HIGH_RISK_COUNTRY">High Risk Country</MenuItem>
                    </TextField>

                    <TextField
                        label="Condition"
                        value={rule.conditionValue}
                        onChange={(e) => setRule({ ...rule, conditionValue: e.target.value })}
                        sx={{ width: 220 }}
                    />

                    <TextField
                        type="number"
                        label="Risk Points"
                        value={rule.riskPoints}
                        onChange={(e) =>
                            setRule({ ...rule, riskPoints: Number(e.target.value) })
                        }
                        sx={{ width: 160 }}
                    />

                    <Button variant="contained" onClick={handleCreate}>
                        Add Rule
                    </Button>
                </Stack>
            </Paper>

            <Paper sx={{ height: 560, borderRadius: 3 }}>
                <DataGrid
                    rows={filteredRules}
                    columns={[
                        { field: "ruleName", headerName: "Rule", flex: 1 },
                        { field: "ruleType", headerName: "Type", width: 220 },
                        { field: "conditionValue", headerName: "Condition", width: 180 },
                        { field: "riskPoints", headerName: "Points", width: 120 },
                        {
                            field: "active",
                            headerName: "Status",
                            width: 140,
                            renderCell: (params) => params.row.active ? "ACTIVE" : "DISABLED"
                        },
                        {
                            field: "actions",
                            headerName: "Actions",
                            width: 220,
                            sortable: false,
                            renderCell: (params) => (
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={async () => {
                                            await updateRuleStatus(params.row.id, !params.row.active);
                                            await createAuditLog(
                                                params.row.active ? "Disabled fraud rule" : "Enabled fraud rule",
                                                "FraudRule",
                                                params.row.id
                                            );
                                            await loadRules();
                                        }}
                                    >
                                        {params.row.active ? "Disable" : "Enable"}
                                    </Button>

                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={async () => {
                                            await deleteRule(params.row.id);
                                            await createAuditLog("Deleted fraud rule", "FraudRule", params.row.id);
                                            await loadRules();
                                        }}
                                    >
                                        Delete
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
