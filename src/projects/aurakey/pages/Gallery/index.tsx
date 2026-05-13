import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Image, Input, Message, Modal, Pagination, Popconfirm, Select, Space, Spin, Table, Tag, Typography } from '@arco-design/web-react';
import { IconCheck, IconClose, IconEye, IconEyeInvisible, IconRefresh, IconSearch, IconStop } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import {
  batchUpdateAurakeyAdminGalleryPublish,
  getAurakeyAdminGalleryList,
  getAurakeyGalleryCategories,
  updateAurakeyAdminGalleryPublish,
  updateAurakeyAdminGalleryStatus,
} from '../../api';
import type {
  AurakeyAdminGalleryCategory,
  AurakeyAdminGalleryItem,
  AurakeyAdminGalleryListParams,
  AurakeyAdminGalleryPublishStatus,
} from '../../types';

type GalleryFilterValues = Omit<Pick<AurakeyAdminGalleryListParams, 'publishStatus' | 'isPublished' | 'categoryId' | 'userId' | 'keyword'>, 'isPublished'> & {
  isPublished?: 'true' | 'false';
};

const FormItem = Form.Item;
const PUBLISH_STATUS_OPTIONS: { label: string; value: AurakeyAdminGalleryPublishStatus; color: string }[] = [
  { label: '已通过', value: 'approved', color: 'green' },
  { label: '已屏蔽', value: 'blocked', color: 'red' },
];

function compactParams(values: GalleryFilterValues): Omit<AurakeyAdminGalleryListParams, 'page' | 'pageSize'> {
  return Object.entries(values).reduce<Omit<AurakeyAdminGalleryListParams, 'page' | 'pageSize'>>((params, [key, value]) => {
    if (value === undefined || value === null || value === '') return params;

    if (key === 'isPublished') {
      return {
        ...params,
        isPublished: value === 'true',
      };
    }

    return {
      ...params,
      [key]: typeof value === 'string' ? value.trim() : value,
    };
  }, {});
}

function getStatusOption(status: AurakeyAdminGalleryPublishStatus) {
  return PUBLISH_STATUS_OPTIONS.find((item) => item.value === status);
}

function formatUnixTime(value?: number | null) {
  if (!value) return '-';

  return new Date(value * 1000).toLocaleString('zh-CN');
}

function renderPublishStatus(status: AurakeyAdminGalleryPublishStatus) {
  const option = getStatusOption(status);

  return <Tag color={option?.color || 'gray'}>{option?.label || status}</Tag>;
}

function getCategoryName(categories: AurakeyAdminGalleryCategory[], categoryId?: string | null) {
  if (!categoryId) return '-';

  return categories.find((item) => item.id === categoryId)?.name || categoryId;
}

