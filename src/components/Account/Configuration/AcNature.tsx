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
import { FootballPosition } from "../../Enum/FootballPosition";

function AcNature() {
    var [tableLoadingSpin, setTableSpinLoading] = useState(false);

    const [acNatures, setAcNatures] = useState<IAcNature[]>([]);

    useEffect(() => {
        getAcNatureList();

        return () => { };
    }, []);

    const getAcNatureList = () => {
        setTableSpinLoading(true);
        axios
            .get(`${API_URL}/ac/natures`)
            .then((response) => {
                response.data.content.map((x: { [x: string]: any; id: any }) => {
                    x["key"] = x.id;
                });
                setAcNatures(response.data.content);
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
