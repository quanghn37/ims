"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  IconScale,
  IconRefresh,
  IconSettings,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import {
  ContractMaterialItem,
  PriceListItem,
  TreeRowItem,
  UpsertMatequipSubmissionParams,
  parseDateSafe,
} from "../types";
import ContractMaterialEditDrawer from "./ContractMaterialEditDrawer";
import ContractPriceListReconcileModal from "./ContractPriceListReconcileModal";
import PriceListDetailModal from "./PriceListDetailModal";
import ResizableTitle from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";

const STORAGE_KEY_CONTRACT_DETAIL = "CONTRACT_DETAIL_COL_WIDTHS";

const defaultColWidths: Record<string, number> = {
  QuotationCode: 220,
  ItemCode: 130,
  ItemName: 240,
  Unit: 65,
  Qnty: 80,
  UnitPrice: 105,
  Amount: 115,
  TaxRate: 65,
  TaxAmount: 95,
  TotalAmountWithVat: 125,
  FromDate: 105,
  ToDate: 105,
  action: 80,
};

interface ContractPriceListsSectionProps {
  isPriceListSectionExpanded: boolean;
  setIsPriceListSectionExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  searchAssigned?: string;
  setSearchAssigned?: (val: string) => void;
  filteredAssignedPriceLists?: PriceListItem[];
  availablePriceLists: PriceListItem[];
  loadingAvailable?: boolean;
  effectiveClientId: any;
  effectiveSubconOf: any;
  effectiveContractId?: any;
  contractDescription?: string;
  fetchAvailableQuotations?: (cId?: any, sOf?: any, contractId?: any) => Promise<any>;
  handleReconcileItems: (selectedItems: TreeRowItem[], selectedPriceLists: PriceListItem[]) => Promise<void>;
  handleRemoveSingle?: (item: PriceListItem) => void;
  viewingPriceList: PriceListItem | null;
  setViewingPriceList: (item: PriceListItem | null) => void;
  isEditing?: boolean;
  isTaskAssigned?: boolean;
  materialItems: ContractMaterialItem[];
  loadingMaterials: boolean;
  onDeleteMaterialItem?: (record: ContractMaterialItem) => void;
  onUpdateMaterialItem?: (payload: UpsertMatequipSubmissionParams) => Promise<boolean | void>;
  onRefreshMaterials?: () => void;
}

