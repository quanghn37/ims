"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  DatePicker,
  Tag,
  Popconfirm,
  message,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import { extractApiList } from "@/lib/api-client";
import { warehouseApi } from "../api";
import { useTranslation } from "@/locales/LanguageContext";

interface WarehousePeriodRow {
  key: string;
  WarehouseId: number | string;
  WarehouseCode: string;
  WarehouseName: string;
  PeriodStatus: "OPEN" | "CLOSED";
  UpdatedBy?: string;
  UpdatedAt?: string;
}

export default function WarehousePeriodControlPage() {
  const { t, language } = useTranslation();
  const isEn = language === "en";

  const [selectedPeriod, setSelectedPeriod] = useState<dayjs.Dayjs>(dayjs());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [warehouses, setWarehouses] = useState<WarehousePeriodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const periodLabel = useMemo(
    () => (selectedPeriod ? selectedPeriod.format("MM/YYYY") : dayjs().format("MM/YYYY")),
    [selectedPeriod]
  );

  // Tải danh sách kho từ API get-warehouse-list đang có
  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehouseApi.getWarehouseList({
        PageNum: 1,
        PageSize: 500,
      });
      const list = extractApiList<any>(data);
      const mapped: WarehousePeriodRow[] = list
        .map((w: any, idx: number) => {
          const id = w.WarehouseId ?? w.Id ?? w.id ?? idx;
          return {
            key: String(id),
            WarehouseId: id,
            WarehouseCode: w.WarehouseCode || w.Code || w.code || "",
            WarehouseName: w.WarehouseName || w.Name || w.name || "",
            PeriodStatus: "OPEN" as const,
          };
        })
        .filter((w) => w.WarehouseName || w.WarehouseCode);

      setWarehouses(mapped);
    } catch (err: any) {
      console.error("Lỗi tải danh sách kho:", err);
      message.error(
        err?.message ||
          (isEn ? "Failed to load warehouse list" : "Không thể tải danh sách kho")
      );
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, [isEn]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const filteredWarehouses = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return warehouses;
    return warehouses.filter(
      (w) =>
        w.WarehouseCode.toLowerCase().includes(kw) ||
        w.WarehouseName.toLowerCase().includes(kw)
    );
  }, [warehouses, searchKeyword]);

  // Thao tác Đóng kỳ / Mở kỳ trên khung giao diện (chờ map API)
  const handlePeriodAction = (action: "CLOSE" | "OPEN") => {
    if (selectedRowKeys.length === 0) return;

    const nowStr = dayjs().format("DD/MM/YYYY HH:mm");
    const nextStatus = action === "CLOSE" ? "CLOSED" : "OPEN";

    setWarehouses((prev) =>
      prev.map((w) =>
        selectedRowKeys.includes(w.key)
          ? {
              ...w,
              PeriodStatus: nextStatus,
              UpdatedAt: nowStr,
            }
          : w
      )
    );

    message.success(
      action === "CLOSE"
        ? isEn
          ? `Closed period ${periodLabel} for ${selectedRowKeys.length} warehouse(s) (Wireframe - API pending).`
          : `Đã đóng kỳ ${periodLabel} cho ${selectedRowKeys.length} kho (Khung giao diện - chờ map API).`
        : isEn
        ? `Opened period ${periodLabel} for ${selectedRowKeys.length} warehouse(s) (Wireframe - API pending).`
        : `Đã mở kỳ ${periodLabel} cho ${selectedRowKeys.length} kho (Khung giao diện - chờ map API).`
    );
    setSelectedRowKeys([]);
  };

  const rawColumns: (ColumnType<WarehousePeriodRow> & { cannotHide?: boolean })[] = useMemo(
    () => [
      {
        title: t.table?.stt || (isEn ? "No." : "STT"),
        key: "stt",
        width: 60,
        align: "center",
        cannotHide: true,
        render: (_val, _record, index) => index + 1,
      },
      {
        title: isEn ? "Warehouse Code" : "Mã kho",
        dataIndex: "WarehouseCode",
        key: "WarehouseCode",
        width: 160,
        render: (val: string) => (
          <span style={{ fontFamily: "monospace", color: "#123443" }}>{val || "---"}</span>
        ),
      },
      {
        title: isEn ? "Warehouse Name" : "Tên kho",
        dataIndex: "WarehouseName",
        key: "WarehouseName",
        width: 340,
        render: (val: string) => <span style={{ color: "#123443" }}>{val || "---"}</span>,
      },
      {
        title: isEn ? "Period" : "Kỳ kho",
        key: "Period",
        width: 130,
        align: "center",
        render: () => (
          <span style={{ fontFamily: "monospace", color: "#123443" }}>{periodLabel}</span>
        ),
      },
      {
        title: isEn ? "Period Status" : "Trạng thái kỳ",
        dataIndex: "PeriodStatus",
        key: "PeriodStatus",
        width: 150,
        align: "center",
        render: (status: "OPEN" | "CLOSED") =>
          status === "CLOSED" ? (
            <Tag color="red" style={{ margin: 0, borderRadius: 12, padding: "1px 10px" }}>
              {isEn ? "Closed" : "Đã đóng kỳ"}
            </Tag>
          ) : (
            <Tag color="green" style={{ margin: 0, borderRadius: 12, padding: "1px 10px" }}>
              {isEn ? "Open" : "Đang mở kỳ"}
            </Tag>
          ),
      },
      {
        title: isEn ? "Updated At" : "Thời gian cập nhật",
        dataIndex: "UpdatedAt",
        key: "UpdatedAt",
        width: 180,
        align: "center",
        render: (val?: string) => (
          <span style={{ color: "#64748b" }}>{val || "---"}</span>
        ),
      },
    ],
    [t, isEn, periodLabel]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns<WarehousePeriodRow>({
    tableKey: "warehouse_period_control_v1",
    columns: rawColumns,
    defaultScrollX: 1050,
  });

  return (
    <ErpPageContainer>
      {/* Toolbar: Chọn kỳ + Tìm kiếm bên trái; Đóng kỳ / Mở kỳ bên phải khi có chọn kho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <Space size={10} wrap align="center" style={{ flex: 1 }}>
          <DatePicker
            picker="month"
            format="MM/YYYY"
            allowClear={false}
            value={selectedPeriod}
            onChange={(val) => {
              if (val) {
                setSelectedPeriod(val);
                setSelectedRowKeys([]);
              }
            }}
            style={{ width: 150, height: 36, borderRadius: 8 }}
            placeholder={isEn ? "Select period" : "Chọn kỳ kho"}
          />

          <Input
            placeholder={isEn ? "Search warehouse code, name..." : "Tìm mã kho, tên kho..."}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 260, height: 36, borderRadius: 8, fontSize: 13.5 }}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />

          <Button
            icon={<ReloadOutlined style={{ color: "#008f89" }} />}
            onClick={() => {
              setSelectedRowKeys([]);
              fetchWarehouses();
            }}
            loading={loading}
            style={{
              height: 36,
              borderRadius: 8,
              borderColor: "#dce5e6",
              fontSize: 13.5,
              color: "#334155",
            }}
          >
            {t.common?.refresh || (isEn ? "Refresh" : "Làm mới")}
          </Button>

          {selectedRowKeys.length > 0 && (
            <Tag
              style={{
                background: "#eef8f6",
                color: "#008f89",
                border: "1px solid #79c7bf",
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 12,
                fontWeight: 600,
                lineHeight: "18px",
                margin: 0,
              }}
            >
              {isEn
                ? `Selected: ${selectedRowKeys.length} warehouse(s)`
                : `Đã chọn: ${selectedRowKeys.length} kho`}
            </Tag>
          )}
        </Space>

        {selectedRowKeys.length > 0 && (
          <Space size={10} align="center">
            <Popconfirm
              title={
                isEn
                  ? `Close period ${periodLabel} for ${selectedRowKeys.length} selected warehouse(s)?`
                  : `Xác nhận Đóng kỳ ${periodLabel} cho ${selectedRowKeys.length} kho đã chọn?`
              }
              onConfirm={() => handlePeriodAction("CLOSE")}
              okText={isEn ? "Close Period" : "Đóng kỳ"}
              cancelText={t.common?.cancel || "Hủy"}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="primary"
                danger
                icon={<LockOutlined />}
                style={{
                  height: 36,
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 500,
                }}
              >
                {isEn ? "Close Period" : "Đóng kỳ"} ({selectedRowKeys.length})
              </Button>
            </Popconfirm>

            <Popconfirm
              title={
                isEn
                  ? `Open period ${periodLabel} for ${selectedRowKeys.length} selected warehouse(s)?`
                  : `Xác nhận Mở kỳ ${periodLabel} cho ${selectedRowKeys.length} kho đã chọn?`
              }
              onConfirm={() => handlePeriodAction("OPEN")}
              okText={isEn ? "Open Period" : "Mở kỳ"}
              cancelText={t.common?.cancel || "Hủy"}
              okButtonProps={{ style: { background: "#008f89", borderColor: "#008f89" } }}
            >
              <Button
                type="primary"
                icon={<UnlockOutlined />}
                style={{
                  background: "#008f89",
                  borderColor: "#008f89",
                  height: 36,
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 500,
                  boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                }}
              >
                {isEn ? "Open Period" : "Mở kỳ"} ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      {/* Main Table (Full Canvas) */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #dce5e6",
          borderRadius: 8,
          overflow: "hidden",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Table
          className="erp-full-table"
          components={{ header: { cell: ResizableTitle } }}
          rowKey="key"
          size="middle"
          columns={tableColumns}
          dataSource={filteredWarehouses}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${isEn ? "warehouses" : "kho"}`,
          }}
          scroll={{ x: scrollX, y: "100%" }}
        />
      </div>
    </ErpPageContainer>
  );
}
