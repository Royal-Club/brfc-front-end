import {
    Col,
    Row
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import axios from "axios";
import { useEffect, useState } from "react";
import IAcNature from "../../../interfaces/IAcNature";
import { API_URL } from "../../../settings";
import { AcNatureType } from "../../Enum/AcNatureType";
import { useGetAcNatureListQuery } from "../../../state/features/account/accountSlice";

function AcNature() {
    const { data,isLoading } = useGetAcNatureListQuery();
    const [acNatures, setAcNatures] = useState<IAcNature[]>([]);

    useEffect(() => {
        if(data?.content) {
            const arr = data.content.map((item: IAcNature) => ({
                ...item,
                key: item.id
            }));
            setAcNatures(arr);
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
    const acNatureColumns: ColumnsType<IAcNature> = [
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
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (_: any, record: IAcNature) => {
                return getEnumValue(record.type);
            },
        },
        // {
        //     title: "Description",
        //     dataIndex: "description",
        //     key: "description",
        // },
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
                            dataSource={acNatures}
                            columns={acNatureColumns}
                            scroll={{ x: "max-content" }} // Enables horizontal scrolling on smaller screens
                        />
                    </div>
                </Col>
            </Row>
        </>
    );
}

export default AcNature;
