"use client";

import React from "react";
import { Drawer, Button, Spin, Input } from "antd";
import {
  IconClipboardCheck,
  IconClock,
  IconX,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";
import ApprovalDecisionSelect from "@/components/common/ApprovalDecisionSelect";
import RaciRoleTag from "@/components/common/RaciRoleTag";

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
            <RaciRoleTag role={selectedWorkflowRow.Role} />
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
            {/* THỜI GIAN BẮT ĐẦU */}
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
                <IconClock size={16} style={{ color: "#718894" }} />
                <span>
                  {t("workflow.startTime") || "Bắt đầu"}:{" "}
                  {dayjs(selectedWorkflowRow.ActualStart).format("HH:mm DD/MM/YYYY")}
                </span>
              </div>
            )}

            {/* QUYẾT ĐỊNH */}
            <div>
              <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                {t("workflow.decision") || "Quyết định"}
              </div>
              <ApprovalDecisionSelect
                role={selectedWorkflowRow.Role}
                value={rowDetailDecision}
                onChange={setRowDetailDecision}
                statusList={processingStatusList}
                loading={loadingProcessingStatus}
                style={{ height: 40 }}
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
                {displayAmount.toLocaleString(numLocale)}
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
