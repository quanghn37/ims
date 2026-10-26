"use client";

import React, { useMemo } from "react";
import {
  Drawer,
  Table,
  Space,
  Row,
  Col,
  Button,
  DatePicker,
  Spin,
  Empty,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileTextOutlined,
  PrinterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { StockCardReportData, StockCardTransactionItem } from "../../types";
import { useTranslation } from "@/locales/LanguageContext";

const { RangePicker } = DatePicker;

interface StockCardDrawerProps {
  open: boolean;
  onClose: () => void;
  item: any;
  data: StockCardReportData | null;
  loading: boolean;
  dateRange: [string, string];
  onDateRangeChange: (fromDate: string, toDate: string) => void;
  onRefresh: () => void;
}

export default function StockCardDrawer({
  open,
  onClose,
  item,
  data,
  loading,
  dateRange,
  onDateRangeChange,
  onRefresh,
}: StockCardDrawerProps) {
  const { t, language } = useTranslation();
  if (!item && !data) return null;

  const itemName = data?.ItemName ?? item?.ItemName ?? item?.itemName ?? "";
  const itemCode = data?.ItemCode ?? item?.ItemCode ?? item?.itemCode ?? "";
  const unit = data?.UomCode ?? item?.UomCode ?? item?.unit ?? "";
  const warehouseName = data?.WarehouseName ?? item?.WarehouseName ?? item?.warehouseName ?? "";

  const openingQty = Number(data?.OpeningQty ?? 0);
  const openingValue = Number(data?.OpeningValue ?? 0);
  const totalReceiptQty = Number(data?.TotalReceiptQty ?? 0);
  const totalReceiptValue = Number(data?.TotalReceiptValue ?? 0);
  const totalIssueQty = Number(data?.TotalIssueQty ?? 0);
  const totalIssueValue = Number(data?.TotalIssueValue ?? 0);
  const closingQty = Number(data?.ClosingQty ?? (item?.OnHandQty ?? item?.stockQty ?? 0));
  const closingValue = Number(data?.ClosingValue ?? (item?.TotalCost ?? item?.totalValue ?? 0));

  const numLocale = language === "en" ? "en-US" : "vi-VN";

  const transactions = useMemo(() => {
    return data?.Transactions ?? [];
  }, [data]);

  const columns: ColumnsType<StockCardTransactionItem> = [
    {
      title: "STT",
      dataIndex: "RowNum",
      key: "RowNum",
      width: 50,
      align: "center",
      render: (val: number, _, index: number) => (
        <span style={{ color: "#718894", fontSize: 13 }}>{val ?? index + 1}</span>
      ),
    },
    {
      title: language === "en" ? "Doc Date" : "Ngày CT",
      dataIndex: "DocDate",
      key: "DocDate",
      width: 100,
      align: "center",
      render: (val: string) => (
        <span style={{ fontSize: 13, color: "#334155" }}>
          {val ? dayjs(val).format("DD/MM/YYYY") : "---"}
        </span>
      ),
    },
    {
      title: language === "en" ? "Doc No." : "Số chứng từ",
      dataIndex: "DocCode",
      key: "DocCode",
      width: 175,
      render: (val: string) => (
        <span
          style={{
            fontWeight: 600,
            color: "#008f89",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          {val || "---"}
        </span>
      ),
    },
    {
      title: language === "en" ? "Trans Type" : "Loại giao dịch",
      dataIndex: "TransType",
      key: "TransType",
      width: 140,
      render: (val: string, r: StockCardTransactionItem) => {
        const isReceipt = String(val).toLowerCase().includes("receipt");
        return (
          <div>
            <span
              style={{
                color: isReceipt ? "#16A34A" : "#DC2626",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {isReceipt
                ? language === "en" ? "Stock In" : "Nhập kho"
                : language === "en" ? "Stock Out" : "Xuất kho"}
            </span>
            {r.SubType && (
              <span style={{ fontSize: 11, color: "#718894", marginLeft: 4 }}>
                ({r.SubType})
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: language === "en" ? "Order / Ref" : "Đơn hàng",
      dataIndex: "ReferenceNo",
      key: "ReferenceNo",
      width: 155,
      render: (val: string) => (
        <span style={{ color: "#475569", fontSize: 12 }}>{val || "---"}</span>
      ),
    },
    {
      title: language === "en" ? "Description" : "Diễn giải",
      dataIndex: "Description",
      key: "Description",
      width: 180,
      ellipsis: true,
      render: (val: string) => (
        <span style={{ color: "#718894", fontSize: 13 }}>{val || "---"}</span>
      ),
    },
    // Nhóm Cột Nhập
    {
      title: language === "en" ? "Receipts in Period" : "Nhập trong kỳ",
      children: [
        {
          title: language === "en" ? "Quantity" : "Số lượng",
          dataIndex: "ReceiptQty",
          key: "ReceiptQty",
          width: 95,
          align: "right",
          render: (val: number) => (
            <span
              style={{
                color: val > 0 ? "#16A34A" : "#718894",
                fontWeight: val > 0 ? 600 : 400,
                fontSize: 13,
              }}
            >
              {val > 0 ? Number(val).toLocaleString(numLocale) : "-"}
            </span>
          ),
        },
        {
          title: language === "en" ? "Unit Price" : "Đơn giá",
          dataIndex: "ReceiptUnitPrice",
          key: "ReceiptUnitPrice",
          width: 110,
          align: "right",
          render: (val: number) => (
            <span style={{ color: "#334155", fontSize: 13 }}>
              {val > 0 ? Number(val).toLocaleString(numLocale) : "-"}
            </span>
          ),
        },
        {
          title: language === "en" ? "Amount" : "Thành tiền",
          dataIndex: "ReceiptAmount",
          key: "ReceiptAmount",
          width: 125,
          align: "right",
          render: (val: number) => (
            <span
              style={{
                color: val > 0 ? "#16A34A" : "#718894",
                fontWeight: val > 0 ? 600 : 400,
                fontSize: 13,
              }}
            >
              {val > 0 ? Number(val).toLocaleString(numLocale) : "-"}
            </span>
          ),
        },
      ],
    },
    // Nhóm Cột Xuất
    {
      title: language === "en" ? "Issues in Period" : "Xuất trong kỳ",
      children: [
        {
          title: language === "en" ? "Quantity" : "Số lượng",
          dataIndex: "IssueQty",
          key: "IssueQty",
          width: 95,
          align: "right",
          render: (val: number) => (
            <span
              style={{
                color: val > 0 ? "#DC2626" : "#718894",
                fontWeight: val > 0 ? 600 : 400,
                fontSize: 13,
              }}
            >
              {val > 0 ? Number(val).toLocaleString(numLocale) : "-"}
            </span>
          ),
        },
        {
          title: language === "en" ? "Unit Price" : "Đơn giá",
          dataIndex: "IssueUnitPrice",
          key: "IssueUnitPrice",
          width: 110,
          align: "right",
          render: (val: number) => (
            <span style={{ color: "#334155", fontSize: 13 }}>
              {val > 0 ? Number(val).toLocaleString(numLocale) : "-"}
            </span>
          ),
        },
        {
          title: language === "en" ? "Amount" : "Thành tiền",
          dataIndex: "IssueAmount",
          key: "IssueAmount",
          width: 125,
          align: "right",
          render: (val: number) => (
            <span
              style={{
                color: val > 0 ? "#DC2626" : "#718894",
                fontWeight: val > 0 ? 600 : 400,
                fontSize: 13,
              }}
            >
              {val > 0 ? Number(val).toLocaleString(numLocale) : "-"}
            </span>
          ),
        },
      ],
    },
    // Nhóm Cột Tồn Lũy Kế
    {
      title: language === "en" ? "Cumulative Balance" : "Tồn lũy kế",
      children: [
        {
          title: language === "en" ? "Quantity" : "Số lượng",
          dataIndex: "RunningQty",
          key: "RunningQty",
          width: 100,
          align: "right",
          render: (val: number) => (
            <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
              {Number(val || 0).toLocaleString(numLocale)}
            </span>
          ),
        },
        {
          title: language === "en" ? "Value" : "Giá trị",
          dataIndex: "RunningValue",
          key: "RunningValue",
          width: 130,
          align: "right",
          render: (val: number) => (
            <span style={{ fontWeight: 600, color: "#008f89", fontSize: 13 }}>
              {Number(val || 0).toLocaleString(numLocale)}
            </span>
          ),
        },
      ],
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 10 }}>
          <Space>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#dce5e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#008f89",
              }}
            >
              <FileTextOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#123443" }}>
                {language === "en" ? "Stock Card: " : "Thẻ kho: "}{itemName}
              </div>
              <div style={{ fontSize: 12, color: "#718894", fontWeight: 400 }}>
                {language === "en" ? "Item Code: " : "Mã VT: "}
                <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#008f89" }}>{itemCode}</span>
                {" • "}{language === "en" ? "Unit: " : "ĐVT: "}{unit}
                {" • "}{language === "en" ? "Warehouse: " : "Kho: "}{warehouseName}
              </div>
            </div>
          </Space>

          <Space size={8}>
            <RangePicker
              format="DD/MM/YYYY"
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  onDateRangeChange(dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD"));
                }
              }}
              allowClear={false}
              style={{ width: 235 }}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              style={{ borderRadius: 6, borderColor: "#CBD5E1" }}
            >
              {t.common.refresh}
            </Button>

            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{ borderRadius: 6, borderColor: "#CBD5E1" }}
            >
              {language === "en" ? "Print Stock Card" : "In Thẻ kho"}
            </Button>
          </Space>
        </div>
      }
      placement="right"
      width={1180}
      onClose={onClose}
      open={open}
      styles={{
        header: { borderBottom: "1px solid #dce5e6", padding: "14px 20px" },
        body: { padding: "18px 20px", background: "#f7fbfa" },
      }}
    >
      <Spin spinning={loading} tip={language === "en" ? "Loading stock card data..." : "Đang tải dữ liệu Thẻ kho..."}>
        {/* 1. KHỐI TỔNG HỢP NHANH 4 THẺ */}
        <Row gutter={[14, 14]} style={{ marginBottom: 16 }}>
          {/* Tồn đầu kỳ */}
          <Col span={6}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #dce5e6",
                borderRadius: 8,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, color: "#718894", marginBottom: 2 }}>
                {language === "en" ? "Opening Stock" : "Tồn đầu kỳ"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#123443" }}>
                {openingQty.toLocaleString(numLocale)}
              </div>
              <div style={{ fontSize: 12, color: "#718894", marginTop: 2 }}>
                {language === "en" ? "Value: " : "Giá trị: "}
                <span style={{ fontWeight: 500, color: "#123443" }}>{openingValue.toLocaleString(numLocale)}</span>
              </div>
            </div>
          </Col>

          {/* Tổng nhập trong kỳ */}
          <Col span={6}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #dce5e6",
                borderRadius: 8,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, color: "#16A34A", marginBottom: 2 }}>
                {language === "en" ? "Total Receipts in Period" : "Tổng nhập trong kỳ"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#16A34A" }}>
                {totalReceiptQty.toLocaleString(numLocale)}
              </div>
              <div style={{ fontSize: 12, color: "#718894", marginTop: 2 }}>
                {language === "en" ? "Value: " : "Giá trị: "}
                <span style={{ fontWeight: 500, color: "#16A34A" }}>{totalReceiptValue.toLocaleString(numLocale)}</span>
              </div>
            </div>
          </Col>

          {/* Tổng xuất trong kỳ */}
          <Col span={6}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #dce5e6",
                borderRadius: 8,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 2 }}>
                {language === "en" ? "Total Issues in Period" : "Tổng xuất trong kỳ"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>
                {totalIssueQty.toLocaleString(numLocale)}
              </div>
              <div style={{ fontSize: 12, color: "#718894", marginTop: 2 }}>
                {language === "en" ? "Value: " : "Giá trị: "}
                <span style={{ fontWeight: 500, color: "#DC2626" }}>{totalIssueValue.toLocaleString(numLocale)}</span>
              </div>
            </div>
          </Col>

          {/* Tồn cuối kỳ */}
          <Col span={6}>
            <div
              style={{
                background: "#dce5e6",
                border: "1px solid #b2ded9",
                borderRadius: 8,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, color: "#008f89", marginBottom: 2, fontWeight: 500 }}>
                {language === "en" ? "Closing Stock" : "Tồn cuối kỳ"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#007873" }}>
                {closingQty.toLocaleString(numLocale)}
              </div>
              <div style={{ fontSize: 12, color: "#008f89", marginTop: 2 }}>
                {language === "en" ? "Value: " : "Giá trị: "}
                <span style={{ fontWeight: 600, color: "#007873" }}>{closingValue.toLocaleString(numLocale)}</span>
              </div>
            </div>
          </Col>
        </Row>

        {/* 2. BẢNG PHÁT SINH BIẾN ĐỘNG THẺ KHO */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #dce5e6",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #dce5e6",
              fontWeight: 600,
              fontSize: 14,
              color: "#123443",
            }}
          >
            <span>{language === "en" ? "Stock card transaction details" : "Chi tiết các giao dịch xuất nhập Thẻ kho"}</span>
          </div>

          <Table
            size="middle"
            dataSource={transactions}
            columns={columns}
            rowKey={(r, idx) => `${r.RowNum ?? idx}_${r.DocCode ?? ""}`}
            pagination={false}
            bordered
            scroll={{ x: 1350 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={language === "en" ? "No stock movements in this period" : "Không có phát sinh giao dịch xuất nhập nào trong khoảng thời gian này"}
                />
              ),
            }}
            summary={() => {
              if (transactions.length === 0) return null;
              const getLeafCols = (cols: any[]): any[] =>
                cols.flatMap((c) => (c.children && c.children.length > 0 ? getLeafCols(c.children) : c));
              const leafCols = getLeafCols(columns);

              return (
                <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: 600 }}>
                  {leafCols.map((col: any, index: number) => {
                    const key = String(col.key || col.dataIndex || index);
                    if (key === "Description") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="center">
                          <span style={{ fontWeight: 700, color: "#123443", fontSize: 13 }}>
                            {language === "en" ? "Total Movements:" : "Tổng cộng phát sinh:"}
                          </span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "ReceiptQty") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span style={{ color: "#16A34A" }}>{totalReceiptQty.toLocaleString(numLocale)}</span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "ReceiptUnitPrice") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span>-</span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "ReceiptAmount") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span style={{ color: "#16A34A" }}>{totalReceiptValue.toLocaleString(numLocale)}</span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "IssueQty") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span style={{ color: "#DC2626" }}>{totalIssueQty.toLocaleString(numLocale)}</span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "IssueUnitPrice") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span>-</span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "IssueAmount") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span style={{ color: "#DC2626" }}>{totalIssueValue.toLocaleString(numLocale)}</span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "ClosingQty") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span style={{ color: "#123443" }}>{closingQty.toLocaleString(numLocale)}</span>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "ClosingAmount") {
                      return (
                        <Table.Summary.Cell key={key} index={index} align="right">
                          <span style={{ color: "#008f89", fontWeight: 700 }}>
                            {closingValue.toLocaleString(numLocale)}
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
      </Spin>
    </Drawer>
  );
}
