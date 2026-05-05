import { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Grid, Space, Spin, Statistic, Typography } from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import { getAurakeyDashboardStats } from '../../api';
import type { AurakeyAdminStats } from '../../types';

const Row = Grid.Row;
const Col = Grid.Col;

const emptyStats: AurakeyAdminStats = {
  today_new_users: 0,
  today_active_users: 0,
  today_generations: 0,
  today_revenue: 0,
  revenue_growth_rate: 0,
};

function formatFen(value: number) {
  return `¥ ${(value / 100).toFixed(2)}`;
}

export default function AurakeyDashboardPage() {
  const [stats, setStats] = useState<AurakeyAdminStats>(emptyStats);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await getAurakeyDashboardStats();
      setStats(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Typography.Title heading={5} style={{ margin: 0 }}>
              AuraKey 仪表板
            </Typography.Title>
            <Typography.Paragraph style={{ margin: '8px 0 0', color: 'var(--color-text-2)' }}>
              统计来自 /api/v1/aurakey/admin/dashboard/stats。
            </Typography.Paragraph>
          </div>
          <Button icon={<IconRefresh />} onClick={() => void loadStats()} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </Card>

      <Spin loading={loading} style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="今日新增用户" value={stats.today_new_users} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="今日活跃用户" value={stats.today_active_users} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="今日生图次数" value={stats.today_generations} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="今日收入" value={formatFen(stats.today_revenue)} />
            </Card>
          </Col>
        </Row>
        <Card style={{ marginTop: 16 }}>
          <Descriptions
            column={2}
            data={[
              {
                label: '收入增长率',
                value: `${stats.revenue_growth_rate.toFixed(2)}%`,
              },
              {
                label: '管理权限要求',
                value: 'aurakey_admin / SUPER_ADMIN',
              },
            ]}
          />
        </Card>
      </Spin>
    </Space>
  );
}