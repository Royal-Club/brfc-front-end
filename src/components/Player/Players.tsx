import { CheckCircleTwoTone, DeleteTwoTone, EditTwoTone } from '@ant-design/icons';
import { Button, Col, Popconfirm, Row, Space, message } from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import Title from 'antd/es/typography/Title';
import axios from 'axios';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import IPlayer from '../../interfaces/IPlayer';
import { API_URL } from '../../settings';

function Players() {

    var [tableLoadingSpin, setTableSpinLoading] = useState(false);
    const [players, setPlayers] = useState<IPlayer[]>([]);

    useEffect(() => {
        getPlayers();

        return () => {
        }
    }, [])


    const getPlayers = () => {
        setTableSpinLoading(true);
        axios.get(`${API_URL}/players`)
            .then((response) => {
                if (response.data?.content) {
                    response.data?.content?.map((x: { [x: string]: any; id: any; }) => {
                        x['key'] = x.id;
                    })
                    setPlayers(response.data.content);
                }
                setTableSpinLoading(false);
            }).catch(err => {
                // Handle error
                console.log("server error", err);
                setTableSpinLoading(false);
            });
    }

    const deletePopConfirm = (gallerieId: any) => {
        axios.delete(`${API_URL}/players/${gallerieId}`)
            .then((response) => {
                getPlayers();
                message.success('Deleted Successfully.');
            }).catch(err => {
                console.log("server error", err);
            });
    };

    const viewAction = (id: number) => {

    }
    // table rendering settings
    const playersColumn: ColumnsType<IPlayer> = [

        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Skype',
            dataIndex: 'skypeId',
            key: 'skypeId',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Mobile',
            dataIndex: 'mobileNo',
            key: 'mobileNo',
        },
        {
            title: 'Status',
            dataIndex: 'active',
            key: 'active',
            render: (_: any, record: IPlayer) => {
                if (record.active) {
                    return (
                        <span>
                            <CheckCircleTwoTone twoToneColor="#52c41a" /> Active
                        </span>
                    )
                } else {
                    return (
                        <span>
                            <CheckCircleTwoTone twoToneColor="#eb2f96" /> InActive
                        </span>
                    )
                }

            },
        },
        {
            title: 'Created Date',
            dataIndex: 'createdDate',
            key: 'createdDate',
            render: (_: any, record: IPlayer) => (
                moment
                    .utc(record.createdDate)
                    .local()
                    .format('DD-MMM-YYYY')
            )
        },
        {
            title: 'Modified Date',
            dataIndex: 'lastModifiedDate',
            key: 'lastModifiedDate',
            render: (_: any, record: IPlayer) => (
                moment
                    .utc(record.updatedDate)
                    .local()
                    .format('DD-MMM-YYYY')
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: IPlayer) => (
                <Space size="middle">
                    <Link to={`/players/${record.id}`} ><EditTwoTone /></Link>
                    <Popconfirm
                        disabled={true}
                        title="Are you sure to delete this record?"
                        onConfirm={() => deletePopConfirm(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <a><DeleteTwoTone /></a>
                    </Popconfirm>
                </Space>
            ),
        },
    ];


    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Title level={4}>Players</Title>
                        <Link to={'/player'}><Button type="primary">Create</Button></Link>
                        <Table
                            loading={tableLoadingSpin}
                            size="small"
                            dataSource={players}
                            columns={playersColumn}
                            scroll={{ x: 'max-content' }} // Enables horizontal scrolling on smaller screens
                        />
                    </div>
                </Col>
            </Row>
        </>
    )
}

export default Players;