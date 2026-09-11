import {
    Button,
    Input,
    InputRef,
    Space,
    Typography,
} from "antd";
import Table, { ColumnsType } from "antd/es/table";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import IAcVoucher from "../../../interfaces/IAcVoucher";
import { API_URL } from "../../../settings";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import FormatCurrencyWithSymbol from "../../Util/FormatCurrencyWithSymbol";
import axiosApi from "../../../state/api/axiosBase";
import VoucherFormModal from "./VoucherFormModal";
import { SearchOutlined, PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "../../../theme/clubTable.css";
const { Text } = Typography;

function AcVouchers() {
    const loginInfo = useSelector(selectLoginInfo);
    const [isMobile, setIsMobile] = useState(false);

    var [tableLoadingSpin, setTableSpinLoading] = useState(false);

    const [acVouchers, setAcVouchers] = useState<IAcVoucher[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const searchInput = useRef<InputRef>(null);

    useEffect(() => {
        getAcVoucherList();

        return () => {};
    }, []);

    const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
        confirm();
    };

    const handleReset = (clearFilters: any) => {
        clearFilters();
    };

    const getColumnSearchProps = (dataIndex: any) => ({
        filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
        }: any) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) =>
                        setSelectedKeys(e.target.value ? [e.target.value] : [])
                    }
                    onPressEnter={() =>
                        handleSearch(selectedKeys, confirm, dataIndex)
                    }
                    style={{ marginBottom: 8, display: "block" }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() =>
                            handleSearch(selectedKeys, confirm, dataIndex)
                        }
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() =>
                            clearFilters && handleReset(clearFilters)
                        }
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({ closeDropdown: false });
                        }}
                    >
                        Filter
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: any) => (
            <SearchOutlined
                style={{ color: filtered ? "#c6a15b" : undefined }}
            />
        ),
        onFilter: (value: any, record: any) =>
            record[dataIndex]
                ?.toString()
                ?.toLowerCase()
                ?.includes(value.toLowerCase()),
        onFilterDropdownOpenChange: (visible: any) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text: any) => text,
    });

    const getAcVoucherList = () => {
        setTableSpinLoading(true);
        axiosApi
            .get(`${API_URL}/ac/vouchers`)
            .then((response) => {
                response.data.content.map(
                    (x: { [x: string]: any; id: any }) => {
                        x["key"] = x.id;
                    }
                );
                setAcVouchers(response.data.content);
                setTableSpinLoading(false);
            })
            .catch((err) => {
                // Handle error
                console.log("server error", err);
                setTableSpinLoading(false);
            });
    };

    // The entry modal owns its own form state and resets itself on close, so opening and closing
    // it is the whole of what this screen has to track.
    const showModal = () => setModalOpen(true);

    const handleCancel = () => setModalOpen(false);

    const getUniqueMonths = () => {
        return [
            ...new Set(
                acVouchers.map((item) => dayjs(item.voucherDate).format("MMMM"))
            ),
        ];
    };

    const getUniqueYears = () => {
        return [
            ...new Set(
                acVouchers.map((item) => dayjs(item.voucherDate).year())
            ),
        ];
    };

    // table rendering settings
    const acVoucherColumns: ColumnsType<IAcVoucher> = [
        {
            title: "Voucher No",
            dataIndex: "code",
            key: "code",
            ...getColumnSearchProps("code"),
            render: (code: string) => <span className="brfc-chip">{code}</span>,
        },
        {
            title: "Date",
            dataIndex: "voucherDate",
            key: "voucherDate",
            render: (_: any, record: IAcVoucher) => (
                <Space size={7}>
                    <CalendarOutlined style={{ color: "#c6a15b", fontSize: 13 }} />
                    <Text type="secondary" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {moment.utc(record.voucherDate).local().format("YYYY-MMM-DD")}
                    </Text>
                </Space>
            ),
            sorter: (a, b) =>
                dayjs(a.voucherDate).unix() - dayjs(b.voucherDate).unix(),
            filters: [
                ...getUniqueYears().map((year) => ({
                    text: year,
                    value: year,
                })),
                ...getUniqueMonths().map((month) => ({
                    text: month,
                    value: month,
                })),
            ],
            onFilter: (value, record) => {
                if (typeof value === "number") {
                    return dayjs(record.voucherDate).year() === value;
                }
                if (typeof value === "string") {
                    return dayjs(record.voucherDate).format("MMMM") === value;
                }
                return true;
            },
        },
        {
            title: "Type",
            dataIndex: "voucherType.name",
            key: "voucherType.name",
            render: (_: any, record: IAcVoucher) => (
                <span className="brfc-status brfc-status--neutral">
                    <span className="brfc-status__dot" />
                    {record.voucherType.name}
                </span>
            ),
        },

        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            align: "right",
            render: (_: any, record: IAcVoucher) => (
                <span className="brfc-amount">
                    <FormatCurrencyWithSymbol amount={record.amount} />
                </span>
            ),
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: "Reference",
            dataIndex: "collection",
            key: "collectionCode",
            render: (_: any, record: IAcVoucher) => {
                const ref = record.collection
                    ? record.collection.transactionId
                    : record.billPayment
                    ? record.billPayment.code
                    : "";
                return ref ? <span className="brfc-chip">{ref}</span> : <Text type="secondary">—</Text>;
            },
        },

        // {
        //   title: "Action",
        //   key: "action",
        //   render: (_: any, record: IAcVoucher) => (
        //     <Space size="middle">
        //       <a onClick={() => updateAction(record.id)}>
        //         <EditTwoTone />
        //       </a>
        //     </Space>
        //   ),
        // },
    ];

    // The old single-amount submit, the player dropdown it fed and the update-by-id fetch have
    // gone with the modal they served: that modal posted a player id and one amount, which the
    // vouchers endpoint has no fields for, so every save failed validation silently. Entry now
    // lives in VoucherFormModal, which posts the balanced debit/credit lines the API expects.

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const canManage =
        loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

    return (
        <div className="brfc-page" style={{ padding: isMobile ? "16px 0" : "4px 0" }}>
            {/* Page header */}
            <div className="brfc-page-header">
                <Title level={2} style={{ margin: 0, lineHeight: 1.1, fontSize: isMobile ? "20px" : undefined }}>
                    Vouchers
                </Title>
                {canManage && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showModal}
                    >
                        New Voucher
                    </Button>
                )}
            </div>

            {/* Gold divider under the header */}
            <div className="brfc-gold-divider" />

            <Table
                loading={tableLoadingSpin}
                size={isMobile ? "small" : "middle"}
                rowKey="id"
                className="brfc-club-table"
                style={{ borderRadius: 10, overflow: "hidden" }}
                pagination={{
                    showTotal: (total) => `Total ${total} records`,
                    showSizeChanger: !isMobile,
                    showQuickJumper: !isMobile,
                    size: isMobile ? "small" : "default",
                }}
                dataSource={acVouchers}
                columns={acVoucherColumns}
                scroll={{
                    x: isMobile ? 600 : "max-content",
                    y: isMobile ? "60vh" : undefined,
                }}
            />

            <VoucherFormModal
                open={modalOpen}
                onClose={handleCancel}
                onSaved={getAcVoucherList}
            />
        </div>
    );
}

export default AcVouchers;
