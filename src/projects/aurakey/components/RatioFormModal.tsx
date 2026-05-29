import { useEffect } from 'react';
import { Form, Input, InputNumber, Modal, Select } from '@arco-design/web-react';
import type { AurakeyAdminOptionRatio, AurakeyAdminOptionRatioPayload } from '../types';

interface RatioFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  ratio?: AurakeyAdminOptionRatio;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: AurakeyAdminOptionRatioPayload) => Promise<void>;
}

export default function RatioFormModal({
  visible,
  mode,
  ratio,
  confirmLoading,
  onCancel,
  onSubmit,
}: RatioFormModalProps) {
  const [form] = Form.useForm<AurakeyAdminOptionRatioPayload>();

  useEffect(() => {
    if (!visible) return;

    if (mode === 'edit' && ratio) {
      form.setFieldsValue({
        ratio: ratio.ratio,
        sort: ratio.sort,
        status: ratio.status,
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({ sort: 0, status: 'on' });
  }, [visible, mode, ratio, form]);

  const handleOk = async () => {
    const values = await form.validate();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={mode === 'create' ? '新增宽高比' : '编辑宽高比'}
      visible={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={confirmLoading}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item field="ratio" label="宽高比" rules={[{ required: true, message: '请输入宽高比' }]}>
          <Input placeholder="例如：16:9" maxLength={20} />
        </Form.Item>
        <Form.Item field="sort" label="排序值" rules={[{ required: true, message: '请输入排序值' }]}>
          <InputNumber placeholder="数字越大越靠前" min={0} style={{ width: '100%' }} />
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
