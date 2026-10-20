"use client";

import React, { useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { InventoryBalanceItem } from "../../types";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

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

  const columns: ColumnsType<InventoryBalanceItem> = [
    {
      title: t.table.stt,
      key: "stt",
      width: 55,
      align: "center",
      render: (_, __, index) => (
        <span style={{ color: "#64748B", fontSize: 13 }}>
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
            color: "#7C3AED",
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
        <span style={{ fontWeight: 500, fontSize: 13, color: "#0F172A", lineHeight: "18px" }}>
          {val}
        </span>
      ),
    },
    {
      title: t.table.unit,
      dataIndex: "UomCode",
      key: "UomCode",
      width: 75,
      align: "center",
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
      align: "right",
      render: (val: number) => (
        <span style={{ fontWeight: 600, fontSize: 13, color: val === 0 ? "#DC2626" : "#0F172A" }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.reservedQty,
      dataIndex: "ReservedQty",
      key: "ReservedQty",
      width: 105,
      align: "right",
      render: (val: number) => (
        <span style={{ color: "#64748B", fontSize: 13 }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.availableQty,
      dataIndex: "AvailableQty",
      key: "AvailableQty",
      width: 115,
      align: "right",
      render: (val: number) => (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#16A34A" }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.avgCost,
      dataIndex: "AvgUnitCost",
      key: "AvgUnitCost",
      width: 140,
      align: "right",
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
      align: "right",
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: "#7C3AED", fontSize: 13 }}>
          {Number(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: t.table.lastReceiptDate,
      dataIndex: "LastReceiptDate",
      key: "LastReceiptDate",
      width: 120,
      align: "center",
      render: (val: string | null) => (
        <span style={{ color: "#64748B", fontSize: 13 }}>
          {val ? dayjs(val).format("DD/MM/YYYY") : "---"}
        </span>
      ),
    },
    {
      title: t.common.actions,
      key: "action",
      width: 80,
      align: "center",
      fixed: "right",
      render: (_: any, record: InventoryBalanceItem) => (
        <Tooltip title={t.inventory.stockCardTooltip}>
          <Button
            type="text"
            size="small"
            icon={<HistoryOutlined style={{ color: "#7C3AED", fontSize: 15 }} />}
            onClick={() => onOpenStockCard(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {/* BỘ LỌC VÀ CÔNG CỤ TÌM KIẾM */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Space size={10} wrap>
          {/* Lọc theo Kho */}
          <Select
            value={selectedWarehouseId}
            onChange={(val) => {
              setSelectedWarehouseId(val);
              onPageChange(1, pagination.pageSize, val);
            }}
            style={{ width: 260 }}
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
            style={{ width: 260, borderRadius: 6 }}
            allowClear
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => onPageChange(1, pagination.pageSize)}
            style={{
              background: "#7C3AED",
              borderColor: "#7C3AED",
              borderRadius: 6,
            }}
          >
            {t.common.search}
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            style={{ borderRadius: 6, borderColor: "#CBD5E1" }}
          >
            {t.common.refresh}
          </Button>
        </Space>

        <Space size={8}>
          <Button
            icon={<FileExcelOutlined />}
            style={{ borderRadius: 6, borderColor: "#CBD5E1" }}
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
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Table
          size="middle"
          loading={loading}
          dataSource={items}
          columns={columns}
          rowKey={(r) => `${r.BalanceId ?? r.MaterialId ?? r.ItemCode}_${r.WarehouseId}`}
          scroll={{ x: 1450 }}
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
              <Table.Summary.Row style={{ background: "#F5F3FF" }}>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>
                    {t.table.total}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>
                    {pageTotalQty.toLocaleString("vi-VN")}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span>-</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{ fontWeight: 700, color: "#16A34A", fontSize: 13 }}>
                    {pageAvailableQty.toLocaleString("vi-VN")}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span>-</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <span style={{ fontWeight: 700, color: "#7C3AED", fontSize: 13 }}>
                    {pageTotalValue.toLocaleString("vi-VN")}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} colSpan={2} />
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    </div>
  );
}
