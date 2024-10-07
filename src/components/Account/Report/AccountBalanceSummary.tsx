import { Col, Row } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import { useGetAcBalanceSummaryListQuery } from "../../../state/features/account/accountSlice";
import IAccountBalanceSummary from "../../../interfaces/IAccountBalanceSummary";

function AccountBalanceSummary() {
  const { data, error, isLoading,refetch } = useGetAcBalanceSummaryListQuery();
  const [accountSummary, setAccountSummary] = useState<IAccountBalanceSummary[]>([]);
  
  useEffect(() => {
    refetch();
  }, []);



  // useEffect to handle side effects and data transformations
  useEffect(() => {
    if (data?.content) {
      const transformedData = data.content.map((item: IAccountBalanceSummary) => ({
        ...item,
        key: item.accountType, // Adding key for each record, if necessary
      }));
      setAccountSummary(transformedData);
    }
  }, [data]); // Trigger when data changes

  // Table columns for the account balances summary
  const accountSummaryColumns: ColumnsType<IAccountBalanceSummary> = [
    {
      title: "Account Type",
      dataIndex: "accountType",
      key: "accountType",
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
      title: "Net Balance",
      dataIndex: "netBalance",
      key: "netBalance",
      render: (value: number) => value.toFixed(2), // Formatting the number
    },
  ];

  // Return loading or error state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Failed to load account summary</div>;
  }

  return (
    <>
      <Row>
        <Col md={24}>
          <div>
            <Title level={4}>Account Balances Summary</Title>
            <Table
              loading={isLoading}
              size="small"
              dataSource={accountSummary}
              columns={accountSummaryColumns}
              scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
              rowKey={(record) => record.accountType}
            />
          </div>
        </Col>
      </Row>
    </>
  );
}

export default AccountBalanceSummary;
