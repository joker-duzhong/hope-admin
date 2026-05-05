import { Alert, Button, Card, Form, Input, InputNumber, Message, Select, Space, Typography } from '@arco-design/web-react';
import { adjustAurakeyUserBalance, updateAurakeyUserStatus } from '../../api';
import type { AurakeyAdminAdjustBalancePayload, AurakeyAdminUserStatusPayload } from '../../types';

const FormItem = Form.Item;

export default function AurakeyUserOpsPage() {
  const [balanceForm] = Form.useForm<AurakeyAdminAdjustBalancePayload>();
  const [statusForm] = Form.useForm<{ user_id: string; status: AurakeyAdminUserStatusPayload['status'] }>();

  const handleAdjustBalance = async () => {
    const values = await balanceForm.validate();
    const res = await adjustAurakeyUserBalance(values);
    Message.success(`余额调整成功，最新余额 ${res.data.data.balance_after}`);
    balanceForm.resetFields();
  };

  const handleUpdateStatus = async () => {
    const values = await statusForm.validate();
    const res = await updateAurakeyUserStatus(values.user_id, { status: values.status });
    Message.success(`用户状态已更新为 ${res.data.data.currentStatus === 'banned' ? '封禁' : '正常'}`);
    statusForm.resetFields();
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Typography.Title heading={5} style={{ margin: 0 }}>
          AuraKey 用户处理
        </Typography.Title>
      </Card>

      <Space size={16} wrap style={{ width: '100%', alignItems: 'stretch' }}>
        <Card title="调整用户余额" style={{ flex: 1, minWidth: 360 }}>
          <Form form={balanceForm} layout="vertical">
            <FormItem field="user_id" label="用户 ID" rules={[{ required: true, message: '请输入用户 ID' }]}>
              <Input placeholder="请输入 UUID" />
            </FormItem>
            <FormItem field="amount" label="调整数量" rules={[{ required: true, message: '请输入调整数量' }]}>
              <InputNumber placeholder="正数增加，负数扣减" style={{ width: '100%' }} />
            </FormItem>
            <FormItem field="remark" label="备注">
              <Input.TextArea placeholder="例如：补偿异常消耗" maxLength={100} />
            </FormItem>
            <Button type="primary" onClick={() => void handleAdjustBalance()}>
              提交调整
            </Button>
          </Form>
        </Card>

        <Card title="更新用户状态" style={{ flex: 1, minWidth: 360 }}>
          <Form form={statusForm} layout="vertical" initialValues={{ status: 'normal' }}>
            <FormItem field="user_id" label="用户 ID" rules={[{ required: true, message: '请输入用户 ID' }]}>
              <Input placeholder="请输入 UUID" />
            </FormItem>
            <FormItem field="status" label="目标状态" rules={[{ required: true, message: '请选择目标状态' }]}>
              <Select placeholder="请选择目标状态">
                <Select.Option value="normal">正常</Select.Option>
                <Select.Option value="banned">封禁</Select.Option>
              </Select>
            </FormItem>
          </Form>
          <Space>
            <Button onClick={() => statusForm.setFieldValue('status', 'normal')}>设为正常</Button>
            <Button status="warning" onClick={() => statusForm.setFieldValue('status', 'banned')}>
              设为封禁
            </Button>
            <Button type="primary" onClick={() => void handleUpdateStatus()}>
              更新状态
            </Button>
          </Space>
          <Alert
            type="info"
            style={{ marginTop: 16 }}
            content="当前文档未提供用户列表查询接口，此页按用户 ID 直接处理。"
          />
        </Card>
      </Space>
    </Space>
  );
}