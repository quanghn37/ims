"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Table, Steps, Spin, Typography, Tag, message } from "antd";
import { IconRoute } from "@tabler/icons-react";
import dayjs from "dayjs";
import InventoryWorkflowRowDetailDrawer from "./InventoryWorkflowRowDetailDrawer";
import { StockItemDetail } from "../../types";
import { warehouseApi } from "../../api";
import { extractApiList } from "@/lib/api-client";
import { renderApprovalBadge } from "@/components/common/ApprovalBadge";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface InventoryWorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  itemDetail?: StockItemDetail | any | null;
  displayMode?: string;
  onWorkflowUpdated?: () => void;
}

export default function InventoryWorkflowDrawer({
  open,
  onClose,
  itemDetail,
  displayMode = "Receipt",
  onWorkflowUpdated,
}: InventoryWorkflowDrawerProps) {
  const [workflowData, setWorkflowData] = useState<any[]>([]);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  // State cho row detail modal
  const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);
  const [selectedWorkflowRow, setSelectedWorkflowRow] = useState<any>(null);
  const [processingStatusList, setProcessingStatusList] = useState<any[]>([]);
  const [loadingProcessingStatus, setLoadingProcessingStatus] = useState(false);
  const [rowDetailDecision, setRowDetailDecision] = useState<string>("");
  const [rowDetailQnty, setRowDetailQnty] = useState<number>(0);
  const [rowDetailUnitPrice, setRowDetailUnitPrice] = useState<number>(0);
  const [rowDetailRemarks, setRowDetailRemarks] = useState<string>("");
  const [savingRowDetail, setSavingRowDetail] = useState(false);

  const subId = itemDetail?.SubmissionId ?? itemDetail?.LocalId;

  const fetchWorkflowStatus = useCallback(async () => {
    if (!subId) {
      setWorkflowData([]);
      return;
    }
    setLoadingWorkflow(true);
    try {
      const data = await warehouseApi.getInventorySubmissionStatus({
        DisplayMode: displayMode,
        SubmissionId: Number(subId),
        PageNum: 1,
        PageSize: 20,
      });
      setWorkflowData(extractApiList(data));
    } catch (e: any) {
      console.error("Lỗi tải trạng thái quy trình duyệt:", e);
      message.error(e?.message || "Không thể tải quy trình duyệt chi tiết.");
      setWorkflowData([]);
    } finally {
      setLoadingWorkflow(false);
    }
  }, [subId, displayMode]);

  useEffect(() => {
    if (open && subId) {
      fetchWorkflowStatus();
    } else {
      setWorkflowData([]);
      setIsRowDetailOpen(false);
    }
  }, [open, subId, fetchWorkflowStatus]);

  const openRowDetail = async (record: any) => {
    setSelectedWorkflowRow(record);
    setRowDetailQnty(Number(record.Qnty ?? itemDetail?.Qnty ?? 0));
    setRowDetailUnitPrice(Number(record.UnitPrice ?? itemDetail?.UnitPrice ?? 0));
    setRowDetailRemarks(record.Remarks || "");
    setRowDetailDecision(record.ApprovalStatus || "");
    setIsRowDetailOpen(true);
    setLoadingProcessingStatus(true);

    try {
      const data = await warehouseApi.getProcessingStatuses({
        DisplayMode: "approval_no_all",
        Role: record.Role || "A",
      });
      setProcessingStatusList(extractApiList(data));
    } catch {
      setProcessingStatusList([]);
    } finally {
      setLoadingProcessingStatus(false);
    }
  };

  const handleSaveRowDetail = async () => {
    if (!selectedWorkflowRow) return;
    setSavingRowDetail(true);
    try {
      await warehouseApi.updateSubmissionReview(
        {
          SubmissionDetail: [
            {
              AssignmentId: selectedWorkflowRow.AssignmentId || selectedWorkflowRow.LocalId,
              WorkType: displayMode === "Request" ? "Inventory_request" : "Inventory_receipt",
              ApprovalDecision: rowDetailDecision,
              Qnty: rowDetailQnty,
              UnitPrice: rowDetailUnitPrice,
              Remarks: rowDetailRemarks,
            },
          ],
        },
        "update_detail_all_work_type"
      );
      message.success("Lưu quyết định duyệt thành công!");
      setIsRowDetailOpen(false);
      fetchWorkflowStatus();
      if (onWorkflowUpdated) {
        onWorkflowUpdated();
      }
    } catch (e: any) {
      console.error("Lỗi lưu quyết định duyệt:", e);
      message.error(e?.message || "Lưu quyết định duyệt thất bại!");
    } finally {
      setSavingRowDetail(false);
    }
  };

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
        <span style={{ fontFamily: "monospace", color: "#64748B", fontWeight: 600, fontSize: 13 }}>
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
            background: "#EDE9FE",
            color: "#7C3AED",
            border: "1px solid #DDD6FE",
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
        <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>
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
      render: (val: string) => renderApprovalBadge(val, undefined, language),
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
          <div style={{ fontSize: 12, color: "#64748B", lineHeight: "18px" }}>
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
                background: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconRoute size={20} strokeWidth={1.8} style={{ color: "#7C3AED" }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#7C3AED", lineHeight: "24px" }}>
                {language === "en"
                  ? `Approval Workflow (${displayMode === "Request" ? "Material Request" : "Stock Receipt"})`
                  : `Quy trình phê duyệt ${displayMode === "Request" ? "Yêu cầu xuất" : "Nhập kho"}`}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                Submission #{subId} · {displayMode === "Request" ? (language === "en" ? "Material Requisition Note" : "Phiếu yêu cầu xuất vật tư") : (language === "en" ? "Stock Receipt Note" : "Phiếu nhập vật tư")}
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
            background: #F8FAFC !important;
            color: #0F172A !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            line-height: 18px !important;
            border-color: #E2E8F0 !important;
            padding: 10px 12px !important;
          }
          .workflow-history-table .ant-table-tbody > tr > td {
            color: #0F172A !important;
            font-size: 13px !important;
            line-height: 18px !important;
            border-color: #E2E8F0 !important;
            padding: 10px 12px !important;
            height: 46px !important;
          }
          .workflow-history-table .ant-table-tbody > tr:hover > td {
            background-color: #F5F3FF !important;
          }
          .workflow-history-table .ant-table-container {
            border: 1px solid #E2E8F0 !important;
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
                color: "#64748B",
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
                border: "1px solid #E2E8F0",
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
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                    {t("common.materialCode") || "Mã vật tư"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>
                    {itemDetail.SystemCode || itemDetail.itemCode || "---"}
                  </div>
                </div>

                {/* Ô 2: Tên vật tư */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                    {t("common.materialName") || "Tên vật tư"}
                  </div>
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={itemDetail.Description || itemDetail.itemName}
                  >
                    {itemDetail.Description || itemDetail.itemName || "---"}
                  </div>
                </div>

                {/* Ô 3: ĐVT */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                    {t("common.unit") || "ĐVT"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    {itemDetail.Unit || itemDetail.unit || "---"}
                  </div>
                </div>

                {/* Ô 4, 5, 6: Phân chia theo displayMode (Request: OrgName, SL đề nghị, SL duyệt / Receipt: SL đề nghị, Đơn giá, Thành tiền) */}
                {displayMode === "Request" ? (
                  <>
                    {/* Ô 4: OrgName */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>OrgName</div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={
                          itemDetail.Orgcode && itemDetail.OrgName
                            ? `${itemDetail.Orgcode} - ${itemDetail.OrgName}`
                            : itemDetail.OrgName || itemDetail.orgName || itemDetail.Orgcode || itemDetail.orgCode || ""
                        }
                      >
                        {itemDetail.OrgName || itemDetail.orgName || itemDetail.Orgcode || itemDetail.orgCode || "---"}
                      </div>
                    </div>

                    {/* Ô 5: Số lượng đề nghị */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                        {language === "en" ? "Requested Qty" : "Số lượng đề nghị"}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        {Number(itemDetail.requestedQty ?? itemDetail.Qnty ?? itemDetail.actualQty ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>

                    {/* Ô 6: Số lượng duyệt */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                        {t("workflow.approvedQty") || "Số lượng duyệt"}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#7C3AED" }}>
                        {Number(itemDetail.approvedQty ?? itemDetail.ApprovedQty ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Ô 4: Số lượng đề nghị */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                        {language === "en" ? "Requested Qty" : "Số lượng đề nghị"}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        {Number(itemDetail.Qnty ?? itemDetail.actualQty ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>

                    {/* Ô 5: Đơn giá đề nghị */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                        {language === "en" ? "Requested Unit Price" : "Đơn giá đề nghị"}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        {Number(itemDetail.UnitPrice ?? itemDetail.unitPrice ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>

                    {/* Ô 6: Thành tiền đề nghị */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
                        {language === "en" ? "Requested Amount" : "Thành tiền đề nghị"}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#7C3AED" }}>
                        {Number(itemDetail.Amount ?? itemDetail.totalPrice ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>
                  </>
                )}
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
                border: "1px solid #E2E8F0",
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
                          background: "#7C3AED",
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
                          color: "#64748B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                          border: "1px solid #E2E8F0",
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
                        {item.FullName || item.UserName || `${language === "en" ? "Approver " : "Người duyệt "}${idx + 1}`}
                      </div>
                    ),
                    description: (
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2, lineHeight: "16px" }}>
                        <div>
                          {isDone
                            ? (statusStr || (language === "en" ? "Approved" : "Chấp thuận"))
                            : isProcessing
                            ? (statusStr || (language === "en" ? "In Progress" : "Đang làm"))
                            : isRejected
                            ? (statusStr || (language === "en" ? "Rejected" : "Từ chối"))
                            : (statusStr || (language === "en" ? "Not Started" : "Chưa làm"))}
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
                  color: "#64748B",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>💡</span> {t("workflow.clickHint") || "Nhấn vào dòng bên dưới để xem / nhập quyết định duyệt"}
              </div>
              <Table
                className="workflow-history-table"
                dataSource={workflowData}
                rowKey={(r, idx) => r.AssignmentId || r.RowNum || `wf_${idx}`}
                pagination={false}
                size="middle"
                onRow={(record) => ({
                  onClick: () => openRowDetail(record),
                  style: { cursor: "pointer" },
                })}
                columns={workflowTableColumns}
              />
            </div>
          </div>
        )}
      </Drawer>

      <InventoryWorkflowRowDetailDrawer
        open={isRowDetailOpen}
        onClose={() => setIsRowDetailOpen(false)}
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
        onSave={handleSaveRowDetail}
        displayMode={displayMode}
      />
    </>
  );
}
