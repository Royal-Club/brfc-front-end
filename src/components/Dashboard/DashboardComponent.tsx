import { Col, Row, Spin } from "antd";
import React, { useEffect, useState } from "react";
// import BarChart from "./BarChart";
// import LineChart from "./LineChart";
// import PieChart from "./PieChart";
import axios from "axios";
import { API_URL } from "../../settings";
import ScatterChart from "./ScatterChart";
import DoughnutChart from "./DoughnutChart";

const Dashboard: React.FC = () => {
  // const [itemData, setItemData] = useState<ItemData[]>([]);
  // const [itemApiLoading, setItemApiLoading] = useState<boolean>(false);

  useEffect(() => {
    // getItemDataList();
    return () => {};
  }, []);

  // const getItemDataList = () => {
  //   setItemApiLoading(true);
  //   axios
  //     .get(`${API_URL}/items/sum-by-project`)
  //     .then((response) => {
  //       response.data.map((x: { [x: string]: any; id: any }) => {
  //         x["key"] = x.id;
  //       });
  //       setItemData(response.data);
  //       setItemApiLoading(false);
  //     })
  //     .catch((err) => {
  //       // Handle error
  //       console.log("server error", err);
  //       setItemApiLoading(false);
  //     });
  // };

  return (
    <div>
      <Row gutter={48}>
        <Col md={12} sm={24}>
          <div>
            <h2>Project wise Items count</h2>
            {/* <Spin spinning={itemApiLoading}>
              <BarChart data={itemData} />
            </Spin> */}
              <ScatterChart />
          </div>
        </Col>
        <Col md={12} sm={24}>
          <div>
            <h2>Line Chart</h2>
            {/* <Spin spinning={itemApiLoading}>
              <LineChart /> */}
              <DoughnutChart />
            {/* </Spin> */}
          </div>
        </Col>
        {/* <Col md={12} sm={24}>
          <div className="mt-5">
            <h2>Project wise Items Amount</h2>
            <Spin spinning={itemApiLoading}>
              <PieChart data={itemData} />
            </Spin>
          </div>
        </Col> */}
      </Row>
    </div>
  );
};

export default Dashboard;
