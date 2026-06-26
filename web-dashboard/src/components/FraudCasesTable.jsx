export default function FraudCasesTable({ cases, onStatusUpdate }) {
    return (
        <div style={{ marginTop: "50px" }}>
            <h2>Fraud Investigation Cases</h2>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                <tr>
                    <th>Case #</th>
                    <th>Analyst</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Action</th>
                </tr>
                </thead>

                <tbody>
                {cases.map((item) => (
                    <tr key={item.id}>
                        <td>{item.caseNumber}</td>
                        <td>{item.assignedAnalyst}</td>
                        <td>{item.status}</td>
                        <td>{item.notes}</td>
                        <td>
                            {item.status !== "CLOSED" ? (
                                <button onClick={() => onStatusUpdate(item.id, "CLOSED")}>
                                    Close Case
                                </button>
                            ) : (
                                <span>Closed</span>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}