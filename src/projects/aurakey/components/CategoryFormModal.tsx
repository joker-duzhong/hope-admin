import { Form, Input, InputNumber, Modal } from '@arco-design/web-react';
import type { AurakeyAdminGalleryCategoryPayload } from '../types';

interface CategoryFormModalProps {
  visible: boolean;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: AurakeyAdminGalleryCategoryPayload) => Promise<void>;
}

export default function CategoryFormModal({
  visible,
  confirmLoading,
  onCancel,
  onSubmit,
}: CategoryFormModalProps) {
  const [form] = Form.useForm<AurakeyAdminGalleryCategoryPayload>();

  const handleOk = async () => {
    const values = await form.validate();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="新增图库分类"
      visible={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={confirmLoading}
      unmountOnExit
    >
      <Form form={form} layout="vertical" initialValues={{ sort: 0 }}>
        <Form.Item field="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
          <Input placeholder="例如：风景" maxLength={30} />
        </Form.Item>
        <Form.Item field="sort" label="排序值" rules={[{ required: true, message: '请输入排序值' }]}>
          <InputNumber placeholder="数字越大越靠前" min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}