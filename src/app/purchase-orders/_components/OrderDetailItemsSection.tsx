"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Table,
  Tooltip,
  Popconfirm,
  Space,
  Typography,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconScale,
  IconRefresh,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import ResizableTitle from "@/components/table/ResizableTitle";
import { renderApprovalBadge } from "@/components/common/ApprovalBadge";
import { useTranslation } from "@/locales/LanguageContext";
import ErpDetailCard from "@/components/common/ErpDetailCard";

const STORAGE_KEY_DETAIL = "PO_DETAIL_COL_WIDTHS";
const { Text } = Typography;

interface OrderDetailItemsSectionProps {
  hasOrderHeader: boolean;
  items?: any[];
  setItems?: React.Dispatch<React.SetStateAction<any[]>>;
  loadingItems?: boolean;
  onDeleteItem?: (record: any) => void | Promise<void>;
  onEditItem?: (record: any) => void;
  onOpenPriceCompare?: () => void;
  onFetchWorkflow?: (submissionId: any, item?: any) => void;
  onRefreshItems?: () => void;
}

const extractOrgInfo = (val: any, record: any) => {
  const raw = String(
    val || record?.Orgcode || record?.OrgCode || record?.WBS || record?.Wbs || ""
  ).trim();
  let orgName = String(record?.OrgName || record?.Orgname || record?.BudgetDescription || "").trim();
  let orgCode = "";

  if (raw.includes(" - ")) {
    const parts = raw.split(" - ");
    orgCode = parts[0].trim();
    if (!orgName) {
      orgName = parts.slice(1).join(" - ").trim();
    }
  } else {
    const matchParen = raw.match(/\(([^)]+)\)/);
    if (matchParen) {
      orgCode = matchParen[1].trim();
      if (!orgName) {
        orgName = raw.replace(/\([^)]+\)/, "").trim();
      }
    } else {
      orgCode = raw;
    }
  }

  if (orgName) {
    const matchParen = orgName.match(/\(([^)]+)\)/);
    if (matchParen) {
      if (!orgCode || orgCode === orgName) {
        orgCode = matchParen[1].trim();
      }
      orgName = orgName.replace(/\([^)]+\)/, "").trim();
    }
  }

  orgCode = orgCode.replace(/^\(|\)$/g, "").trim();
  orgName = orgName.replace(/^\(|\)$/g, "").trim();

  return { orgCode, orgName };
};

