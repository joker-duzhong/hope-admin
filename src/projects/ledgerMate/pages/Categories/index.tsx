import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Form,
  Image,
  Input,
  InputNumber,
  Message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Typography,
} from '@arco-design/web-react';
import type { TableColumnProps } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconPlus, IconUpload } from '@arco-design/web-react/icon';
import { uploadFiles } from '@/core/utils/upload';
import {
  createLedgerMateCategory,
  deleteLedgerMateCategory,
  getLedgerMateCategories,
  updateLedgerMateCategory,
} from '../../api';
import type { LedgerMateCategory, LedgerMateCategoryPayload, LedgerMateRecordType } from '../../types';

const typeLabels: Record<LedgerMateRecordType, string> = {
  expense: '支出',
  income: '收入',
};

const sortCategories = (items: LedgerMateCategory[]) =>
  [...items].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'zh-CN'));

export default function LedgerMateCategoriesPage() {
  const [categories, setCategories] = useState<LedgerMateCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LedgerMateCategory | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [form] = Form.useForm<LedgerMateCategoryPayload>();
  const iconInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await getLedgerMateCategories();
      setCategories(sortCategories(response.data.data || []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 页面初始化时从接口同步列表。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setIconUrl(null);
    form.resetFields();
    form.setFieldsValue({ record_type: 'expense', sort_order: 0, is_enabled: true, icon: null });
    setModalVisible(true);
  };

  const openEdit = (category: LedgerMateCategory) => {
    setEditingCategory(category);
    setIconUrl(category.icon || null);
    form.setFieldsValue({
      record_type: category.record_type,
      name: category.name,
      sort_order: category.sort_order,
      is_enabled: category.is_enabled,
      icon: category.icon || null,
    });
    setModalVisible(true);
  };

  const handleUploadIcon = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Message.warning('请选择图片文件');
      return;
    }

    setUploading(true);
    try {
      const resources = await uploadFiles(file);
      const url = resources[0]?.url;
      if (!url) throw new Error('上传结果缺少图片地址');
      setIconUrl(url);
      form.setFieldValue('icon', url);
      Message.success('图标上传成功');
    } catch {
      // uploadFiles 已统一提示错误。
    } finally {
      setUploading(false);
      if (iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    const values = await form.validate();
    setSaving(true);
    try {
      if (editingCategory) {
        await updateLedgerMateCategory(editingCategory.id, values);
        Message.success('分类已更新');
      } else {
        await createLedgerMateCategory(values);
        Message.success('分类已创建');
      }
      setModalVisible(false);
      await loadCategories();
    } finally {
      setSaving(false);
    }
  };

  const updateCategory = async (category: LedgerMateCategory, payload: Partial<LedgerMateCategoryPayload>) => {
    try {
      await updateLedgerMateCategory(category.id, payload);
      setCategories((items) =>
        sortCategories(items.map((item) => (item.id === category.id ? { ...item, ...payload } : item)))
      );
      Message.success('分类已更新');
    } catch {
      // request 已统一提示错误，保留当前列表状态。
    }
  };

  const columns: TableColumnProps<LedgerMateCategory>[] = [
      {
        title: '图标',
        dataIndex: 'icon',
        width: 72,
        render: (icon) =>
          icon ? <Image width={36} height={36} src={icon} alt="分类图标" preview /> : <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: '分类名称',
        dataIndex: 'name',
        render: (name, category) => (
          <Space>
            <span>{name}</span>
            {category.is_system && <Badge status="processing" text="预设" />}
          </Space>
        ),
      },
      {
        title: '收支类型',
        dataIndex: 'record_type',
        width: 110,
        render: (value: LedgerMateRecordType) => typeLabels[value] || value,
      },
      {
        title: '排序',
        dataIndex: 'sort_order',
        width: 130,
        render: (value: number, category) => (
            <InputNumber
            size="small"
            min={0}
            value={value}
            style={{ width: 90 }}
            onChange={(nextValue) => {
              if (typeof nextValue === 'number' && nextValue !== value) {
                void updateCategory(category, { sort_order: nextValue });
              }
            }}
          />
        ),
      },
      {
        title: '状态',
        dataIndex: 'is_enabled',
        width: 110,
        render: (enabled: boolean) => (enabled ? <Badge status="success" text="启用" /> : <Badge status="warning" text="停用" />),
      },
      {
        title: '操作',
        width: 210,
        render: (_value, category) => (
          <Space size="mini">
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEdit(category)}>
              编辑
            </Button>
            <Button
              type="text"
              size="small"
              onClick={() => void updateCategory(category, { is_enabled: !category.is_enabled })}
            >
              {category.is_enabled ? '停用' : '启用'}
            </Button>
            <Popconfirm title="确认删除该分类？" onOk={() => deleteCategory(category)}>
              <Button type="text" status="danger" size="small" icon={<IconDelete />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
  ];

  const deleteCategory = async (category: LedgerMateCategory) => {
    try {
      await deleteLedgerMateCategory(category.id);
      setCategories((items) => items.filter((item) => item.id !== category.id));
      Message.success('分类已删除');
    } catch {
      // request 已统一提示错误。
    }
  };

  return (
    <Card
      title="账伴分类管理"
      extra={
        <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
          新增分类
        </Button>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        data={categories}
        pagination={false}
        stripe
      />

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        visible={modalVisible}
        confirmLoading={saving || uploading}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalVisible(false)}
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <Form.Item field="record_type" label="收支类型" rules={[{ required: true, message: '请选择收支类型' }]}>
            <Select options={[{ label: '支出', value: 'expense' }, { label: '收入', value: 'income' }]} />
          </Form.Item>
          <Form.Item field="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input maxLength={30} placeholder="例如：餐饮" />
          </Form.Item>
          <Form.Item field="sort_order" label="排序值" rules={[{ required: true, message: '请输入排序值' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
          </Form.Item>
          <Form.Item field="is_enabled" label="状态" triggerPropName="checked">
            <Switch checkedText="启用" uncheckedText="停用" />
          </Form.Item>
          <Form.Item field="icon" label="分类图标">
            <Space>
              {iconUrl && <Image width={40} height={40} src={iconUrl} alt="分类图标" preview />}
              <Button icon={<IconUpload />} loading={uploading} onClick={() => iconInputRef.current?.click()}>
                上传图片
              </Button>
              <input
                ref={iconInputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => void handleUploadIcon(event.target.files?.[0])}
              />
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
