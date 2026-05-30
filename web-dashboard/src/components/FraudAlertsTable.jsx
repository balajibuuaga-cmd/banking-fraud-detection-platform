import { updateAlertStatus } from "../services/analyticsService";

export default function FraudAlertsTable({ alerts, refresh, onSelect }) {

    const resolveAlert = async (id) => {
        await updateAlertStatus(id, "RESOLVED");
        refresh();
    };

    return (
        <div style={{ marginTop: "40px" }}>
            <h2>Recent Fraud Alerts</h2>

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "20px",
                }}
            >
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Severity</th>
                    <th>Risk Score</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                </thead>

                <tbody>
                {alerts.map((alert) => (
                    <tr
                        key={alert.id}
                        onClick={() => onSelect && onSelect(alert)}
                        style={{ cursor: "pointer" }}
                    >
                        <td>{alert.id}</td>
                        <td>{alert.severity}</td>
                        <td>{alert.riskScore}</td>
                        <td>{alert.status}</td>
                        <td>
                            {alert.status !== "RESOLVED" ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resolveAlert(alert.id);
                                    }}
                                >
                                    Resolve
                                </button>
                            ) : (
                                "Resolved"
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}