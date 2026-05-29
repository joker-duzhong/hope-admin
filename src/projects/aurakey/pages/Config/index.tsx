import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Form, Input, InputNumber, Message, Popconfirm, Space, Spin, Table, Tabs, Typography } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconPlus, IconRefresh, IconSave } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import { useSearchParams } from 'react-router-dom';
import {
  createAurakeyGalleryCategory,
  createAurakeyOptionModel,
  createAurakeyOptionRatio,
  deleteAurakeyGalleryCategory,
  deleteAurakeyOptionRatio,
  getAurakeyAdminSystemConfig,
  getAurakeyGalleryCategories,
  getAurakeyOptionModels,
  getAurakeyOptionRatios,
  updateAurakeyAdminSystemConfig,
  updateAurakeyGalleryCategory,
  updateAurakeyOptionRatio,
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
  AurakeySystemConfig,
  AurakeySystemConfigUpdatePayload,
} from '../../types';

function renderStatus(status: 'on' | 'off') {
  return status === 'on' ? <Badge status="success" text="启用" /> : <Badge status="warning" text="停用" />;
}

const TabPane = Tabs.TabPane;
const CONFIG_TABS = ['category', 'model', 'ratio', 'system'] as const;
type ConfigTabKey = (typeof CONFIG_TABS)[number];

interface SystemConfigFormValues extends Omit<AurakeySystemConfigUpdatePayload, 'custom'> {
  custom_json: string;
}

const DEFAULT_SYSTEM_CONFIG: AurakeySystemConfig = {
  register_reward_points: 10,
  daily_sign_in_reward_points: 10,
  invite_reward_points: 50,
  default_vip_valid_days: 30,
  default_point_pack_valid_days: null,
  daily_free_points_reset_hour: 12,
  custom: {},
};

function normalizeSystemConfig(config?: AurakeySystemConfig | null): AurakeySystemConfig {
  return {
    ...DEFAULT_SYSTEM_CONFIG,
    ...config,
    custom: config?.custom ?? {},
  };
}

function stringifyCustomConfig(custom: Record<string, unknown>) {
  return JSON.stringify(custom, null, 2);
}

function isConfigTabKey(value: string | null): value is ConfigTabKey {
  return !!value && CONFIG_TABS.includes(value as ConfigTabKey);
}

