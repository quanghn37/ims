"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Space,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BarChartOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { InventoryPeriodReportItem } from "../types";
import { warehouseApi } from "../api";
import { purchaseOrdersApi } from "@/app/purchase-orders/api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";

const { Title, Text } = Typography;

export default function InventoryPeriodReportPage() {
  const { t } = useTranslation();
  const [dataList, setDataList] = useState<InventoryPeriodReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<dayjs.Dayjs | null>(dayjs("2026-10", "YYYY-MM"));
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | number>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [onlyHasMovement, setOnlyHasMovement] = useState(true);

  // Warehouses list
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Tải danh mục Kho từ Backend
  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await purchaseOrdersApi.getWarehouseList({
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList(data);
      if (list && list.length > 0) {
        setWarehouses(list);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách kho:", e);
    }
  }, []);

  // Gọi API Báo cáo Nhập - Xuất - Tồn: api/get-inventory-periodreport
  const fetchPeriodReport = useCallback(
    async (
      page = 1,
      pageSize = 50,
      periodStr = selectedPeriod ? selectedPeriod.format("YYYY-MM") : "2026-10",
      whId = selectedWarehouseId,
      keyword = searchKeyword,
      movement = onlyHasMovement
    ) => {
      setLoading(true);
      try {
        const res = await warehouseApi.getInventoryPeriodReport({
          Period: periodStr,
          WarehouseId: whId === "ALL" ? null : Number(whId),
          MaterialId: null,
          Keyword: keyword.trim(),
          OnlyHasMovement: movement ? 1 : 0,
          PageNum: page,
          PageSize: pageSize,
        });

        const list = extractApiList<InventoryPeriodReportItem>(res);
        const total = extractTotalRows(res, list.length);
        setDataList(list);
        setPagination({
          current: page,
          pageSize,
          total,
        });
      } catch (err: any) {
        console.error("Lỗi khi tải báo cáo Nhập - Xuất - Tồn:", err);
        message.error(err?.message || "Không thể tải báo cáo Nhập - Xuất - Tồn.");
      } finally {
        setLoading(false);
      }
    },
    [selectedPeriod, selectedWarehouseId, searchKeyword, onlyHasMovement]
  );

  // Chỉ tải danh mục kho và báo cáo mặc định 1 lần khi mở trang; các lần lọc tiếp theo thực hiện khi bấm "Xem báo cáo" hoặc Enter
  useEffect(() => {
    fetchWarehouses();
    fetchPeriodReport(1, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const warehouseOptions = useMemo(() => {
    return [
      { value: "ALL", label: t.periodReport.allWarehouse },
      ...warehouses.map((w) => ({
        value: w.WarehouseId ?? w.Id ?? w.id,
        label: w.WarehouseName ?? w.Name ?? w.name,
      })),
    ];
  }, [warehouses, t]);

  // Cấu hình cột phân nhóm kinh điển cho báo cáo NXT
  const columns: ColumnsType<InventoryPeriodReportItem> = useMemo(
    () => [
      {
        title: t.periodReport.colStt,
        key: "stt",
        width: 50,
        align: "center",
        render: (_, __, index) => (
          <span style={{ color: "#718894", fontSize: 13 }}>
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        title: t.table.warehouse,
        dataIndex: "WarehouseName",
        key: "WarehouseName",
        width: 220,
        render: (val: string) => <span style={{ color: "#334155", fontSize: 13 }}>{val}</span>,
      },
      {
        title: t.periodReport.colItemName,
        dataIndex: "ItemName",
        key: "ItemName",
        width: 280,
        render: (_: any, record: InventoryPeriodReportItem) => (
          <div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: "#123443",
                lineHeight: "18px",
                marginBottom: 2,
              }}
            >
              {record.ItemName}
            </div>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 600,
                color: "#008f89",
              }}
            >
              {record.ItemCode}
            </span>
          </div>
        ),
      },
      {
        title: t.periodReport.colUnit,
        dataIndex: "UomCode",
        key: "UomCode",
        width: 70,
        align: "center",
        render: (val: string) => <span style={{ color: "#475569", fontSize: 13 }}>{val}</span>,
      },
      // Nhóm 1: Tồn đầu kỳ
      {
        title: t.periodReport.groupOpening,
        children: [
          {
            title: t.periodReport.colOpeningQty,
            dataIndex: "OpeningQty",
            key: "OpeningQty",
            width: 95,
            align: "right",
            render: (val: number) => (
              <span style={{ color: "#334155", fontSize: 13 }}>
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
          {
            title: t.periodReport.colOpeningAmount,
            dataIndex: "OpeningValue",
            key: "OpeningValue",
            width: 120,
            align: "right",
            render: (val: number) => (
              <span style={{ color: "#334155", fontSize: 13 }}>
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
        ],
      },
      // Nhóm 2: Nhập trong kỳ
      {
        title: t.periodReport.groupStockIn,
        children: [
          {
            title: t.periodReport.colStockInQty,
            dataIndex: "ReceiptQty",
            key: "ReceiptQty",
            width: 95,
            align: "right",
            render: (val: number) => (
              <span
                style={{
                  color: val > 0 ? "#16A34A" : "#334155",
                  fontWeight: val > 0 ? 600 : 400,
                  fontSize: 13,
                }}
              >
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
          {
            title: t.periodReport.colStockInAmount,
            dataIndex: "ReceiptValue",
            key: "ReceiptValue",
            width: 125,
            align: "right",
            render: (val: number) => (
              <span style={{ color: val > 0 ? "#16A34A" : "#334155", fontSize: 13 }}>
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
        ],
      },
      // Nhóm 3: Xuất trong kỳ
      {
        title: t.periodReport.groupStockOut,
        children: [
          {
            title: t.periodReport.colStockOutQty,
            dataIndex: "IssueQty",
            key: "IssueQty",
            width: 95,
            align: "right",
            render: (val: number) => (
              <span
                style={{
                  color: val > 0 ? "#DC2626" : "#334155",
                  fontWeight: val > 0 ? 600 : 400,
                  fontSize: 13,
                }}
              >
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
          {
            title: t.periodReport.colStockOutAmount,
            dataIndex: "IssueValue",
            key: "IssueValue",
            width: 125,
            align: "right",
            render: (val: number) => (
              <span style={{ color: val > 0 ? "#DC2626" : "#334155", fontSize: 13 }}>
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
        ],
      },
      // Nhóm 4: Tồn cuối kỳ
      {
        title: t.periodReport.groupClosing,
        children: [
          {
            title: t.periodReport.colClosingQty,
            dataIndex: "ClosingQty",
            key: "ClosingQty",
            width: 100,
            align: "right",
            render: (val: number) => (
              <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
          {
            title: t.periodReport.colClosingAmount,
            dataIndex: "ClosingValue",
            key: "ClosingValue",
            width: 130,
            align: "right",
            render: (val: number) => (
              <span style={{ fontWeight: 600, color: "#008f89", fontSize: 13 }}>
                {Number(val || 0).toLocaleString("vi-VN")}
              </span>
            ),
          },
        ],
      },
      {
        title: t.table.avgCost,
        dataIndex: "AverageCost",
        key: "AverageCost",
        width: 125,
        align: "right",
        render: (val: number) => (
          <span style={{ color: "#334155", fontSize: 13 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
    ],
    [t, pagination.current, pagination.pageSize]
  );

  const handleSearch = () => {
    fetchPeriodReport(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSelectedPeriod(dayjs("2026-10", "YYYY-MM"));
    setSelectedWarehouseId("ALL");
    setSearchKeyword("");
    setOnlyHasMovement(true);
    fetchPeriodReport(1, pagination.pageSize, "2026-10", "ALL", "", true);
  };

  return (
    <div style={{ padding: "20px 24px", background: "#FFFFFF", borderRadius: 16, border: "1px solid #dce5e6", minHeight: "calc(100vh - 100px)", boxShadow: "0 1px 3px rgba(18, 52, 67, 0.04)" }}>
      {/* 1. TIÊU ĐỀ TRANG */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <Space size={10} align="center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#eef8f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#008f89",
            }}
          >
            <BarChartOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: "#123443", fontWeight: 700 }}>
              {t.periodReport.title}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t.pageTitles.periodReport}
            </Text>
          </div>
        </Space>
      </div>

      {/* 2. BỘ LỌC VÀ CÔNG CỤ TÌM KIẾM */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #dce5e6",
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
          {/* Chọn Kỳ / Tháng */}
          <DatePicker
            picker="month"
            format="MM/YYYY"
            value={selectedPeriod}
            onChange={(d) => setSelectedPeriod(d)}
            style={{ width: 140 }}
            placeholder={t.periodReport.period}
            allowClear={false}
          />

          {/* Chọn Kho lưu trữ */}
          <Select
            value={selectedWarehouseId}
            onChange={setSelectedWarehouseId}
            style={{ width: 260 }}
            options={warehouseOptions}
            placeholder={t.periodReport.selectWarehouse}
          />

          {/* Ô tìm kiếm */}
          <Input
            placeholder={t.periodReport.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240, borderRadius: 6 }}
            allowClear
          />

          <Checkbox
            checked={onlyHasMovement}
            onChange={(e) => setOnlyHasMovement(e.target.checked)}
          >
            {t.periodReport.onlyMovement}
          </Checkbox>

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              borderRadius: 6,
            }}
          >
            {t.common.search}
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            style={{ borderRadius: 6, borderColor: "#CBD5E1" }}
          >
            {t.periodReport.refresh}
          </Button>
        </Space>

        <Space size={8}>
          <Button
            icon={<FileExcelOutlined />}
            style={{ borderRadius: 6, borderColor: "#CBD5E1" }}
            onClick={() => {
              message.info("Tính năng xuất Excel báo cáo Nhập-Xuất-Tồn đang được chuẩn bị.");
            }}
          >
            {t.periodReport.exportExcel}
          </Button>
        </Space>
      </div>

      {/* 3. BẢNG DỮ LIỆU BÁO CÁO NHẬP - XUẤT - TỒN */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #dce5e6",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Table
          size="middle"
          loading={loading}
          dataSource={dataList}
          columns={columns}
          rowKey={(r) => `${r.PeriodId ?? r.Period}_${r.WarehouseId}_${r.MaterialId ?? r.ItemCode}`}
          scroll={{ x: 1500 }}
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100"],
            onChange: (page, pageSize) => {
              fetchPeriodReport(page, pageSize);
            },
            showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.table.itemsCount}`,
          }}
          summary={(pageData) => {
            const sumOpeningQty = pageData.reduce((acc, it) => acc + (Number(it.OpeningQty) || 0), 0);
            const sumOpeningValue = pageData.reduce((acc, it) => acc + (Number(it.OpeningValue) || 0), 0);
            const sumReceiptQty = pageData.reduce((acc, it) => acc + (Number(it.ReceiptQty) || 0), 0);
            const sumReceiptValue = pageData.reduce((acc, it) => acc + (Number(it.ReceiptValue) || 0), 0);
            const sumIssueQty = pageData.reduce((acc, it) => acc + (Number(it.IssueQty) || 0), 0);
            const sumIssueValue = pageData.reduce((acc, it) => acc + (Number(it.IssueValue) || 0), 0);
            const sumClosingQty = pageData.reduce((acc, it) => acc + (Number(it.ClosingQty) || 0), 0);
            const sumClosingValue = pageData.reduce((acc, it) => acc + (Number(it.ClosingValue) || 0), 0);

            return (
              <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={4} align="center">
                  <span style={{ fontWeight: 700, color: "#123443", fontSize: 13 }}>
                    {t.periodReport.totalSummary}
                  </span>
                </Table.Summary.Cell>
                {/* Tồn đầu */}
                <Table.Summary.Cell index={1} align="right">
                  <span style={{ color: "#123443" }}>{sumOpeningQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{ color: "#123443" }}>{sumOpeningValue.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>
                {/* Nhập */}
                <Table.Summary.Cell index={3} align="right">
                  <span style={{ color: "#16A34A" }}>{sumReceiptQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span style={{ color: "#16A34A" }}>{sumReceiptValue.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>
                {/* Xuất */}
                <Table.Summary.Cell index={5} align="right">
                  <span style={{ color: "#DC2626" }}>{sumIssueQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <span style={{ color: "#DC2626" }}>{sumIssueValue.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>
                {/* Tồn cuối */}
                <Table.Summary.Cell index={7} align="right">
                  <span style={{ color: "#123443" }}>{sumClosingQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <span style={{ color: "#008f89", fontWeight: 700 }}>
                    {sumClosingValue.toLocaleString("vi-VN")}
                  </span>
                </Table.Summary.Cell>
                {/* Đơn giá */}
                <Table.Summary.Cell index={9} align="right">
                  <span>-</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    </div>
  );
}
