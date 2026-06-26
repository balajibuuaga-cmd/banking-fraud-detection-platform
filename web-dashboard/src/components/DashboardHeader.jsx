import { useNavigate } from "react-router-dom";

export default function DashboardHeader({
    searchTerm,
    setSearchTerm,
    selectedSeverity,
    setSelectedSeverity,
    notifications,
    setShowNotifications,
    showNotifications,
    loadDashboard
}) {
    const navigate = useNavigate();

    return (
        <header className="modern-header">
            <div className="brand">
                <div className="brand-icon">F</div>
                <div>
                    <h1>FraudOps</h1>
                    <p>Risk Command Center</p>
                </div>
            </div>

            <nav className="nav-tabs">
                <button onClick={() => navigate("/")}>Dashboard</button>
                <button onClick={() => navigate("/alerts")}>Alerts</button>
                <button onClick={() => navigate("/investigations")}>Investigations</button>
                <button onClick={() => navigate("/analytics")}>Analytics</button>
                <button onClick={() => navigate("/fraud-rules")}>Fraud Rules</button>
            </nav>

            <div className="header-tools">
                <input
                    className="search-box"
                    placeholder="Search alerts, cases, analysts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="filter-box"
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>

                <button className="icon-action" onClick={loadDashboard}>↻</button>

                <button
                    className="icon-action notification-icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    🔔
                    {notifications.length > 0 && (
                        <span className="notif-count">{notifications.length}</span>
                    )}
                </button>

                <button
                    className="admin-pill"
                    onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }}
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
