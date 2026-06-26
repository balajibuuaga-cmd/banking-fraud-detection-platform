import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308"];

function AnalyticsChart({ data = {} }) {
    const chartData = Object.entries(data || {}).map(([key, value]) => ({
        name: key,
        value: Number(value)
    }));

    if (chartData.length === 0) {
        return <div className="empty-card">No severity data available</div>;
    }

    return (
        <div style={{ width: "100%", minWidth: "180px", height: "170px", minHeight: "170px" }}>
            <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={68}
                        label
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={entry.name}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>

                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default AnalyticsChart;