export default function AurakeyConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [systemForm] = Form.useForm<SystemConfigFormValues>();
  const [categories, setCategories] = useState<AurakeyAdminGalleryCategory[]>([]);
  const [models, setModels] = useState<AurakeyAdminOptionModel[]>([]);
  const [ratios, setRatios] = useState<AurakeyAdminOptionRatio[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<AurakeyAdminGalleryCategory | undefined>();
  const [modelVisible, setModelVisible] = useState(false);
  const [modelMode, setModelMode] = useState<'create' | 'edit'>('create');
  const [selectedModel, setSelectedModel] = useState<AurakeyAdminOptionModel | undefined>();
  const [ratioVisible, setRatioVisible] = useState(false);
  const [ratioMode, setRatioMode] = useState<'create' | 'edit'>('create');
  const [selectedRatio, setSelectedRatio] = useState<AurakeyAdminOptionRatio | undefined>();
  const [submitLoading, setSubmitLoading] = useState<'category' | 'model' | 'ratio' | 'system' | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const tabParam = searchParams.get('tab');
  const activeTab: ConfigTabKey = isConfigTabKey(tabParam) ? tabParam : 'category';

  const categoryColumns: TableColumnProps<AurakeyAdminGalleryCategory>[] = useMemo(
    () => [
      { title: '分类 ID', dataIndex: 'id', ellipsis: true },
      { title: '分类名称', dataIndex: 'name' },
      { title: '排序值', dataIndex: 'sort', width: 120 },
      {
        title: '操作',
        width: 220,
        render: (_value, record) => (
          <Space size="mini">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleOpenEditCategory(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除该分类？"
              content="删除后无法恢复"
              onOk={() => handleDeleteCategory(record.id)}
            >
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                loading={deleteLoading === `category-${record.id}`}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deleteLoading]
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
      {
        title: '操作',
        width: 100,
        render: (_value, record) => (
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => {
              setModelMode('edit');
              setSelectedModel(record);
              setModelVisible(true);
            }}
          >
            编辑
          </Button>
        ),
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
      {
        title: '操作',
        width: 220,
        render: (_value, record) => (
          <Space size="mini">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleOpenEditRatio(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除该宽高比？"
              content="删除后无法恢复"
              onOk={() => handleDeleteRatio(record.id)}
            >
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                loading={deleteLoading === `ratio-${record.id}`}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deleteLoading]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryRes, modelRes, ratioRes, systemConfigRes] = await Promise.all([
        getAurakeyGalleryCategories(),
        getAurakeyOptionModels(),
        getAurakeyOptionRatios(),
        getAurakeyAdminSystemConfig(),
      ]);
      const systemConfig = normalizeSystemConfig(systemConfigRes.data.data);
      setCategories(categoryRes.data.data || []);
      setModels(modelRes.data.data || []);
      setRatios(ratioRes.data.data || []);
      systemForm.setFieldsValue({
        register_reward_points: systemConfig.register_reward_points,
        daily_sign_in_reward_points: systemConfig.daily_sign_in_reward_points,
        invite_reward_points: systemConfig.invite_reward_points,
        default_vip_valid_days: systemConfig.default_vip_valid_days,
        default_point_pack_valid_days: systemConfig.default_point_pack_valid_days,
        daily_free_points_reset_hour: systemConfig.daily_free_points_reset_hour,
        custom_json: stringifyCustomConfig(systemConfig.custom),
      });
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

  const handleSubmitCategory = async (values: AurakeyAdminGalleryCategoryPayload) => {
    setSubmitLoading('category');
    try {
      if (categoryMode === 'edit' && selectedCategory) {
        await updateAurakeyGalleryCategory(selectedCategory.id, values);
      } else {
        await createAurakeyGalleryCategory(values);
      }
      Message.success(categoryMode === 'edit' ? '分类已更新' : '分类已创建');
      setCategoryVisible(false);
      setSelectedCategory(undefined);
      await loadData();
    } finally {
      setSubmitLoading(null);
    }
  };

  const handleOpenCreateCategory = () => {
    setCategoryMode('create');
    setSelectedCategory(undefined);
    setCategoryVisible(true);
  };

  const handleOpenEditCategory = (category: AurakeyAdminGalleryCategory) => {
    setCategoryMode('edit');
    setSelectedCategory(category);
    setCategoryVisible(true);
  };

  const handleCloseCategoryModal = () => {
    setCategoryVisible(false);
    setSelectedCategory(undefined);
  };

  const handleDeleteCategory = async (id: string) => {
    setDeleteLoading(`category-${id}`);
    try {
      await deleteAurakeyGalleryCategory(id);
      Message.success('分类已删除');
      await loadData();
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCreateModel = async (values: AurakeyAdminOptionModelPayload) => {
    setSubmitLoading('model');
    try {
      await createAurakeyOptionModel(values);
      Message.success(modelMode === 'create' ? '模型已创建' : '模型已更新');
      setModelVisible(false);
      setSelectedModel(undefined);
      await loadData();
    } finally {
      setSubmitLoading(null);
    }
  };

  const handleOpenCreateModel = () => {
    setModelMode('create');
    setSelectedModel(undefined);
    setModelVisible(true);
  };

  const handleCloseModelModal = () => {
    setModelVisible(false);
    setSelectedModel(undefined);
  };

  const handleSubmitRatio = async (values: AurakeyAdminOptionRatioPayload) => {
    setSubmitLoading('ratio');
    try {
      if (ratioMode === 'edit' && selectedRatio) {
        await updateAurakeyOptionRatio(selectedRatio.id, values);
      } else {
        await createAurakeyOptionRatio(values);
      }
      Message.success(ratioMode === 'edit' ? '宽高比已更新' : '宽高比已创建');
      setRatioVisible(false);
      setSelectedRatio(undefined);
      await loadData();
    } finally {
      setSubmitLoading(null);
    }
  };

  const handleOpenCreateRatio = () => {
    setRatioMode('create');
    setSelectedRatio(undefined);
    setRatioVisible(true);
  };

  const handleOpenEditRatio = (ratio: AurakeyAdminOptionRatio) => {
    setRatioMode('edit');
    setSelectedRatio(ratio);
    setRatioVisible(true);
  };

  const handleCloseRatioModal = () => {
    setRatioVisible(false);
    setSelectedRatio(undefined);
  };

  const handleDeleteRatio = async (id: string) => {
    setDeleteLoading(`ratio-${id}`);
    try {
      await deleteAurakeyOptionRatio(id);
      Message.success('宽高比已删除');
      await loadData();
    } finally {
      setDeleteLoading(null);
    }
  };

  const parseCustomConfig = (value: string): Record<string, unknown> | null => {
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};

      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        Message.error('custom 必须是 JSON 对象');
        return null;
      }

      return parsed as Record<string, unknown>;
    } catch {
      Message.error('custom JSON 格式不正确');
      return null;
    }
  };

  const handleSaveSystemConfig = async () => {
    let values: SystemConfigFormValues;

    try {
      values = await systemForm.validate();
    } catch {
      return;
    }

    const custom = parseCustomConfig(values.custom_json);
    if (!custom) return;

    const payload: AurakeySystemConfigUpdatePayload = {
      register_reward_points: values.register_reward_points ?? null,
      daily_sign_in_reward_points: values.daily_sign_in_reward_points ?? null,
      invite_reward_points: values.invite_reward_points ?? null,
      default_vip_valid_days: values.default_vip_valid_days ?? null,
      default_point_pack_valid_days: values.default_point_pack_valid_days ?? null,
      daily_free_points_reset_hour: values.daily_free_points_reset_hour ?? null,
      custom,
    };

    setSubmitLoading('system');
    try {
      await updateAurakeyAdminSystemConfig(payload);
      Message.success('系统配置已保存');
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
                  <Button type="primary" icon={<IconPlus />} onClick={handleOpenCreateCategory}>
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
                  <Button type="primary" icon={<IconPlus />} onClick={handleOpenCreateModel}>
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
                  <Button type="primary" icon={<IconPlus />} onClick={handleOpenCreateRatio}>
                    新增宽高比
                  </Button>
                }
              >
                <Table rowKey="id" columns={ratioColumns} data={ratios} pagination={false} />
              </Card>
            </TabPane>

            <TabPane key="system" title="系统配置">
              <Card
                title="系统配置"
                bordered={false}
                extra={
                  <Button
                    type="primary"
                    icon={<IconSave />}
                    loading={submitLoading === 'system'}
                    onClick={() => void handleSaveSystemConfig()}
                  >
                    保存配置
                  </Button>
                }
              >
                <Form form={systemForm} layout="vertical" style={{ maxWidth: 720 }}>
                  <Form.Item
                    field="register_reward_points"
                    label="注册奖励算力"
                    rules={[{ required: true, message: '请输入注册奖励算力' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    field="daily_sign_in_reward_points"
                    label="签到奖励算力"
                    rules={[{ required: true, message: '请输入签到奖励算力' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    field="invite_reward_points"
                    label="邀请奖励算力"
                    rules={[{ required: true, message: '请输入邀请奖励算力' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    field="default_vip_valid_days"
                    label="默认会员有效期（天）"
                    rules={[{ required: true, message: '请输入默认会员有效期' }]}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    field="default_point_pack_valid_days"
                    label="默认点数包有效期（天）"
                  >
                    <InputNumber placeholder="留空则设置默认有效期为永久" min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    field="daily_free_points_reset_hour"
                    label="每日免费算力重置小时"
                    rules={[{ required: true, message: '请输入每日免费算力重置小时' }]}
                  >
                    <InputNumber min={0} max={24} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item field="custom_json" label="custom JSON（勿动）">
                    <Input.TextArea autoSize={{ minRows: 5, maxRows: 12 }} />
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>
          </Tabs>
        </Card>
      </Spin>

      <CategoryFormModal
        visible={categoryVisible}
        mode={categoryMode}
        category={selectedCategory}
        confirmLoading={submitLoading === 'category'}
        onCancel={handleCloseCategoryModal}
        onSubmit={handleSubmitCategory}
      />
      <ModelFormModal
        visible={modelVisible}
        mode={modelMode}
        model={selectedModel}
        confirmLoading={submitLoading === 'model'}
        onCancel={handleCloseModelModal}
        onSubmit={handleCreateModel}
      />
      <RatioFormModal
        visible={ratioVisible}
        mode={ratioMode}
        ratio={selectedRatio}
        confirmLoading={submitLoading === 'ratio'}
        onCancel={handleCloseRatioModal}
        onSubmit={handleSubmitRatio}
      />
    </Space>
  );
}
