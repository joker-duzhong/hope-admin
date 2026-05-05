import { Form, Input, InputNumber, Modal, Select, Switch } from '@arco-design/web-react';
import type { AurakeyAdminOptionModelPayload } from '../types';

interface ModelFormModalProps {
  visible: boolean;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: AurakeyAdminOptionModelPayload) => Promise<void>;
}

export default function ModelFormModal({
  visible,
  confirmLoading,
  onCancel,
  onSubmit,
}: ModelFormModalProps) {
  const [form] = Form.useForm<AurakeyAdminOptionModelPayload>();

  const handleOk = async () => {
    const values = await form.validate();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="新增生图模型"
      visible={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={confirmLoading}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          cost: 10,
          is_vip_only: false,
          status: 'on',
        }}
      >
        <Form.Item field="model_id" label="模型标识" rules={[{ required: true, message: '请输入模型标识' }]}>
          <Input placeholder="例如：pro_v1" maxLength={60} />
        </Form.Item>
        <Form.Item field="name" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
          <Input placeholder="例如：专业版 v1.0" maxLength={60} />
        </Form.Item>
        <Form.Item field="cost" label="消耗算力" rules={[{ required: true, message: '请输入消耗算力' }]}>
          <InputNumber placeholder="每次生成消耗" min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item field="is_vip_only" label="仅限 VIP">
          <Switch checkedText="是" uncheckedText="否" />
        </Form.Item>
        <Form.Item field="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select placeholder="请选择状态">
            <Select.Option value="on">启用</Select.Option>
            <Select.Option value="off">停用</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}