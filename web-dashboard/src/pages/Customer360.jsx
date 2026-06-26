import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@mui/material/Button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Box,
    Chip,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import { getCustomer360 } from "../services/analyticsService";

export default function Customer360({ darkMode, setDarkMode }) {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    useEffect(() => {
        getCustomer360(customerId).then(setData);
    }, [customerId]);

    if (!data) {
        return <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>Loading customer profile...</MainLayout>;
    }

    const exportCustomerPdf = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Customer 360 Risk Report", 14, 20);

        doc.setFontSize(11);
        doc.text(`Customer: ${data.customer.fullName}`, 14, 34);
        doc.text(`Email: ${data.customer.email}`, 14, 42);
        doc.text(`Phone: ${data.customer.phoneNumber}`, 14, 50);
        doc.text(`Risk Level: ${data.customer.riskLevel || "UNKNOWN"}`, 14, 58);

        autoTable(doc, {
            startY: 70,
            head: [["Account", "Type", "Balance", "Status"]],
            body: data.accounts.map((acc) => [
                acc.accountNumber,
                acc.accountType,
                `$${acc.balance}`,
                acc.status,
            ]),
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 12,
            head: [["Txn ID", "Amount", "Type", "Location", "Risk", "Score"]],
            body: data.transactions.map((tx) => [
                tx.id,
                `$${tx.amount}`,
                tx.transactionType,
                tx.location,
                tx.riskLevel,
                tx.riskScore,
            ]),
        });

        doc.save(`customer-${data.customer.id}-risk-report.pdf`);
    };

    const askCopilotAboutCustomer = () => {
        const prompt = `Summarize customer ${data.customer.fullName}'s fraud risk profile and recommend the next investigation step. Total transactions: ${data.totalTransactions}. Critical transactions: ${data.criticalTransactions}. Accounts: ${data.accounts.length}.`;
        const context = {
            type: "customer",
            customerId: data.customer.id,
            customerName: data.customer.fullName,
            totalTransactions: data.totalTransactions,
            criticalTransactions: data.criticalTransactions,
            accountCount: data.accounts.length,
        };

        navigate(`/copilot?prompt=${encodeURIComponent(prompt)}&context=${encodeURIComponent(JSON.stringify(context))}`);
    };

    return (
        <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Customer 360
                    </Typography>
                    <Typography color="text.secondary">
                        Complete customer risk profile and fraud activity summary.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={askCopilotAboutCustomer}>
                        Ask Copilot
                    </Button>

                    <Button variant="contained" onClick={exportCustomerPdf}>
                        Export PDF
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>Customer Profile</Typography>
                        <Typography mt={2}><strong>Name:</strong> {data.customer.fullName}</Typography>
                        <Typography><strong>Email:</strong> {data.customer.email}</Typography>
                        <Typography><strong>Phone:</strong> {data.customer.phoneNumber}</Typography>
                        <Typography><strong>Address:</strong> {data.customer.address}</Typography>
                        <Chip sx={{ mt: 2 }} label={data.customer.riskLevel || "UNKNOWN"} color="error" />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>Risk Summary</Typography>
                        <Typography mt={2}>Total Transactions: {data.totalTransactions}</Typography>
                        <Typography>Critical Transactions: {data.criticalTransactions}</Typography>
                        <Typography mt={2}>{data.aiRiskSummary}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>Accounts</Typography>
                        {data.accounts.map((acc) => (
                            <Box key={acc.id} mt={2}>
                                <Typography><strong>{acc.accountNumber}</strong></Typography>
                                <Typography>{acc.accountType} · ${acc.balance}</Typography>
                                <Chip label={acc.status} color={acc.status === "LOCKED" ? "error" : "success"} size="small" />
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>ID</strong></TableCell>
                                    <TableCell><strong>Amount</strong></TableCell>
                                    <TableCell><strong>Type</strong></TableCell>
                                    <TableCell><strong>Location</strong></TableCell>
                                    <TableCell><strong>Risk</strong></TableCell>
                                    <TableCell><strong>Score</strong></TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {data.transactions.map((tx) => (
                                    <TableRow key={tx.id} hover>
                                        <TableCell>#{tx.id}</TableCell>
                                        <TableCell>${tx.amount}</TableCell>
                                        <TableCell>{tx.transactionType}</TableCell>
                                        <TableCell>{tx.location}</TableCell>
                                        <TableCell>
                                            <Chip label={tx.riskLevel} color={tx.riskLevel === "CRITICAL" ? "error" : "warning"} size="small" />
                                        </TableCell>
                                        <TableCell>{tx.riskScore}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </MainLayout>
    );
}
