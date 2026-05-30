import { useEffect, useState } from "react";
import AnalyticsChart from "../components/AnalyticsChart";
import FraudAlertsTable from "../components/FraudAlertsTable";
import FraudInvestigationPanel from "../components/FraudInvestigationPanel";
import {
    getSeverityStats,
    getAllTransactions,
    getAllAlerts,
} from "../services/analyticsService";

export default function Dashboard() {
    const [transactions, setTransactions] = useState(0);
    const [alerts, setAlerts] = useState(0);
    const [criticalAlerts, setCriticalAlerts] = useState(0);
    const [severityData, setSeverityData] = useState({});
    const [alertsData, setAlertsData] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const transactionData = await getAllTransactions();
            const alertData = await getAllAlerts();
            const severityStats = await getSeverityStats();

            setTransactions(transactionData.length);
            setAlerts(alertData.length);
            setAlertsData(alertData);
            setCriticalAlerts(severityStats.CRITICAL || 0);
            setSeverityData(severityStats);
        } catch (error) {
            console.error("Dashboard load error:", error);
        }
    };

    return (
        <div>
            <h1>Banking Fraud Risk Analytics Platform</h1>

            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                <div style={{ border: "1px solid gray", padding: "20px", borderRadius: "10px" }}>
                    <h3>Total Transactions</h3>
                    <h2>{transactions}</h2>
                </div>

                <div style={{ border: "1px solid gray", padding: "20px", borderRadius: "10px" }}>
                    <h3>Total Alerts</h3>
                    <h2>{alerts}</h2>
                </div>

                <div style={{ border: "1px solid gray", padding: "20px", borderRadius: "10px" }}>
                    <h3>Critical Alerts</h3>
                    <h2>{criticalAlerts}</h2>
                </div>
            </div>

            <h2 style={{ marginTop: "40px" }}>Fraud Severity Distribution</h2>
            <AnalyticsChart data={severityData} />
            <FraudAlertsTable
                alerts={alertsData}
                refresh={loadDashboard}
                onSelect={setSelectedAlert}
            />

            <FraudInvestigationPanel alert={selectedAlert} />
        </div>
    );
}