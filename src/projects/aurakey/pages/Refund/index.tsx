import { Alert, Button, Card, Form, Input, Message, Space, Typography } from '@arco-design/web-react';
import { refundAurakeyOrder } from '../../api';
import type { AurakeyAdminRefundPayload } from '../../types';

const FormItem = Form.Item;

export default function AurakeyRefundPage() {
  const [refundForm] = Form.useForm<{ order_no: string; remark?: string }>();

  const handleRefundOrder = async () => {
    const values = await refundForm.validate();
    const payload: AurakeyAdminRefundPayload = {
      remark: values.remark || undefined,
    };
    const res = await refundAurakeyOrder(values.order_no, payload);
    const refundId = res.data.data.refund_id ? `，退款流水 ${res.data.data.refund_id}` : '';
    Message.success(`退款处理成功，扣回 ${res.data.data.deducted_points} 算力${refundId}`);
    refundForm.resetFields();
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Typography.Title heading={5} style={{ margin: 0 }}>
          AuraKey 订单退款
        </Typography.Title>
      </Card>

      <Card title="订单退款处理">
        <Form form={refundForm} layout="vertical">
          <FormItem field="order_no" label="订单号" rules={[{ required: true, message: '请输入订单号' }]}>
            <Input placeholder="例如：OD17480000000012ab" />
          </FormItem>
          <FormItem field="remark" label="退款备注">
            <Input.TextArea placeholder="例如：用户投诉，申请退款" maxLength={120} />
          </FormItem>
          <Button type="primary" status="warning" onClick={() => void handleRefundOrder()}>
            发起退款
          </Button>
        </Form>
        <Alert
          type="warning"
          style={{ marginTop: 16 }}
          content="退款接口会同步扣回算力赠送，提交前请先在线下确认订单状态与退款原因。"
        />
      </Card>
    </Space>
  );
}