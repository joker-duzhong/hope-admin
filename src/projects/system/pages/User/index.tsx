import { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Badge, Popconfirm, Message } from '@arco-design/web-react';
import { getUsersApi, freezeUserApi, type AdminUserListItem } from '@/core/api/user';
import type { TableColumnProps } from '@arco-design/web-react';
import UserEditModal from './UserEditModal';

export default function UserList() {
  const [data, setData] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [editVisible, setEditVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);

  const fetchData = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const res = await getUsersApi({ page, size });
      const { items, total } = res.data.data;
      setData(items);
      setPagination({ current: page, pageSize: size, total });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFreeze = async (user: AdminUserListItem) => {
    try {
      await freezeUserApi(user.id, !user.is_active);
      Message.success(user.is_active ? '用户已冻结' : '用户已启用');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (user: AdminUserListItem) => {
    setSelectedUser(user);
    setEditVisible(true);
  };

  const columns: TableColumnProps<AdminUserListItem>[] = [
    { title: 'OpenID', dataIndex: 'openid', width: 220, render: (val) => val || '-' },
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '手机号', dataIndex: 'phone' },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (val) => val ? <Badge status="success" text="启用" /> : <Badge status="error" text="禁用" />,
    },
    { title: '角色', dataIndex: 'roles', render: (roles: any[]) => roles?.map((r) => r.name).join(', ') || '-' },
    { title: '注册时间', dataIndex: 'created_at' },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title={record.is_active ? '确定要冻结该用户吗？' : '确定要启用该用户吗？'}
            onOk={() => handleFreeze(record)}
          >
            <Button type="text" status={record.is_active ? 'warning' : 'success'} size="small">
              {record.is_active ? '冻结' : '解冻'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Typography.Title heading={6}>用户管理</Typography.Title>
      <Table
        rowKey="id"
        columns={columns}
        data={data}
        loading={loading}
        pagination={{ onChange: (page, pageSize) => fetchData(page, pageSize), ...pagination }}
      />
      <UserEditModal
        visible={editVisible}
        user={selectedUser}
        onClose={() => setEditVisible(false)}
        onSuccess={() => fetchData(pagination.current, pagination.pageSize)}
      />
    </Card>
  );
}
