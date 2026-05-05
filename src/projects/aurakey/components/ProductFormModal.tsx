import { Modal, Form, Input, Select, InputNumber, Message } from '@arco-design/web-react';
import { useState } from 'react';
import type { AurakeyProduct, AurakeyProductCreatePayload, AurakeyProductUpdatePayload } from '../types';
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

  const handleOk = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      if (mode === 'create') {
        await createAurakeyProduct(values as AurakeyProductCreatePayload);
        Message.success('创建成功');
      } else if (mode === 'edit' && product) {
        await updateAurakeyProduct(product.id, values as AurakeyProductUpdatePayload);
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
        initialValues={
          mode === 'edit' && product
            ? {
                type: product.type,
                name: product.name,
                price: product.price,
                original_price: product.original_price,
                point_amount: product.point_amount,
                bonus_amount: product.bonus_amount,
                tag: product.tag,
              }
            : {}
        }
      >
        <Form.Item
          field="type"
          label="商品类型"
          rules={[{ required: true, message: '请选择商品类型' }]}
        >
          <Select placeholder="选择商品类型">
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
          rules={[{ required: true, message: '请输入算力点数' }]}
        >
          <InputNumber placeholder="例如：100" min={0} />
        </Form.Item>

        <Form.Item
          field="bonus_amount"
          label="赠送算力"
        >
          <InputNumber placeholder="例如：20" min={0} />
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
