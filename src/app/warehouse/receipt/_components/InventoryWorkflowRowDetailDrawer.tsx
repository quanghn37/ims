"use client";

import React, { useMemo } from "react";
import {
  Drawer,
  Button,
  InputNumber,
  Select,
  Spin,
  Tag,
  Input,
} from "antd";
import {
  IconClipboardCheck,
  IconDeviceFloppy,
  IconClock,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";

interface InventoryWorkflowRowDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedWorkflowRow: any;
  processingStatusList: any[];
  loadingProcessingStatus: boolean;
  rowDetailDecision: string;
  setRowDetailDecision: (v: string) => void;
  rowDetailQnty: number;
  setRowDetailQnty: (v: number) => void;
  rowDetailUnitPrice: number;
  setRowDetailUnitPrice: (v: number) => void;
  rowDetailRemarks: string;
  setRowDetailRemarks: (v: string) => void;
  savingRowDetail: boolean;
  onSave: () => void;
  displayMode?: string;
}

export default function InventoryWorkflowRowDetailDrawer({
  open,
  onClose,
  selectedWorkflowRow,
  processingStatusList,
  loadingProcessingStatus,
  rowDetailDecision,
  setRowDetailDecision,
  rowDetailQnty,
  setRowDetailQnty,
  rowDetailUnitPrice,
  setRowDetailUnitPrice,
  rowDetailRemarks,
  setRowDetailRemarks,
  savingRowDetail,
  onSave,
  displayMode = "Receipt",
}: InventoryWorkflowRowDetailDrawerProps) {
  const { t, language } = useTranslation();
  const numLocale = language === "en" ? "en-US" : "vi-VN";

  const selectOptions = useMemo(() => {
    if (processingStatusList.length > 0) {
      const seen = new Set<string>();
      return processingStatusList
        .map((item: any) => {
          const raw = item.Description || item.StatusName || item.Value || item.Alias || "";
          const cleanLabel = String(raw).replace(/[✅❌⏳]/g, "").trim();
          let finalLabel = cleanLabel || raw;

          if (language === "en") {
            const lower = cleanLabel.toLowerCase();
            if (lower === "approved" || lower === "chấp thuận" || lower === "duyệt" || lower === "đã duyệt") {
              finalLabel = "Approved";
            } else if (lower === "cond-approved" || lower === "cond approved") {
              finalLabel = "Cond-Approved";
            } else if (lower === "đang làm" || lower === "dang lam" || lower === "in-progress" || lower === "in progress" || lower === "processing") {
              finalLabel = "In-Progress";
            } else if (lower === "từ chối" || lower === "rejected") {
              finalLabel = "Rejected";
            } else if (lower === "chưa làm" || lower === "not-started" || lower === "not started") {
              finalLabel = "Not-Started";
            }
          } else {
            const lower = cleanLabel.toLowerCase();
            if (lower === "approved") {
              finalLabel = "Chấp thuận";
            } else if (lower === "cond-approved") {
              finalLabel = "Duyệt có điều kiện";
            } else if (lower === "in-progress" || lower === "processing" || lower === "in progress") {
              finalLabel = "Đang làm";
            } else if (lower === "rejected") {
              finalLabel = "Từ chối";
            } else if (lower === "not-started" || lower === "not started") {
              finalLabel = "Chưa làm";
            }
          }

          return {
            value: raw,
            label: finalLabel,
          };
        })
        .filter((it: any) => {
          if (!it.value || seen.has(it.value)) return false;
          seen.add(it.value);
          return true;
        });
    }

    return [
      { value: language === "en" ? "Approved" : "Chấp thuận", label: language === "en" ? "Approved" : "Chấp thuận" },
      { value: language === "en" ? "In-Progress" : "Đang làm", label: language === "en" ? "In-Progress" : "Đang làm" },
      { value: language === "en" ? "Rejected" : "Từ chối", label: language === "en" ? "Rejected" : "Từ chối" },
    ];
  }, [processingStatusList, language]);

  return (
    <Drawer
      closable={true}
      closeIcon={<IconX size={18} style={{ color: "#718894" }} />}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconClipboardCheck size={20} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#123443" }}>
            {selectedWorkflowRow?.FullName || selectedWorkflowRow?.UserName || (language === "en" ? "Approver" : "Người duyệt")}
          </span>
          {selectedWorkflowRow?.Role && (
            <Tag
              style={{
                background: "#dce5e6",
                color: "#008f89",
                border: "none",
                borderRadius: 16,
                fontWeight: 600,
                fontSize: 12,
                padding: "2px 10px",
                margin: 0,
              }}
            >
              {selectedWorkflowRow.Role}
            </Tag>
          )}
        </div>
      }
      placement="right"
      width={440}
      open={open}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button
            onClick={onClose}
            style={{
              height: 38,
              borderRadius: 8,
              borderColor: "#dce5e6",
              color: "#334155",
              padding: "0 18px",
            }}
          >
            {t("workflow.close") || "Đóng"}
          </Button>
          <Button
            type="primary"
            icon={<IconDeviceFloppy size={18} strokeWidth={1.8} />}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 38,
              borderRadius: 8,
              fontWeight: 500,
              padding: "0 20px",
              boxShadow: "0 2px 6px rgba(0, 143, 137, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            loading={savingRowDetail}
            onClick={onSave}
          >
            {t("workflow.save") || "Lưu"}
          </Button>
        </div>
      }
    >
      {selectedWorkflowRow && (
        <Spin spinning={loadingProcessingStatus}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {selectedWorkflowRow.ActualStart && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#334155",
                  background: "#f7fbfa",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #F1F5F9",
                  fontWeight: 500,
                }}
              >
                <IconClock size={16} strokeWidth={1.8} style={{ color: "#718894" }} />
                <span>
                  {t("workflow.startTime") || "Bắt đầu"}: {dayjs(selectedWorkflowRow.ActualStart).format("HH:mm DD/MM/YYYY")}
                </span>
              </div>
            )}

            <div>
              <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                {t("workflow.decision") || "Quyết định"}
              </div>
              <Select
                value={rowDetailDecision || undefined}
                onChange={setRowDetailDecision}
                placeholder={t("workflow.selectDecision") || "— Chọn quyết định —"}
                style={{ width: "100%", height: 40 }}
                loading={loadingProcessingStatus}
                options={selectOptions}
              />
            </div>

            {displayMode === "Request" ? (
              <div>
                <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                  {t("workflow.approvedQty") || "Số lượng duyệt"}
                  <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400, marginLeft: 4 }}>
                    ({t("workflow.original") || "Gốc"}: {Number(selectedWorkflowRow.Qnty || 0).toLocaleString(numLocale)})
                  </span>
                </div>
                <InputNumber
                  value={rowDetailQnty}
                  onChange={(v) => setRowDetailQnty(Number(v || 0))}
                  min={0}
                  style={{ width: "100%", height: 40, borderRadius: 8, borderColor: "#dce5e6" }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val?.replace(/,/g, "") || 0) as any}
                />
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                      {t("workflow.approvedQty") || "Số lượng duyệt"}
                      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400, marginLeft: 4 }}>
                        ({t("workflow.original") || "Gốc"}: {Number(selectedWorkflowRow.Qnty || 0).toLocaleString(numLocale)})
                      </span>
                    </div>
                    <InputNumber
                      value={rowDetailQnty}
                      onChange={(v) => setRowDetailQnty(Number(v || 0))}
                      min={0}
                      style={{ width: "100%", height: 40, borderRadius: 8, borderColor: "#dce5e6" }}
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(val) => Number(val?.replace(/,/g, "") || 0) as any}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                      {t("workflow.approvedUnitPrice") || "Đơn giá duyệt"}
                      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400, marginLeft: 4 }}>
                        ({t("workflow.original") || "Gốc"}: {Number(selectedWorkflowRow.UnitPrice || 0).toLocaleString(numLocale)})
                      </span>
                    </div>
                    <InputNumber
                      value={rowDetailUnitPrice}
                      onChange={(v) => setRowDetailUnitPrice(Number(v || 0))}
                      min={0}
                      style={{ width: "100%", height: 40, borderRadius: 8, borderColor: "#dce5e6" }}
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(val) => Number(val?.replace(/,/g, "") || 0) as any}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: "#eef8f6",
                    borderRadius: 10,
                    padding: "14px 16px",
                    border: "1px solid #dce5e6",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#718894", fontWeight: 500, marginBottom: 4 }}>
                    {t("workflow.approvedAmount") || "Thành tiền duyệt"}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#008f89", letterSpacing: 0.2 }}>
                    {(rowDetailQnty * rowDetailUnitPrice).toLocaleString(numLocale)}
                  </div>
                </div>
              </>
            )}

            <div>
              <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                {t("workflow.remarks") || "Ý kiến / Ghi chú"}
              </div>
              <Input.TextArea
                value={rowDetailRemarks}
                onChange={(e) => setRowDetailRemarks(e.target.value)}
                rows={4}
                placeholder={
                  displayMode === "Request"
                    ? (language === "en" ? "Enter material request approval comments..." : "Nhập ý kiến phê duyệt yêu cầu xuất vật tư...")
                    : (language === "en" ? "Enter stock receipt approval comments..." : "Nhập ý kiến phê duyệt nhập kho...")
                }
                style={{ borderRadius: 8, borderColor: "#dce5e6", padding: "10px 12px" }}
              />
            </div>
          </div>
        </Spin>
      )}
    </Drawer>
  );
}
