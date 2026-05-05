import { useEffect, useState } from 'react';
import { Card, Table, Pagination, Space, Image, Tag, Spin, Message } from '@arco-design/web-react';
import { getAurakeyGalleryList } from '../../api';
import type { AurakeyGalleryItem } from '../../types';

export default function AurakeyGalleryPage() {
  const [data, setData] = useState<AurakeyGalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadData = async (currentPage: number = 1, size: number = 20) => {
    setLoading(true);
    try {
      const res = await getAurakeyGalleryList(currentPage, size);
      if (res.data.data) {
        setData(res.data.data.items);
        setTotal(res.data.data.total);
        setPage(currentPage);
        setPageSize(size);
      }
    } catch (error) {
      Message.error('加载画廊列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, pageSize);
  }, []);

  const columns = [
    {
      title: '缩略图',
      dataIndex: 'thumb_url',
      width: 120,
      render: (value: string) => (
        <Image src={value} width={100} height={100} />
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      width: 150,
      render: (author: { nickname: string; avatar: string }) => (
        <Space>
          <Image src={author.avatar} width={32} height={32} />
          <span>{author.nickname}</span>
        </Space>
      ),
    },
    {
      title: '宽高比',
      dataIndex: 'aspect_ratio',
      width: 100,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '点赞',
      dataIndex: 'like_count',
      width: 80,
      render: (value: number) => <span>{value}</span>,
    },
    {
      title: '浏览',
      dataIndex: 'view_count',
      width: 80,
      render: (value: number) => <span>{value}</span>,
    },
    {
      title: '用户已点赞',
      dataIndex: 'is_liked',
      width: 100,
      render: (value: boolean) => <Tag color={value ? 'green' : 'gray'}>{value ? '已点赞' : '未点赞'}</Tag>,
    },
  ];

  return (
    <Card title="画廊列表" bordered={false}>
      <Spin loading={loading} style={{ width: '100%' }}>
        <div style={{ width: '100%', overflow: 'auto' }}>
          <Table
            rowKey="id"
            columns={columns}
            data={data}
            pagination={false}
            border
            scroll={{ x: 800 }}
          />
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(p) => loadData(p, pageSize)}
            onPageSizeChange={(size) => loadData(1, size)}
          />
        </div>
      </Spin>
    </Card>
  );
}
