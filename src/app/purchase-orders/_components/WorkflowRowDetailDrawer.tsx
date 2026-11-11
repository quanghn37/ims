"use client";

import React from "react";
import {
  Drawer,
  Button,
  InputNumber,
  Spin,
  Input,
} from "antd";
import {
  AuditOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";
import ApprovalDecisionSelect from "@/components/common/ApprovalDecisionSelect";
import RaciRoleTag from "@/components/common/RaciRoleTag";

interface WorkflowRowDetailDrawerProps {
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
}

export default function WorkflowRowDetailDrawer({
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
}: WorkflowRowDetailDrawerProps) {
  const { t, language } = useTranslation();
  const numLocale = language === "en" ? "en-US" : "vi-VN";

  return (
    <Drawer
      closable={true}
      closeIcon={<CloseOutlined style={{ fontSize: 16, color: "#718894" }} />}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AuditOutlined style={{ color: "#008f89", fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#123443" }}>
            {selectedWorkflowRow?.FullName || selectedWorkflowRow?.UserName || (language === "en" ? "Approver" : "Người duyệt")}
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
            {t("workflow.close") || "Đóng"}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
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
                <ClockCircleOutlined style={{ color: "#718894", fontSize: 15 }} />
                <span>
                  {t("workflow.startTime") || "Bắt đầu"}: {dayjs(selectedWorkflowRow.ActualStart).format("HH:mm DD/MM/YYYY")}
                </span>
              </div>
            )}

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

            <div>
              <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#334155" }}>
                {t("workflow.remarks") || "Ý kiến / Ghi chú"}
              </div>
              <Input.TextArea
                value={rowDetailRemarks}
                onChange={(e) => setRowDetailRemarks(e.target.value)}
                rows={4}
                placeholder={t("workflow.remarksPlaceholder") || "Nhập ý kiến phê duyệt đơn hàng..."}
                style={{ borderRadius: 8, borderColor: "#dce5e6", padding: "10px 12px" }}
              />
            </div>
          </div>
        </Spin>
      )}
    </Drawer>
  );
}