export default function OrderDetailItemsSection({
  hasOrderHeader,
  items = [],
  setItems = () => {},
  loadingItems,
  onDeleteItem,
  onEditItem,
  onOpenPriceCompare,
  onFetchWorkflow,
  onRefreshItems,
}: OrderDetailItemsSectionProps) {
  const { t, language } = useTranslation();

  const handleDeleteItemRow = async (record: any) => {
    if (onDeleteItem) {
      await onDeleteItem(record);
    } else {
      const targetId = record.id || record.SubmissionId || record.LocalId;
      setItems((prev) =>
        prev.filter((it) => (it.id || it.SubmissionId || it.LocalId) !== targetId)
      );
    }
  };

  const totalQty = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.Qnty ?? 0) || 0), 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((acc, it) => {
      const q = Number(it.Qnty ?? 0);
      const p = Number(it.UnitPrice ?? 0);
      return (
        acc +
        (it.TotalPrice !== undefined
          ? Number(it.TotalPrice)
          : it.Amount !== undefined
          ? Number(it.Amount)
          : q * p)
      );
    }, 0);
  }, [items]);

  const totalTax = useMemo(() => {
    return items.reduce((acc, it) => {
      const q = Number(it.Qnty ?? 0);
      const p = Number(it.UnitPrice ?? 0);
      const raw =
        it.TotalPrice !== undefined
          ? Number(it.TotalPrice)
          : it.Amount !== undefined
          ? Number(it.Amount)
          : q * p;
      const rate =
        it.TaxRate !== undefined && it.TaxRate !== null ? Number(it.TaxRate) : 0.08;
      const tax =
        it.TaxAmount !== undefined && it.TaxAmount !== null && it.TaxAmount !== ""
          ? Number(it.TaxAmount)
          : raw * rate;
      return acc + tax;
    }, 0);
  }, [items]);

  const defaultDetailColWidths: Record<string, number> = useMemo(
    () => ({
      stt: 42,
      OrgCode: 100,
      OrgName: 150,
      ItemCode: 130,
      Description: 240,
      Unit: 55,
      Qnty: 75,
      UnitPrice: 95,
      TotalPrice: 105,
      TaxAmount: 65,
      TotalAmountWithVat: 110,
      StatusCode: 95,
      action: 70,
    }),
    []
  );

  const [detailColWidths, setDetailColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultDetailColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DETAIL);
      if (saved) {
        return { ...defaultDetailColWidths, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột chi tiết đơn hàng:", e);
    }
    return defaultDetailColWidths;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DETAIL);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDetailColWidths((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột chi tiết đơn hàng:", e);
    }
  }, []);

  const handleResizeDetailColumn =
    (colKey: string) =>
    (_: any, { size }: { size: { width: number } }) => {
      setDetailColWidths((prev) => {
        const updated = {
          ...prev,
          [colKey]: Math.max(size.width, 50),
        };
        try {
          localStorage.setItem(STORAGE_KEY_DETAIL, JSON.stringify(updated));
        } catch (e) {
          console.error("Lỗi lưu kích thước cột:", e);
        }
        return updated;
      });
    };

  const baseItemColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 50,
        align: "center",
        render: (_, __, idx) => (
          <span style={{ fontWeight: 500, color: "#718894", fontSize: 13 }}>{idx + 1}</span>
        ),
      },
      {
        title: t.table.orgCode || "OrgCode",
        dataIndex: "OrgCode",
        key: "OrgCode",
        width: 100,
        render: (val: any, record: any) => {
          const { orgCode } = extractOrgInfo(val, record);
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: orgCode ? "#1e293b" : "#94A3B8",
                fontSize: 12.5,
              }}
            >
              {orgCode || "---"}
            </span>
          );
        },
      },
      {
        title: t.table.orgName || "OrgName",
        dataIndex: "OrgName",
        key: "OrgName",
        width: 150,
        render: (val: any, record: any) => {
          const { orgName } = extractOrgInfo(val, record);
          return (
            <div
              style={{
                color: orgName ? "#123443" : "#94A3B8",
                fontSize: 12.5,
                wordBreak: "break-word",
              }}
            >
              {orgName || "---"}
            </div>
          );
        },
      },
      {
        title: t.table.itemCode,
        dataIndex: "ItemCode",
        key: "ItemCode",
        width: 130,
        render: (_: any, record: any) => {
          const sCode = record.ItemCode || record.SystemCode || "";
          const name = record.Description || record.ItemName || "";
          const matchParen = name.match(/\(([^)]+)\)/);
          const extractedCode = sCode || (matchParen ? matchParen[1] : "");
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: extractedCode ? "#1e293b" : "#94A3B8",
                fontSize: 12.5,
              }}
            >
              {extractedCode || "---"}
            </span>
          );
        },
      },
      {
        title: t.table.itemName,
        dataIndex: "Description",
        key: "Description",
        width: 240,
        render: (_, record) => {
          const name = record.Description || record.ItemName || "";
          const matchParen = name.match(/\(([^)]+)\)/);
          let mainTitle = name;
          let subTitle = record.Remarks || record.Spec || "";
          if (matchParen) {
            mainTitle = name.replace(/\([^)]+\)/, "").trim();
          }
          return (
            <div>
              <div style={{ color: "#123443", fontSize: 12.5, wordBreak: "break-word" }}>
                {mainTitle || "---"}
              </div>
              {subTitle && (
                <div style={{ fontSize: 11, color: "#718894", marginTop: 2, wordBreak: "break-word" }}>
                  {subTitle}
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
        width: 70,
        align: "center",
        render: (val, record) => (
          <span style={{ color: "#123443", fontSize: 13 }}>
            {val || record.Unit || "---"}
          </span>
        ),
      },
      {
        title: t.table.qty,
        dataIndex: "Qnty",
        key: "Qnty",
        width: 95,
        align: "right",
        render: (val) => (
          <span style={{ color: "#123443", fontSize: 13 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.unitPrice,
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        width: 110,
        align: "right",
        render: (val) => (
          <span style={{ color: "#123443", fontSize: 13 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.amount,
        dataIndex: "TotalPrice",
        key: "TotalPrice",
        width: 130,
        align: "right",
        render: (val, r) => {
          const total =
            val !== undefined
              ? val
              : r.TotalPrice !== undefined
              ? r.TotalPrice
              : Number(r.Qnty || 0) * Number(r.UnitPrice || 0);
          return (
            <span style={{ color: "#123443", fontSize: 13 }}>
              {Number(total || 0).toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.vat,
        dataIndex: "TaxAmount",
        key: "TaxAmount",
        width: 70,
        align: "center",
        render: (_, r) => {
          const taxRate =
            r.TaxRate !== undefined && r.TaxRate !== null ? Number(r.TaxRate) : 0.08;
          const ratePercent = `${Math.round(taxRate * 100)}%`;
          return (
            <span style={{ color: "#475569", fontSize: 13 }}>
              {ratePercent}
            </span>
          );
        },
      },
      {
        title: t.table.totalVat,
        key: "TotalAmountWithVat",
        width: 140,
        align: "right",
        render: (_, r) => {
          const rawAmount = Number(
            r.TotalPrice ?? r.Amount ?? Number(r.UnitPrice || 0) * Number(r.Qnty || 0)
          );
          const taxRate =
            r.TaxRate !== undefined && r.TaxRate !== null ? Number(r.TaxRate) : 0.08;
          const taxVal =
            r.TaxAmount !== undefined && r.TaxAmount !== null && r.TaxAmount !== ""
              ? Number(r.TaxAmount)
              : rawAmount * taxRate;
          const totalWithVat = rawAmount + taxVal;
          return (
            <span style={{ color: "#123443", fontSize: 13 }}>
              {totalWithVat.toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.status,
        dataIndex: "StatusCode",
        key: "StatusCode",
        width: 120,
        align: "center",
        render: (val, record) => {
          const subId = record.SubmissionId || record.LocalId;
          const rawStatus =
            val !== undefined && val !== null && val !== ""
              ? String(val).trim()
              : record?.StatusCode || "";
          const isNotStarted =
            !rawStatus ||
            rawStatus.toLowerCase().includes("not-started") ||
            rawStatus === "0";
          return (
            <Tooltip
              title={
                subId
                  ? `${t.purchaseOrder.workflowTooltip} (#${subId})`
                  : t.purchaseOrder.noWorkflow
              }
            >
              <span
                onClick={() => {
                  if (subId && onFetchWorkflow) {
                    onFetchWorkflow(subId, record);
                  }
                }}
                style={{
                  cursor: subId ? "pointer" : "default",
                  display: "inline-block",
                }}
              >
                {renderApprovalBadge(val, record, language)}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: t.table.action,
        key: "action",
        width: 75,
        align: "center",
        fixed: "right" as const,
        render: (_, record) => {
          return (
            <Space size={6}>
              <ActionIconButton
                action="edit"
                size="small"
                onClick={() => onEditItem && onEditItem(record)}
              />
              <Popconfirm
                title={t.purchaseOrder.deleteItemConfirm}
                onConfirm={() => handleDeleteItemRow(record)}
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
    [onEditItem, onFetchWorkflow, t]
  );

  const mergedItemColumns = useMemo(() => {
    return baseItemColumns.map((col: any) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = detailColWidths[colKey] || col.width || 100;
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResizeDetailColumn(colKey),
        }),
      };
    });
  }, [baseItemColumns, detailColWidths]);

  const detailScrollX = useMemo(() => {
    return mergedItemColumns.reduce(
      (sum: number, col: any) => sum + (Number(col.width) || 100),
      0
    );
  }, [mergedItemColumns]);

  if (!hasOrderHeader) {
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
        {t.purchaseOrder.notCreatedYet}
      </div>
    );
  }

  return (
    <ErpDetailCard
      title={t.section.materialInfo}
      actions={
        hasOrderHeader ? (
          <Space size={8}>
            {onRefreshItems && (
              <Button
                icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
                onClick={onRefreshItems}
                loading={loadingItems}
                style={{
                  borderColor: "#dce5e6",
                  background: "#FFFFFF",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 500,
                  height: 32,
                  borderRadius: 6,
                }}
              >
                {t.common.refresh}
              </Button>
            )}
            {onOpenPriceCompare && (
              <Button
                icon={<IconScale size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
                style={{
                  borderColor: "#dce5e6",
                  background: "#FFFFFF",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 500,
                  height: 32,
                  borderRadius: 6,
                }}
                onClick={onOpenPriceCompare}
                disabled={!hasOrderHeader}
              >
                {t.purchaseOrder.priceCompare}
              </Button>
            )}
          </Space>
        ) : null
      }
    >

      <Table
        className="erp-detail-table po-order-table"
        rowKey={(r, index) =>
          r.id ?? r.SubmissionId ?? r.LocalId ?? `order_form_item_${index}`
        }
        size="small"
        bordered
        components={{ header: { cell: ResizableTitle } }}
        columns={mergedItemColumns}
        dataSource={items}
        pagination={false}
        loading={loadingItems}
        scroll={{ x: detailScrollX, y: 450 }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: "bold" }}>
              {mergedItemColumns.map((col: any, index: number) => {
                const key = String(col.key || col.dataIndex || index);
                if (key === "ItemName" || key === "Description") {
                  return (
                    <Table.Summary.Cell key={key} index={index} align="right">
                      <Text strong style={{ color: "#123443", fontSize: 13.5 }}>
                        {t.table.total}
                      </Text>
                    </Table.Summary.Cell>
                  );
                }
                if (key === "Qnty") {
                  return (
                    <Table.Summary.Cell key={key} index={index} align="right">
                      <Text style={{ color: "#123443", fontSize: 13.5 }}>
                        {totalQty.toLocaleString("vi-VN")}
                      </Text>
                    </Table.Summary.Cell>
                  );
                }
                if (key === "TotalPrice" || key === "Amount") {
                  return (
                    <Table.Summary.Cell key={key} index={index} align="right">
                      <Text strong style={{ color: "#123443", fontSize: 13.5 }}>
                        {totalAmount.toLocaleString("vi-VN")}
                      </Text>
                    </Table.Summary.Cell>
                  );
                }
                if (key === "TaxAmount") {
                  return (
                    <Table.Summary.Cell key={key} index={index} align="center">
                      <Text style={{ color: "#475569", fontSize: 13 }}>8%</Text>
                    </Table.Summary.Cell>
                  );
                }
                if (key === "TotalAmountWithVat") {
                  return (
                    <Table.Summary.Cell key={key} index={index} align="right">
                      <Text strong style={{ color: "#123443", fontSize: 13.5 }}>
                        {(totalAmount + totalTax).toLocaleString("vi-VN")}
                      </Text>
                    </Table.Summary.Cell>
                  );
                }
                return (
                  <Table.Summary.Cell key={key} index={index} align="center">
                    <Text style={{ color: "#94A3B8" }}>-</Text>
                  </Table.Summary.Cell>
                );
              })}
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </ErpDetailCard>
  );
}
