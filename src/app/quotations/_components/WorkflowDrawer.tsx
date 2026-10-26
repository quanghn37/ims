"use client";

import React from "react";
import { Drawer, Typography } from "antd";
import { AuditOutlined } from "@ant-design/icons";
import WorkflowRowDetailDrawer from "./WorkflowRowDetailDrawer";
import { useTranslation } from "@/locales/LanguageContext";
import WorkflowRaciTable from "@/components/common/WorkflowRaciTable";

const { Text } = Typography;

interface WorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  currentSubmissionId: any;
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
                {t("workflow.title") || "Quy trình phê duyệt"}
              </div>
              <div style={{ fontSize: 12, color: "#718894", marginTop: 2 }}>
                Submission #{currentSubmissionId} · {language === "en" ? "Quotation Item" : "Hạng mục báo giá"}
              </div>
            </div>
          </div>
        }
        placement="right"
        width="54vw"
        zIndex={1100}
        open={open}
        onClose={onClose}
        bodyStyle={{ padding: "20px 24px", background: "#fbfcfc" }}
      >
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
