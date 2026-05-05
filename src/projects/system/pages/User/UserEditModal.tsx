import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Message, Spin } from '@arco-design/web-react';
import { updateUserApi, assignUserRolesApi, type AdminUserListItem } from '@/core/api/user';
import { getRolesApi, type RoleResponse } from '@/core/api/role';

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
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        nickname: user.nickname,
        phone: user.phone,
        role_ids: user.roles?.map((r) => r.id) || [],
      });
      fetchRoles();
    }
  }, [visible, user, form]);

  const fetchRoles = async () => {
    setFetchingRoles(true);
    try {
      const res = await getRolesApi();
      setRoles(res.data.data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      const values = await form.validate();
      setLoading(true);

      await updateUserApi(user.id, {
        nickname: values.nickname,
        phone: values.phone,
      });

      await assignUserRolesApi(user.id, values.role_ids);

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
      <Spin loading={fetchingRoles}>
        <Form form={form} layout="vertical">
          <FormItem label="昵称" field="nickname">
            <Input placeholder="请输入昵称" />
          </FormItem>
          <FormItem label="手机号" field="phone">
            <Input placeholder="请输入手机号" />
          </FormItem>
          <FormItem label="角色分配" field="role_ids">
            <Select mode="multiple" placeholder="选择角色">
              {roles.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </FormItem>
        </Form>
      </Spin>
    </Modal>
  );
};

export default UserEditModal;
