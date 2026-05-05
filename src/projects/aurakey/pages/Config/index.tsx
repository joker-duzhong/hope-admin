import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Message, Space, Spin, Table, Tabs, Typography } from '@arco-design/web-react';
import { IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import { useSearchParams } from 'react-router-dom';
import {
  createAurakeyGalleryCategory,
  createAurakeyOptionModel,
  createAurakeyOptionRatio,
  getAurakeyGalleryCategories,
  getAurakeyOptionModels,
  getAurakeyOptionRatios,
} from '../../api';
import CategoryFormModal from '../../components/CategoryFormModal';
import ModelFormModal from '../../components/ModelFormModal';
import RatioFormModal from '../../components/RatioFormModal';
import type {
  AurakeyAdminGalleryCategory,
  AurakeyAdminGalleryCategoryPayload,
  AurakeyAdminOptionModel,
  AurakeyAdminOptionModelPayload,
  AurakeyAdminOptionRatio,
  AurakeyAdminOptionRatioPayload,
} from '../../types';

function renderStatus(status: 'on' | 'off') {
  return status === 'on' ? <Badge status="success" text="启用" /> : <Badge status="warning" text="停用" />;
}

const TabPane = Tabs.TabPane;
const CONFIG_TABS = ['category', 'model', 'ratio'] as const;
type ConfigTabKey = (typeof CONFIG_TABS)[number];

function isConfigTabKey(value: string | null): value is ConfigTabKey {
  return !!value && CONFIG_TABS.includes(value as ConfigTabKey);
}

export default function AurakeyConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<AurakeyAdminGalleryCategory[]>([]);
  const [models, setModels] = useState<AurakeyAdminOptionModel[]>([]);
  const [ratios, setRatios] = useState<AurakeyAdminOptionRatio[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [modelVisible, setModelVisible] = useState(false);
  const [ratioVisible, setRatioVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState<'category' | 'model' | 'ratio' | null>(null);

  const tabParam = searchParams.get('tab');
  const activeTab: ConfigTabKey = isConfigTabKey(tabParam) ? tabParam : 'category';

  const categoryColumns: TableColumnProps<AurakeyAdminGalleryCategory>[] = useMemo(
    () => [
      { title: '分类 ID', dataIndex: 'id', ellipsis: true },
      { title: '分类名称', dataIndex: 'name' },
      { title: '排序值', dataIndex: 'sort', width: 120 },
    ],
    []
  );

  const modelColumns: TableColumnProps<AurakeyAdminOptionModel>[] = useMemo(
    () => [
      { title: '模型 ID', dataIndex: 'id', ellipsis: true },
      { title: '模型标识', dataIndex: 'model_id' },
      { title: '模型名称', dataIndex: 'name' },
      { title: '消耗算力', dataIndex: 'cost', width: 120 },
      {
        title: 'VIP 限制',
        dataIndex: 'is_vip_only',
        width: 120,
        render: (value) => (value ? 'VIP 专属' : '全部用户'),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: renderStatus,
      },
    ],
    []
  );

  const ratioColumns: TableColumnProps<AurakeyAdminOptionRatio>[] = useMemo(
    () => [
      { title: '比例 ID', dataIndex: 'id', ellipsis: true },
      { title: '宽高比', dataIndex: 'ratio' },
      { title: '排序值', dataIndex: 'sort', width: 120 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: renderStatus,
      },
    ],
    []
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryRes, modelRes, ratioRes] = await Promise.all([
        getAurakeyGalleryCategories(),
        getAurakeyOptionModels(),
        getAurakeyOptionRatios(),
      ]);
      setCategories(categoryRes.data.data || []);
      setModels(modelRes.data.data || []);
      setRatios(ratioRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (isConfigTabKey(tabParam)) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', 'category');
    setSearchParams(nextParams, { replace: true });
  }, [tabParam, searchParams, setSearchParams]);

  const handleTabChange = (key: string) => {
    if (!isConfigTabKey(key)) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', key);
    setSearchParams(nextParams, { replace: true });
  };

  const handleCreateCategory = async (values: AurakeyAdminGalleryCategoryPayload) => {
    setSubmitLoading('category');
    try {
      await createAurakeyGalleryCategory(values);
      Message.success('分类已创建');
      setCategoryVisible(false);
      await loadData();
    } finally {
      setSubmitLoading(null);
    }
  };

  const handleCreateModel = async (values: AurakeyAdminOptionModelPayload) => {
    setSubmitLoading('model');
    try {
      await createAurakeyOptionModel(values);
      Message.success('模型已创建');
      setModelVisible(false);
      await loadData();
    } finally {
      setSubmitLoading(null);
    }
  };

  const handleCreateRatio = async (values: AurakeyAdminOptionRatioPayload) => {
    setSubmitLoading('ratio');
    try {
      await createAurakeyOptionRatio(values);
      Message.success('宽高比已创建');
      setRatioVisible(false);
      await loadData();
    } finally {
      setSubmitLoading(null);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title heading={5} style={{ margin: 0 }}>
            AuraKey 配置管理
          </Typography.Title>
          <Button icon={<IconRefresh />} onClick={() => void loadData()} loading={loading}>
            刷新配置
          </Button>
        </Space>
      </Card>

      <Spin loading={loading} style={{ width: '100%' }}>
        <Card>
          <Tabs activeTab={activeTab} onChange={handleTabChange} type="rounded">
            <TabPane key="category" title="图库分类">
              <Card
                title="图库分类"
                bordered={false}
                extra={
                  <Button type="primary" icon={<IconPlus />} onClick={() => setCategoryVisible(true)}>
                    新增分类
                  </Button>
                }
              >
                <Table rowKey="id" columns={categoryColumns} data={categories} pagination={false} />
              </Card>
            </TabPane>

            <TabPane key="model" title="生图模型">
              <Card
                title="生图模型"
                bordered={false}
                extra={
                  <Button type="primary" icon={<IconPlus />} onClick={() => setModelVisible(true)}>
                    新增模型
                  </Button>
                }
              >
                <Table rowKey="id" columns={modelColumns} data={models} pagination={false} />
              </Card>
            </TabPane>

            <TabPane key="ratio" title="宽高比配置">
              <Card
                title="宽高比配置"
                bordered={false}
                extra={
                  <Button type="primary" icon={<IconPlus />} onClick={() => setRatioVisible(true)}>
                    新增宽高比
                  </Button>
                }
              >
                <Table rowKey="id" columns={ratioColumns} data={ratios} pagination={false} />
              </Card>
            </TabPane>
          </Tabs>
        </Card>
      </Spin>

      <CategoryFormModal
        visible={categoryVisible}
        confirmLoading={submitLoading === 'category'}
        onCancel={() => setCategoryVisible(false)}
        onSubmit={handleCreateCategory}
      />
      <ModelFormModal
        visible={modelVisible}
        confirmLoading={submitLoading === 'model'}
        onCancel={() => setModelVisible(false)}
        onSubmit={handleCreateModel}
      />
      <RatioFormModal
        visible={ratioVisible}
        confirmLoading={submitLoading === 'ratio'}
        onCancel={() => setRatioVisible(false)}
        onSubmit={handleCreateRatio}
      />
    </Space>
  );
}