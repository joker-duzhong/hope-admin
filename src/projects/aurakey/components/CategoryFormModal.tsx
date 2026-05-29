import { useEffect } from 'react';
import { Form, Input, InputNumber, Modal } from '@arco-design/web-react';
import type { AurakeyAdminGalleryCategory, AurakeyAdminGalleryCategoryPayload } from '../types';

interface CategoryFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  category?: AurakeyAdminGalleryCategory;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: AurakeyAdminGalleryCategoryPayload) => Promise<void>;
}

export default function CategoryFormModal({
  visible,
  mode,
  category,
  confirmLoading,
  onCancel,
  onSubmit,
}: CategoryFormModalProps) {
  const [form] = Form.useForm<AurakeyAdminGalleryCategoryPayload>();

  useEffect(() => {
    if (!visible) return;

    if (mode === 'edit' && category) {
      form.setFieldsValue({
        name: category.name,
        sort: category.sort,
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({ sort: 0 });
  }, [visible, mode, category, form]);

  const handleOk = async () => {
    const values = await form.validate();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={mode === 'create' ? '新增图库分类' : '编辑图库分类'}
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
