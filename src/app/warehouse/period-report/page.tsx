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
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { InventoryPeriodReportItem } from "../types";
import { warehouseApi } from "../api";
import { purchaseOrdersApi } from "@/app/purchase-orders/api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";
import { exportToExcel } from "@/lib/excel-export";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";

export default function InventoryPeriodReportPage() {
  const { t } = useTranslation();
  const [dataList, setDataList] = useState<InventoryPeriodReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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
                color: "#475569",
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
              <span style={{ color: "#123443", fontSize: 13 }}>
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
              <span style={{ color: "#008f89", fontSize: 13 }}>
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

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const periodStr = selectedPeriod ? selectedPeriod.format("YYYY-MM") : "2026-10";

      // Gọi API tải toàn bộ dữ liệu theo bộ lọc hiện tại để xuất đủ báo cáo
      const res = await warehouseApi.getInventoryPeriodReport({
        Period: periodStr,
        WarehouseId: selectedWarehouseId === "ALL" ? null : Number(selectedWarehouseId),
        MaterialId: null,
        Keyword: searchKeyword.trim(),
        OnlyHasMovement: onlyHasMovement ? 1 : 0,
        PageNum: 1,
        PageSize: 10000,
      });

      const fullList = extractApiList<InventoryPeriodReportItem>(res);
      const exportData = fullList && fullList.length > 0 ? fullList : dataList;

      if (!exportData || exportData.length === 0) {
        message.warning("Không có dữ liệu để xuất Excel!");
        return;
      }

      // Tính tổng cộng cho toàn bộ tập dữ liệu xuất
      const sumOpeningQty = exportData.reduce((acc, it) => acc + (Number(it.OpeningQty) || 0), 0);
      const sumOpeningValue = exportData.reduce((acc, it) => acc + (Number(it.OpeningValue) || 0), 0);
      const sumReceiptQty = exportData.reduce((acc, it) => acc + (Number(it.ReceiptQty) || 0), 0);
      const sumReceiptValue = exportData.reduce((acc, it) => acc + (Number(it.ReceiptValue) || 0), 0);
      const sumIssueQty = exportData.reduce((acc, it) => acc + (Number(it.IssueQty) || 0), 0);
      const sumIssueValue = exportData.reduce((acc, it) => acc + (Number(it.IssueValue) || 0), 0);
      const sumClosingQty = exportData.reduce((acc, it) => acc + (Number(it.ClosingQty) || 0), 0);
      const sumClosingValue = exportData.reduce((acc, it) => acc + (Number(it.ClosingValue) || 0), 0);

      const selectedWhLabel =
        warehouseOptions.find((w) => String(w.value) === String(selectedWarehouseId))?.label ||
        t.periodReport.allWarehouse ||
        "Tất cả kho";

      await exportToExcel({
        fileName: `Bao_cao_NXT_${periodStr}`,
        sheetName: "NXT",
        title: t.periodReport.title || "BÁO CÁO NHẬP - XUẤT - TỒN",
        metadata: [
          { label: t.periodReport.period || "Kỳ báo cáo", value: selectedPeriod?.format("MM/YYYY") || periodStr },
          { label: t.table.warehouse || "Kho", value: selectedWhLabel },
          { label: "Ngày xuất báo cáo", value: dayjs().format("DD/MM/YYYY HH:mm") },
        ],
        columns: [
          { key: "stt", title: t.periodReport.colStt || "STT", width: 50, align: "center", dataType: "number" },
          { key: "WarehouseName", title: t.table.warehouse || "Kho", width: 220, align: "left" },
          { key: "ItemName", title: t.periodReport.colItemName || "Tên vật tư", width: 280, align: "left" },
          { key: "UomCode", title: t.periodReport.colUnit || "ĐVT", width: 70, align: "center" },
          {
            key: "groupOpening",
            title: t.periodReport.groupOpening || "TỒN ĐẦU KỲ",
            children: [
              { key: "OpeningQty", title: t.periodReport.colOpeningQty || "Số lượng", width: 95, align: "right", dataType: "number", numFmt: "#,##0" },
              { key: "OpeningValue", title: t.periodReport.colOpeningAmount || "Thành tiền", width: 120, align: "right", dataType: "number", numFmt: "#,##0" },
            ],
          },
          {
            key: "groupStockIn",
            title: t.periodReport.groupStockIn || "NHẬP TRONG KỲ",
            children: [
              { key: "ReceiptQty", title: t.periodReport.colStockInQty || "Số lượng", width: 95, align: "right", dataType: "number", numFmt: "#,##0" },
              { key: "ReceiptValue", title: t.periodReport.colStockInAmount || "Thành tiền", width: 125, align: "right", dataType: "number", numFmt: "#,##0" },
            ],
          },
          {
            key: "groupStockOut",
            title: t.periodReport.groupStockOut || "XUẤT TRONG KỲ",
            children: [
              { key: "IssueQty", title: t.periodReport.colStockOutQty || "Số lượng", width: 95, align: "right", dataType: "number", numFmt: "#,##0" },
              { key: "IssueValue", title: t.periodReport.colStockOutAmount || "Thành tiền", width: 125, align: "right", dataType: "number", numFmt: "#,##0" },
            ],
          },
          {
            key: "groupClosing",
            title: t.periodReport.groupClosing || "TỒN CUỐI KỲ",
            children: [
              { key: "ClosingQty", title: t.periodReport.colClosingQty || "Số lượng", width: 100, align: "right", dataType: "number", numFmt: "#,##0" },
              { key: "ClosingValue", title: t.periodReport.colClosingAmount || "Thành tiền", width: 130, align: "right", dataType: "number", numFmt: "#,##0" },
            ],
          },
          { key: "AverageCost", title: t.table.avgCost || "Đơn giá BQ", width: 125, align: "right", dataType: "number", numFmt: "#,##0" },
        ],
        data: exportData,
        summary: {
          mergeLabel: {
            startColKey: "WarehouseName",
            endColKey: "ItemName",
            label: t.periodReport.totalSummary || "TỔNG CỘNG",
          },
          values: {
            OpeningQty: sumOpeningQty,
            OpeningValue: sumOpeningValue,
            ReceiptQty: sumReceiptQty,
            ReceiptValue: sumReceiptValue,
            IssueQty: sumIssueQty,
            IssueValue: sumIssueValue,
            ClosingQty: sumClosingQty,
            ClosingValue: sumClosingValue,
          },
        },
      });

      message.success("Xuất file Excel thành công!");
    } catch (err: any) {
      console.error("Lỗi khi xuất file Excel:", err);
      message.error("Lỗi khi xuất file Excel!");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ErpPageContainer>
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
          {/* Chọn Kỳ / Tháng */}
          <DatePicker
            picker="month"
            format="MM/YYYY"
            value={selectedPeriod}
            onChange={(d) => setSelectedPeriod(d)}
            style={{ width: 130, height: 36 }}
            placeholder={t.periodReport.period}
            allowClear={false}
          />

          {/* Chọn Kho lưu trữ */}
          <Select
            value={selectedWarehouseId}
            onChange={setSelectedWarehouseId}
            style={{ width: 240, height: 36 }}
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
            style={{ width: 240, height: 36, borderRadius: 8, fontSize: 13.5 }}
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
              borderRadius: 8,
              height: 36,
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            {t.common.search}
          </Button>

          <Button
            icon={<ReloadOutlined style={{ color: "#008f89" }} />}
            onClick={handleReset}
            style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", color: "#334155", fontSize: 13.5, fontWeight: 500 }}
          >
            {t.periodReport.refresh}
          </Button>

          <span style={{ fontSize: 13, color: "#64748b" }}>
            {t.common.total || "Tổng"}: <strong style={{ color: "#008f89" }}>{pagination.total}</strong> {t.table.itemsCount || "mặt hàng"}
          </span>
        </Space>

        <Space size={10}>
          <Button
            icon={<FileExcelOutlined style={{ color: "#16A34A" }} />}
            style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", color: "#334155", fontSize: 13.5, fontWeight: 500 }}
            loading={exporting}
            onClick={handleExportExcel}
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
          scroll={{ x: 1500, y: "calc(100vh - 225px)" }}
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100", "200"],
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
                {/* Cột 0: STT */}
                <Table.Summary.Cell index={0} align="center" />

                {/* Cột 1 & 2: Merged Kho (Warehouse) & Tên vật tư (ItemName) */}
                <Table.Summary.Cell index={1} colSpan={2} align="center">
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#123443",
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t.periodReport.totalSummary}
                  </span>
                </Table.Summary.Cell>

                {/* Cột 3: ĐVT */}
                <Table.Summary.Cell index={3} align="center" />

                {/* Cột 4: Tồn đầu kỳ - SL */}
                <Table.Summary.Cell index={4} align="right">
                  <span style={{ color: "#123443" }}>{sumOpeningQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>

                {/* Cột 5: Tồn đầu kỳ - Tiền */}
                <Table.Summary.Cell index={5} align="right">
                  <span style={{ color: "#123443" }}>{sumOpeningValue.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>

                {/* Cột 6: Nhập trong kỳ - SL */}
                <Table.Summary.Cell index={6} align="right">
                  <span style={{ color: "#16A34A" }}>{sumReceiptQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>

                {/* Cột 7: Nhập trong kỳ - Tiền */}
                <Table.Summary.Cell index={7} align="right">
                  <span style={{ color: "#16A34A" }}>{sumReceiptValue.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>

                {/* Cột 8: Xuất trong kỳ - SL */}
                <Table.Summary.Cell index={8} align="right">
                  <span style={{ color: "#DC2626" }}>{sumIssueQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>

                {/* Cột 9: Xuất trong kỳ - Tiền */}
                <Table.Summary.Cell index={9} align="right">
                  <span style={{ color: "#DC2626" }}>{sumIssueValue.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>

                {/* Cột 10: Tồn cuối kỳ - SL */}
                <Table.Summary.Cell index={10} align="right">
                  <span style={{ color: "#123443" }}>{sumClosingQty.toLocaleString("vi-VN")}</span>
                </Table.Summary.Cell>

                {/* Cột 11: Tồn cuối kỳ - Tiền */}
                <Table.Summary.Cell index={11} align="right">
                  <span style={{ color: "#008f89", fontWeight: 700 }}>
                    {sumClosingValue.toLocaleString("vi-VN")}
                  </span>
                </Table.Summary.Cell>

                {/* Cột 12: Đơn giá bình quân */}
                <Table.Summary.Cell index={12} align="center" />
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    </ErpPageContainer>
  );
}
