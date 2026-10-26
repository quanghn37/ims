"use client";

import React, { useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { InventoryBalanceItem } from "../../types";
import { useTranslation } from "@/locales/LanguageContext";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedColumnWidths } from "@/lib/table-utils";

interface InventoryTableProps {
  items: InventoryBalanceItem[];
  loading: boolean;
  searchKeyword: string;
  setSearchKeyword: (val: string) => void;
  selectedWarehouseId: string | number;
  setSelectedWarehouseId: (val: string | number) => void;
  warehouses: any[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onOpenStockCard: (item: InventoryBalanceItem) => void;
  onRefresh: () => void;
  onPageChange: (page: number, pageSize: number, whIdOverride?: string | number) => void;
}

export default function InventoryTable({
  items,
  loading,
  searchKeyword,
  setSearchKeyword,
  selectedWarehouseId,
  setSelectedWarehouseId,
  warehouses,
  pagination,
  onOpenStockCard,
  onRefresh,
  onPageChange,
}: InventoryTableProps) {
  const { t } = useTranslation();

  // Lựa chọn kho từ backend
  const warehouseOptions = useMemo(() => {
    return [
      { value: "ALL", label: t.inventory.allWarehouse },
      ...warehouses.map((w) => ({
        value: w.WarehouseId ?? w.Id ?? w.id,
        label: w.WarehouseName ?? w.Name ?? w.name,
      })),
    ];
  }, [warehouses, t]);

  const initialColumns = useMemo(() => [
    {
      title: t.table.stt,
      key: "stt",
      width: 55,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: "#718894", fontSize: 13 }}>
          {(pagination.current - 1) * pagination.pageSize + index + 1}
        </span>
      ),
    },
    {
      title: t.table.itemCode,
      dataIndex: "ItemCode",
      key: "ItemCode",
      width: 160,
      render: (val: string, record: InventoryBalanceItem) => (
        <span
          onClick={() => onOpenStockCard(record)}
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 600,
            color: "#008f89",
            cursor: "pointer",
          }}
          title={t.inventory.stockCardTooltip}
        >
          {val}
        </span>
      ),
    },
    {
      title: t.table.itemName,
      dataIndex: "ItemName",
      key: "ItemName",
      width: 280,
      render: (val: string) => (
        <span style={{ fontSize: 13, color: "#123443", lineHeight: "18px" }}>
          {val}
        </span>
      ),
    },
    {
      title: t.table.unit,
      dataIndex: "UomCode",
      key: "UomCode",
      width: 75,
      align: "center" as const,
      render: (val: string) => (
        <span style={{ color: "#475569", fontSize: 13 }}>{val}</span>
      ),
    },
    {
      title: t.table.warehouse,
      dataIndex: "WarehouseName",
      key: "WarehouseName",
      width: 250,
      render: (val: string) => (
        <span style={{ color: "#334155", fontSize: 13 }}>{val}</span>
      ),
    },
    {
      title: t.table.onHandQty,
      dataIndex: "OnHandQty",
      key: "OnHandQty",
      width: 110,
      align: "right" as const,
      render: (val: number) => (
        <span style={{ fontSize: 13, color: val === 0 ? "#DC2626" : "#123443" }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.reservedQty,
      dataIndex: "ReservedQty",
      key: "ReservedQty",
      width: 105,
      align: "right" as const,
      render: (val: number) => (
        <span style={{ color: "#718894", fontSize: 13 }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.availableQty,
      dataIndex: "AvailableQty",
      key: "AvailableQty",
      width: 115,
      align: "right" as const,
      render: (val: number) => (
        <span style={{ fontSize: 13, color: "#16A34A" }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.avgCost,
      dataIndex: "AvgUnitCost",
      key: "AvgUnitCost",
      width: 140,
      align: "right" as const,
      render: (val: number) => (
        <span style={{ color: "#334155", fontSize: 13 }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.totalCost,
      dataIndex: "TotalCost",
      key: "TotalCost",
      width: 155,
      align: "right" as const,
      render: (val: number) => (
        <span style={{ color: "#008f89", fontSize: 13 }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.lastReceiptDate,
      dataIndex: "LastReceiptDate",
      key: "LastReceiptDate",
      width: 120,
      align: "center" as const,
      render: (val: string | null) => (
        <span style={{ color: "#718894", fontSize: 13 }}>
          {val ? dayjs(val).format("DD/MM/YYYY") : "---"}
        </span>
      ),
    },
    {
      key: "_spacer",
      title: "",
      width: undefined,
      render: () => null,
    },
    {
      title: t.common.actions,
      key: "action",
      width: 80,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: InventoryBalanceItem) => (
        <Tooltip title={t.inventory.stockCardTooltip}>
          <Button
            type="text"
            size="small"
            icon={<HistoryOutlined style={{ color: "#008f89", fontSize: 15 }} />}
            onClick={() => onOpenStockCard(record)}
          />
        </Tooltip>
      ),
    },
  ], [pagination.current, pagination.pageSize, onOpenStockCard, t]);

  const { columns, handleResizeColumn } = usePersistedColumnWidths(initialColumns, "inventory_table_widths_v1");

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
    const isAction = key === "action";
    return {
      ...column,
      width: isAction ? 80 : column.width,
      onHeaderCell: (headerColumn: any) => ({
        width: isAction ? 80 : headerColumn.width,
        onResize: isAction ? undefined : handleResizeColumn(index),
        style: isAction ? ({ padding: "4px 2px", textAlign: "center" } as React.CSSProperties) : undefined,
      }),
    };
  }), [columns, handleResizeColumn]);

  const scrollX = useMemo(() => {
    return mergedColumns.reduce((sum, col) => {
      if (col.key === "_spacer") return sum;
      return sum + (Number(col.width) || 120);
    }, 0);
  }, [mergedColumns]);

  return (
    <div>
      {/* BỘ LỌC VÀ CÔNG CỤ TÌM KIẾM */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <Space size={10} wrap style={{ flex: 1 }}>
          {/* Lọc theo Kho */}
          <Select
            value={selectedWarehouseId}
            onChange={(val) => {
              setSelectedWarehouseId(val);
              onPageChange(1, pagination.pageSize, val);
            }}
            style={{ width: 240, height: 36 }}
            options={warehouseOptions}
            placeholder={t.inventory.selectWarehouse}
          />

          {/* Ô tìm kiếm */}
          <Input
            placeholder={t.inventory.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={() => onPageChange(1, pagination.pageSize)}
            style={{ width: 260, height: 36, borderRadius: 8, fontSize: 13.5 }}
            allowClear
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => onPageChange(1, pagination.pageSize)}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              borderRadius: 8,
              height: 36,
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            {t.common.search}
          </Button>

          <span style={{ fontSize: 13, color: "#64748b" }}>
            {t.common.total || "Tổng"}: <strong style={{ color: "#008f89" }}>{pagination.total}</strong> {t.table.itemsCount || "mặt hàng"}
          </span>
        </Space>

        <Space size={10}>
          <Button
            icon={<ReloadOutlined style={{ color: "#008f89" }} />}
            onClick={onRefresh}
            style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", color: "#334155", fontSize: 13.5, fontWeight: 500 }}
          >
            {t.common.refresh}
          </Button>

          <Button
            icon={<FileExcelOutlined style={{ color: "#16A34A" }} />}
            style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", color: "#334155", fontSize: 13.5, fontWeight: 500 }}
            onClick={() => {
              // Export CSV / Excel
            }}
          >
            {t.common.exportExcel}
          </Button>
        </Space>
      </div>

      {/* BẢNG DỮ LIỆU TỒN KHO TỨC THỜI */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #dce5e6",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Table
          tableLayout="fixed"
          components={{ header: { cell: ResizableTitle } }}
          size="middle"
          loading={loading}
          dataSource={items}
          columns={mergedColumns as any}
          rowKey={(r) => `${r.BalanceId ?? r.MaterialId ?? r.ItemCode}_${r.WarehouseId}`}
          scroll={{ x: scrollX, y: "calc(100vh - 215px)" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100"],
            onChange: onPageChange,
            showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.table.itemsCount}`,
          }}
          summary={(pageData) => {
            const pageTotalQty = pageData.reduce((acc, it) => acc + (Number(it.OnHandQty) || 0), 0);
            const pageAvailableQty = pageData.reduce((acc, it) => acc + (Number(it.AvailableQty) || 0), 0);
            const pageTotalValue = pageData.reduce((acc, it) => acc + (Number(it.TotalCost) || 0), 0);

            return (
              <Table.Summary.Row style={{ background: "#eef8f6" }}>
                {mergedColumns.map((col: any, index: number) => {
                  const key = String(col.key || col.dataIndex || index);
                  if (key === "_spacer") {
                    return <Table.Summary.Cell key="_spacer" index={index} />;
                  }
                  if (key === "WarehouseName" || (key === "ItemName" && !mergedColumns.some((c: any) => (c.key || c.dataIndex) === "WarehouseName"))) {
                    return (
                      <Table.Summary.Cell key={key} index={index} align="right">
                        <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
                          {t.table.total}
                        </span>
                      </Table.Summary.Cell>
                    );
                  }
                  if (key === "OnHandQty") {
                    return (
                      <Table.Summary.Cell key={key} index={index} align="right">
                        <span style={{ fontWeight: 700, color: "#123443", fontSize: 13 }}>
                          {pageTotalQty.toLocaleString("vi-VN")}
                        </span>
                      </Table.Summary.Cell>
                    );
                  }
                  if (key === "ReservedQty") {
                    return (
                      <Table.Summary.Cell key={key} index={index} align="right">
                        <span>-</span>
                      </Table.Summary.Cell>
                    );
                  }
                  if (key === "AvailableQty") {
                    return (
                      <Table.Summary.Cell key={key} index={index} align="right">
                        <span style={{ fontWeight: 700, color: "#16A34A", fontSize: 13 }}>
                          {pageAvailableQty.toLocaleString("vi-VN")}
                        </span>
                      </Table.Summary.Cell>
                    );
                  }
                  if (key === "AvgUnitCost") {
                    return (
                      <Table.Summary.Cell key={key} index={index} align="right">
                        <span>-</span>
                      </Table.Summary.Cell>
                    );
                  }
                  if (key === "TotalCost") {
                    return (
                      <Table.Summary.Cell key={key} index={index} align="right">
                        <span style={{ fontWeight: 700, color: "#008f89", fontSize: 13 }}>
                          {pageTotalValue.toLocaleString("vi-VN")}
                        </span>
                      </Table.Summary.Cell>
                    );
                  }
                  return <Table.Summary.Cell key={key} index={index} />;
                })}
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    </div>
  );
}
