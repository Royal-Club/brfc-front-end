import {
    Col,
    Row
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import IAcVoucherType from "../../../interfaces/IAcVoucherType";
import { CheckCircleOutlined, CheckCircleTwoTone } from "@ant-design/icons";
import { useGetAcVoucherTypeListQuery } from "../../../state/features/account/accountSlice";

function AcVoucherType() {
    const { data, isLoading } = useGetAcVoucherTypeListQuery();

    const [acVoucherTypes, setAcVoucherTypes] = useState<IAcVoucherType[]>([]);

    useEffect(() => {
        if(data?.content) {
            const arr = data.content.map((item: IAcVoucherType) => ({
                ...item,
                key: item.id
            }));
            setAcVoucherTypes(arr);
        }
      
    }, [data]);


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
                            loading={isLoading}
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
