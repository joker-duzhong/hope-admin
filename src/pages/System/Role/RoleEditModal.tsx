import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Message, Switch } from '@arco-design/web-react';
import { createRoleApi, updateRoleApi, type RoleResponse, type RoleCreate } from '@/api/role';

const FormItem = Form.Item;

interface RoleEditModalProps {
  visible: boolean;
  role: RoleResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleEditModal: React.FC<RoleEditModalProps> = ({ visible, role, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!role;

  useEffect(() => {
    if (visible) {
      if (isEdit && role) {
        form.setFieldsValue({
          name: role.name,
          code: role.code,
          description: role.description,
          is_active: role.is_active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
    }
  }, [visible, role]);

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      
      if (isEdit && role) {
        await updateRoleApi(role.id, {
          name: values.name,
          description: values.description,
          is_active: values.is_active,
        });
        Message.success('角色已更新');
      } else {
        await createRoleApi({
          name: values.name,
          code: values.code,
          description: values.description,
          scope: 'admin', // Default scope
        } as RoleCreate);
        Message.success('角色已创建');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "编辑角色" : "新增角色"}
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <FormItem label="角色名称" field="name" rules={[{ required: true, message: '请输入角色名称' }]}>
          <Input placeholder="请输入角色名称" />
        </FormItem>
        <FormItem label="角色标识 (Code)" field="code" rules={[{ required: true, message: '请输入角色标识' }]}>
          <Input placeholder="请输入角色标识 (如: admin)" disabled={isEdit} />
        </FormItem>
        <FormItem label="描述" field="description">
          <Input.TextArea placeholder="请输入描述" autoSize />
        </FormItem>
        {isEdit && (
          <FormItem label="启用状态" field="is_active" triggerPropName="checked">
            <Switch />
          </FormItem>
        )}
      </Form>
    </Modal>
  );
};

export default RoleEditModal;
