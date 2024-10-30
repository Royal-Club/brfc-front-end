import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Select, Spin } from "antd";
import dayjs from "dayjs";
import IAcCollection from "../../../interfaces/IAcCollection";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PlayerMonthlyAmountChartProps {
    acCollections: IAcCollection[];
}

const PlayerMonthlyAmountChart: React.FC<PlayerMonthlyAmountChartProps> = ({
    acCollections,
}) => {
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [chartData, setChartData] = useState<any>(null);

    const getUniqueYears = () => {
        return [
            ...new Set(acCollections.map((item) => dayjs(item.date).year())),
        ];
    };

    const handleYearChange = (value: number) => {
        setSelectedYear(value);
    };

    useEffect(() => {
        const filteredCollections = acCollections.filter(
            (item) => dayjs(item.date).year() === selectedYear
        );

        const monthlyData = Array(12).fill(0);
        filteredCollections.forEach((collection) => {
            const monthIndex = dayjs(collection.date).month();
            console.log(monthIndex, collection.totalAmount);
            monthlyData[monthIndex] += collection.totalAmount;
        });

        setChartData({
            labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ],
            datasets: [
                {
                    label: "Monthly Amount",
                    data: monthlyData,
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    fill: true,
                },
            ],
        });
    }, [acCollections, selectedYear]);

    return (
        <div style={{ marginBottom: 20 }}>
            <Select
                value={selectedYear}
                onChange={handleYearChange}
                options={getUniqueYears().map((year) => ({
                    label: year.toString(),
                    value: year,
                }))}
                style={{ width: 120, marginBottom: 16 }}
                placeholder="Select Year"
            />
            <div style={{ height: 200 }}>
                {/* Adjust height and width here */}
                {chartData ? (
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1000,
                                    },
                                },
                            },
                        }}
                    />
                ) : (
                    <Spin />
                )}
            </div>
        </div>
    );
};

export default PlayerMonthlyAmountChart;