export default function ContractPriceListsSection({
  isPriceListSectionExpanded,
  setIsPriceListSectionExpanded,
  availablePriceLists,
  effectiveClientId,
  effectiveSubconOf,
  effectiveContractId,
  contractDescription,
  handleReconcileItems,
  viewingPriceList,
  setViewingPriceList,
  isEditing = false,
  isTaskAssigned = false,
  materialItems = [],
  loadingMaterials = false,
  onDeleteMaterialItem,
  onUpdateMaterialItem,
  onRefreshMaterials,
}: ContractPriceListsSectionProps) {
  const { t, language } = useTranslation();
  const isEn = language === "en";
  const hasContractId = Boolean(effectiveContractId || isEditing);
  // States cho Drawer chỉnh sửa chi tiết vật tư
  const [editingMaterial, setEditingMaterial] = useState<ContractMaterialItem | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // State cho Modal Đối chiếu Bảng giá
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [submittingReconcile, setSubmittingReconcile] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Gom nhóm danh sách vật tư theo Hợp đồng (Tree structure - phong cách Đối chiếu Bảng giá)
  const treeMaterialData = useMemo(() => {
    if (!materialItems || materialItems.length === 0) return [];

    const groupMap = new Map<string, { code: string; items: ContractMaterialItem[] }>();

    materialItems.forEach((it) => {
      const code = String(it.ContractCode || "CONTRACT").trim();
      if (!groupMap.has(code)) {
        groupMap.set(code, { code, items: [] });
      }
      groupMap.get(code)!.items.push(it);
    });

    return Array.from(groupMap.values()).map((group) => {
      const parentKey = `contract_group_${group.code}`;
      const children = group.items.map((it, idx) => ({
        ...it,
        key: it.uniqueKey || `item_${group.code}_${it.SubmissionId || it.LocalId || idx}`,
        isParent: false,
      }));

      const signDate =
        group.items[0]?.FromDate ||
        group.items[0]?.StartDate ||
        group.items[0]?.signDate ||
        group.items[0]?.ItemDate ||
        "";

      return {
        key: parentKey,
        isParent: true,
        ContractCode: group.code,
        signDate,
        children,
      };
    });
  }, [materialItems]);

  // Mặc định mở rộng tất cả các nhóm hợp đồng
  useEffect(() => {
    if (treeMaterialData.length > 0) {
      setExpandedRowKeys(treeMaterialData.map((p) => p.key));
    }
  }, [treeMaterialData]);

  const handleOpenEditDrawer = (record: ContractMaterialItem) => {
    setEditingMaterial(record);
  };

  const handleSaveEditDrawer = async (payload: UpsertMatequipSubmissionParams) => {
    if (!onUpdateMaterialItem) return;
    setSubmittingEdit(true);
    try {
      const ok = await onUpdateMaterialItem(payload);
      if (ok !== false) {
        setEditingMaterial(null);
      }
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleConfirmReconcile = async (
    selectedItems: TreeRowItem[],
    selectedPriceLists: PriceListItem[]
  ) => {
    setSubmittingReconcile(true);
    try {
      await handleReconcileItems(selectedItems, selectedPriceLists);
      setIsReconcileModalOpen(false);
    } finally {
      setSubmittingReconcile(false);
    }
  };

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTRACT_DETAIL);
      if (saved) {
        return { ...defaultColWidths, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Lỗi đọc kích thước cột chi tiết vật tư:", e);
    }
    return defaultColWidths;
  });

  const handleResizeColumn = (key: string) => (_: any, { size }: { size: { width: number } }) => {
    setColWidths((prev) => {
      const next = { ...prev, [key]: Math.max(50, size.width) };
      try {
        localStorage.setItem(STORAGE_KEY_CONTRACT_DETAIL, JSON.stringify(next));
      } catch (e) {
        console.error("Lỗi lưu kích thước cột:", e);
      }
      return next;
    });
  };

  // Cột cơ sở bảng Section II (Chi tiết vật tư của Hợp đồng theo Cây Hợp đồng)
  const baseMaterialColumns = useMemo(
    () => {
      const cols: any[] = [
        {
          title: t.table.priceList || (isEn ? "Price List" : "Bảng giá"),
          key: "QuotationCode",
          width: colWidths.QuotationCode || defaultColWidths.QuotationCode,
          render: (_: any, r: any) => {
            if (r.isParent) {
              return (
                <span
                  style={{
                    position: "sticky",
                    left: 38,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <strong
                    style={{
                      color: "#008f89",
                      fontSize: 13,
                      fontFamily: "monospace",
                      letterSpacing: "0.2px",
                      verticalAlign: "middle",
                    }}
                  >
                    {r.ContractCode}
                  </strong>
                </span>
              );
            }
            return (
              <span style={{ color: "#123443", fontSize: 13, fontWeight: 500, fontFamily: "monospace" }}>
                {r.QuotationCode || r.PriceListCode || "---"}
              </span>
            );
          },
        },
        {
          title: t.table.itemCode || (isEn ? "Item Code" : "Mã VT"),
          key: "ItemCode",
          width: colWidths.ItemCode || defaultColWidths.ItemCode,
          render: (_: any, r: any) => {
            if (r.isParent) return null;
            const sCode = r.SystemCode || r.ItemCode || (r.MaterialId ? String(r.MaterialId) : "");
            return (
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: sCode ? "#1e293b" : "#94A3B8",
                  fontSize: 12.5,
                }}
              >
                {sCode ? sCode.replace(/^\(|\)$/g, "") : "---"}
              </span>
            );
          },
        },
        {
          title: t.table.itemName || (isEn ? "Material Name" : "Tên vật tư"),
          key: "ItemName",
          width: colWidths.ItemName || defaultColWidths.ItemName,
          render: (_: any, r: any) => {
            if (r.isParent) return null;
            const name = r.Description || r.ItemName || (isEn ? "Material" : "Vật tư");
            const matchParen = name.match(/\(([^)]+)\)/);
            const cleanName = matchParen ? name.replace(/\([^)]+\)/, "").trim() : name;
            return (
              <div style={{ lineHeight: "16px", margin: 0, padding: 0 }}>
                <div style={{ fontWeight: 400, color: "#123443", fontSize: 12.5, wordBreak: "break-word" }}>
                  {cleanName}
                </div>
              </div>
            );
          },
        },
        {
          title: t.table.unit || (isEn ? "Unit" : "ĐVT"),
          dataIndex: "Unit",
          key: "Unit",
          width: colWidths.Unit || defaultColWidths.Unit,
          align: "center" as const,
          render: (val: string, r: any) => (r.isParent ? null : val || (isEn ? "Pcs" : "Cái")),
        },
        {
          title: t.table.qty || (isEn ? "Quantity" : "Số lượng"),
          dataIndex: "Qnty",
          key: "Qnty",
          width: colWidths.Qnty || defaultColWidths.Qnty,
          align: "right" as const,
          render: (val: number, r: any) =>
            r.isParent ? null : (
              <span style={{ color: "#123443", fontSize: 13 }}>
                {Number(val ?? r.Qnty ?? 0).toLocaleString("vi-VN")}
              </span>
            ),
        },
        {
          title: t.table.unitPrice || (isEn ? "Unit Price" : "Đơn giá"),
          dataIndex: "UnitPrice",
          key: "UnitPrice",
          width: colWidths.UnitPrice || defaultColWidths.UnitPrice,
          align: "right" as const,
          render: (val: number, r: any) =>
            r.isParent ? null : (
              <span style={{ color: "#123443", fontSize: 13 }}>
                {Number(val ?? r.UnitPrice ?? 0).toLocaleString("vi-VN")}
              </span>
            ),
        },
        {
          title: t.table.amount || (isEn ? "Amount" : "Thành tiền"),
          dataIndex: "Amount",
          key: "Amount",
          width: colWidths.Amount || defaultColWidths.Amount,
          align: "right" as const,
          render: (val: any, r: any) => {
            if (r.isParent) return null;
            const raw = Number(val ?? r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
            return <span style={{ color: "#123443", fontSize: 13 }}>{raw.toLocaleString("vi-VN")}</span>;
          },
        },
        {
          title: t.table.tax || (isEn ? "VAT Rate" : "Thuế VAT"),
          dataIndex: "TaxRate",
          key: "TaxRate",
          width: colWidths.TaxRate || defaultColWidths.TaxRate,
          align: "center" as const,
          render: (val: any, r: any) => (r.isParent ? null : `${((Number(val) || 0) * 100).toFixed(0)}%`),
        },
        {
          title: t.table.taxAmount || (isEn ? "VAT Amount" : "Tiền thuế"),
          dataIndex: "TaxAmount",
          key: "TaxAmount",
          width: colWidths.TaxAmount || defaultColWidths.TaxAmount,
          align: "right" as const,
          render: (val: any, r: any) => {
            if (r.isParent) return null;
            const rawAmount = Number(r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
            const rawTax = Number(r.TaxRate) || 0;
            const taxRate = rawTax > 1 ? rawTax / 100 : rawTax;
            const taxVal =
              val !== undefined && val !== null
                ? Number(val)
                : rawAmount * taxRate;
            return (
              <span style={{ color: "#123443", fontSize: 13 }}>
                {taxVal.toLocaleString("vi-VN")}
              </span>
            );
          },
        },
        {
          title: t.table.totalVat || (isEn ? "Total Amount" : "Tổng tiền"),
          key: "TotalAmountWithVat",
          width: colWidths.TotalAmountWithVat || defaultColWidths.TotalAmountWithVat,
          align: "right" as const,
          render: (_: any, r: any) => {
            if (r.isParent) return null;
            const rawAmount = Number(r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
            const rawTax = Number(r.TaxRate) || 0;
            const taxRate = rawTax > 1 ? rawTax / 100 : rawTax;
            const taxVal =
              r.TaxAmount !== undefined && r.TaxAmount !== null
                ? Number(r.TaxAmount)
                : rawAmount * taxRate;
            const totalVat = rawAmount + taxVal;
            return (
              <span style={{ color: "#123443", fontSize: 13 }}>
                {totalVat.toLocaleString("vi-VN")}
              </span>
            );
          },
        },
        {
          title: t.table.effectiveDate || (isEn ? "Effective Date" : "Ngày hiệu lực"),
          key: "FromDate",
          width: colWidths.FromDate || defaultColWidths.FromDate,
          align: "center" as const,
          render: (_: any, r: any) => {
            if (r.isParent) return null;
            const raw = r.FromDate || r.StartDate || r.signDate || r.ItemDate;
            const d = parseDateSafe(raw);
            return (
              <span style={{ color: "#334155", fontSize: 13 }}>
                {d ? d.format("DD/MM/YYYY") : "---"}
              </span>
            );
          },
        },
        {
          title: t.table.expiryDate || (isEn ? "Expiry Date" : "Ngày hết hạn"),
          key: "ToDate",
          width: colWidths.ToDate || defaultColWidths.ToDate,
          align: "center" as const,
          render: (_: any, r: any) => {
            if (r.isParent) return null;
            const raw = r.Enddate || r.EndDate;
            const d = parseDateSafe(raw);
            return (
              <span style={{ color: "#334155", fontSize: 13 }}>
                {d ? d.format("DD/MM/YYYY") : "---"}
              </span>
            );
          },
        },
        ...(onDeleteMaterialItem || onUpdateMaterialItem
          ? [
              {
                title: (
                  <Tooltip title={t.table.action}>
                    <IconSettings size={15} strokeWidth={1.8} style={{ color: "#718894" }} />
                  </Tooltip>
                ),
                key: "action",
                width: 80,
                fixed: "right" as const,
                align: "center" as const,
                render: (_: any, r: any) => {
                  if (r.isParent) return null;
                  return (
                    <Space size={6}>
                      {onUpdateMaterialItem && (
                        <ActionIconButton
                          action="edit"
                          size="small"
                          tooltip={t.common.edit || (isEn ? "Edit item details" : "Chỉnh sửa chi tiết")}
                          onClick={() => handleOpenEditDrawer(r)}
                        />
                      )}
                      {onDeleteMaterialItem && !isTaskAssigned && (
                        <Popconfirm
                          title={
                            isEn
                              ? `Delete item "${r.ItemName || r.Description}" from contract?`
                              : `Xóa mặt hàng "${r.ItemName || r.Description}" khỏi hợp đồng?`
                          }
                          onConfirm={() => onDeleteMaterialItem(r)}
                          okText={t.common.delete || (isEn ? "Delete" : "Xóa")}
                          cancelText={t.common.cancel || (isEn ? "Cancel" : "Hủy")}
                          okButtonProps={{ danger: true }}
                        >
                          <ActionIconButton
                            action="delete"
                            size="small"
                            tooltip={t.common.delete || (isEn ? "Delete item" : "Xóa mặt hàng")}
                          />
                        </Popconfirm>
                      )}
                    </Space>
                  );
                },
              },
            ]
          : []),
      ];

      return cols;
    },
    [onDeleteMaterialItem, onUpdateMaterialItem, isTaskAssigned, t, isEn, colWidths]
  );

  // Gộp thông tin resize và dynamic colSpan cho các cột
  const mergedMaterialColumns = useMemo(() => {
    const totalCols = baseMaterialColumns.length;
    return baseMaterialColumns.map((col: any, index: number) => {
      const colKey = String(col.key || col.dataIndex || index);
      const isFixedAction = colKey === "action";
      const currentWidth = isFixedAction ? 80 : (colWidths[colKey] || col.width || 100);

      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: isFixedAction ? undefined : handleResizeColumn(colKey),
        }),
        onCell: (r: any) => ({
          colSpan: r.isParent ? (index === 0 ? totalCols : 0) : 1,
        }),
      };
    });
  }, [baseMaterialColumns, colWidths]);

  const scrollX = useMemo(() => {
    return mergedMaterialColumns.reduce(
      (sum: number, col: any) => sum + (Number(col.width) || 100),
      0
    );
  }, [mergedMaterialColumns]);

  return (
    <>
      <style>{`
        .reconcile-tree-table .ant-table-cell-with-append {
          display: flex !important;
          align-items: center !important;
        }
        .contract-detail-table .ant-table-row-level-0 td {
          background: #FAF5FF !important;
          font-weight: 600 !important;
          padding: 6px 12px !important;
          white-space: nowrap !important;
        }
        .contract-detail-table .ant-table-row-level-0:hover td,
        .reconcile-tree-table .ant-table-row-level-0:hover td {
          background: #F3E8FF !important;
        }
        .contract-detail-table .ant-table-row-indent,
        .contract-detail-table .ant-table-row-expand-icon-spaced,
        .reconcile-tree-table .ant-table-row-indent,
        .reconcile-tree-table .ant-table-row-expand-icon-spaced {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .contract-detail-table .ant-table-row-expand-icon,
        .reconcile-tree-table .ant-table-row-expand-icon {
          margin-right: 8px !important;
          width: 18px !important;
          height: 18px !important;
          line-height: 16px !important;
        }
      `}</style>

      <div
        style={{
          marginTop: 10,
          border: "1px solid #dce5e6",
          borderRadius: 8,
          background: "#ffffff",
          padding: "10px 12px",
        }}
      >
        {/* TIÊU ĐỀ & NÚT THAO TÁC: [-] II. CHI TIẾT VẬT TƯ | [Làm mới] [Đối chiếu bảng giá] */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isPriceListSectionExpanded ? 10 : 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setIsPriceListSectionExpanded((prev) => !prev)}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "#dce5e6",
                color: "#008f89",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {isPriceListSectionExpanded ? "−" : "+"}
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#008f89", textTransform: "uppercase" }}>
              {t.contract.materialDetails}
            </span>
          </div>

          {/* CỤM BUTTON NGANG HÀNG VỚI TIÊU ĐỀ: LÀM MỚI & ĐỐI CHIẾU BẢNG GIÁ */}
          {hasContractId && (
            <Space size={8}>
              <Button
                icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: "#718894" }} />}
                onClick={onRefreshMaterials}
                loading={loadingMaterials}
                style={{
                  height: 32,
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#334155",
                  borderColor: "#CBD5E1",
                  background: "#FFFFFF",
                }}
              >
                {t.common.refresh}
              </Button>

              {!isTaskAssigned && (
                <Tooltip
                  title={
                    !isEditing
                      ? "Vui lòng bấm 'Lưu Hợp đồng' trước khi đối chiếu bảng giá"
                      : !effectiveClientId || !effectiveSubconOf
                      ? "Vui lòng chọn HĐ chủ đầu tư và Đối tượng (NCC)"
                      : ""
                  }
                >
                  <span>
                    <Button
                      type="primary"
                      icon={<IconScale size={16} strokeWidth={1.8} />}
                      onClick={() => setIsReconcileModalOpen(true)}
                      disabled={!isEditing || !effectiveClientId || !effectiveSubconOf}
                      style={{
                        background: "#008f89",
                        borderColor: "#008f89",
                        height: 32,
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                      }}
                    >
                      {t.contract.reconcilePriceList}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Space>
          )}
        </div>

        {/* NỘI DUNG EXPANDED */}
        {isPriceListSectionExpanded && (
          <div>
            {/* BẢNG CHI TIẾT VẬT TƯ CỦA HỢP ĐỒNG (GOM NHÓM THEO HỢP ĐỒNG) */}
            {treeMaterialData.length > 0 ? (
              <Table
                className="contract-detail-table erp-detail-table"
                tableLayout="fixed"
                size="small"
                bordered
                components={{ header: { cell: ResizableTitle } }}
                dataSource={treeMaterialData}
                rowKey="key"
                loading={loadingMaterials}
                pagination={false}
                scroll={{ x: scrollX, y: 380 }}
                columns={mergedMaterialColumns}
                expandable={{
                  indentSize: 0,
                  expandedRowKeys,
                  onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
                  expandIconColumnIndex: 0,
                  expandRowByClick: false,
                  expandIcon: ({ expanded, onExpand, record }) => {
                    if (!record.isParent) return null;
                    return (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => onExpand(record, e)}
                        style={{
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 18,
                          height: 18,
                          minWidth: 18,
                          borderRadius: 4,
                          backgroundColor: expanded ? "#dce5e6" : "#f7fbfa",
                          border: `1px solid ${expanded ? "#008f89" : "#CBD5E1"}`,
                          color: expanded ? "#008f89" : "#718894",
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1,
                          marginRight: 8,
                          userSelect: "none",
                          flexShrink: 0,
                          verticalAlign: "middle",
                        }}
                      >
                        {expanded ? "−" : "+"}
                      </span>
                    );
                  },
                }}
                summary={() => {
                  let totalQnty = 0;
                  let totalAmount = 0;
                  let totalTax = 0;
                  let totalVat = 0;

                  materialItems.forEach((r) => {
                    const q = Number(r.Qnty || 0);
                    const p = Number(r.UnitPrice || 0);
                    const amt = Number(r.Amount ?? q * p);
                    const rawTax = Number(r.TaxRate) || 0;
                    const taxRate = rawTax > 1 ? rawTax / 100 : rawTax;
                    const taxVal =
                      r.TaxAmount !== undefined && r.TaxAmount !== null
                        ? Number(r.TaxAmount)
                        : amt * taxRate;
                    totalQnty += q;
                    totalAmount += amt;
                    totalTax += taxVal;
                    totalVat += amt + taxVal;
                  });

                  return (
                    <Table.Summary.Row style={{ background: "#f7fbfa", fontWeight: 700 }}>
                      {mergedMaterialColumns.map((col: any, index: number) => {
                        const key = String(col.key || col.dataIndex || index);
                        const fixedProps = col.fixed ? { fixed: col.fixed } : {};
                        if (key === "QuotationCode" || index === 0) {
                          return (
                            <Table.Summary.Cell key={key} index={index} align="left" {...fixedProps}>
                              <span style={{ color: "#123443", fontWeight: 700 }}>
                                &Sigma; {t.common.total || (isEn ? "Total" : "Tổng cộng")} ({materialItems.length} {t.table.itemsCount || (isEn ? "items" : "vật tư")})
                              </span>
                            </Table.Summary.Cell>
                          );
                        }
                        if (key === "Qnty") {
                          return (
                            <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                              <span style={{ color: "#123443", fontWeight: 700 }}>
                                {totalQnty.toLocaleString("vi-VN")}
                              </span>
                            </Table.Summary.Cell>
                          );
                        }
                        if (key === "Amount") {
                          return (
                            <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                              <span style={{ color: "#123443", fontWeight: 700 }}>
                                {totalAmount.toLocaleString("vi-VN")}
                              </span>
                            </Table.Summary.Cell>
                          );
                        }
                        if (key === "TaxAmount") {
                          return (
                            <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                              <span style={{ color: "#123443", fontWeight: 700 }}>
                                {totalTax.toLocaleString("vi-VN")}
                              </span>
                            </Table.Summary.Cell>
                          );
                        }
                        if (key === "TotalAmountWithVat") {
                          return (
                            <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                              <span style={{ color: "#008f89", fontWeight: 700 }}>
                                {totalVat.toLocaleString("vi-VN")}
                              </span>
                            </Table.Summary.Cell>
                          );
                        }
                        return (
                          <Table.Summary.Cell key={key} index={index} align="center" {...fixedProps}>
                            -
                          </Table.Summary.Cell>
                        );
                      })}
                    </Table.Summary.Row>
                  );
                }}
              />
            ) : (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                  background: "#f7fbfa",
                  borderRadius: 6,
                  border: "1px dashed #CBD5E1",
                }}
              >
                {!hasContractId
                  ? (isEn
                      ? 'Please click "Save Contract" above before adding materials and price lists.'
                      : 'Vui lòng bấm "Lưu Hợp đồng" ở trên trước khi chọn và đối chiếu chi tiết vật tư.')
                  : (t.contract.emptyMaterialNotice ||
                      (isEn
                        ? 'No material items for this contract yet. Click "Reconcile Price List" above to add materials.'
                        : 'Chưa có chi tiết vật tư nào cho hợp đồng. Bấm "Đối chiếu bảng giá" ở trên để chọn vật tư đưa vào hợp đồng.'))}
              </div>
            )}

            {/* Dòng trạng thái footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
                fontSize: 12,
                color: "#8c8c8c",
              }}
            >
              <span>
                {materialItems.length > 0
                  ? (t.contract.showingItems || (isEn ? "Showing: {count} items" : "Đang hiển thị: {count} mặt hàng")).replace(
                      "{count}",
                      String(materialItems.length)
                    )
                  : t.contract.noMaterialItems || (isEn ? "No material items" : "Chưa có chi tiết vật tư")}
              </span>
              {hasContractId && (!effectiveClientId || !effectiveSubconOf) ? (
                <span style={{ color: "#faad14" }}>
                  {t.contract.selectClientAndVendorNotice ||
                    (isEn
                      ? "* Please select Client Contract and Vendor in Section I to load price lists"
                      : "* Vui lòng chọn HĐ chủ đầu tư và Đối tượng ở phần I để tải danh sách bảng giá")}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ĐỐI CHIẾU BẢNG GIÁ (TREE TABLE TÁCH RIÊNG) */}
      <ContractPriceListReconcileModal
        open={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        effectiveClientId={effectiveClientId}
        effectiveSubconOf={effectiveSubconOf}
        effectiveContractId={effectiveContractId}
        assignedSourceIds={useMemo(() => new Set(materialItems.map((m) => m.SourceId).filter(Boolean)), [materialItems])}
        availablePriceLists={availablePriceLists}
        onConfirmReconcile={handleConfirmReconcile}
        submitting={submittingReconcile}
      />

      {/* MODAL 2: XEM CHI TIẾT BẢNG GIÁ (TÁCH RIÊNG) */}
      <PriceListDetailModal
        priceList={viewingPriceList}
        onClose={() => setViewingPriceList(null)}
      />

      {/* DRAWER 3: CHỈNH SỬA CHI TIẾT VẬT TƯ (TÁCH RIÊNG) */}
      <ContractMaterialEditDrawer
        open={Boolean(editingMaterial)}
        onClose={() => setEditingMaterial(null)}
        material={editingMaterial}
        onSave={handleSaveEditDrawer}
        onDelete={onDeleteMaterialItem}
        submitting={submittingEdit}
        isTaskAssigned={isTaskAssigned}
      />
    </>
  );
}
