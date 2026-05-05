import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Message } from '@arco-design/web-react';
import { updateUserApi, type AdminUserListItem } from '@/core/api/user';

const FormItem = Form.Item;

interface UserEditModalProps {
  visible: boolean;
  user: AdminUserListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ visible, user, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        nickname: user.nickname,
        phone: user.phone,
      });
    }
  }, [visible, user, form]);

  const handleSubmit = async () => {
    if (!user) return;
    try {
      const values = await form.validate();
      setLoading(true);

      await updateUserApi(user.id, {
        nickname: values.nickname,
        phone: values.phone,
      });

      Message.success('用户信息已更新');
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
      title="编辑用户信息"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <FormItem label="昵称" field="nickname">
          <Input placeholder="请输入昵称" />
        </FormItem>
        <FormItem label="手机号" field="phone">
          <Input placeholder="请输入手机号" />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default UserEditModal;
