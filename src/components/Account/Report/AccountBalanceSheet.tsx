import { Col, Row } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IBalanceSheetReport from "../../../interfaces/IBalanceSheetReport";
import { useGetAcBalanceSheetListQuery } from "../../../state/features/account/accountSlice";

function AccountBalanceSheet() {
  const { data, isLoading, refetch } = useGetAcBalanceSheetListQuery();
  const [balanceSheet, setBalanceSheet] = useState<IBalanceSheetReport[]>([]);
  
  useEffect(() => {
    refetch();
  }, []);


  
  useEffect(() => {
    if (data) {
      const arr = data.content.map((item: IBalanceSheetReport) => ({
        ...item,
        key: item.natureType, // Setting a unique key for each nature type
      }));
      setBalanceSheet(arr);
    }
  }, [data]);

  // Table rendering settings
  const balanceSheetColumns: ColumnsType<IBalanceSheetReport> = [
    {
      title: "Nature Type",
      dataIndex: "natureType",
      key: "natureType",
    },
    {
      title: "Total Debit",
      dataIndex: "totalDebit",
      key: "totalDebit",
      render: (value: number) => value.toFixed(2), // Formatting the number
    },
    {
      title: "Total Credit",
      dataIndex: "totalCredit",
      key: "totalCredit",
      render: (value: number) => value.toFixed(2), // Formatting the number
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (value: number) => value.toFixed(2), // Formatting the number
    },
  ];

  return (
    <>
      <Row>
        <Col md={24}>
          <div>
            <Title level={4}>Balance Sheet</Title>
            <Table
              loading={isLoading}
              size="small"
              dataSource={balanceSheet}
              columns={balanceSheetColumns}
              scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
            />
          </div>
        </Col>
      </Row>
    </>
  );
}

export default AccountBalanceSheet;
