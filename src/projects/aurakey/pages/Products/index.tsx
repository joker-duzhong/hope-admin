import { useEffect, useState } from "react";
import { Card, Table, Tag, Spin, Message, Button, Space, Popconfirm } from "@arco-design/web-react";
import { IconDelete, IconEdit } from "@arco-design/web-react/icon";
import { getAurakeyProducts, deleteAurakeyProduct } from "../../api";
import ProductFormModal from "../../components/ProductFormModal";
import type { AurakeyProduct } from "../../types";

export default function AurakeyProductsPage() {
  const [data, setData] = useState<AurakeyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<AurakeyProduct | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAurakeyProducts();
      if (res.data.data) {
        setData(res.data.data);
      }
    } catch (error) {
      Message.error("加载商品列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedProduct(undefined);
    setModalVisible(true);
  };

  const handleEdit = (product: AurakeyProduct) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAurakeyProduct(id);
      Message.success("删除成功");
      await loadData();
    } catch (error) {
      Message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "商品名称",
      dataIndex: "name",
      width: 180,
      render: (value: string, record: AurakeyProduct) => (
        <>
          <div>{value}</div>
          {record.tag && (
            <Tag
              color="orange"
              size="small"
            >
              {record.tag}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 100,
      render: (value: string) => <Tag color={value === "point_pack" ? "blue" : "green"}>{value === "point_pack" ? "算力包" : "会员"}</Tag>,
    },
    {
      title: "售价",
      dataIndex: "price",
      width: 120,
      render: (value: number) => <span>¥{(value / 100).toFixed(2)}</span>,
    },
    {
      title: "原价",
      dataIndex: "original_price",
      width: 120,
      render: (value: number | null) => (value ? <span style={{ textDecoration: "line-through", color: "#999" }}>¥{(value / 100).toFixed(2)}</span> : "-"),
    },
    {
      title: "算力点数",
      dataIndex: "point_amount",
      width: 100,
      render: (value: number) => (value > 0 ? `+${value}` : "-"),
    },
    {
      title: "赠送算力",
      dataIndex: "bonus_amount",
      width: 100,
      render: (value: number) => (value > 0 ? `+${value}` : "-"),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 180,
      render: (value: string) => new Date(value).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: AurakeyProduct) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            content="删除后无法恢复"
            onOk={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="商品列表"
      bordered={false}
      extra={
        <Button
          type="primary"
          onClick={handleCreate}
        >
          新增商品
        </Button>
      }
    >
      <Spin
        loading={loading}
        style={{ width: "100%" }}
      >
        <Table
          rowKey="id"
          columns={columns}
          data={data}
          pagination={false}
          border
          scroll={{ x: 1200 }}
        />
      </Spin>
      <ProductFormModal
        visible={modalVisible}
        mode={modalMode}
        product={selectedProduct}
        onClose={() => {
          setModalVisible(false);
          setSelectedProduct(undefined);
        }}
        onSuccess={() => {
          loadData();
        }}
      />
    </Card>
  );
}
