import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308"];

function AnalyticsChart({ data }) {
    const chartData = Object.entries(data).map(([key, value]) => ({
        name: key,
        value
    }));

    return (
        <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        outerRadius={120}
                        label
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={index}
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