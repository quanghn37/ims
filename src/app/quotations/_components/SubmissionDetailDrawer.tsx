"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Table,
  Button,
  Typography,
  Tooltip,
  Space,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlusOutlined,
  FileExcelOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { ContractItem, SubmissionItem } from "@/types";
import { parseDateSafe } from "./types";
import ResizableTitle from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;


const ExcelIcon = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 16,
      height: 16,
      verticalAlign: "middle",
      marginRight: 2,
    }}
  >
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        fill="#107C41"
      />
      <path d="M14 2v6h6" fill="#0E5E31" />
      <path
        d="M8.3 17.5l2-3.2 2 3.2h1.8l-2.8-4.2 2.6-3.8h-1.8l-1.8 2.9-1.8-2.9H6.9l2.6 3.8-2.8 4.2h1.6z"
        fill="#FFFFFF"
      />
    </svg>
  </span>
);

interface SubmissionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedContract: ContractItem | null;
  submissions: SubmissionItem[];
  loadingSubmissions: boolean;
  onOpenAddItem: () => void;
  onOpenEditItem: (record: any) => void;
  onDeleteSubmission: (submissionId: any) => void;
  onFetchWorkflow: (submissionId: any) => void;
  onOpenImportExcel: () => void;
}

export default function SubmissionDetailDrawer({
  open,
  onClose,
  selectedContract,
  submissions,
  loadingSubmissions,
  onOpenAddItem,
  onOpenEditItem,
  onDeleteSubmission,
  onFetchWorkflow,
  onOpenImportExcel,
}: SubmissionDetailDrawerProps) {
  const { t, language } = useTranslation();
  const numLocale = language === "en" ? "en-US" : "vi-VN";

  const isReadOnly = Boolean(
    selectedContract && (selectedContract.Editable === 0 || selectedContract.Editable === "0")
  );

  const initialSubmissionColumns = useMemo(
    () => [
    {
      title: t("common.materialCode") || "Mã Vật tư",
      dataIndex: "SystemCode",
      key: "SystemCode",
      width: 160,
      render: (val: any, r: any) => (
        <Text style={{ whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 12.5 }}>
          {val || `#${r.MaterialId || r.ItemId || r.LocalId}`}
        </Text>
      ),
    },
    {
      title: t("common.materialName") || "Tên vật tư",
      dataIndex: "Description",
      key: "Description",
      render: (val: string, r: any) => (
        <Text>{val || r.Remarks || (language === "en" ? "Price list item" : "Vật tư trong bảng giá")}</Text>
      ),
    },
    {
      title: t("common.unit") || "ĐVT",
      dataIndex: "Unit",
      key: "Unit",
      width: 75,
      align: "center" as const,
      render: (val: string) => val || (language === "en" ? "Pcs" : "Cái"),
    },
    {
      title: t("common.quantity") || "Số lượng",
      dataIndex: "Qnty",
      key: "Qnty",
      align: "right" as const,
      width: 90,
      render: (val: number) => Number(val || 0).toLocaleString(numLocale),
    },
    {
      title: t("common.unitPrice") || "Đơn giá",
      dataIndex: "UnitPrice",
      key: "UnitPrice",
      align: "right" as const,
      width: 125,
      render: (val: number) => <Text style={{ color: "#262626" }}>{Number(val || 0).toLocaleString(numLocale)}</Text>,
    },
    {
      title: t("common.subtotal") || "Thành tiền",
      dataIndex: "Amount",
      key: "Amount",
      align: "right" as const,
      width: 135,
      render: (val: number, r: any) => {
        const rawAmount = Number(val ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
        return <Text style={{ color: "#262626" }}>{rawAmount.toLocaleString(numLocale)}</Text>;
      },
    },
    {
      title: t("common.taxRate") || "Thuế",
      dataIndex: "TaxRate",
      key: "TaxRate",
      width: 75,
      align: "center" as const,
      render: (val: number) => `${((Number(val) || 0) * 100).toFixed(0)}%`,
    },
    {
      title: t("common.taxAmount") || "Tiền thuế",
      dataIndex: "TaxAmount",
      key: "TaxAmount",
      align: "right" as const,
      width: 125,
      render: (val: any, r: any) => {
        const rawAmount = Number(r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
        const taxVal =
          val !== undefined && val !== null && val !== ""
            ? Number(val)
            : rawAmount * (Number(r.TaxRate) || 0);
        return <Text style={{ color: "#262626" }}>{taxVal.toLocaleString(numLocale)}</Text>;
      },
    },
    {
      title: t("common.totalWithVat") || "Thành tiền VAT",
      key: "TotalAmountWithVat",
      align: "right" as const,
      width: 140,
      render: (_: any, r: any) => {
        const rawAmount = Number(r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
        const taxVal =
          r.TaxAmount !== undefined && r.TaxAmount !== null && r.TaxAmount !== ""
            ? Number(r.TaxAmount)
            : rawAmount * (Number(r.TaxRate) || 0);
        const totalVat = rawAmount + taxVal;
        return (
          <Text strong style={{ color: "#262626" }}>
            {totalVat.toLocaleString(numLocale)}
          </Text>
        );
      },
    },
    {
      title: t("common.effectiveDate") || "Ngày hiệu lực",
      key: "FromDate",
      align: "center" as const,
      width: 110,
      render: (_: any, r: any) => {
        const raw =
          r.FromDate ||
          r.StartDate ||
          r.EffectiveDate ||
          r.ItemDate ||
          selectedContract?.StartDate ||
          selectedContract?.FromDate;
        const d = parseDateSafe(raw);
        return <Text>{d ? d.format("DD/MM/YYYY") : "---"}</Text>;
      },
    },
    {
      title: t("common.expiryDate") || "Ngày hết hiệu lực",
      key: "ToDate",
      align: "center" as const,
      width: 130,
      render: (_: any, r: any) => {
        const raw =
          r.Enddate ||
          r.EndDate ||
          r.ToDate ||
          r.ExpiredDate ||
          r.ExpireDate;
        const d = parseDateSafe(raw);
        return <Text>{d ? d.format("DD/MM/YYYY") : "---"}</Text>;
      },
    },
    {
      title: <Tooltip title={t("common.action") || "Thao tác"}><SettingOutlined style={{ fontSize: 13, color: "#8c8c8c" }} /></Tooltip>,
      key: "action",
      width: 80,
      align: "center" as const,
      fixed: "right" as const,
      onCell: () => ({ style: { padding: "4px 4px", whiteSpace: "nowrap" } }),
      render: (_: any, record: any) => (
        <Space size={6} wrap={false}>
          <Tooltip title={isReadOnly ? (t("common.viewDetail") || "Xem chi tiết") : (t("common.edit") || "Chỉnh sửa")}>
            <Button
              type="text"
              size="small"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: isReadOnly ? "#f5f5f5" : "#e6f4ff",
                borderColor: isReadOnly ? "#d9d9d9" : "#bae0ff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              icon={
                isReadOnly ? (
                  <EyeOutlined style={{ color: "#718894", fontSize: 13 }} />
                ) : (
                  <EditOutlined style={{ color: "#008f89", fontSize: 13 }} />
                )
              }
              onClick={() => onOpenEditItem(record)}
            />
          </Tooltip>
          {!isReadOnly && (
            <Popconfirm
              title={language === "en" ? "Remove this item from the price list?" : "Xóa vật tư này khỏi bảng giá?"}
              onConfirm={() => onDeleteSubmission(record.SubmissionId || record.LocalId)}
              okText={t("common.delete") || "Xóa"}
              cancelText={t("common.cancel") || "Hủy"}
              okButtonProps={{ danger: true }}
            >
              <Tooltip title={t("common.delete") || "Xóa vật tư"}>
                <Button
                  danger
                  type="text"
                  size="small"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "#fff1f0",
                    borderColor: "#ffa39e",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: 13 }} />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [onOpenEditItem, onDeleteSubmission, isReadOnly, selectedContract, t, language, numLocale]);

  const [itemColumns, setItemColumns] = useState<any[]>(initialSubmissionColumns);

  useEffect(() => {
    setItemColumns((prev) =>
      initialSubmissionColumns.map((col, idx) => ({
        ...col,
        width: col.key === "action" ? 50 : (prev[idx]?.width || col.width),
      }))
    );
  }, [initialSubmissionColumns]);

  const handleResizeItemColumn =
    (index: number) =>
    (_: any, { size }: { size: { width: number } }) => {
      setItemColumns((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          width: Math.max(size.width, 50),
        };
        return next;
      });
    };

  const resizableSubmissionColumns = useMemo(
    () =>
      itemColumns.map((col, index) => ({
        ...col,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResizeItemColumn(index),
        }),
      })),
    [itemColumns]
  );

  return (
    <Drawer
      title={
        <div>
          <Text strong style={{ fontSize: 16 }}>
            {language === "en" ? "Price List Details #" : "Chi tiết Bảng giá #"}{selectedContract?.ContractId}: {selectedContract?.Description}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {language === "en" ? "Vendor ID: " : "NCC ID: "}{selectedContract?.ClientID || selectedContract?.ClientId} | {language === "en" ? "Currency: " : "Tiền tệ: "}{selectedContract?.Currency || "VND"}
          </Text>
        </div>
      }
      placement="right"
      width="80%"
      open={open}
      onClose={onClose}
      extra={
        isReadOnly ? (
          <Tag color="orange" style={{ margin: 0 }}>
            {language === "en" ? "Editing locked" : "Đã khóa chỉnh sửa"}
          </Tag>
        ) : (
          <Space>
            <Button
              shape="round"
              icon={<ExcelIcon />}
              onClick={onOpenImportExcel}
              style={{
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {t("common.importExcel") || "Import Excel"}
            </Button>
            <Button
              shape="round"
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenAddItem}
            >
              {t("common.addItem") || (language === "en" ? "Add Item" : "Thêm vật tư")}
            </Button>
          </Space>
        )
      }
    >
      <Table
        components={{
          header: {
            cell: ResizableTitle,
          },
        }}
        dataSource={submissions}
        columns={resizableSubmissionColumns}
        rowKey={(r, index) => r.SubmissionId ?? r.LocalId ?? `sub_detail_${index}`}
        loading={loadingSubmissions}
        pagination={false}
        size="small"
        bordered={false}
        scroll={{ x: "max-content" }}
        summary={(pageData) => {
          let totalQnty = 0;
          let totalAmount = 0;
          let totalTax = 0;

          pageData.forEach((item) => {
            totalQnty += Number(item.Qnty || 0);
            const raw = Number(item.Amount ?? (Number(item.UnitPrice || 0) * Number(item.Qnty || 0)));
            const tax =
              item.TaxAmount !== undefined && item.TaxAmount !== null && item.TaxAmount !== ""
                ? Number(item.TaxAmount)
                : raw * (Number(item.TaxRate) || 0);
            totalAmount += raw;
            totalTax += tax;
          });

          const grandTotal = totalAmount + totalTax;

          return (
            <Table.Summary.Row style={{ background: "#f8fafd", borderTop: "2px solid #e6f0fa" }}>
              <Table.Summary.Cell index={0} colSpan={3}>
                <Text strong style={{ color: "#262626", fontSize: 13 }}>
                  {t("common.total") || "Tổng cộng"}:
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ color: "#262626" }}>{totalQnty.toLocaleString(numLocale)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right" />
              <Table.Summary.Cell index={3} align="right">
                <Text strong style={{ color: "#262626" }}>{totalAmount.toLocaleString(numLocale)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="center" />
              <Table.Summary.Cell index={5} align="right">
                <Text strong style={{ color: "#262626" }}>{totalTax.toLocaleString(numLocale)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <Text strong style={{ color: "#008f89", fontSize: 13.5 }}>
                  {grandTotal.toLocaleString(numLocale)}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="center" />
              <Table.Summary.Cell index={8} align="center" />
              <Table.Summary.Cell index={9} align="center" />
            </Table.Summary.Row>
          );
        }}
      />
    </Drawer>
  );
}
