import { Col, Row } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IAcChart from "../../../interfaces/IAcChart";
import { AcNatureType } from "../../Enum/AcNatureType";
import { useGetAcChartListQuery } from "../../../state/features/account/accountSlice";

function AcChart() {
  const { data, isLoading } = useGetAcChartListQuery();
  const [acCharts, setAcCharts] = useState<IAcChart[]>([]);

  useEffect(() => {
    if (data?.content) {
      const arr = data.content.map((item: IAcChart) => ({
        ...item,
        key: item.id,
      }));
      setAcCharts(arr);
    }
  }, [data]);
  


  const getEnumValue = (type: string): string => {
    switch (type) {
        case "ASSET":
            return AcNatureType.ASSET;
        case "LIABILITY":
            return AcNatureType.LIABILITY;
        case "INCOME":
            return AcNatureType.INCOME;
        case "EXPENSE":
            return AcNatureType.EXPENSE;
        default:
            return type; // Fallback to the original type if not found in enum
    }
};

  // table rendering settings
  const acChartColumns: ColumnsType<IAcChart> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Nature",
      dataIndex: "nature.name",
      key: "nature.name",
      render: (_: any, record: IAcChart) => {
        return record.nature.name;
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (_: any, record: IAcChart) => {
        return getEnumValue(record.nature.type)
      },
    },
  ];

  return (
    <>
      <Row>
        <Col md={24}>
          <div>
            <Title level={4}>Chart of Account</Title>
            <Table
              loading={isLoading}
              size="small"
              dataSource={acCharts}
              columns={acChartColumns}
              pagination={{
                showTotal: (total) => `Total ${total} records`,
            }}
              scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
            />
          </div>
        </Col>
      </Row>
    </>
  );
}

export default AcChart;


