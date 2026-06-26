import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    LinearProgress,
    Paper,
    Snackbar,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import {
    getAllFraudCases,
    createAuditLog,
    getInvestigationSummary,
    updateCaseNotes,
    updateAccountStatus,
    updateFraudCaseStatus
} from "../services/analyticsService";
import { getCaseSla } from "../utils/caseSla";

export default function CaseDetails({ darkMode, setDarkMode }) {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [notes, setNotes] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
    const [decisionType, setDecisionType] = useState("");
    const [decisionReason, setDecisionReason] = useState("");
    const [decisionError, setDecisionError] = useState("");
    const timelineItems = [
        {
            label: "Case Created",
            detail: "Fraud case was generated from a suspicious alert."
        },
        {
            label: "Risk Scored",
            detail: `Risk score calculated as ${caseData?.riskScore || "N/A"}.`
        },
        {
            label: "Analyst Assigned",
            detail: `${caseData?.assignedAnalyst || "Unassigned"} assigned to investigate.`
        },
        {
            label: "Current Status",
            detail: `Case is currently ${caseData?.status}.`
        }
    ];

    const loadCase = async () => {
        const cases = await getAllFraudCases();
        const selected = cases.find((c) => String(c.id) === String(caseId));
        setCaseData(selected);
        setNotes(selected?.notes || "");
    };

    useEffect(() => {
        loadCase();
    }, [caseId]);

    const generateSummary = async () => {
        const data = await getInvestigationSummary(caseId);
        setSummary(data);
        setSummaryDialogOpen(true);
        await createAuditLog("Generated AI summary", "FraudCase", caseData.id);
    };

    const exportCasePdf = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Fraud Investigation Report", 14, 20);

        doc.setFontSize(11);
        doc.text(`Case Number: ${caseData.caseNumber}`, 14, 34);
        doc.text(`Status: ${caseData.status}`, 14, 42);
        doc.text(`Assigned Analyst: ${caseData.assignedAnalyst || "Unassigned"}`, 14, 50);
        doc.text(`Risk Score: ${caseData.riskScore || "N/A"}`, 14, 58);

        autoTable(doc, {
            startY: 72,
            head: [["Section", "Details"]],
            body: [
                ["Case Notes", notes || caseData.notes || "N/A"],
                ["AI Summary", summary?.summary || "Generate AI summary before exporting for latest AI analysis."],
                ["Recommended Next Steps", summary?.recommendedNextSteps || "Verify customer identity, review transaction history, and document final decision."],
                ["Decision", "Pending analyst decision"]
            ],
        });

        doc.save(`${caseData.caseNumber}-investigation-report.pdf`);
        createAuditLog("Exported investigation PDF", "FraudCase", caseData.id);
    };

    const saveNotes = async () => {
        await updateCaseNotes(caseData.id, notes);
        await createAuditLog("Saved analyst notes", "FraudCase", caseData.id);
        await loadCase();
        setSnackbarOpen(true);
    };

    const closeCase = async () => {
        await updateFraudCaseStatus(caseData.id, "CLOSED");
        await createAuditLog("Closed investigation", "FraudCase", caseData.id);
        await loadCase();
    };

    const updateCaseStatusWithAudit = async (status, action) => {
        await updateFraudCaseStatus(caseData.id, status);
        await createAuditLog(action, "FraudCase", caseData.id);
        await loadCase();
    };

    const askCopilotAboutCase = () => {
        const prompt = `Summarize case ${caseData.caseNumber}, explain the main fraud risk, and recommend the next analyst action. Current status: ${caseData.status}. Risk score: ${caseData.riskScore || "N/A"}. Notes: ${notes || caseData.notes || "N/A"}.`;
        const context = {
            type: "case",
            caseId: caseData.id,
            caseNumber: caseData.caseNumber,
            riskScore: caseData.riskScore || "N/A",
            status: caseData.status,
            notes: notes || caseData.notes || "N/A",
        };

        navigate(`/copilot?prompt=${encodeURIComponent(prompt)}&context=${encodeURIComponent(JSON.stringify(context))}`);
    };

    const openDecisionDialog = (type) => {
        setDecisionType(type);
        setDecisionReason("");
        setDecisionError("");
        setDecisionDialogOpen(true);
    };

    const submitDecision = async () => {
        if (!decisionReason.trim()) {
            setDecisionError("A decision reason is required.");
            return;
        }

        const decisionMap = {
            FREEZE_ACCOUNT: {
                label: "Freeze Account",
                status: "ESCALATED",
                action: "Decision: freeze account",
                accountStatus: "LOCKED"
            },
            ESCALATE: {
                label: "Escalate",
                status: "ESCALATED",
                action: "Decision: escalate investigation"
            },
            CLEAR_CUSTOMER: {
                label: "Clear Customer",
                status: "CLOSED",
                action: "Decision: clear customer"
            },
            CLOSE_INVESTIGATION: {
                label: "Close Investigation",
                status: "CLOSED",
                action: "Decision: close investigation"
            }
        };
        const decision = decisionMap[decisionType];
        const decisionNote = `${notes || caseData.notes || ""}\n\nDecision: ${decision.label}\nReason: ${decisionReason.trim()}`.trim();

        if (decision.accountStatus) {
            await updateAccountStatus(1, decision.accountStatus);
            await createAuditLog(`Account ${decision.accountStatus} from investigation decision`, "BankAccount", 1);
        }

        await updateCaseNotes(caseData.id, decisionNote);
        await updateFraudCaseStatus(caseData.id, decision.status);
        await createAuditLog(`${decision.action}: ${decisionReason.trim()}`, "FraudCase", caseData.id);
        await loadCase();
        setDecisionDialogOpen(false);
        setSnackbarOpen(true);
    };

    if (!caseData) {
        return <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>Loading case...</MainLayout>;
    }

    const caseSla = getCaseSla(caseData);

    return (
        <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        {caseData.caseNumber}
                    </Typography>
                    <Typography color="text.secondary">
                        Fraud investigation case details and analyst workflow.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Chip label={caseData.status} color="primary" />
                    <Chip label={`${caseSla.label} · ${caseSla.detail}`} color={caseSla.color} />
                </Stack>
            </Stack>

            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>
                            Investigation Confidence
                        </Typography>

                        <Box mt={2}>
                            <Stack direction="row" justifyContent="space-between" mb={1}>
                                <Typography color="text.secondary">
                                    Fraud likelihood
                                </Typography>
                                <Typography fontWeight={800}>
                                    78%
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={78}
                                sx={{ height: 10, borderRadius: 999 }}
                                color="error"
                            />
                            <Typography mt={2} fontWeight={800} color="error">
                                HIGH CONFIDENCE FRAUD
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: darkMode ? "rgba(79, 70, 229, 0.16)" : "#eef2ff" }}>
                        <Typography variant="h6" fontWeight={800}>
                            🤖 AI Confidence
                        </Typography>

                        <Typography mt={2} color="text.secondary">
                            Fraud Probability
                        </Typography>

                        <Typography variant="h3" fontWeight={900} color="error">
                            92%
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography>
                            Recommendation: Freeze account, verify customer identity, and escalate investigation.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>Case Summary</Typography>
                        <Typography mt={2}>{caseData.notes}</Typography>
                        <Typography mt={2}><strong>Assigned Analyst:</strong> {caseData.assignedAnalyst}</Typography>
                        <Typography><strong>Risk Score:</strong> {caseData.riskScore || "N/A"}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>Actions</Typography>

                        <Stack direction="row" spacing={1} mt={2}>
                            <Button
                                variant="outlined"
                                onClick={() => updateCaseStatusWithAudit("UNDER_REVIEW", "Started case review")}
                            >
                                Start Review
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => updateCaseStatusWithAudit("ESCALATED", "Escalated investigation")}
                            >
                                Escalate
                            </Button>

                            <Button variant="contained" onClick={generateSummary}>
                                AI Summary
                            </Button>

                            <Button variant="outlined" onClick={exportCasePdf}>
                                Export PDF
                            </Button>

                            <Button color="secondary" variant="contained" onClick={askCopilotAboutCase}>
                                Ask Copilot
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>
                            Case Timeline
                        </Typography>

                        <Stack spacing={2} mt={2}>
                            {timelineItems.map((item, index) => (
                                <Box key={index} sx={{ borderLeft: "3px solid #4f46e5", pl: 2 }}>
                                    <Typography fontWeight={800}>
                                        {item.label}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {item.detail}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>
                            Risk Factors
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" mt={2} useFlexGap>
                            <Chip label="High Amount" color="error" />
                            <Chip label="New Device" color="warning" />
                            <Chip label="High Risk Country" color="error" />
                            <Chip label="Rapid Transactions" color="warning" />
                            <Chip label="International Transfer" color="primary" />
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>
                            Investigation Evidence
                        </Typography>

                        <Stack spacing={2} mt={2}>
                            <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                                <Typography fontWeight={700}>
                                    Transaction Pattern
                                </Typography>
                                <Typography color="text.secondary">
                                    Multiple high-value transactions were detected within a short time window.
                                </Typography>
                            </Paper>

                            <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                                <Typography fontWeight={700}>
                                    Device Analysis
                                </Typography>
                                <Typography color="text.secondary">
                                    Activity involved a new or unknown device associated with elevated fraud risk.
                                </Typography>
                            </Paper>

                            <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                                <Typography fontWeight={700}>
                                    Location Risk
                                </Typography>
                                <Typography color="text.secondary">
                                    Transaction activity includes unusual or high-risk geographic locations.
                                </Typography>
                            </Paper>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>
                            Analyst Notes
                        </Typography>

                        <TextField
                            multiline
                            minRows={4}
                            fullWidth
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            sx={{ mt: 2 }}
                        />

                        <Button variant="contained" sx={{ mt: 2 }} onClick={saveNotes}>
                            Save Notes
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={800}>
                            Investigation Decision
                        </Typography>

                        <Stack direction="row" spacing={2} mt={3} flexWrap="wrap" useFlexGap>
                            <Button color="error" variant="contained" onClick={() => openDecisionDialog("FREEZE_ACCOUNT")}>
                                Freeze Account
                            </Button>

                            <Button
                                color="warning"
                                variant="contained"
                                onClick={() => openDecisionDialog("ESCALATE")}
                            >
                                Escalate
                            </Button>

                            <Button color="success" variant="contained" onClick={() => openDecisionDialog("CLEAR_CUSTOMER")}>
                                Clear Customer
                            </Button>

                            <Button variant="outlined" onClick={() => openDecisionDialog("CLOSE_INVESTIGATION")}>
                                Close Investigation
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    severity="success"
                    onClose={() => setSnackbarOpen(false)}
                >
                    Notes saved successfully
                </Alert>
            </Snackbar>

            <Dialog
                open={summaryDialogOpen}
                onClose={() => setSummaryDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>AI Investigation Summary</DialogTitle>

                <DialogContent>
                    {summary && (
                        <>
                            <Typography fontWeight={800} mb={1}>
                                Summary
                            </Typography>
                            <Typography mb={3}>
                                {summary.summary}
                            </Typography>

                            <Typography fontWeight={800} mb={1}>
                                Recommended Next Steps
                            </Typography>
                            <Typography>
                                {summary.recommendedNextSteps}
                            </Typography>
                        </>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setSummaryDialogOpen(false)}>
                        Close
                    </Button>
                    <Button variant="contained" onClick={exportCasePdf}>
                        Export PDF
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={decisionDialogOpen}
                onClose={() => setDecisionDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Record Investigation Decision</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary" mb={2}>
                        Enter the reason for this analyst decision. It will be saved to case notes and the audit trail.
                    </Typography>
                    <TextField
                        label="Decision Reason"
                        value={decisionReason}
                        onChange={(event) => {
                            setDecisionReason(event.target.value);
                            setDecisionError("");
                        }}
                        error={Boolean(decisionError)}
                        helperText={decisionError}
                        multiline
                        minRows={4}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDecisionDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={submitDecision}>
                        Save Decision
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
}
