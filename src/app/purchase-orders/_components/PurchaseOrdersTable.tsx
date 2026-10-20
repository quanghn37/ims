import { useMemo } from "react";
import { Button, Input, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  IconSettings,
  IconSearch,
  IconRefresh,
  IconPlus,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import { ContractItem } from "@/types";
import ResizableTitle from "@/components/table/ResizableTitle";
import { parseDateSafe } from "./types";
import { usePersistedColumnWidths } from "@/lib/table-utils";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;
type PaginationState = { current: number; pageSize: number; total: number };

interface PurchaseOrdersTableProps {
  filteredOrders: ContractItem[];
  loading: boolean;
  pagination: PaginationState;
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  storageKey: string;
  onRefresh: (page: number, pageSize: number) => void;
  onCreate: () => void;
  onEdit: (record: ContractItem) => void;
  onDelete: (contractId: ContractItem["ContractId"]) => void;
}

export default function PurchaseOrdersTable({
  filteredOrders,
  loading,
  pagination,
  searchKeyword,
  setSearchKeyword,
  storageKey,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: PurchaseOrdersTableProps) {
  const { t } = useTranslation();

  const initialColumns = useMemo(() => [
    {
      title: t.purchaseOrder.orderCode,
      dataIndex: "ContractCode",
      key: "ContractCode",
      width: 160,
      render: (val: any, record: ContractItem) => (
        <span
          onClick={() => onEdit(record)}
          style={{
            cursor: "pointer",
            fontWeight: 600,
            color: "#7C3AED",
            fontFamily: "monospace",
            fontSize: 13,
          }}
          title="Nhấp đúp hoặc bấm để xem chi tiết"
        >
          {val || "---"}
        </span>
      ),
    },
    {
      title: t.purchaseOrder.orderDesc,
      dataIndex: "Description",
      key: "Description",
      width: 260,
      render: (val: string) => (
        <span style={{ fontWeight: 500, color: "#0F172A", fontSize: 13 }}>
          {val || "Đơn đặt hàng vật tư & thiết bị"}
        </span>
      ),
    },
    {
      title: t.purchaseOrder.vendor,
      key: "Venname",
      width: 220,
      render: (_: any, record: any) => (
        <span style={{ color: "#0F172A", fontSize: 13 }}>
          {record.Venname || record.ClientId || "---"}
        </span>
      ),
    },
    {
      title: t.purchaseOrder.mainContract,
      key: "ParentId",
      width: 180,
      render: (_: any, record: any) => {
        const text =
          record.ParentContractCode ||
          record.ParentCode ||
          record.SubconCode ||
          record.ContractRefCode ||
          (record.ParentId ? String(record.ParentId) : "");
        const clean = text ? String(text).replace(/^#+/, "").trim() : "";
        return clean ? (
          <span style={{ color: "#0F172A", fontSize: 13 }}>{clean}</span>
        ) : (
          <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>
        );
      },
    },
    {
      title: t.purchaseOrder.priceList,
      key: "SourceId",
      width: 180,
      render: (_: any, record: any) => {
        const text =
          record.SourceContractCode ||
          record.SourceCode ||
          record.QuotationCode ||
          (record.SourceId ? String(record.SourceId) : "");
        const clean = text ? String(text).replace(/^#+/, "").trim() : "";
        return clean ? (
          <span style={{ color: "#0F172A", fontSize: 13 }}>{clean}</span>
        ) : (
          <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>
        );
      },
    },
    {
      title: t.purchaseOrder.deliveryWarehouse,
      dataIndex: "WarehouseName",
      key: "WarehouseName",
      width: 210,
      render: (val: any, record: any) => {
        const text = val || record.WarehouseName || (record.WarehouseId ? `Kho #${record.WarehouseId}` : "");
        return text ? (
          <span style={{ color: "#0F172A", fontSize: 13 }}>{text}</span>
        ) : (
          <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>
        );
      },
    },
    {
      title: t.purchaseOrder.orderDate,
      key: "ContractDate",
      width: 130,
      render: (_: any, record: ContractItem) => {
        const raw = record.ContractDate || record.Contractdate || record.FromDate;
        const date = parseDateSafe(raw);
        return (
          <span style={{ color: "#64748B", fontSize: 13, whiteSpace: "nowrap" }}>
            {date ? date.format("DD/MM/YYYY") : raw || "---"}
          </span>
        );
      },
    },
    {
      title: t.purchaseOrder.deliveryDate,
      key: "DeliveryDate",
      width: 130,
      render: (_: any, record: any) => {
        const raw = record.DeliveryDate || record.Deliverydate || record.ToDate;
        const date = parseDateSafe(raw);
        return (
          <span style={{ color: "#64748B", fontSize: 13, whiteSpace: "nowrap" }}>
            {date ? date.format("DD/MM/YYYY") : raw || "---"}
          </span>
        );
      },
    },
    {
      title: t.table.creator,
      dataIndex: "CreatedBy",
      key: "CreatedBy",
      width: 120,
      render: (val: string) => (
        <span style={{ color: "#64748B", fontSize: 13 }}>{val || "Hệ thống"}</span>
      ),
    },
    {
      title: (
        <Tooltip title={t.table.action}>
          <IconSettings size={15} strokeWidth={1.8} style={{ color: "#94A3B8" }} />
        </Tooltip>
      ),
      key: "action",
      width: 75,
      fixed: "right" as const,
      align: "center" as const,
      onCell: () => ({ style: { padding: "4px 2px", whiteSpace: "nowrap" } }),
      render: (_: any, record: ContractItem) => (
        <Space size={6} wrap={false}>
          <ActionIconButton
            action="edit"
            size="small"
            tooltip="Chỉnh sửa đơn hàng"
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title={t.common.deleteConfirmTitle}
            description={t.common.deleteConfirmDesc}
            onConfirm={() => onDelete(record.ContractId)}
            okText={t.common.delete}
            cancelText={t.common.cancel}
            okButtonProps={{ danger: true }}
          >
            <ActionIconButton
              action="delete"
              size="small"
              tooltip="Xóa đơn hàng"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ], [onEdit, onDelete, t]);

  const { columns, handleResizeColumn } = usePersistedColumnWidths(initialColumns, storageKey);

  const mergedColumns = columns.map((column, index) => {
    const isAction = column.key === "action";
    return {
      ...column,
      width: isAction ? 60 : column.width,
      onHeaderCell: (headerColumn: any) => ({
        width: isAction ? 60 : headerColumn.width,
        onResize: isAction ? undefined : handleResizeColumn(index),
        style: isAction ? ({ padding: "4px 2px", textAlign: "center" } as React.CSSProperties) : undefined,
      }),
    };
  });

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "16px 24px",
        minHeight: "calc(100vh - 110px)",
        boxSizing: "border-box",
      }}
    >
      {/* STYLE OVERRIDES DÀNH CHO BẢNG DANH SÁCH ĐƠN HÀNG */}
      <style>{`
        .po-main-table .ant-table {
          font-family: inherit;
        }
        .po-main-table .ant-table-thead > tr > th {
          background-color: #F8FAFC !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 10px 12px !important;
        }
        .po-main-table .ant-table-tbody > tr > td {
          color: #0F172A !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .po-main-table .ant-table-container {
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .po-main-table .ant-pagination .ant-pagination-item-active {
          border-color: #7C3AED !important;
          background-color: #7C3AED !important;
        }
        .po-main-table .ant-pagination .ant-pagination-item-active a {
          color: #FFFFFF !important;
        }
      `}</style>

      {/* TOOLBAR HEADER: TIÊU ĐỀ + TÌM KIẾM + LÀM MỚI + TẠO ĐƠN HÀNG */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text strong style={{ fontSize: 18, color: "#7C3AED", fontWeight: 700, lineHeight: "28px" }}>
            {t.pageTitles.purchaseOrders}
          </Text>
          <Tag
            style={{
              background: "#EDE9FE",
              color: "#7C3AED",
              borderRadius: 12,
              border: "none",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: "16px",
              padding: "2px 8px",
              margin: 0,
            }}
          >
            {pagination.total} {t.table.records}
          </Tag>
        </div>

        <Space size={10}>
          <Input
            placeholder={t.purchaseOrder.searchPlaceholder}
            prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            style={{
              width: 240,
              height: 36,
              borderRadius: 8,
              borderColor: "#E2E8F0",
              fontSize: 14,
              color: "#0F172A",
            }}
          />
          <Button
            icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: "#7C3AED" }} />}
            onClick={() => onRefresh(pagination.current, pagination.pageSize)}
            style={{
              height: 36,
              borderRadius: 8,
              borderColor: "#E2E8F0",
              background: "#FFFFFF",
              color: "#334155",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {t.common.refresh}
          </Button>
          <Button
            type="primary"
            icon={<IconPlus size={16} strokeWidth={2} />}
            style={{
              background: "#7C3AED",
              borderColor: "#7C3AED",
              height: 36,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "#FFFFFF",
            }}
            onClick={onCreate}
          >
            {t.common.createOrder}
          </Button>
        </Space>
      </div>

      {/* BẢNG DỮ LIỆU ĐƠN HÀNG */}
      <Table
        className="po-main-table"
        components={{ header: { cell: ResizableTitle } }}
        dataSource={filteredOrders}
        columns={mergedColumns}
        rowKey={(record, index) => record.ContractId ?? record.ContractCode ?? `po_${index}`}
        loading={loading}
        scroll={{ x: 1400 }}
        onRow={(record) => ({ onDoubleClick: () => onEdit(record) })}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => onRefresh(page, pageSize),
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.table.records}`,
        }}
      />
    </div>
  );
}