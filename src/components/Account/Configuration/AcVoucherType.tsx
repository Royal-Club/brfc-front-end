import {
    Col,
    Row
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import axios from "axios";
import { useEffect, useState } from "react";
import IAcVoucherType from "../../../interfaces/IAcVoucherType";
import { API_URL } from "../../../settings";
import { CheckCircleOutlined, CheckCircleTwoTone } from "@ant-design/icons";

function AcVoucherType() {
    var [tableLoadingSpin, setTableSpinLoading] = useState(false);

    const [acVoucherTypes, setAcVoucherTypes] = useState<IAcVoucherType[]>([]);

    useEffect(() => {
        getAcVoucherTypeList();

        return () => { };
    }, []);

    const getAcVoucherTypeList = () => {
        setTableSpinLoading(true);
        axios
            .get(`${API_URL}/ac/voucher-types`)
            .then((response) => {
                response.data.content.map((x: { [x: string]: any; id: any }) => {
                    x["key"] = x.id;
                });
                setAcVoucherTypes(response.data.content);
                setTableSpinLoading(false);
            })
            .catch((err) => {
                // Handle error
                console.log("server error", err);
                setTableSpinLoading(false);
            });
    };

    // table rendering settings
    const acVoucherTypeColumns: ColumnsType<IAcVoucherType> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Alias",
            dataIndex: "alias",
            key: "alias",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Default?",
            dataIndex: "default",
            key: "default",
            render: (_: any, record: IAcVoucherType) => {
                if (record.default) {
                    return (
                        <span>
                            <CheckCircleTwoTone twoToneColor="#52c41a" /> Yes
                        </span>
                    )
                } else {
                    return (
                        <span>
                            <CheckCircleOutlined /> No
                        </span>
                    )
                }

            },
        },
    ];


    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Title level={4}>Voucher Type</Title>
                        <Table
                            loading={tableLoadingSpin}
                            size="small"
                            dataSource={acVoucherTypes}
                            columns={acVoucherTypeColumns}
                            scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
                        />
                    </div>
                </Col>
            </Row>
        </>
    );
}

export default AcVoucherType;
