import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Message, Spin } from '@arco-design/web-react';
import { assignUserRolesApi, type AdminUserListItem } from '@/core/api/user';
import { getRolesApi, type RoleResponse } from '@/core/api/role';

const FormItem = Form.Item;

interface UserRoleModalProps {
  visible: boolean;
  user: AdminUserListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserRoleModal: React.FC<UserRoleModalProps> = ({ visible, user, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
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

      await assignUserRolesApi(user.id, values.role_ids);

      Message.success('角色分配已更新');
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
      title="分配角色"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      unmountOnExit
    >
      <Spin loading={fetchingRoles}>
        <Form form={form} layout="vertical">
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

export default UserRoleModal;
