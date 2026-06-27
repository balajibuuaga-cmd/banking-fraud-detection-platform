import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@mui/material";
import AnalyticsChart from "../components/AnalyticsChart";
import FraudTrendChart from "../components/FraudTrendChart";
import MainLayout from "../layouts/MainLayout";
import { isAdminRole, isAnalystRole } from "../utils/roles";
import { filterByDateRange } from "../utils/dateFilters";
import { connectWebSocket } from "../services/websocketService";
import {
    getSeverityStats,
    getAllTransactions,
    getAllAlerts,
    getAllFraudCases,
    updateFraudCaseStatus,
    createFraudCase,
    getAccountById,
    updateAccountStatus,
    updateAlertStatus,
    assignFraudCaseAnalyst,
    updateCaseNotes,
    getAuditLogs,
    getInvestigationSummary
} from "../services/analyticsService";

export default function Dashboard({ user, darkMode, setDarkMode, dateRange, setDateRange }) {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [severityData, setSeverityData] = useState({});
    const [fraudCases, setFraudCases] = useState([]);
    const [accountStatus, setAccountStatus] = useState("LOCKED");
    const [account, setAccount] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [caseSummaries, setCaseSummaries] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSeverity, setSelectedSeverity] = useState("ALL");
    const [selectedCaseStatus, setSelectedCaseStatus] = useState("ALL");
    const [dashboardError, setDashboardError] = useState("");
    const [alertPage, setAlertPage] = useState(1);
    const [casePage, setCasePage] = useState(1);
    const itemsPerPage = 5;
    const role = user?.role || localStorage.getItem("role");
    const isAdmin = isAdminRole(role);
    const isAnalyst = isAnalystRole(role);

    const addAuditLog = (action) => {
        const log = {
            id: Date.now(),
            action,
            performedBy: "Balaji",
            entityName: "Dashboard",
            entityId: 1,
            createdAt: new Date().toLocaleTimeString()
        };

        setAuditLogs((prev) => [log, ...prev]);
    };

    const loadDashboard = async () => {
        const [
            transactionResult,
            alertResult,
            severityResult,
            caseResult,
            accountResult,
            logsResult
        ] = await Promise.allSettled([
            getAllTransactions(),
            getAllAlerts(),
            getSeverityStats(),
            getAllFraudCases(),
            getAccountById(1),
            getAuditLogs()
        ]);

        if (transactionResult.status === "fulfilled") {
            setTransactions(Array.isArray(transactionResult.value) ? transactionResult.value : []);
        }

        if (alertResult.status === "fulfilled") {
            setAlerts(Array.isArray(alertResult.value) ? alertResult.value : []);
        }

        if (severityResult.status === "fulfilled") {
            setSeverityData(severityResult.value || {});
        }

        if (caseResult.status === "fulfilled") {
            setFraudCases(Array.isArray(caseResult.value) ? caseResult.value : []);
        }

        if (accountResult.status === "fulfilled") {
            setAccount(accountResult.value);
            setAccountStatus(accountResult.value?.status || "LOCKED");
        }

        if (logsResult.status === "fulfilled") {
            setAuditLogs(Array.isArray(logsResult.value) ? logsResult.value : []);
        }

        const failedRequest = [
            transactionResult,
            alertResult,
            severityResult,
            caseResult,
            accountResult,
            logsResult
        ].find((result) => result.status === "rejected");

        setDashboardError(
            failedRequest
                ? "Dashboard data could not be loaded. Your session may have expired. Please log in again."
                : ""
        );
    };

    useEffect(() => {
        loadDashboard();

        const disconnect = connectWebSocket((newAlert) => {
            const notification = {
                id: Date.now(),
                severity: newAlert.severity,
                message: `${newAlert.severity} fraud alert generated with risk score ${newAlert.riskScore}`,
                time: new Date().toLocaleTimeString()
            };

            setNotifications((prev) => [notification, ...prev]);

            if (newAlert.severity === "CRITICAL") {
                handleAccountStatusUpdate("LOCKED");
                addAuditLog("Auto-locked account due to CRITICAL fraud alert");
            }

            loadDashboard();
        });

        return () => {
            disconnect();
        };
    }, []);

    const handleCreateCase = async (alertId) => {
        if (!alertId) {
            alert("Alert ID missing. Cannot create case.");
            return;
        }

        await createFraudCase(alertId);
        addAuditLog(`Created fraud case for Alert #${alertId}`);
        await loadDashboard();

        alert("Fraud case created successfully.");
    };

    const handleAccountStatusUpdate = async (status) => {
        const result = await updateAccountStatus(1, status);
        setAccountStatus(result.status);
        addAuditLog(`Updated account ACC1001 to ${status}`);
        await loadDashboard();

        alert(`Account updated to ${status}`);
    };

    const handleAlertStatusUpdate = async (alertId, status) => {
        try {
            await updateAlertStatus(alertId, status);
            addAuditLog(`Updated Alert #${alertId} to ${status}`);
            await loadDashboard();

            alert(`Alert marked as ${status}`);
        } catch (error) {
            console.error(error);
            alert("Failed to update alert status.");
        }
    };

    const visibleTransactions = filterByDateRange(transactions, dateRange);
    const visibleAlerts = filterByDateRange(alerts, dateRange);
    const visibleCases = filterByDateRange(fraudCases, dateRange);

    const criticalAlerts = visibleAlerts.filter(
        (alertItem) => alertItem.severity === "CRITICAL"
    ).length;

    const filteredAlerts = visibleAlerts.filter((alertItem) => {
        const matchesSearch =
            `${alertItem.description} ${alertItem.severity} ${alertItem.status}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesSeverity =
            selectedSeverity === "ALL" || alertItem.severity === selectedSeverity;

        return matchesSearch && matchesSeverity;
    });

    const filteredCases = visibleCases.filter((item) => {
        const matchesSearch =
            `${item.caseNumber} ${item.status} ${item.assignedAnalyst} ${item.notes}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesStatus =
            selectedCaseStatus === "ALL" || item.status === selectedCaseStatus;

        return matchesSearch && matchesStatus;
    });

    const paginatedAlerts = filteredAlerts.slice(
        (alertPage - 1) * itemsPerPage,
        alertPage * itemsPerPage
    );

    const paginatedCases = filteredCases.slice(
        (casePage - 1) * itemsPerPage,
        casePage * itemsPerPage
    );

    const handleAssignAnalyst = async (caseId, analyst) => {
        await assignFraudCaseAnalyst(caseId, analyst);
        addTimelineLog(caseId, `Assigned to ${analyst}`);
        await loadDashboard();
    };

    const handleCaseStatusUpdate = async (caseId, status) => {
        await updateFraudCaseStatus(caseId, status);
        addTimelineLog(caseId, `Status changed to ${status}`);
        await loadDashboard();
    };

    const handleGenerateSummary = async (caseId) => {
        const data = await getInvestigationSummary(caseId);

        setCaseSummaries((prev) => ({
            ...prev,
            [caseId]: data
        }));
    };

    const closeCase = async (id) => {
        await updateFraudCaseStatus(id, "CLOSED");
        addTimelineLog(id, "Case closed");
        await loadDashboard();
    };

    const handleUpdateNotes = async (caseId, notes) => {
        await updateCaseNotes(caseId, notes);
        addTimelineLog(caseId, "Investigation notes updated");
        await loadDashboard();
    };

    const addTimelineLog = (caseId, action) => {
        addAuditLog(`Case #${caseId}: ${action}`);
    };

    const closedCases = visibleCases.filter((item) => item.status === "CLOSED").length;
    const escalatedCases = visibleCases.filter((item) => item.status === "ESCALATED").length;
    const averageRiskScore = Math.round(
        visibleTransactions.reduce((sum, item) => sum + (item.riskScore || 0), 0) /
        Math.max(visibleTransactions.length, 1)
    );
    const ruleHits = Object.entries(
        visibleTransactions.reduce((acc, tx) => {
            if (!tx.reasonCodes) return acc;

            tx.reasonCodes.split(",").forEach((reason) => {
                acc[reason] = (acc[reason] || 0) + 1;
            });

            return acc;
        }, {})
    );
    const topLocations = Object.entries(
        visibleTransactions.reduce((acc, tx) => {
            if (!tx.location) return acc;
            acc[tx.location] = (acc[tx.location] || 0) + 1;
            return acc;
        }, {})
    ).slice(0, 3);
    const activityItems = [
        ...auditLogs.map((log) => ({
            id: `audit-${log.id}`,
            time: log.createdAt || log.time || "now",
            text: log.action
        })),
        ...notifications.map((item) => ({
            id: `notification-${item.id}`,
            time: item.time,
            text: item.message
        }))
    ].slice(0, 4);
    const formatAlertTitle = (alertItem) => {
        if (alertItem.severity === "CRITICAL") {
            return "High-Risk International Transfer";
        }

        if (alertItem.reasonCodes?.includes("RAPID_TRANSACTION_PATTERN")) {
            return "Multiple Transactions";
        }

        if (alertItem.reasonCodes?.includes("UNUSUAL_LOCATION")) {
            return "Unusual Login Location";
        }

        return alertItem.description || `Alert #${alertItem.id}`;
    };

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            searchTerm={searchTerm}
            setSearchTerm={(value) => {
                setSearchTerm(value);
                setAlertPage(1);
                setCasePage(1);
            }}
            selectedSeverity={selectedSeverity}
            setSelectedSeverity={(value) => {
                setSelectedSeverity(value);
                setAlertPage(1);
            }}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={loadDashboard}
        >
                {dashboardError && (
                    <Alert severity="warning" sx={{ mx: 3, mt: 2 }}>
                        {dashboardError}
                    </Alert>
                )}

                <section className="kpi-row">
                    <button className="metric-card kpi-button" onClick={() => navigate("/transactions")}>
                        <span>Total Transactions</span>
                        <h3>{visibleTransactions.length}</h3>
                    </button>

                    <button className="metric-card kpi-button" onClick={() => navigate("/alerts")}>
                        <span>Total Alerts</span>
                        <h3>{visibleAlerts.length}</h3>
                    </button>

                    <button className="metric-card danger kpi-button" onClick={() => navigate("/alerts?severity=CRITICAL")}>
                        <span>Critical Alerts</span>
                        <h3>{criticalAlerts}</h3>
                    </button>

                    <button className="metric-card kpi-button" onClick={() => navigate("/investigations?status=CLOSED")}>
                        <span>Cases Closed</span>
                        <h3>{closedCases}</h3>
                    </button>

                    <button className="metric-card warning kpi-button" onClick={() => navigate("/investigations?status=ESCALATED")}>
                        <span>Escalated Cases</span>
                        <h3>{escalatedCases}</h3>
                    </button>

                    <button className="metric-card kpi-button" onClick={() => navigate("/analytics")}>
                        <span>Avg Risk Score</span>
                        <h3>
                            {visibleTransactions.length === 0
                                ? 0
                                : averageRiskScore}
                        </h3>
                    </button>
                </section>

                <section className="dashboard-grid">
                    <div className="dashboard-panel">
                        <div className="panel-title-row">
                            <div>
                                <h2>Investigation Queue</h2>
                                <p>Cases requiring analyst review</p>
                            </div>
                            <button onClick={() => navigate("/queue")}>View All</button>
                        </div>

                        {filteredCases.length === 0 ? (
                            <div className="empty-card">No investigation cases found</div>
                        ) : (
                            paginatedCases.slice(0, 3).map((item) => (
                                <div className="queue-card" key={item.id}>
                                    <div>
                                        <div className="queue-title">
                                            <h3>{item.caseNumber}</h3>
                                            <span className={`status-pill ${item.status?.toLowerCase()}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p>{item.notes}</p>
                                        <div className="queue-meta">
                                            <strong>Assigned:</strong>
                                            <span>{item.assignedAnalyst || "Investigator"}</span>
                                        </div>
                                    </div>
                                    <div className="risk-score">
                                        <span>Risk Score</span>
                                        <strong>{item.riskScore || item.fraudAlert?.riskScore || "N/A"}</strong>
                                        <small>{item.createdAt ? "2m ago" : "Live"}</small>
                                    </div>
                                    <div className="case-actions-inline">
                                        <button onClick={() => handleGenerateSummary(item.id)}>AI Summary</button>
                                        {caseSummaries[item.id] && (
                                            <p>{caseSummaries[item.id].summary}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        <button className="link-button" onClick={() => navigate("/queue")}>View All Cases →</button>
                    </div>

                    <div className="dashboard-panel">
                        <div className="panel-title-row">
                            <div>
                                <h2>Fraud Alerts</h2>
                                <p>Recent high-risk alerts</p>
                            </div>
                            <button onClick={() => navigate("/alerts")}>View All</button>
                        </div>

                        {filteredAlerts.length === 0 ? (
                            <div className="empty-card">No fraud alerts found</div>
                        ) : (
                            paginatedAlerts.slice(0, 3).map((alertItem) => {
                                const alertId = alertItem.id || alertItem.alertId || alertItem.ID;

                                return (
                                    <div className="alert-row-card" key={alertId}>
                                        <div className={`alert-symbol ${alertItem.severity?.toLowerCase()}`}>▲</div>
                                        <div>
                                            <h3>{formatAlertTitle(alertItem)}</h3>
                                            <p>
                                                Account: {alertItem.accountNumber || account?.accountNumber || "****1234"}
                                                {" "}· Risk Score: {alertItem.riskScore}
                                            </p>
                                            <p>{alertItem.location ? `Location: ${alertItem.location}` : alertItem.status || "Requires review"}</p>
                                        </div>
                                        <div className="alert-right">
                                            <span>2m ago</span>
                                            <button className={`severity-chip ${alertItem.severity?.toLowerCase()}`}>
                                                {alertItem.severity}
                                            </button>
                                        </div>
                                        {alertItem.status === "OPEN" && (
                                            <div className="alert-actions-inline">
                                                <button onClick={() => handleCreateCase(alertItem.id)}>
                                                    Create Case
                                                </button>
                                                <button onClick={() => handleAlertStatusUpdate(alertItem.id, "RESOLVED")}>
                                                    Resolve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        <button className="link-button" onClick={() => navigate("/alerts")}>View All Alerts →</button>
                    </div>

                    {isAdmin && (
                    <div className="dashboard-panel">
                        <div className="panel-title-row">
                            <div>
                                <h2>Account Actions</h2>
                                <p>Quick actions for suspicious accounts</p>
                            </div>
                        </div>

                        <div className="action-list">
                        <div className="action-tile" onClick={() => handleAccountStatusUpdate("LOCKED")}>
                            <span>▣</span>
                            <div>
                                <strong>Lock Account</strong>
                                <p>Temporarily lock user account</p>
                            </div>
                        </div>

                        <div className="action-tile" onClick={() => handleAccountStatusUpdate("ACTIVE")}>
                            <span>▢</span>
                            <div>
                                <strong>Unlock Account</strong>
                                <p>Remove account restrictions</p>
                            </div>
                        </div>

                        <div
                            className="action-tile"
                            onClick={() => addAuditLog("Customer verification initiated")}
                        >
                            <span>⌾</span>
                            <div>
                                <strong>Customer Verification</strong>
                                <p>Initiate customer verification process</p>
                            </div>
                        </div>

                        <div
                            className="action-tile"
                            onClick={() => addAuditLog("Transaction review started")}
                        >
                            <span>⌕</span>
                            <div>
                                <strong>Review Transactions</strong>
                                <p>Review recent account transactions</p>
                            </div>
                        </div>
                        </div>

                        <div className="ai-copilot-card recommendation-card">
                            <div>
                                <h3>🤖 AI Copilot</h3>
                                <p>
                                    Get AI-powered recommendations for investigations, account actions,
                                    and customer verification.
                                </p>
                            </div>
                            <button onClick={() => filteredCases[0] && handleGenerateSummary(filteredCases[0].id)}>
                                Ask AI →
                            </button>
                        </div>
                    </div>
                    )}
                </section>

                <section className="analytics-grid">
                    <div className="chart-card compact-chart">
                        <h3>Alerts by Severity</h3>
                        <AnalyticsChart data={severityData} />
                    </div>

                    <div className="chart-card compact-chart">
                        <h3>Alerts Trend (Last 7 Days)</h3>
                        <FraudTrendChart alerts={visibleAlerts} />
                    </div>

                    <div className="analytics-card rule-panel">
                        <h3>Rule Hit Analytics</h3>
                        {ruleHits.length === 0 ? (
                            <p>No rule hit data available</p>
                        ) : (
                            ruleHits.slice(0, 5).map(([reason, count]) => (
                                <div className="rule-hit-row" key={reason}>
                                    <span>{reason.replaceAll("_", " ")}</span>
                                    <div><i style={{ width: `${Math.min(count * 28, 100)}%` }} /></div>
                                    <strong>{count} hit{count === 1 ? "" : "s"}</strong>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="analytics-card insights-panel">
                        <h3>AI Insights</h3>
                        <div className="insight-row purple">
                            <span>◒</span>
                            <p>Spike in international transfers detected in last 2 hours.</p>
                        </div>
                        <div className="insight-row amber">
                            <span>◇</span>
                            <p>{topLocations[0]?.[0] || "2 accounts"} show unusual activity patterns.</p>
                        </div>
                        <div className="insight-row green">
                            <span>✓</span>
                            <p>Consider reviewing high-risk transactions over $10,000.</p>
                        </div>
                    </div>
                </section>

        </MainLayout>
    );
}
