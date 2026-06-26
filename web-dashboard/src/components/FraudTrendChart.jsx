import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

export default function FraudTrendChart({ alerts }) {
    const trendData = Object.entries(
        alerts.reduce((acc, alert) => {
            const date = alert.createdAt?.split("T")[0] || "Unknown";
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {})
    ).map(([date, count]) => ({
        date,
        alerts: count
    }));

    return (
        <ResponsiveContainer width="100%" height={170}>
            <LineChart data={trendData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="alerts" strokeWidth={3} />
            </LineChart>
        </ResponsiveContainer>
    );
}
