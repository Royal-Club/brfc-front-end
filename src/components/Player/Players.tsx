import { CheckCircleTwoTone, EditTwoTone } from "@ant-design/icons";
import { Button, Col, Row, Space } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { Link } from "react-router-dom";
import IPlayer from "../../interfaces/IPlayer";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";

function Players() {
    const { data: playersData, isLoading, refetch } = useGetPlayersQuery();
    const loginInfo = useSelector(selectLoginInfo);

    useEffect(() => {
        refetch();
    }, []);

    const CommonColumns: ColumnsType<IPlayer> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Skype",
            dataIndex: "skypeId",
            key: "skypeId",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Mobile",
            dataIndex: "mobileNo",
            key: "mobileNo",
        },
        {
            title: "Employee Id",
            dataIndex: "employeeId",
            key: "employeeId",
        },
        {
            title: "Status",
            dataIndex: "active",
            key: "active",
            render: (_: any, record: IPlayer) => {
                if (record.active) {
                    return (
                        <span>
                            <CheckCircleTwoTone twoToneColor="#52c41a" /> Active
                        </span>
                    );
                } else {
                    return (
                        <span>
                            <CheckCircleTwoTone twoToneColor="#eb2f96" />{" "}
                            InActive
                        </span>
                    );
                }
            },
        },
        {
            title: "Created Date",
            dataIndex: "createdDate",
            key: "createdDate",
            render: (_: any, record: IPlayer) =>
                moment.utc(record.createdDate).local().format("DD-MMM-YYYY"),
        },
        {
            title: "Modified Date",
            dataIndex: "lastModifiedDate",
            key: "lastModifiedDate",
            render: (_: any, record: IPlayer) =>
                moment.utc(record.updatedDate).local().format("DD-MMM-YYYY"),
        },
    ];

    // table rendering settings
    const playersColumn: ColumnsType<IPlayer> = loginInfo.roles.includes(
        "ADMIN"
    )
        ? [
              ...CommonColumns,
              {
                  title: "Action",
                  key: "action",
                  render: (_: any, record: IPlayer) => (
                      <Space size="middle">
                          <Link to={`/players/${record.id}`}>
                              <EditTwoTone />
                          </Link>
                      </Space>
                  ),
              },
          ]
        : CommonColumns;

    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Title level={4}>Players</Title>
                        {loginInfo.roles.includes("ADMIN") && (
                            <Link to={"/player"}>
                                <Button type="primary">Create</Button>
                            </Link>
                        )}
                        <Table
                            loading={isLoading}
                            size="middle"
                            dataSource={playersData?.content}
                            columns={playersColumn}
                            scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
                        />
                    </div>
                </Col>
            </Row>
        </>
    );
}

export default Players;
