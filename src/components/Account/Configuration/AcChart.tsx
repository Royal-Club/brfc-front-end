import { Col, Row } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import axios from "axios";
import { useEffect, useState } from "react";
import IAcChart from "../../../interfaces/IAcChart";
import { API_URL } from "../../../settings";
import { AcNatureType } from "../../Enum/AcNatureType";

function AcChart() {
  var [tableLoadingSpin, setTableSpinLoading] = useState(false);

  const [acCharts, setAcCharts] = useState<IAcChart[]>([]);

  useEffect(() => {
    getAcChartList();

    return () => {};
  }, []);

  const getAcChartList = () => {
    setTableSpinLoading(true);
    axios
      .get(`${API_URL}/ac/charts`)
      .then((response) => {
        response.data.content.map((x: { [x: string]: any; id: any }) => {
          x["key"] = x.id;
        });
        setAcCharts(response.data.content);
        setTableSpinLoading(false);
      })
      .catch((err) => {
        // Handle error
        console.log("server error", err);
        setTableSpinLoading(false);
      });
  };

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
              loading={tableLoadingSpin}
              size="small"
              dataSource={acCharts}
              columns={acChartColumns}
              scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
            />
          </div>
        </Col>
      </Row>
    </>
  );
}

export default AcChart;


