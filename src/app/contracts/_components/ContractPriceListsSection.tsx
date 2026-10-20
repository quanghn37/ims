"use client";

import React, { useState, useMemo } from "react";
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
import { useTranslation } from "@/locales/LanguageContext";

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
  fetchAvailableQuotations?: (cId?: any, sOf?: any, contractId?: any) => Promise<any>;
  handleReconcileItems: (selectedItems: TreeRowItem[], selectedPriceLists: PriceListItem[]) => Promise<void>;
  handleRemoveSingle?: (item: PriceListItem) => void;
  viewingPriceList: PriceListItem | null;
  setViewingPriceList: (item: PriceListItem | null) => void;
  isEditing?: boolean;
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
  handleReconcileItems,
  viewingPriceList,
  setViewingPriceList,
  isEditing = false,
  materialItems = [],
  loadingMaterials = false,
  onDeleteMaterialItem,
  onUpdateMaterialItem,
  onRefreshMaterials,
}: ContractPriceListsSectionProps) {
  const { t } = useTranslation();
  // States cho Drawer chỉnh sửa chi tiết vật tư
  const [editingMaterial, setEditingMaterial] = useState<ContractMaterialItem | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // State cho Modal Đối chiếu Bảng giá
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [submittingReconcile, setSubmittingReconcile] = useState(false);

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

  // Cột bảng chính Section II (Chi tiết vật tư của Hợp đồng)
  const mainMaterialColumns = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 50,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: t.table.priceList,
        key: "QuotationCode",
        width: 150,
        align: "center" as const,
        render: (_: any, r: ContractMaterialItem) => (
          <span style={{ color: "#123443", fontSize: 13, fontWeight: 400 }}>
            {r.QuotationCode || r.PriceListCode || "---"}
          </span>
        ),
      },
      {
        title: t.table.itemName,
        key: "ItemName",
        width: 270,
        render: (_: any, r: ContractMaterialItem) => {
          const desc = r.Description || r.ItemName || "";
          const sCode = r.SystemCode || r.ItemCode || (r.MaterialId ? String(r.MaterialId) : "");
          return (
            <div>
              <div style={{ fontWeight: 600, color: "#123443", fontSize: 13, wordBreak: "break-word" }}>
                {desc || "Vật tư trong bảng giá"}
              </div>
              {sCode && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#718894",
                    marginTop: 2,
                    fontFamily: "monospace",
                    wordBreak: "break-word",
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
        width: 65,
        align: "center" as const,
        render: (val: string) => val || "Cái",
      },
      {
        title: t.table.qty,
        dataIndex: "Qnty",
        key: "Qnty",
        width: 80,
        align: "right" as const,
        render: (val: number, r: ContractMaterialItem) => (
          <span style={{ color: "#123443", fontSize: 13 }}>
            {Number(val ?? r.Qnty ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.unitPrice,
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        width: 105,
        align: "right" as const,
        render: (val: number, r: ContractMaterialItem) => (
          <span style={{ color: "#123443", fontSize: 13 }}>
            {Number(val ?? r.UnitPrice ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.amount,
        dataIndex: "Amount",
        key: "Amount",
        width: 115,
        align: "right" as const,
        render: (val: any, r: ContractMaterialItem) => {
          const raw = Number(val ?? r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
          return <span style={{ color: "#123443", fontSize: 13 }}>{raw.toLocaleString("vi-VN")}</span>;
        },
      },
      {
        title: t.table.tax,
        dataIndex: "TaxRate",
        key: "TaxRate",
        width: 60,
        align: "center" as const,
        render: (val: any) => `${((Number(val) || 0) * 100).toFixed(0)}%`,
      },
      {
        title: t.table.taxAmount,
        dataIndex: "TaxAmount",
        key: "TaxAmount",
        width: 95,
        align: "right" as const,
        render: (val: any, r: ContractMaterialItem) => {
          const rawAmount = Number(r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
          const taxVal =
            val !== undefined && val !== null
              ? Number(val)
              : rawAmount * (Number(r.TaxRate) || 0);
          return (
            <span style={{ color: "#123443", fontSize: 13 }}>
              {taxVal.toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.totalVat,
        key: "TotalAmountWithVat",
        width: 125,
        align: "right" as const,
        render: (_: any, r: ContractMaterialItem) => {
          const rawAmount = Number(r.Amount ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
          const taxVal =
            r.TaxAmount !== undefined && r.TaxAmount !== null
              ? Number(r.TaxAmount)
              : rawAmount * (Number(r.TaxRate) || 0);
          const totalVat = rawAmount + taxVal;
          return (
            <span style={{ color: "#123443", fontWeight: 600, fontSize: 13 }}>
              {totalVat.toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.effectiveDate,
        key: "FromDate",
        width: 105,
        align: "center" as const,
        render: (_: any, r: ContractMaterialItem) => {
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
        title: t.table.expiryDate,
        key: "ToDate",
        width: 110,
        align: "center" as const,
        render: (_: any, r: ContractMaterialItem) => {
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
              align: "center" as const,
              render: (_: any, r: ContractMaterialItem) => (
                <Space size={6}>
                  {onUpdateMaterialItem && (
                    <ActionIconButton
                      action="edit"
                      size="small"
                      tooltip="Chỉnh sửa chi tiết"
                      onClick={() => handleOpenEditDrawer(r)}
                    />
                  )}
                  {onDeleteMaterialItem && (
                    <Popconfirm
                      title={`Xóa mặt hàng "${r.ItemName || r.Description}" khỏi hợp đồng?`}
                      onConfirm={() => onDeleteMaterialItem(r)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <ActionIconButton
                        action="delete"
                        size="small"
                        tooltip="Xóa mặt hàng"
                      />
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]
        : []),
    ],
    [onDeleteMaterialItem, onUpdateMaterialItem, t]
  );

  return (
    <>
      <style>{`
        .contract-detail-table .ant-table-thead > tr > th,
        .reconcile-tree-table .ant-table-thead > tr > th {
          background: #f7fbfa !important;
          font-weight: 600 !important;
          color: #475569 !important;
          font-size: 12px !important;
          padding: 6px 8px !important;
          line-height: 1.3 !important;
        }
        .contract-detail-table .ant-table-tbody > tr > td,
        .reconcile-tree-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
          line-height: 1.35 !important;
        }
        .reconcile-tree-table .ant-table-row-level-0 td {
          background: #FAF5FF !important;
          font-weight: 600 !important;
          padding: 5px 8px !important;
        }
        .reconcile-tree-table .ant-table-row-level-0:hover td {
          background: #F3E8FF !important;
        }
        .reconcile-tree-table .ant-table-row-indent,
        .reconcile-tree-table .ant-table-row-expand-icon-spaced {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .reconcile-tree-table .ant-table-row-expand-icon {
          margin-right: 6px !important;
          width: 15px !important;
          height: 15px !important;
          line-height: 14px !important;
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
          </Space>
        </div>

        {/* NỘI DUNG EXPANDED */}
        {isPriceListSectionExpanded && (
          <div>
            {/* BẢNG CHI TIẾT VẬT TƯ CỦA HỢP ĐỒNG */}
            {materialItems.length > 0 ? (
              <Table
                className="contract-detail-table"
                tableLayout="fixed"
                size="small"
                bordered
                dataSource={materialItems}
                rowKey={(r, index) => r.uniqueKey || r.SubmissionId || r.LocalId || `mat_${index}`}
                loading={loadingMaterials}
                pagination={
                  materialItems.length > 20
                    ? {
                        pageSize: 20,
                        size: "small",
                        showTotal: (total) => `${t.common.total}: ${total} ${t.table.itemsCount}`,
                      }
                    : false
                }
                scroll={{ x: 1320, y: 380 }}
                columns={mainMaterialColumns}
                summary={(pageData) => {
                  let totalQnty = 0;
                  let totalAmount = 0;
                  let totalTax = 0;
                  let totalVat = 0;

                  pageData.forEach((r) => {
                    const q = Number(r.Qnty || 0);
                    const p = Number(r.UnitPrice || 0);
                    const amt = Number(r.Amount ?? q * p);
                    const taxVal =
                      r.TaxAmount !== undefined && r.TaxAmount !== null
                        ? Number(r.TaxAmount)
                        : amt * (Number(r.TaxRate) || 0);
                    totalQnty += q;
                    totalAmount += amt;
                    totalTax += taxVal;
                    totalVat += amt + taxVal;
                  });

                  return (
                    <Table.Summary.Row style={{ background: "#f7fbfa", fontWeight: 700 }}>
                      <Table.Summary.Cell index={0} align="center">
                        -
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="center">
                        -
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="center">
                        <span style={{ color: "#123443", fontWeight: 700 }}>{t.common.total}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="center">
                        -
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <span style={{ color: "#123443", fontWeight: 700 }}>
                          {totalQnty.toLocaleString("vi-VN")}
                        </span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="center">
                        -
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="right">
                        <span style={{ color: "#123443", fontWeight: 700 }}>
                          {totalAmount.toLocaleString("vi-VN")}
                        </span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="center">
                        -
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8} align="right">
                        <span style={{ color: "#123443", fontWeight: 700 }}>
                          {totalTax.toLocaleString("vi-VN")}
                        </span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={9} align="right">
                        <span style={{ color: "#008f89", fontWeight: 700 }}>
                          {totalVat.toLocaleString("vi-VN")}
                        </span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={10} align="center">
                        -
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={11} align="center">
                        -
                      </Table.Summary.Cell>
                      {(onDeleteMaterialItem || onUpdateMaterialItem) && (
                        <Table.Summary.Cell index={12} align="center">
                          -
                        </Table.Summary.Cell>
                      )}
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
                Chưa có chi tiết vật tư nào cho hợp đồng. Bấm "Đối chiếu bảng giá" ở trên để chọn vật tư đưa vào hợp đồng.
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
                  ? `Đang hiển thị: ${materialItems.length} mặt hàng`
                  : "Chưa có chi tiết vật tư"}
              </span>
              {!effectiveClientId || !effectiveSubconOf ? (
                <span style={{ color: "#faad14" }}>
                  * Vui lòng chọn HĐ chủ đầu tư và Đối tượng ở phần I để tải danh sách bảng giá
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
      />
    </>
  );
}
