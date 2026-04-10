import { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Badge } from '@arco-design/web-react';
import { getRolesApi, type RoleResponse } from '@/api/role';
import type { TableColumnProps } from '@arco-design/web-react';

export default function RoleList() {
  const [data, setData] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(false);

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

  const columns: TableColumnProps<RoleResponse>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '角色名', dataIndex: 'name' },
    { title: 'Code', dataIndex: 'code' },
    { title: 'Scope', dataIndex: 'scope' },
    { title: '状态', dataIndex: 'is_active', render: (val) => val ? <Badge status="success" text="启用" /> : <Badge status="error" text="禁用" /> },
    { title: '创建时间', dataIndex: 'created_at' },
    { title: '操作', render: () => <Space><Button type="text" size="small">编辑</Button></Space> }
  ];

  return (
    <Card>
      <Typography.Title heading={6}>角色管理</Typography.Title>
      <Table 
        rowKey="id"
        columns={columns} 
        data={data} 
        loading={loading}
        pagination={false}
      />
    </Card>
  );
}
