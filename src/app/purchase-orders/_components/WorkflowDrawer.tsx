"use client";

import React from "react";
import { Drawer, Table, Steps, Spin, Typography, Tag } from "antd";
import { AuditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import WorkflowRowDetailDrawer from "./WorkflowRowDetailDrawer";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

function renderApprovalBadge(val: string, language: string = "vi") {
  const cleanVal = String(val || "").trim();
  const lower = cleanVal.toLowerCase();

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

  let bg = "#F59E0B";
  let icon = "🕒";
  let label = cleanVal || (language === "en" ? "Not Started" : "Chưa làm");

  if (isDone) {
    bg = "#0D9488";
    icon = "✓";
    label = cleanVal || (language === "en" ? "Approved" : "Chấp thuận");
  } else if (isProcessing) {
    bg = "#F97316";
    icon = "💬";
    label = cleanVal || (language === "en" ? "Processing" : "Đang làm");
  } else if (isRejected) {
    bg = "#EF4444";
    icon = "✕";
    label = cleanVal || (language === "en" ? "Rejected" : "Từ chối");
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 12px",
        borderRadius: 16,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

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

  const workflowTableColumns = [
    {
      title: "#",
      dataIndex: "RowNum",
      key: "RowNum",
      width: 50,
      align: "center" as const,
      render: (val: any, _: any, idx: number) => (
        <span style={{ fontFamily: "monospace", color: "#718894", fontWeight: 600, fontSize: 13 }}>
          #{val || idx + 1}
        </span>
      ),
    },
    {
      title: t("workflow.role") || "Vai trò",
      dataIndex: "Role",
      key: "Role",
      width: 85,
      align: "center" as const,
      render: (val: string) => (
        <Tag
          style={{
            background: "#dce5e6",
            color: "#008f89",
            border: "1px solid #b2ded9",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 12,
            padding: "1px 8px",
            margin: 0,
          }}
        >
          {val || "?"}
        </Tag>
      ),
    },
    {
      title: t("workflow.assignee") || "Người phụ trách",
      dataIndex: "FullName",
      key: "FullName",
      width: 170,
      render: (val: string, r: any) => (
        <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
          {val || r.UserName || "---"}
        </span>
      ),
    },
    {
      title: t("workflow.decision") || "Quyết định",
      dataIndex: "ApprovalStatus",
      key: "ApprovalStatus",
      width: 135,
      align: "center" as const,
      render: (val: string) => renderApprovalBadge(val, language),
    },
    {
      title: t("workflow.remarks") || "Ý kiến",
      dataIndex: "Remarks",
      key: "Remarks",
      render: (val: string) =>
        val ? (
          <span style={{ fontSize: 13, color: "#334155" }}>{val}</span>
        ) : (
          <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
            {t("workflow.noRemarks") || "Chưa có"}
          </span>
        ),
    },
    {
      title: t("workflow.time") || "Thời gian",
      key: "time",
      width: 140,
      render: (_: any, r: any) => {
        const start = r.ActualStart ? dayjs(r.ActualStart).format("HH:mm DD/MM") : null;
        const finish = r.ActualFinish ? dayjs(r.ActualFinish).format("HH:mm DD/MM") : null;
        return (
          <div style={{ fontSize: 12, color: "#718894", lineHeight: "18px" }}>
            {start && <div>🕒 {start}</div>}
            {finish && <div style={{ color: "#0D9488", fontWeight: 500 }}>✓ {finish}</div>}
            {!start && !finish && "---"}
          </div>
        );
      },
    },
  ];

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
        bodyStyle={{ padding: "20px 24px", background: "#FAF5FF08" }}
      >
        {/* Scoped CSS cho bảng lịch sử phê duyệt */}
        <style jsx global>{`
          .workflow-history-table .ant-table-thead > tr > th {
            background: #f7fbfa !important;
            color: #123443 !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            line-height: 18px !important;
            border-color: #dce5e6 !important;
            padding: 10px 12px !important;
          }
          .workflow-history-table .ant-table-tbody > tr > td {
            color: #123443 !important;
            font-size: 13px !important;
            line-height: 18px !important;
            border-color: #dce5e6 !important;
            padding: 10px 12px !important;
            height: 46px !important;
          }
          .workflow-history-table .ant-table-tbody > tr:hover > td {
            background-color: #eef8f6 !important;
          }
          .workflow-history-table .ant-table-container {
            border: 1px solid #dce5e6 !important;
            border-radius: 8px !important;
            overflow: hidden;
          }
        `}</style>

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
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #dce5e6",
                borderRadius: 10,
                padding: "14px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
              >
                {/* Ô 1: Mã vật tư */}
                <div style={{ background: "#f7fbfa", border: "1px solid #dce5e6", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 4 }}>
                    {t("common.materialCode") || "Mã vật tư"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#123443", fontFamily: "monospace" }}>
                    {itemDetail.ItemCode || itemDetail.SystemCode || itemDetail.MaterialId || "---"}
                  </div>
                </div>

                {/* Ô 2: Tên vật tư */}
                <div style={{ background: "#f7fbfa", border: "1px solid #dce5e6", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 4 }}>
                    {t("common.materialName") || "Tên vật tư"}
                  </div>
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: "#123443", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={itemDetail.ItemName || itemDetail.Description}
                  >
                    {itemDetail.ItemName || itemDetail.Description || "---"}
                  </div>
                </div>

                {/* Ô 3: ĐVT */}
                <div style={{ background: "#f7fbfa", border: "1px solid #dce5e6", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 4 }}>
                    {t("common.unit") || "ĐVT"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#123443" }}>
                    {itemDetail.Unit || itemDetail.unit || itemDetail.UomCode || "---"}
                  </div>
                </div>

                {/* Ô 4: Số lượng đề nghị */}
                <div style={{ background: "#f7fbfa", border: "1px solid #dce5e6", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 4 }}>
                    {language === "en" ? "Requested Qty" : "Số lượng đề nghị"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#123443" }}>
                    {Number(itemDetail.Qnty ?? itemDetail.actualQty ?? itemDetail.PO_Qnty ?? 0).toLocaleString(numLocale)}
                  </div>
                </div>

                {/* Ô 5: Đơn giá đề nghị */}
                <div style={{ background: "#f7fbfa", border: "1px solid #dce5e6", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 4 }}>
                    {language === "en" ? "Requested Unit Price" : "Đơn giá đề nghị"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#123443" }}>
                    {Number(itemDetail.UnitPrice ?? itemDetail.unitPrice ?? 0).toLocaleString(numLocale)}
                  </div>
                </div>

                {/* Ô 6: Thành tiền đề nghị */}
                <div style={{ background: "#f7fbfa", border: "1px solid #dce5e6", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 4 }}>
                    {language === "en" ? "Requested Amount" : "Thành tiền đề nghị"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#008f89" }}>
                    {Number(itemDetail.Amount ?? itemDetail.TotalPrice ?? itemDetail.totalPrice ?? 0).toLocaleString(numLocale)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stepper Card */}
            <div
              style={{
                background: "#FFFFFF",
                padding: "20px 24px",
                borderRadius: 10,
                border: "1px solid #dce5e6",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
              }}
            >
              <Steps
                current={
                  workflowData.findIndex((i) => {
                    const l = String(i.ApprovalStatus || "").toLowerCase();
                    return l === "đang làm" || l === "dang làm" || l === "dang lam" || l === "processing" || l === "in progress";
                  }) !== -1
                    ? workflowData.findIndex((i) => {
                        const l = String(i.ApprovalStatus || "").toLowerCase();
                        return l === "đang làm" || l === "dang làm" || l === "dang lam" || l === "processing" || l === "in progress";
                      })
                    : 0
                }
                items={workflowData.map((item, idx) => {
                  const statusStr = item.ApprovalStatus || "";
                  const lower = statusStr.toLowerCase();
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

                  let iconNode;
                  if (isDone) {
                    iconNode = (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#0D9488",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 16,
                        }}
                      >
                        ✓
                      </div>
                    );
                  } else if (isProcessing) {
                    iconNode = (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#008f89",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {idx + 1}
                      </div>
                    );
                  } else if (isRejected) {
                    iconNode = (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#EF4444",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        ✕
                      </div>
                    );
                  } else {
                    iconNode = (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#F1F5F9",
                          color: "#718894",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                          border: "1px solid #dce5e6",
                        }}
                      >
                        {idx + 1}
                      </div>
                    );
                  }

                  const timeStr = item.ActualFinish || item.ActualStart || item.ApprovedOn;
                  const formattedTime = timeStr ? dayjs(timeStr).format("HH:mm DD/MM") : null;

                  return {
                    icon: iconNode,
                    title: (
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#123443", marginTop: 4 }}>
                        {item.FullName || item.UserName || `${language === "en" ? "Approver " : "Người duyệt "}${idx + 1}`}
                      </div>
                    ),
                    description: (
                      <div style={{ fontSize: 12, color: "#718894", marginTop: 2, lineHeight: "16px" }}>
                        <div>
                          {statusStr || (isDone
                            ? (language === "en" ? "Approved" : "Chấp thuận")
                            : isProcessing
                            ? (language === "en" ? "Processing" : "Đang làm")
                            : isRejected
                            ? (language === "en" ? "Rejected" : "Từ chối")
                            : (language === "en" ? "Not-Started" : "Chưa làm"))}
                        </div>
                        {formattedTime && <div style={{ color: "#94A3B8" }}>{formattedTime}</div>}
                      </div>
                    ),
                  };
                })}
              />
            </div>

            {/* Bảng danh sách chi tiết */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#718894",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>💡</span> {t("workflow.clickHint") || "Nhấn vào dòng bên dưới để xem / nhập quyết định"}
              </div>
              <Table
                className="workflow-history-table"
                dataSource={workflowData}
                rowKey={(r, idx) => r.AssignmentId || r.RowNum || `wf_${idx}`}
                pagination={false}
                size="middle"
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