export default function AurakeyGalleryPage() {
  const [filterForm] = Form.useForm<GalleryFilterValues>();
  const [data, setData] = useState<AurakeyAdminGalleryItem[]>([]);
  const [categories, setCategories] = useState<AurakeyAdminGalleryCategory[]>([]);
  const [filters, setFilters] = useState<Omit<AurakeyAdminGalleryListParams, 'page' | 'pageSize'>>({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadCategories = async () => {
    const res = await getAurakeyGalleryCategories();
    setCategories(res.data.data || []);
  };

  const loadData = async (
    currentPage: number = page,
    size: number = pageSize,
    nextFilters: Omit<AurakeyAdminGalleryListParams, 'page' | 'pageSize'> = filters
  ) => {
    setLoading(true);
    try {
      const res = await getAurakeyAdminGalleryList({
        ...nextFilters,
        page: currentPage,
        pageSize: size,
      });
      if (res.data.data) {
        setData(res.data.data.items);
        setTotal(res.data.data.total);
        setPage(res.data.data.page);
        setPageSize(res.data.data.page_size);
        setSelectedRowKeys([]);
      }
    } catch {
      Message.error('加载画廊列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    void loadData(1, pageSize, {});
  }, []);

  const handleSearch = async () => {
    const values = filterForm.getFieldsValue();
    const nextFilters = compactParams(values);
    setFilters(nextFilters);
    await loadData(1, pageSize, nextFilters);
  };

  const handleReset = async () => {
    filterForm.resetFields();
    setFilters({});
    await loadData(1, pageSize, {});
  };

  const handlePublishChange = async (record: AurakeyAdminGalleryItem, isPublished: boolean) => {
    const actionKey = `publish-${record.task_id}`;
    setActionLoading(actionKey);
    try {
      await updateAurakeyAdminGalleryPublish(record.task_id, {
        is_published: isPublished,
        category_id: record.category_id ?? null,
      });
      Message.success(isPublished ? '作品已公开' : '作品已取消公开');
      await loadData(page, pageSize);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (record: AurakeyAdminGalleryItem, publishStatus: AurakeyAdminGalleryPublishStatus) => {
    const actionKey = `status-${record.task_id}`;
    setActionLoading(actionKey);
    try {
      await updateAurakeyAdminGalleryStatus(record.task_id, { publish_status: publishStatus });
      Message.success(publishStatus === 'approved' ? '作品已通过' : '作品已屏蔽');
      await loadData(page, pageSize);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBatchPublish = async (isPublished: boolean) => {
    if (!selectedRowKeys.length) {
      Message.warning('请先选择作品');
      return;
    }

    const actionKey = isPublished ? 'batch-publish' : 'batch-unpublish';
    setActionLoading(actionKey);
    try {
      const res = await batchUpdateAurakeyAdminGalleryPublish({
        task_ids: selectedRowKeys,
        is_published: isPublished,
      });
      const result = res.data.data;
      if (!result) {
        Message.success(isPublished ? '批量公开完成' : '批量取消公开完成');
      } else if (result.failed_count > 0) {
        const reasons = result.failed_items?.slice(0, 3).map((item) => `${item.task_id}: ${item.reason}`).join('\n');
        Modal.warning({
          title: '批量操作部分失败',
          content: (
            <div>
              <div>{`成功 ${result.updated_count} 项，失败 ${result.failed_count} 项。`}</div>
              {reasons && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{reasons}</pre>}
            </div>
          ),
        });
      } else {
        Message.success(isPublished ? '批量公开成功' : '批量取消公开成功');
      }
      await loadData(page, pageSize);
    } finally {
      setActionLoading(null);
    }
  };

  const columns: TableColumnProps<AurakeyAdminGalleryItem>[] = useMemo(
    () => [
      {
        title: '作品',
        dataIndex: 'thumb_url',
        width: 120,
        render: (value: string | null, record) => {
          const imageUrl = value || record.image_url;

          return imageUrl ? <Image src={imageUrl} width={88} height={88} style={{ objectFit: 'cover' }} /> : '-';
        },
      },
      {
        title: '作者',
        dataIndex: 'user',
        width: 220,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Space size="mini">
              {record.user.avatar && <Image src={record.user.avatar} width={24} height={24} preview={false} style={{ borderRadius: '50%' }} />}
              <span>{record.user.nickname || record.user.username || '未命名用户'}</span>
            </Space>
            <Typography.Text type="secondary" copyable={{ text: record.user.user_id }}>
              {record.user.user_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: '提示词',
        dataIndex: 'prompt',
        width: 260,
        ellipsis: true,
      },
      {
        title: '模型 / 比例',
        width: 140,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <span>{record.model_name || '-'}</span>
            {record.aspect_ratio ? <Tag color="blue">{record.aspect_ratio}</Tag> : '-'}
          </Space>
        ),
      },
      {
        title: '任务状态',
        dataIndex: 'status',
        width: 110,
        render: (value: string) => <Tag color={value === 'success' ? 'green' : value === 'failed' ? 'red' : 'orange'}>{value}</Tag>,
      },
      {
        title: '公开状态',
        dataIndex: 'is_published',
        width: 110,
        render: (value: boolean) => <Tag color={value ? 'green' : 'gray'}>{value ? '公开' : '未公开'}</Tag>,
      },
      {
        title: '审核状态',
        dataIndex: 'publish_status',
        width: 110,
        render: renderPublishStatus,
      },
      {
        title: '分类',
        dataIndex: 'category_id',
        width: 140,
        render: (value: string | null) => getCategoryName(categories, value),
      },
      {
        title: '互动',
        width: 100,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <span>{`点赞 ${record.like_count}`}</span>
            <span>{`浏览 ${record.view_count}`}</span>
          </Space>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        width: 180,
        render: formatUnixTime,
      },
      {
        title: '发布时间',
        dataIndex: 'published_at',
        width: 180,
        render: formatUnixTime,
      },
      {
        title: '操作',
        width: 260,
        fixed: 'right',
        render: (_value, record) => {
          const nextPublished = !record.is_published;
          const nextStatus: AurakeyAdminGalleryPublishStatus = record.publish_status === 'approved' ? 'blocked' : 'approved';

          return (
            <Space size="mini" wrap>
              <Popconfirm
                title={nextPublished ? '确定公开作品？' : '确定取消公开？'}
                onOk={() => handlePublishChange(record, nextPublished)}
              >
                <Button
                  type="text"
                  size="small"
                  icon={nextPublished ? <IconEye /> : <IconEyeInvisible />}
                  loading={actionLoading === `publish-${record.task_id}`}
                >
                  {nextPublished ? '公开' : '取消公开'}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={nextStatus === 'approved' ? '确定通过作品？' : '确定屏蔽作品？'}
                onOk={() => handleStatusChange(record, nextStatus)}
              >
                <Button
                  type="text"
                  size="small"
                  status={nextStatus === 'approved' ? 'success' : 'danger'}
                  icon={nextStatus === 'approved' ? <IconCheck /> : <IconStop />}
                  loading={actionLoading === `status-${record.task_id}`}
                >
                  {nextStatus === 'approved' ? '通过' : '屏蔽'}
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [actionLoading, categories, page, pageSize, filters]
  );

  return (
    <Card title="画廊管理" bordered={false}>
      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <FormItem field="keyword">
          <Input placeholder="提示词 / 模型 / 用户" allowClear style={{ width: 220 }} />
        </FormItem>
        <FormItem field="publishStatus">
          <Select placeholder="审核状态" allowClear style={{ width: 120 }}>
            {PUBLISH_STATUS_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </FormItem>
        <FormItem field="isPublished">
          <Select placeholder="公开状态" allowClear style={{ width: 120 }}>
            <Select.Option value="true">公开</Select.Option>
            <Select.Option value="false">未公开</Select.Option>
          </Select>
        </FormItem>
        <FormItem field="categoryId">
          <Select placeholder="分类" allowClear style={{ width: 140 }}>
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </FormItem>
        <FormItem field="userId">
          <Input placeholder="作者用户 ID" allowClear style={{ width: 220 }} />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" icon={<IconSearch />} onClick={() => void handleSearch()}>
              查询
            </Button>
            <Button icon={<IconRefresh />} onClick={() => void handleReset()}>
              重置
            </Button>
          </Space>
        </FormItem>
      </Form>

      <Space style={{ marginBottom: 16 }}>
        <Popconfirm title={`确定公开选中的 ${selectedRowKeys.length} 个作品？`} onOk={() => handleBatchPublish(true)}>
          <Button
            icon={<IconEye />}
            disabled={!selectedRowKeys.length}
            loading={actionLoading === 'batch-publish'}
          >
            批量公开
          </Button>
        </Popconfirm>
        <Popconfirm title={`确定取消公开选中的 ${selectedRowKeys.length} 个作品？`} onOk={() => handleBatchPublish(false)}>
          <Button
            status="warning"
            icon={<IconEyeInvisible />}
            disabled={!selectedRowKeys.length}
            loading={actionLoading === 'batch-unpublish'}
          >
            批量取消公开
          </Button>
        </Popconfirm>
        {selectedRowKeys.length > 0 && (
          <Button type="text" icon={<IconClose />} onClick={() => setSelectedRowKeys([])}>
            清空选择
          </Button>
        )}
      </Space>

      <Spin loading={loading} style={{ width: '100%' }}>
        <div style={{ width: '100%', overflow: 'auto' }}>
          <Table
            rowKey="task_id"
            columns={columns}
            data={data}
            pagination={false}
            border
            scroll={{ x: 2100 }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys.map(String)),
            }}
          />
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showTotal
            sizeCanChange
            onChange={(currentPage) => void loadData(currentPage, pageSize)}
            onPageSizeChange={(size) => void loadData(1, size)}
          />
        </div>
      </Spin>
    </Card>
  );
}
