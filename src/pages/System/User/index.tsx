import { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Badge } from '@arco-design/web-react';
import { getUsersApi, type AdminUserListItem } from '@/api/user';
import type { TableColumnProps } from '@arco-design/web-react';

export default function UserList() {
  const [data, setData] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

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

  const columns: TableColumnProps<AdminUserListItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '手机号', dataIndex: 'phone' },
    { title: '来源', dataIndex: 'source' },
    { title: '状态', dataIndex: 'is_active', render: (val) => val ? <Badge status="success" text="启用" /> : <Badge status="error" text="禁用" /> },
    { title: '注册时间', dataIndex: 'created_at' },
    { title: '操作', render: () => <Space><Button type="text" size="small">编辑</Button></Space> }
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
    </Card>
  );
}
