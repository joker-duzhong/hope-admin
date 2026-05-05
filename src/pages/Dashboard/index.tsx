import { useMemo } from 'react';
import { Card, Grid, Space, Statistic, Table, Tag, Typography } from '@arco-design/web-react';
import type { TableColumnProps } from '@arco-design/web-react';

const Row = Grid.Row;
const Col = Grid.Col;

interface DashboardOrderItem {
  orderNo: string;
  user: string;
  amount: number;
  status: 'success' | 'waiting' | 'failed';
  channel: 'wechat' | 'alipay';
  createdAt: string;
}

interface DashboardTaskItem {
  taskId: string;
  model: string;
  ratio: string;
  status: 'processing' | 'success' | 'failed';
  cost: number;
  progress: number;
}

const mockOverview = {
  totalUsers: 12984,
  dailyActiveUsers: 1832,
  todayRevenue: 286400,
  generationCount: 7421,
};

const mockOrders: DashboardOrderItem[] = [
  {
    orderNo: 'OD174801200000011',
    user: 'U-1024',
    amount: 9800,
    status: 'success',
    channel: 'wechat',
    createdAt: '2026-05-05 09:20:10',
  },
  {
    orderNo: 'OD174801200000012',
    user: 'U-2048',
    amount: 2900,
    status: 'waiting',
    channel: 'wechat',
    createdAt: '2026-05-05 09:22:45',
  },
  {
    orderNo: 'OD174801200000013',
    user: 'U-5261',
    amount: 1000,
    status: 'failed',
    channel: 'alipay',
    createdAt: '2026-05-05 09:23:11',
  },
  {
    orderNo: 'OD174801200000014',
    user: 'U-7788',
    amount: 5800,
    status: 'success',
    channel: 'wechat',
    createdAt: '2026-05-05 09:24:28',
  },
];

const mockTasks: DashboardTaskItem[] = [
  {
    taskId: 'TK-778899-01',
    model: 'pro_v1',
    ratio: '16:9',
    status: 'processing',
    cost: 10,
    progress: 66,
  },
  {
    taskId: 'TK-778899-02',
    model: 'premium_v2',
    ratio: '1:1',
    status: 'success',
    cost: 20,
    progress: 100,
  },
  {
    taskId: 'TK-778899-03',
    model: 'pro_v1',
    ratio: '9:16',
    status: 'failed',
    cost: 10,
    progress: 35,
  },
];

function formatFen(value: number) {
  return `¥ ${(value / 100).toFixed(2)}`;
}

function statusTag(status: string) {
  if (status === 'success') return <Tag color="green">成功</Tag>;
  if (status === 'waiting') return <Tag color="orange">待处理</Tag>;
  if (status === 'processing') return <Tag color="arcoblue">处理中</Tag>;
  return <Tag color="red">失败</Tag>;
}

export default function DashboardPage() {
  const orderColumns: TableColumnProps<DashboardOrderItem>[] = useMemo(
    () => [
      { title: '订单号', dataIndex: 'orderNo' },
      { title: '用户', dataIndex: 'user' },
      { title: '金额', dataIndex: 'amount', render: (value) => formatFen(value) },
      { title: '状态', dataIndex: 'status', render: (value) => statusTag(value) },
      { title: '渠道', dataIndex: 'channel' },
      { title: '时间', dataIndex: 'createdAt' },
    ],
    []
  );

  const taskColumns: TableColumnProps<DashboardTaskItem>[] = useMemo(
    () => [
      { title: '任务 ID', dataIndex: 'taskId' },
      { title: '模型', dataIndex: 'model' },
      { title: '宽高比', dataIndex: 'ratio' },
      { title: '状态', dataIndex: 'status', render: (value) => statusTag(value) },
      { title: '消耗', dataIndex: 'cost', render: (value) => `${value} 点` },
      { title: '进度', dataIndex: 'progress', render: (value) => `${value}%` },
    ],
    []
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Typography.Title heading={5} style={{ margin: 0 }}>
          平台仪表盘
        </Typography.Title>
        <Typography.Paragraph style={{ margin: '8px 0 0', color: 'var(--color-text-2)' }}>
          当前为前端 mock 数据展示，可在后续接入真实统计接口后无缝替换。
        </Typography.Paragraph>
      </Card>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="累计用户" value={mockOverview.totalUsers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="日活用户" value={mockOverview.dailyActiveUsers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="今日收入" value={formatFen(mockOverview.todayRevenue)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="今日生图量" value={mockOverview.generationCount} />
          </Card>
        </Col>
      </Row>

      <Card title="最新订单动态">
        <Table rowKey="orderNo" columns={orderColumns} data={mockOrders} pagination={false} />
      </Card>

      <Card title="生图任务监控">
        <Table rowKey="taskId" columns={taskColumns} data={mockTasks} pagination={false} />
      </Card>
    </Space>
  );
}