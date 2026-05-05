import { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Badge, Popconfirm, Message, Input, Select, Form } from '@arco-design/web-react';
import { getUsersApi, freezeUserApi, type AdminUserListItem, type UserListParams } from '@/core/api/user';
import type { TableColumnProps } from '@arco-design/web-react';
import UserEditModal from './UserEditModal';
import UserRoleModal from './UserRoleModal';

const FormItem = Form.Item;

export default function UserList() {
  const [data, setData] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [editVisible, setEditVisible] = useState(false);
  const [roleVisible, setRoleVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [filters, setFilters] = useState<Omit<UserListParams, 'page' | 'size'>>({});
  const [form] = Form.useForm();

  const fetchData = async (page = 1, size = 10, extraFilters?: Omit<UserListParams, 'page' | 'size'>) => {
    setLoading(true);
    const params = { page, page_size: size, ...(extraFilters ?? filters) };
    // 去掉空字符串字段，避免传 '' 给后端
    Object.keys(params).forEach((k) => {
      const key = k as keyof typeof params;
      if (params[key] === '' || params[key] === undefined) delete params[key];
    });
    try {
      const res = await getUsersApi(params);
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

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const isActiveValue =
      values.is_active === 'true' ? true : values.is_active === 'false' ? false : undefined;
    const newFilters: Omit<UserListParams, 'page' | 'size'> = {
      keyword: values.keyword || undefined,
      is_active: isActiveValue,
      role_code: values.role_code || undefined,
      source: values.source || undefined,
    };
    setFilters(newFilters);
    fetchData(1, pagination.pageSize, newFilters);
  };

  const handleReset = () => {
    form.resetFields();
    const empty = {};
    setFilters(empty);
    fetchData(1, pagination.pageSize, empty);
  };
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

  const handleAssignRole = (user: AdminUserListItem) => {
    setSelectedUser(user);
    setRoleVisible(true);
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
          <Button type="text" size="small" onClick={() => handleAssignRole(record)}>分配角色</Button>
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
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <FormItem field="keyword">
          <Input placeholder="昵称 / 用户名 / 手机号 / OpenID" style={{ width: 220 }} allowClear />
        </FormItem>
        <FormItem field="is_active">
          <Select placeholder="状态" style={{ width: 100 }} allowClear>
            <Select.Option value="true">启用</Select.Option>
            <Select.Option value="false">已冻结</Select.Option>
          </Select>
        </FormItem>
        <FormItem field="source">
          <Select placeholder="来源" style={{ width: 120 }} allowClear>
            <Select.Option value="default">default</Select.Option>
            <Select.Option value="wechat">wechat</Select.Option>
          </Select>
        </FormItem>
        <FormItem field="role_code">
          <Input placeholder="角色编码" style={{ width: 140 }} allowClear />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </FormItem>
      </Form>
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
      <UserRoleModal
        visible={roleVisible}
        user={selectedUser}
        onClose={() => setRoleVisible(false)}
        onSuccess={() => fetchData(pagination.current, pagination.pageSize)}
      />
    </Card>
  );
}
