export default function FraudInvestigationPanel({ alert }) {
    if (!alert) {
        return null;
    }

    return (
        <div
            style={{
                marginTop: "30px",
                border: "1px solid gray",
                borderRadius: "10px",
                padding: "20px",
            }}
        >
            <h2>Fraud Investigation Panel</h2>

            <p><strong>Alert ID:</strong> {alert.id}</p>
            <p><strong>Severity:</strong> {alert.severity}</p>
            <p><strong>Risk Score:</strong> {alert.riskScore}</p>
            <p><strong>Status:</strong> {alert.status}</p>
            <p><strong>Description:</strong> {alert.description}</p>
        </div>
    );
}