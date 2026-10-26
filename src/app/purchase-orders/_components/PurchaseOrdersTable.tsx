import React, { useMemo, useState, useEffect } from "react";
import { Button, Input, Popover, Space, Table, Tag, Typography } from "antd";
import {
  IconSearch,
  IconRefresh,
  IconPlus,
  IconCircleX,
} from "@tabler/icons-react";
import { ContractItem } from "@/types";
import ResizableTitle from "@/components/table/ResizableTitle";
import { parseDateSafe } from "./types";
import { usePersistedColumnWidths } from "@/lib/table-utils";
import { useTranslation } from "@/locales/LanguageContext";
import { purchaseOrderColumnFields } from "../_hooks/usePurchaseOrders";
import ColumnFilterDropdown from "@/components/table/ColumnFilterDropdown";
import { ApprovalBadge } from "@/components/common/ApprovalBadge";

const { Text } = Typography;
type PaginationState = { current: number; pageSize: number; total: number };

interface PurchaseOrdersTableProps {
  filteredOrders: ContractItem[];
  loading: boolean;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  columnFilters: Record<string, string>;
  setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  columnSuggestions: Record<string, string[]>;
  isFiltering: boolean;
  storageKey: string;
  onRefresh: (page: number, pageSize: number) => void;
  onCreate: () => void;
  onEdit: (record: ContractItem) => void;
  onDelete?: (contractId: ContractItem["ContractId"]) => void;
}

