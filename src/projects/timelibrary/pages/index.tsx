import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Form, InputNumber, Popconfirm, Image, Message, Typography } from '@arco-design/web-react';
import { IconPlus, IconSearch } from '@arco-design/web-react/icon';
import type { Book, BookListParams } from '../types';
import { getBooks, deleteBook } from '../api';
import BookForm from '../components/BookForm';
import BookDetailViewer from '../components/BookDetailViewer';

const TimeLibrary: React.FC = () => {
  const [data, setData] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editData, setEditData] = useState<Book | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);

  const [searchForm] = Form.useForm<BookListParams>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const values = searchForm.getFieldsValue();
      const res = await getBooks({
        start_year: values.start_year || undefined,
        end_year: values.end_year || undefined,
      });
      setData(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => fetchData();

  const handleReset = () => {
    searchForm.resetFields();
    fetchData();
  };

  const handleAdd = () => {
    setEditData(null);
    setFormVisible(true);
  };

  const handleEdit = (record: Book) => {
    setCurrentBookId(record.id);
    setViewerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBook(id);
      Message.success('已下架该书籍');
      fetchData();
    } catch (error) {
      // 错误已由 request 统一拦截并提示
    }
  };

  const columns = [
    {
      title: '封面',
      dataIndex: 'cover_url',
      render: (url: string) =>
        url ? <Image width={60} src={url} alt="cover" style={{ borderRadius: 4, objectFit: 'cover' }} /> : '无图',
    },
    { title: '书名', dataIndex: 'title' },
    { title: '作者', dataIndex: 'author' },
    {
      title: '所属年代',
      dataIndex: 'year',
      render: (val: number) => <Typography.Text>{val}</Typography.Text>,
    },
    {
      title: '坐标位置',
      render: (_: any, record: Book) => `经: ${record.longitude}, 纬: ${record.latitude}`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (val: string) => (val ? new Date(val).toLocaleString() : '-'),
    },
    {
      title: '操作',
      dataIndex: 'op',
      render: (_: any, record: Book) => (
        <Space>
          <Button type="text" onClick={() => handleEdit(record)} size="small" style={{ padding: '0 4px' }}>
            管理与阅读
          </Button>
          <Popconfirm focusLock title="确认下架此书籍吗？" onOk={() => handleDelete(record.id)}>
            <Button type="text" status="danger" size="small" style={{ padding: '0 4px' }}>
              下架
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="时空图书馆管理"
      extra={
        <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
          录入书籍
        </Button>
      }
    >
      <Form form={searchForm} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item label="起始年份" field="start_year">
          <InputNumber placeholder="如: -200" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="结束年份" field="end_year">
          <InputNumber placeholder="如: 2024" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>查询</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        data={data}
        pagination={{ showTotal: true, pageSize: 20 }}
      />

      {formVisible && (
        <BookForm
          visible={formVisible}
          editData={editData}
          onCancel={() => setFormVisible(false)}
          onSuccess={() => {
            setFormVisible(false);
            fetchData();
          }}
        />
      )}

      {viewerVisible && (
        <BookDetailViewer
          visible={viewerVisible}
          bookId={currentBookId}
          onClose={() => setViewerVisible(false)}
          onUpdateSuccess={() => fetchData()}
        />
      )}
    </Card>
  );
};

export default TimeLibrary;
