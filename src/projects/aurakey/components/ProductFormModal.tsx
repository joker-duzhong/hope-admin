import { Modal, Form, Input, Select, InputNumber, Message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import type { AurakeyProduct, AurakeyProductCreatePayload, AurakeyProductType, AurakeyProductUpdatePayload } from '../types';
import { createAurakeyProduct, updateAurakeyProduct } from '../api';

interface ProductFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  product?: AurakeyProduct;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductFormModal({ visible, mode, product, onClose, onSuccess }: ProductFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState<AurakeyProductType>('point_pack');

  useEffect(() => {
    if (!visible) return;

    if (mode === 'edit' && product) {
      setProductType(product.type);
      form.setFieldsValue({
        type: product.type,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        point_amount: product.point_amount,
        bonus_amount: product.bonus_amount,
        tag: product.tag,
        vip_type: product.vip_type,
        vip_level: product.vip_level,
        valid_days: product.valid_days,
      });
    } else {
      form.resetFields();
      setProductType('point_pack');
      form.setFieldsValue({
        type: 'point_pack',
        point_amount: 0,
        bonus_amount: 0,
        vip_level: 0,
      });
    }
  }, [visible, mode, product, form]);

  const normalizePayload = (values: AurakeyProductCreatePayload): AurakeyProductCreatePayload => {
    const payload: AurakeyProductCreatePayload = {
      ...values,
      original_price: values.original_price ?? null,
      tag: values.tag || null,
      valid_days: values.valid_days ?? null,
      point_amount: values.point_amount ?? 0,
      bonus_amount: values.bonus_amount ?? 0,
      vip_level: values.vip_level ?? 0,
    };

    if (payload.type === 'vip') {
      return {
        ...payload,
        vip_type: payload.vip_type || null,
      };
    }

    return {
      ...payload,
      vip_type: null,
      vip_level: 0,
    };
  };

  const handleOk = async () => {
    try {
      const values = await form.validate();
      const payload = normalizePayload(values as AurakeyProductCreatePayload);
      setLoading(true);

      if (mode === 'create') {
        await createAurakeyProduct(payload);
        Message.success('创建成功');
      } else if (mode === 'edit' && product) {
        await updateAurakeyProduct(product.id, payload as AurakeyProductUpdatePayload);
        Message.success('更新成功');
      }

      onSuccess();
      onClose();
      form.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        Message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title={mode === 'create' ? '新增商品' : '编辑商品'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          field="type"
          label="商品类型"
          rules={[{ required: true, message: '请选择商品类型' }]}
        >
          <Select
            placeholder="选择商品类型"
            onChange={(value) => setProductType(value as AurakeyProductType)}
          >
            <Select.Option value="point_pack">算力包</Select.Option>
            <Select.Option value="vip">会员</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          field="name"
          label="商品名称"
          rules={[{ required: true, message: '请输入商品名称' }]}
        >
          <Input placeholder="例如：100点算力包" />
        </Form.Item>

        <Form.Item
          field="price"
          label="售价（分）"
          rules={[{ required: true, message: '请输入售价' }]}
        >
          <InputNumber placeholder="例如：1000（表示10元）" min={0} />
        </Form.Item>

        <Form.Item
          field="original_price"
          label="原价（分）"
        >
          <InputNumber placeholder="可选，用于显示划线价" min={0} />
        </Form.Item>

        <Form.Item
          field="point_amount"
          label="算力点数"
          rules={productType === 'point_pack' ? [{ required: true, message: '请输入算力点数' }] : undefined}
        >
          <InputNumber placeholder="例如：100" min={0} />
        </Form.Item>

        <Form.Item
          field="bonus_amount"
          label="赠送算力"
        >
          <InputNumber placeholder="例如：20" min={0} />
        </Form.Item>

        {productType === 'vip' && (
          <>
            <Form.Item
              field="vip_type"
              label="会员类型"
              rules={[{ required: true, message: '请输入会员类型' }]}
            >
              <Input placeholder="例如：普通会员、月度会员" maxLength={40} />
            </Form.Item>

            <Form.Item
              field="vip_level"
              label="会员等级"
              rules={[{ required: true, message: '请输入会员等级' }]}
            >
              <InputNumber placeholder="数字越大等级越高" min={0} />
            </Form.Item>
          </>
        )}

        <Form.Item
          field="valid_days"
          label="权益有效期（天）"
        >
          <InputNumber placeholder="留空则使用系统默认有效期" min={1} />
        </Form.Item>

        <Form.Item
          field="tag"
          label="标签（可选）"
        >
          <Input placeholder="例如：限时特惠、推荐" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
