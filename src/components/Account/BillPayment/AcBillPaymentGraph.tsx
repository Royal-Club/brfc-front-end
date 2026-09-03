import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Row, Col, Select, Spin } from "antd";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
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

// Chart.js v3+ ships nothing registered by default. Without this the chart throws
// "linear is not a registered scale" whenever this page is the first chart loaded -
// it only appeared to work when another chart component happened to register first.
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const { Option } = Select;

// Module scope so the identity is stable across renders and generateGraphData
// does not have to list it as a dependency.
const getColor = (costType: string): string => {
    const colors: Record<string, string> = {
        FIELD_RENT: "rgba(255, 99, 132, 0.7)",
        FOOD: "rgba(54, 162, 235, 0.7)",
        EQUIPMENT: "rgba(75, 192, 192, 0.7)",
        Insurance: "rgba(153, 102, 255, 0.7)",
        Supplies: "rgba(255, 159, 64, 0.7)",
        Other: "rgba(255, 205, 86, 0.7)",
    };
    return (
        colors[costType] ||
        `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
            Math.random() * 256
        )}, ${Math.floor(Math.random() * 256)}, 0.7)`
    );
};

interface AcBillPaymentGraphProps {
    acBillPayments: IAcBillPayment[];
}

interface GraphData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        fill: boolean;
        borderColor: string;
        tension: number;
    }[];
}

const AcBillPaymentGraph: React.FC<AcBillPaymentGraphProps> = ({
    acBillPayments,
}) => {
    // Memoised because these feed effect dependency arrays. Rebuilt inline they
    // would be a new array on every render, so the effects below would re-run
    // after every render regardless of whether the payments actually changed.
    const years = useMemo(
        () => acBillPayments.map((item) => dayjs(item.paymentDate).year()),
        [acBillPayments]
    );
    const latestYear = years.length > 0 ? Math.max(...years) : dayjs().year();

    const [filteredYear, setFilteredYear] = useState<number>(latestYear);
    const [filteredCostType, setFilteredCostType] = useState<string[]>([]);
    const [graphData, setGraphData] = useState<GraphData>({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState<boolean>(true);

    const uniqueYears = useMemo(() => Array.from(new Set(years)), [years]);
    const uniqueCostTypes = useMemo(
        () =>
            [
                ...new Set(
                    acBillPayments
                        .map((item) => item.costType?.name)
                        .filter(Boolean)
                ),
            ] as string[],
        [acBillPayments]
    );

    // Initialize filteredCostType with all cost types when component mounts
    useEffect(() => {
        if (uniqueCostTypes.length > 0 && filteredCostType.length === 0) {
            setFilteredCostType(uniqueCostTypes);
        }
    }, [uniqueCostTypes, filteredCostType.length]);

    const generateGraphData = useCallback(() => {
        setLoading(true);

        const filteredData = acBillPayments.filter(
            (item) =>
                dayjs(item.paymentDate).year() === filteredYear &&
                (filteredCostType.length === 0 ||
                    filteredCostType.includes(item.costType?.name))
        );

        const data: GraphData = {
            labels: Array.from({ length: 12 }, (_, i) =>
                dayjs().month(i).format("MMMM")
            ),
            datasets: filteredCostType.map((costType) => ({
                label: costType,
                data: Array(12)
                    .fill(0)
                    .map((_, monthIndex) =>
                        filteredData
                            .filter(
                                (item) =>
                                    dayjs(item.paymentDate).month() ===
                                        monthIndex &&
                                    item.costType?.name === costType
                            )
                            .reduce((sum, item) => sum + item.amount, 0)
                    ),
                fill: false,
                borderColor: getColor(costType),
                tension: 0.4,
            })),
        };
        setLoading(false);
        setGraphData(data);
    }, [acBillPayments, filteredYear, filteredCostType]);

    useEffect(() => {
        if (filteredYear && filteredCostType.length > 0) {
            generateGraphData();
        }
    }, [filteredYear, filteredCostType, generateGraphData]);

    const handleYearChange = (value: number) => {
        setFilteredYear(value);
    };

    return (
        <>
            <Row gutter={16} style={{ marginBottom: "20px" }}>
                <Col span={8}>
                    <Select
                        placeholder="Select Year"
                        onChange={(value) => handleYearChange(value as number)}
                        value={filteredYear}
                    >
                        {uniqueYears.map((year) => (
                            <Option key={year} value={year}>
                                {year}
                            </Option>
                        ))}
                    </Select>
                </Col>
            </Row>
            <div style={{ height: 200 }}>
                {loading ? (
                    <Spin />
                ) : graphData.labels.length > 0 ? (
                    <Line
                        data={graphData as any}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: { stepSize: 1000 },
                                },
                            },
                        }}
                    />
                ) : (
                    <p>No data available for the selected filters.</p>
                )}
            </div>
        </>
    );
};

export default AcBillPaymentGraph;
