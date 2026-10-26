"use client";

import React from "react";
import { Drawer, Spin, Typography } from "antd";
import { AuditOutlined } from "@ant-design/icons";
import WorkflowRowDetailDrawer from "./WorkflowRowDetailDrawer";
import { useTranslation } from "@/locales/LanguageContext";
import WorkflowRaciTable from "@/components/common/WorkflowRaciTable";

const { Text } = Typography;

interface WorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  currentSubmissionId: any;
  itemDetail?: any;
  workflowData: any[];
  loadingWorkflow: boolean;
  // Row detail state
  isRowDetailOpen: boolean;
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
  onOpenRowDetail: (record: any) => void;
  onCloseRowDetail: () => void;
  onSaveRowDetail: () => void;
}

export default function WorkflowDrawer({
  open,
  onClose,
  currentSubmissionId,
  itemDetail,
  workflowData,
  loadingWorkflow,
  isRowDetailOpen,
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
  onOpenRowDetail,
  onCloseRowDetail,
  onSaveRowDetail,
}: WorkflowDrawerProps) {
  const { t, language } = useTranslation();
  const numLocale = language === "en" ? "en-US" : "vi-VN";

  return (
    <>
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#dce5e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AuditOutlined style={{ color: "#008f89", fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#008f89", lineHeight: "24px" }}>
                {language === "en" ? "PO Approval Workflow" : "Quy trình phê duyệt PO"}
              </div>
              <div style={{ fontSize: 12, color: "#718894", marginTop: 2 }}>
                Submission #{currentSubmissionId} · {language === "en" ? "Purchase Order (PO)" : "Đơn hàng (PO)"}
              </div>
            </div>
          </div>
        }
        placement="right"
        width="54vw"
        open={open}
        onClose={onClose}
        bodyStyle={{ padding: "20px 24px", background: "#fbfcfc" }}
      >
        {itemDetail && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#718894",
                letterSpacing: 0.5,
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              {language === "en" ? "REQUISITION INFO" : "THÔNG TIN ĐỀ NGHỊ"}
            </div>
            <div className="erp-summary-card">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
              >
                {/* Ô 1: Mã vật tư */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {t("common.materialCode") || "Mã vật tư"}
                  </span>
                  <div className="erp-summary-value mono">
                    {itemDetail.ItemCode || itemDetail.SystemCode || itemDetail.MaterialId || "---"}
                  </div>
                </div>

                {/* Ô 2: Tên vật tư */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {t("common.materialName") || "Tên vật tư"}
                  </span>
                  <div
                    className="erp-summary-value"
                    title={itemDetail.ItemName || itemDetail.Description}
                  >
                    {itemDetail.ItemName || itemDetail.Description || "---"}
                  </div>
                </div>

                {/* Ô 3: ĐVT */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {t("common.unit") || "ĐVT"}
                  </span>
                  <div className="erp-summary-value">
                    {itemDetail.Unit || itemDetail.unit || itemDetail.UomCode || "---"}
                  </div>
                </div>

                {/* Ô 4: Số lượng đề nghị */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {language === "en" ? "Requested Qty" : "Số lượng đề nghị"}
                  </span>
                  <div className="erp-summary-value">
                    {Number(itemDetail.Qnty ?? itemDetail.actualQty ?? itemDetail.PO_Qnty ?? 0).toLocaleString(numLocale)}
                  </div>
                </div>

                {/* Ô 5: Đơn giá đề nghị */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {language === "en" ? "Requested Unit Price" : "Đơn giá đề nghị"}
                  </span>
                  <div className="erp-summary-value">
                    {Number(itemDetail.UnitPrice ?? itemDetail.unitPrice ?? 0).toLocaleString(numLocale)}
                  </div>
                </div>

                {/* Ô 6: Thành tiền đề nghị */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {language === "en" ? "Requested Amount" : "Thành tiền đề nghị"}
                  </span>
                  <div className="erp-summary-value amount">
                    {Number(itemDetail.Amount ?? itemDetail.TotalPrice ?? itemDetail.totalPrice ?? 0).toLocaleString(numLocale)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <WorkflowRaciTable
          dataSource={workflowData}
          loading={loadingWorkflow}
          onOpenRowDetail={onOpenRowDetail}
          emptyText={
            <div style={{ padding: "30px 0", textAlign: "center", color: "#94A3B8" }}>
              <Text type="secondary">
                {t("workflow.empty") || "Chưa có lịch sử hoặc quy trình duyệt cho hạng mục này."}
              </Text>
            </div>
          }
        />
      </Drawer>

      <WorkflowRowDetailDrawer
        open={isRowDetailOpen}
        onClose={onCloseRowDetail}
        selectedWorkflowRow={selectedWorkflowRow}
        processingStatusList={processingStatusList}
        loadingProcessingStatus={loadingProcessingStatus}
        rowDetailDecision={rowDetailDecision}
        setRowDetailDecision={setRowDetailDecision}
        rowDetailQnty={rowDetailQnty}
        setRowDetailQnty={setRowDetailQnty}
        rowDetailUnitPrice={rowDetailUnitPrice}
        setRowDetailUnitPrice={setRowDetailUnitPrice}
        rowDetailRemarks={rowDetailRemarks}
        setRowDetailRemarks={setRowDetailRemarks}
        savingRowDetail={savingRowDetail}
        onSave={onSaveRowDetail}
      />
    </>
  );
}
