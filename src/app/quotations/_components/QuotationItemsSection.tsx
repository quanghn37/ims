"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Table,
  Tooltip,
  Popconfirm,
  Space,
  Typography,
  Tag,
} from "antd";
import {
  IconSettings,
  IconPlus,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import { parseDateSafe } from "./types";
import { SubmissionItem } from "@/types";
import ResizableTitle from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

function ExcelIcon() {
  return <IconFileSpreadsheet size={16} strokeWidth={1.8} style={{ color: "#16A34A" }} />;
}

interface QuotationItemsSectionProps {
  isEditing: boolean;
  isReadOnly: boolean;
  editingContract: any | null;
  submissions?: SubmissionItem[];
  loadingSubmissions?: boolean;
  onOpenAddItem?: () => void;
  onOpenEditItem?: (record: any) => void;
  onDeleteSubmission?: (submissionId: any) => void;
  onOpenImportExcel?: () => void;
}

export default function QuotationItemsSection({
  isEditing,
  isReadOnly,
  editingContract,
  submissions = [],
  loadingSubmissions = false,
  onOpenAddItem,
  onOpenEditItem,
  onDeleteSubmission,
  onOpenImportExcel,
}: QuotationItemsSectionProps) {
  const { t } = useTranslation();

  const initialSubmissionColumns = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 42,
        align: "center" as const,
        render: (_: any, __: any, idx: number) => (
          <span style={{ fontWeight: 500, color: "#718894", fontSize: 12 }}>{idx + 1}</span>
        ),
      },
      {
        title: t.table.itemName,
        dataIndex: "Description",
        key: "Description",
        width: 240,
        render: (val: string, r: any) => {
          const desc = val || r.Description || r.ItemName || "";
          const sCode =
            r.SystemCode || r.ItemCode || (r.MaterialId ? String(r.MaterialId) : "");
          return (
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#123443",
                  fontSize: 12,
                  wordBreak: "break-word",
                }}
              >
                {desc || "Vật tư trong bảng giá"}
              </div>
              {sCode && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#718894",
                    marginTop: 2,
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                  }}
                >
                  {sCode.startsWith("(") ? sCode : `(${sCode})`}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: t.table.unit,
        dataIndex: "Unit",
        key: "Unit",
        width: 55,
        align: "center" as const,
        render: (val: string) => (
          <span style={{ color: "#123443", fontSize: 12 }}>{val || "Cái"}</span>
        ),
      },
      {
        title: t.table.qty,
        dataIndex: "Qnty",
        key: "Qnty",
        align: "right" as const,
        width: 75,
        render: (val: number) => (
          <span style={{ color: "#123443", fontSize: 12 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.unitPrice,
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        align: "right" as const,
        width: 95,
        render: (val: number) => (
          <span style={{ color: "#123443", fontSize: 12 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.amount,
        dataIndex: "Amount",
        key: "Amount",
        align: "right" as const,
        width: 105,
        render: (val: number, r: any) => {
          const rawAmount = Number(
            val ?? Number(r.UnitPrice || 0) * Number(r.Qnty || 0)
          );
          return (
            <span style={{ color: "#123443", fontSize: 12 }}>
              {rawAmount.toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.tax,
        dataIndex: "TaxRate",
        key: "TaxRate",
        width: 60,
        align: "center" as const,
        render: (val: number) => (
          <span style={{ color: "#475569", fontWeight: 500, fontSize: 12 }}>
            {`${((Number(val) || 0) * 100).toFixed(0)}%`}
          </span>
        ),
      },
      {
        title: t.table.taxAmount,
        dataIndex: "TaxAmount",
        key: "TaxAmount",
        align: "right" as const,
        width: 85,
        render: (val: any, r: any) => {
          const rawAmount = Number(
            r.Amount ?? Number(r.UnitPrice || 0) * Number(r.Qnty || 0)
          );
          const taxVal =
            val !== undefined && val !== null && val !== ""
              ? Number(val)
              : rawAmount * (Number(r.TaxRate) || 0);
          return (
            <span style={{ color: "#123443", fontSize: 12 }}>
              {taxVal.toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.totalVat,
        key: "TotalAmountWithVat",
        align: "right" as const,
        width: 110,
        render: (_: any, r: any) => {
          const rawAmount = Number(
            r.Amount ?? Number(r.UnitPrice || 0) * Number(r.Qnty || 0)
          );
          const taxVal =
            r.TaxAmount !== undefined && r.TaxAmount !== null && r.TaxAmount !== ""
              ? Number(r.TaxAmount)
              : rawAmount * (Number(r.TaxRate) || 0);
          const totalVat = rawAmount + taxVal;
          return (
            <span style={{ color: "#123443", fontWeight: 600, fontSize: 12 }}>
              {totalVat.toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.effectiveDate,
        key: "FromDate",
        align: "center" as const,
        width: 95,
        render: (_: any, r: any) => {
          const raw =
            r.FromDate ||
            r.StartDate ||
            r.EffectiveDate ||
            r.ItemDate ||
            editingContract?.StartDate ||
            editingContract?.FromDate;
          const d = parseDateSafe(raw);
          return (
            <span style={{ color: "#334155", fontSize: 12 }}>
              {d ? d.format("DD/MM/YYYY") : "---"}
            </span>
          );
        },
      },
      {
        title: t.table.expiryDate,
        key: "ToDate",
        align: "center" as const,
        width: 105,
        render: (_: any, r: any) => {
          const raw =
            r.Enddate || r.EndDate || r.ToDate || r.ExpiredDate || r.ExpireDate;
          const d = parseDateSafe(raw);
          return (
            <span style={{ color: "#334155", fontSize: 12 }}>
              {d ? d.format("DD/MM/YYYY") : "---"}
            </span>
          );
        },
      },
      {
        title: (
          <Tooltip title={t.table.action}>
            <IconSettings size={15} strokeWidth={1.8} style={{ color: "#718894" }} />
          </Tooltip>
        ),
        key: "action",
        width: 80,
        align: "center" as const,
        fixed: "right" as const,
        render: (_: any, record: any) => {
          const rawEditable = record.EditAble ?? record.Editable;
          const isItemReadOnly =
            isReadOnly || rawEditable === 1 || rawEditable === "1";

          if (isItemReadOnly) {
            return (
              <ActionIconButton
                action="view"
                size="small"
                onClick={() => onOpenEditItem && onOpenEditItem(record)}
              />
            );
          }

          return (
            <Space size={6} wrap={false}>
              <ActionIconButton
                action="edit"
                size="small"
                onClick={() => onOpenEditItem && onOpenEditItem(record)}
              />
              <Popconfirm
                title={t.quotation.deleteItemConfirm}
                onConfirm={() =>
                  onDeleteSubmission &&
                  onDeleteSubmission(record.SubmissionId || record.LocalId)
                }
                okText={t.common.delete}
                cancelText={t.common.cancel}
                okButtonProps={{ danger: true }}
              >
                <ActionIconButton
                  action="delete"
                  size="small"
                />
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [onOpenEditItem, onDeleteSubmission, isReadOnly, editingContract, t]
  );

  const STORAGE_KEY_QUOTATION_ITEMS = "QUOTATION_ITEM_COL_WIDTHS";
  const [itemColumns, setItemColumns] = useState<any[]>(() => {
    let savedMap: Record<string, number> = {};
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_QUOTATION_ITEMS);
        if (saved) savedMap = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialSubmissionColumns.map((col) => {
      const k = String(col.key || col.dataIndex);
      return {
        ...col,
        width: col.key === "action" ? 75 : savedMap[k] || col.width,
      };
    });
  });

  useEffect(() => {
    let savedMap: Record<string, number> = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUOTATION_ITEMS);
      if (saved) savedMap = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    setItemColumns(
      initialSubmissionColumns.map((col) => {
        const k = String(col.key || col.dataIndex);
        return {
          ...col,
          width: col.key === "action" ? 75 : savedMap[k] || col.width,
        };
      })
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
        try {
          const widthMap: Record<string, number> = {};
          next.forEach((c) => {
            const k = String(c.key || c.dataIndex);
            if (c.width) widthMap[k] = c.width;
          });
          localStorage.setItem(
            STORAGE_KEY_QUOTATION_ITEMS,
            JSON.stringify(widthMap)
          );
        } catch (e) {
          console.error("Lỗi lưu kích thước cột:", e);
        }
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

  const detailScrollX = useMemo(() => {
    return resizableSubmissionColumns.reduce(
      (sum: number, col: any) => sum + (Number(col.width) || 100),
      0
    );
  }, [resizableSubmissionColumns]);

  if (!isEditing) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: "24px 16px",
          textAlign: "center",
          background: "#fafafa",
          borderRadius: 6,
          border: "1px dashed #d9d9d9",
          color: "#8c8c8c",
          fontSize: 13,
        }}
      >
        Sau khi tạo Bảng giá thành công, danh mục vật tư hàng hóa và tính năng Import Excel / Thêm vật tư sẽ được kích hoạt tại đây.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #dce5e6",
        borderRadius: 8,
        padding: "12px 14px",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text
            strong
            style={{
              fontSize: 13,
              color: "#008f89",
              fontWeight: 700,
              textTransform: "uppercase",
              lineHeight: "20px",
            }}
          >
            {t.section.materialInfo}
          </Text>
          <Tag
            style={{
              background: "#dce5e6",
              color: "#008f89",
              borderRadius: 12,
              border: "none",
              fontSize: 11,
              fontWeight: 500,
              lineHeight: "16px",
              padding: "1px 8px",
              margin: 0,
            }}
          >
            {submissions.length} {t.table.itemsCount}
          </Tag>
        </div>

        {!isReadOnly && (
          <Space size={8}>
            {onOpenImportExcel && (
              <Button
                icon={<ExcelIcon />}
                onClick={onOpenImportExcel}
                style={{
                  borderColor: "#dce5e6",
                  background: "#FFFFFF",
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: 500,
                  height: 36,
                  borderRadius: 8,
                }}
              >
                {t.common.importExcel}
              </Button>
            )}
            {onOpenAddItem && (
              <Button
                icon={<IconPlus size={16} strokeWidth={2} style={{ color: "#008f89" }} />}
                style={{
                  borderColor: "#dce5e6",
                  background: "#FFFFFF",
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: 500,
                  height: 36,
                  borderRadius: 8,
                }}
                onClick={onOpenAddItem}
              >
                {t.quotation.addMaterial}
              </Button>
            )}
          </Space>
        )}
      </div>

      <Table
        className="quotation-detail-table"
        tableLayout="fixed"
        components={{
          header: {
            cell: ResizableTitle,
          },
        }}
        dataSource={submissions}
        columns={resizableSubmissionColumns}
        rowKey={(r, index) =>
          r.id ?? r.SubmissionId ?? r.LocalId ?? `quotation_item_${index}`
        }
        loading={loadingSubmissions}
        pagination={false}
        size="small"
        bordered
        scroll={{ x: detailScrollX, y: 450 }}
        summary={(pageData) => {
          let totalQnty = 0;
          let totalAmount = 0;
          let totalTax = 0;

          pageData.forEach((item) => {
            totalQnty += Number(item.Qnty || 0);
            const raw = Number(
              item.Amount ?? Number(item.UnitPrice || 0) * Number(item.Qnty || 0)
            );
            const tax =
              item.TaxAmount !== undefined &&
              item.TaxAmount !== null &&
              item.TaxAmount !== ""
                ? Number(item.TaxAmount)
                : raw * (Number(item.TaxRate) || 0);
            totalAmount += raw;
            totalTax += tax;
          });

          const grandTotal = totalAmount + totalTax;

          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: "bold" }}>
                <Table.Summary.Cell index={0} align="center">
                  <Text style={{ color: "#94A3B8" }}>-</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: "#123443", fontSize: 13.5 }}>
                    {t.table.total}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="center">
                  <Text style={{ color: "#94A3B8" }}>-</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text style={{ color: "#123443", fontSize: 13.5 }}>
                    {totalQnty.toLocaleString("vi-VN")}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center">
                  <Text style={{ color: "#94A3B8" }}>-</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Text strong style={{ color: "#123443", fontSize: 13.5 }}>
                    {totalAmount.toLocaleString("vi-VN")}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="center">
                  <Text style={{ color: "#475569", fontSize: 13 }}>-</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <Text style={{ color: "#123443", fontSize: 13.5 }}>
                    {totalTax.toLocaleString("vi-VN")}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <Text strong style={{ color: "#123443", fontSize: 13.5 }}>
                    {grandTotal.toLocaleString("vi-VN")}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="center">
                  <Text style={{ color: "#94A3B8" }}>-</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="center">
                  <Text style={{ color: "#94A3B8" }}>-</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} />
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </div>
  );
}