export default function PurchaseOrdersTable({
  filteredOrders,
  loading,
  pagination,
  setPagination,
  searchKeyword,
  setSearchKeyword,
  columnFilters,
  setColumnFilters,
  columnSuggestions,
  isFiltering,
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
      render: (val: any, record: ContractItem) => {
        const code = val || (record as any).Contractcode || (record as any).Code;
        if (!code) return <span>---</span>;
        return (
          <a
            href={`/purchase-orders?id=${record.ContractId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              onEdit(record);
            }}
            style={{
              cursor: "pointer",
              fontWeight: 600,
              color: "#008f89",
              fontFamily: "monospace",
              fontSize: 13,
              textDecoration: "none",
            }}
            title="Mở chi tiết đơn hàng trong tab mới"
          >
            {code}
          </a>
        );
      },
    },
    {
      title: t.purchaseOrder.orderDesc,
      dataIndex: "Description",
      key: "Description",
      width: 260,
      render: (val: string) => (
        <span style={{ color: "#123443", fontSize: 13 }}>
          {val || "Đơn đặt hàng vật tư & thiết bị"}
        </span>
      ),
    },
    {
      title: t.purchaseOrder.vendor,
      dataIndex: "Venname",
      key: "Venname",
      width: 220,
      render: (_: any, record: any) => (
        <span style={{ color: "#123443", fontSize: 13 }}>
          {record.Venname || record.ClientName || record.ClientId || "---"}
        </span>
      ),
    },
    {
      title: t.purchaseOrder.mainContract,
      dataIndex: "ParentId",
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
          <span style={{ color: "#123443", fontSize: 13 }}>{clean}</span>
        ) : (
          <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>
        );
      },
    },
    {
      title: t.purchaseOrder.priceList,
      dataIndex: "SourceId",
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
          <span style={{ color: "#123443", fontSize: 13 }}>{clean}</span>
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
          <span style={{ color: "#123443", fontSize: 13 }}>{text}</span>
        ) : (
          <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>
        );
      },
    },
    {
      title: t.purchaseOrder.orderDate,
      dataIndex: "ContractDate",
      key: "ContractDate",
      width: 130,
      render: (_: any, record: ContractItem) => {
        const raw = record.ContractDate || record.Contractdate || record.FromDate;
        const date = parseDateSafe(raw);
        return (
          <span style={{ color: "#718894", fontSize: 13, whiteSpace: "nowrap" }}>
            {date ? date.format("DD/MM/YYYY") : raw || "---"}
          </span>
        );
      },
    },
    {
      title: t.purchaseOrder.deliveryDate,
      dataIndex: "DeliveryDate",
      key: "DeliveryDate",
      width: 130,
      render: (_: any, record: any) => {
        const raw = record.DeliveryDate || record.Deliverydate || record.ToDate;
        const date = parseDateSafe(raw);
        return (
          <span style={{ color: "#718894", fontSize: 13, whiteSpace: "nowrap" }}>
            {date ? date.format("DD/MM/YYYY") : raw || "---"}
          </span>
        );
      },
    },
    {
      title: t.table.status,
      dataIndex: "StatusName",
      key: "StatusName",
      width: 120,
      align: "center" as const,
      render: (val: string, r: any) => {
        const raw = val ?? r.Status ?? r.StatusCode ?? "";
        return <ApprovalBadge val={raw} record={r} />;
      },
    },
    {
      title: t.table.creator,
      dataIndex: "CreatedBy",
      key: "CreatedBy",
      width: 120,
      render: (val: string) => (
        <span style={{ color: "#718894", fontSize: 13 }}>{val || "Hệ thống"}</span>
      ),
    },
    {
      key: "_spacer",
      title: "",
      width: undefined,
      render: () => null,
    },
  ], [onEdit, t]);

  const { columns, handleResizeColumn } = usePersistedColumnWidths(initialColumns, storageKey);

  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<{ bottom: number; left: number; width: number } | null>(null);

  const activeColumnMeta = useMemo(() => {
    if (!openFilterKey) return null;
    const col = initialColumns.find((c) => (c.key || c.dataIndex) === openFilterKey);
    const label = typeof col?.title === "string" ? col.title : openFilterKey;
    const suggestions = columnSuggestions[openFilterKey] || [];
    return { label, suggestions };
  }, [openFilterKey, initialColumns, columnSuggestions]);

  useEffect(() => {
    if (!openFilterKey) return;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest(".ant-popover")
      ) {
        return;
      }
      setOpenFilterKey(null);
      setAnchorRect(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [openFilterKey]);

  const mergedColumns = useMemo(() => columns.map((column, index) => {
    const key = column.key || column.dataIndex;
    if (key === "_spacer") {
      return {
        key: "_spacer",
        title: "",
        width: undefined,
        render: () => null,
      };
    }
    const initialColumn = initialColumns[index];
    const searchable = key && purchaseOrderColumnFields[key];
    const isAction = key === "action";
    const onHeaderCell = (headerColumn: any) => ({
      width: isAction ? 75 : headerColumn.width,
      onResize: isAction ? undefined : handleResizeColumn(index),
      style: isAction ? ({ padding: "4px 2px", textAlign: "center" } as React.CSSProperties) : undefined,
    });
    const colWidth = isAction ? 75 : column.width;
    if (!searchable) return { ...column, width: colWidth, onHeaderCell };
    const activeValue = columnFilters[key] || "";
    const rawTitle = typeof initialColumn?.title === "string" ? initialColumn.title : key;
    const titleNode = (
      <span
        className="column-title-clickable"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setAnchorRect({
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
          });
          setOpenFilterKey((prev) => (prev === key ? null : key));
        }}
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: activeValue ? "#008f89" : "inherit",
          fontWeight: activeValue ? 600 : "inherit",
          userSelect: "none",
        }}
        title={`Bấm để tìm kiếm / lọc theo ${rawTitle}`}
      >
        <span>{rawTitle}</span>
        {activeValue && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#008f89",
              flexShrink: 0,
            }}
            title={`Đang lọc: "${activeValue}"`}
          />
        )}
      </span>
    );

    return {
      ...column,
      width: colWidth,
      title: titleNode,
      onHeaderCell,
    };
  }), [columns, initialColumns, columnFilters, handleResizeColumn]);

  const scrollX = useMemo(() => {
    return mergedColumns.reduce((sum, col) => {
      if (col.key === "_spacer") return sum;
      return sum + (Number(col.width) || 130);
    }, 0);
  }, [mergedColumns]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: 0,
        minHeight: "calc(100vh - 100px)",
        boxSizing: "border-box",
      }}
    >
      {/* STYLE OVERRIDES DÀNH CHO BẢNG DANH SÁCH ĐƠN HÀNG */}
      <style>{`
        .po-main-table .ant-table {
          font-family: inherit;
        }
        .po-main-table .ant-table-thead > tr > th {
          background-color: #f7fbfa !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
        }
        .po-main-table .column-title-clickable {
          transition: color 0.15s ease;
        }
        .po-main-table .ant-table-thead > tr > th:hover .column-title-clickable {
          color: #008f89 !important;
        }
        .po-main-table .ant-table-tbody > tr > td {
          color: #123443 !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .po-main-table .ant-table-container {
          border: 1px solid #dce5e6 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .po-main-table .ant-pagination .ant-pagination-item-active {
          border-color: #008f89 !important;
          background-color: #008f89 !important;
        }
        .po-main-table .ant-pagination .ant-pagination-item-active a {
          color: #FFFFFF !important;
        }
      `}</style>

      {/* TOOLBAR HEADER: TÌM KIẾM + LÀM MỚI + TẠO ĐƠN HÀNG */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Input
            placeholder={t.purchaseOrder.searchPlaceholder}
            prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            allowClear
            style={{
              width: 280,
              height: 36,
              borderRadius: 8,
              borderColor: "#dce5e6",
              fontSize: 13.5,
              color: "#123443",
            }}
          />
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {t.common.total || "Tổng"}: <strong style={{ color: "#008f89" }}>{isFiltering ? filteredOrders.length : pagination.total}</strong> {t.table.records || "đơn hàng"}
          </span>
          {isFiltering && (
            <Button
              icon={<IconCircleX size={15} strokeWidth={1.8} style={{ color: "#EF4444" }} />}
              onClick={() => { setSearchKeyword(""); setColumnFilters({}); }}
              style={{
                height: 32,
                borderRadius: 6,
                borderColor: "#FED7AA",
                background: "#FFF7ED",
                color: "#F97316",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {t.common.clearFilter}
            </Button>
          )}
        </div>

        <Space size={10}>
          <Button
            icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={() => onRefresh(pagination.current, pagination.pageSize)}
            style={{
              height: 36,
              borderRadius: 8,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            {t.common.refresh}
          </Button>
          <Button
            type="primary"
            icon={<IconPlus size={16} strokeWidth={2} />}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 36,
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 500,
              color: "#FFFFFF",
              boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
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
        tableLayout="fixed"
        components={{ header: { cell: ResizableTitle } }}
        dataSource={filteredOrders}
        columns={mergedColumns}
        rowKey={(record, index) => record.ContractId ?? record.ContractCode ?? `po_${index}`}
        loading={loading}
        scroll={{ x: scrollX, y: "calc(100vh - 215px)" }}
        onRow={(record) => ({ onDoubleClick: () => onEdit(record) })}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: isFiltering ? filteredOrders.length : pagination.total,
          onChange: (page, pageSize) => isFiltering
            ? setPagination((previous) => ({ ...previous, current: page, pageSize }))
            : onRefresh(page, pageSize),
          showSizeChanger: true,
          pageSizeOptions: ["100", "200", "500", "1000"],
          showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.table.records}`,
        }}
      />

      {/* SINGLE POPOVER DUY NHẤT NGOÀI TABLE */}
      <Popover
        open={Boolean(openFilterKey && anchorRect)}
        onOpenChange={(visible) => {
          if (!visible) {
            setOpenFilterKey(null);
            setAnchorRect(null);
          }
        }}
        trigger={[]}
        placement="bottomLeft"
        overlayStyle={{ zIndex: 1050 }}
        content={
          openFilterKey && activeColumnMeta ? (
            <ColumnFilterDropdown
              colKey={openFilterKey}
              label={activeColumnMeta.label}
              value={columnFilters[openFilterKey] || ""}
              suggestions={activeColumnMeta.suggestions}
              close={() => {
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
              onApply={(val) => {
                const trimmed = val ? val.trim() : "";
                setColumnFilters((previous) => {
                  if (!trimmed) {
                    const next = { ...previous };
                    delete next[openFilterKey];
                    return next;
                  }
                  return { ...previous, [openFilterKey]: trimmed };
                });
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
              onClear={() => {
                setColumnFilters((previous) => {
                  const next = { ...previous };
                  delete next[openFilterKey];
                  return next;
                });
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
            />
          ) : null
        }
      >
        {anchorRect ? (
          <div
            style={{
              position: "fixed",
              top: anchorRect.bottom,
              left: anchorRect.left,
              width: anchorRect.width,
              height: 1,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </Popover>
    </div>
  );
}
