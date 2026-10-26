"use client";

import React, { useMemo } from "react";
import { Drawer, Button, Select, Spin, Tag, Input } from "antd";
import {
  IconClipboardCheck,
  IconClock,
  IconX,
  IconDeviceFloppy,
  IconCheck,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { renderStatusDotItem } from "@/config/statusConfig";
import { useTranslation } from "@/locales/LanguageContext";

interface ContractWorkflowRowDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedWorkflowRow: any;
  contractAmount?: number;
  processingStatusList: any[];
  loadingProcessingStatus: boolean;
  rowDetailDecision: string;
  setRowDetailDecision: (v: string) => void;
  rowDetailRemarks: string;
  setRowDetailRemarks: (v: string) => void;
  savingRowDetail: boolean;
  onSave: () => void;
}

export default function ContractWorkflowRowDetailDrawer({
  open,
  onClose,
  selectedWorkflowRow,
  contractAmount = 0,
  processingStatusList,
  loadingProcessingStatus,
  rowDetailDecision,
  setRowDetailDecision,
  rowDetailRemarks,
  setRowDetailRemarks,
  savingRowDetail,
  onSave,
}: ContractWorkflowRowDetailDrawerProps) {
  const { t, language } = useTranslation();
  const numLocale = language === "en" ? "en-US" : "vi-VN";

  const selectOptions = useMemo(() => {
    if (processingStatusList && processingStatusList.length > 0) {
      const seen = new Set<string>();
      const list = processingStatusList
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
            } else if (
              lower === "đang làm" ||
              lower === "dang lam" ||
              lower === "in-progress" ||
              lower === "in progress" ||
              lower === "processing"
            ) {
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
            label: renderStatusDotItem(raw, finalLabel),
          };
        })
        .filter((it: any) => {
          if (!it.value || seen.has(it.value)) return false;
          seen.add(it.value);
          return true;
        });

      if (rowDetailDecision && !seen.has(rowDetailDecision)) {
        list.unshift({ value: rowDetailDecision, label: renderStatusDotItem(rowDetailDecision) });
      }
      return list;
    }

    const fallback =
      language === "en"
        ? [
            { value: "Approved", label: renderStatusDotItem("Approved", "Approved") },
            { value: "In-Progress", label: renderStatusDotItem("In-Progress", "In-Progress") },
            { value: "Rejected", label: renderStatusDotItem("Rejected", "Rejected") },
          ]
        : [
            { value: "Duyệt", label: renderStatusDotItem("Duyệt", "Duyệt") },
            { value: "Chấp thuận", label: renderStatusDotItem("Chấp thuận", "Chấp thuận") },
            { value: "Đang làm", label: renderStatusDotItem("Đang làm", "Đang làm") },
            { value: "Từ chối", label: renderStatusDotItem("Từ chối", "Từ chối") },
          ];

    if (rowDetailDecision && !fallback.some((item) => item.value === rowDetailDecision)) {
      fallback.unshift({ value: rowDetailDecision, label: renderStatusDotItem(rowDetailDecision) });
    }
    return fallback;
  }, [processingStatusList, language, rowDetailDecision]);

  const displayAmount = Number(
    selectedWorkflowRow?.Amount ?? contractAmount ?? 0
  );

  return (
    <Drawer
      closable={true}
      closeIcon={<IconX size={18} style={{ color: "#718894" }} />}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconClipboardCheck size={20} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#123443" }}>
            {selectedWorkflowRow?.FullName ||
              selectedWorkflowRow?.UserName ||
              (language === "en" ? "Approver" : "Người duyệt")}
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
            {t("workflow.close") || (language === "en" ? "Close" : "Đóng")}
          </Button>
          <Button
            type="primary"
            icon={<IconDeviceFloppy size={16} />}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 38,
              borderRadius: 8,
              fontWeight: 500,
              padding: "0 20px",
              boxShadow: "0 2px 6px rgba(0, 143, 137, 0.25)",
            }}
            loading={savingRowDetail}
            onClick={onSave}
          >
            {t("workflow.save") || (language === "en" ? "Save" : "Lưu")}
          </Button>
        </div>
      }
    >
      {selectedWorkflowRow && (
        <Spin spinning={loadingProcessingStatus}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* THỜI GIAN THỰC HIỆN */}
            {(selectedWorkflowRow.ActualStart || selectedWorkflowRow.ActualFinish) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 13,
                  color: "#334155",
                  background: "#f7fbfa",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #F1F5F9",
                  fontWeight: 500,
                }}
              >
                {selectedWorkflowRow.ActualStart && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <IconClock size={16} strokeWidth={1.8} style={{ color: "#718894" }} />
                    <span>
                      {t("workflow.startTime") || "Bắt đầu"}:{" "}
                      {dayjs(selectedWorkflowRow.ActualStart).format("HH:mm DD/MM/YYYY")}
                    </span>
                  </div>
                )}
                {selectedWorkflowRow.ActualFinish && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#008f89" }}>
                    <IconCheck size={16} strokeWidth={2.2} />
                    <span>
                      {t("workflow.finishTime") || "Hoàn thành"}:{" "}
                      {dayjs(selectedWorkflowRow.ActualFinish).format("HH:mm DD/MM/YYYY")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* QUYẾT ĐỊNH */}
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

            {/* THÀNH TIỀN DUYỆT */}
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
                {displayAmount.toLocaleString(numLocale)} ₫
              </div>
            </div>

            {/* Ý KIẾN / GHI CHÚ */}
            <div>
              <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                {t("workflow.remarks") || "Ý kiến / Ghi chú"}
              </div>
              <Input.TextArea
                value={rowDetailRemarks}
                onChange={(e) => setRowDetailRemarks(e.target.value)}
                rows={4}
                placeholder={
                  t("workflow.remarksPlaceholder") ||
                  (language === "en" ? "Enter approval comments..." : "Nhập ý kiến phê duyệt...")
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
