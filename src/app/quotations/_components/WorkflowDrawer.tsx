"use client";

import React from "react";
import {
  Drawer,
  Table,
  Spin,
  Typography,
  Tag,
} from "antd";
import { AuditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import WorkflowRowDetailDrawer from "./WorkflowRowDetailDrawer";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

function renderApprovalBadge(val: any, record?: any, language: string = "vi") {
  const rawStatus = val ?? record?.StatusCode ?? record?.ApprovalStatus;
  const cleanStatus = String(rawStatus || "").trim();
  const lower = cleanStatus.toLowerCase();

  const isDone =
    lower === "chấp thuận" ||
    lower === "chap thuan" ||
    lower === "duyệt" ||
    lower === "đã duyệt" ||
    lower === "da duyet" ||
    lower === "approved" ||
    lower === "appr." ||
    lower === "appr" ||
    lower === "1";

  const isProcessing =
    lower === "dang làm" ||
    lower === "đang làm" ||
    lower === "dang lam" ||
    lower === "processing" ||
    lower === "in progress" ||
    lower === "in-progress";

  const isRejected =
    lower === "từ chối" ||
    lower === "tu choi" ||
    lower === "rejected" ||
    lower === "reject";

  let bg = "#f59e0b";
  let label = cleanStatus ? `🕒 ${cleanStatus}` : (language === "en" ? "🕒 Not-Started" : "🕒 Chưa làm");

  if (isDone) {
    bg = "#0d9488";
    label = `✓ ${cleanStatus || (language === "en" ? "Approved" : "Chấp thuận")}`;
  } else if (isProcessing) {
    bg = "#f97316";
    label = `💬 ${cleanStatus || (language === "en" ? "Processing" : "Đang làm")}`;
  } else if (isRejected) {
    bg = "#ef4444";
    label = `✕ ${cleanStatus || (language === "en" ? "Rejected" : "Từ chối")}`;
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 500,
        padding: "4px 12px",
        borderRadius: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        boxShadow: `0 2px 6px ${bg}55`,
        border: "none",
      }}
    >
      {label}
    </span>
  );
}

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

  const workflowTableColumns = [
    {
      title: "#",
      dataIndex: "RowNum",
      key: "RowNum",
      width: 50,
      render: (val: any) => <Text>#{val}</Text>,
    },
    {
      title: t("workflow.role") || "Vai trò",
      dataIndex: "Role",
      key: "Role",
      width: 80,
      render: (val: string) => <Tag color="default">{val || "?"}</Tag>,
    },
    {
      title: t("workflow.assignee") || "Người phụ trách",
      dataIndex: "FullName",
      key: "FullName",
      render: (val: string) => <Text>{val || "---"}</Text>,
    },
    {
      title: t("workflow.decision") || "Quyết định",
      dataIndex: "ApprovalStatus",
      key: "ApprovalStatus",
      width: 140,
      render: (val: string) => renderApprovalBadge(val, undefined, language),
    },
    {
      title: t("workflow.remarks") || "Ý kiến",
      dataIndex: "Remarks",
      key: "Remarks",
      render: (val: string) =>
        val ? (
          <Text italic style={{ fontSize: 12 }}>{val}</Text>
        ) : (
          <Text type="secondary" italic style={{ fontSize: 12 }}>
            {t("workflow.noRemarks") || "Chưa có"}
          </Text>
        ),
    },
    {
      title: t("workflow.time") || "Thời gian",
      key: "time",
      width: 120,
      render: (_: any, r: any) => (
        <div style={{ fontSize: 11, color: "#595959" }}>
          {r.ActualStart && <div>{dayjs(r.ActualStart).format("HH:mm DD/MM")}</div>}
          {r.ActualFinish && <div>✓ {dayjs(r.ActualFinish).format("HH:mm DD/MM")}</div>}
        </div>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AuditOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <Text style={{ fontSize: 15 }}>
              {t("workflow.title") || "Quy trình phê duyệt"} — Submission #{currentSubmissionId}
            </Text>
          </div>
        }
        placement="right"
        width="50vw"
        zIndex={1100}
        open={open}
        onClose={onClose}
      >
        {loadingWorkflow ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                {t("workflow.loading") || "Đang tải quy trình duyệt..."}
              </Text>
            </div>
          </div>
        ) : workflowData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Text type="secondary">
              {t("workflow.empty") || "Chưa có lịch sử hoặc quy trình duyệt cho hạng mục này."}
            </Text>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <Text type="secondary" style={{ display: "block", marginBottom: 10, fontSize: 12 }}>
                {t("workflow.clickHint") || "💡 Nhấn vào dòng bên dưới để xem / nhập quyết định"}
              </Text>
              <Table
                dataSource={workflowData}
                rowKey={(r, index) => r.AssignmentId ?? r.RowNum ?? `wf_${index}`}
                pagination={false}
                size="small"
                onRow={(record) => ({
                  onClick: () => onOpenRowDetail(record),
                  style: { cursor: "pointer" },
                })}
                columns={workflowTableColumns}
              />
            </div>
          </div>
        )}
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
