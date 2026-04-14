import { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Badge, Popconfirm, Message } from '@arco-design/web-react';
import { getRolesApi, deleteRoleApi, type RoleResponse } from '@/api/role';
import type { TableColumnProps } from '@arco-design/web-react';
import RoleEditModal from './RoleEditModal';
import { IconPlus } from '@arco-design/web-react/icon';

export default function RoleList() {
  const [data, setData] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // For Editing
  const [editVisible, setEditVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRolesApi();
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (role: RoleResponse | null) => {
    setSelectedRole(role);
    setEditVisible(true);
  };

  const handleDelete = async (roleId: number) => {
    try {
      await deleteRoleApi(roleId);
      Message.success('角色已删除');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const columns: TableColumnProps<RoleResponse>[] = [
    { title: '角色名', dataIndex: 'name' },
    { title: '标识 (Code)', dataIndex: 'code' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'is_active', render: (val) => val ? <Badge status="success" text="启用" /> : <Badge status="error" text="禁用" /> },
    { title: '创建时间', dataIndex: 'created_at' },
    { title: '操作', render: (_, record) => (
      <Space>
        <Button type="text" size="small" onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm
          title="确定要删除该角色吗？"
          onOk={() => handleDelete(record.id)}
        >
          <Button type="text" status="danger" size="small">删除</Button>
        </Popconfirm>
      </Space>
    ) }
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Typography.Title heading={6} style={{ margin: 0 }}>角色管理</Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => handleEdit(null)}>新增角色</Button>
      </div>
      <Table 
        rowKey="id"
        columns={columns} 
        data={data} 
        loading={loading}
        pagination={false}
      />
      <RoleEditModal
        visible={editVisible}
        role={selectedRole}
        onClose={() => setEditVisible(false)}
        onSuccess={() => fetchData()}
      />
    </Card>
  );
}
