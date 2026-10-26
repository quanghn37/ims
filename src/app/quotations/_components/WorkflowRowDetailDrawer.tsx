"use client";

import React from "react";
import {
  Drawer,
  Button,
  Divider,
  InputNumber,
  Select,
  Spin,
  Typography,
  Tag,
  Input,
} from "antd";
import { AuditOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { renderStatusDotItem } from "@/config/statusConfig";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

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
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AuditOutlined style={{ color: "#008f89" }} />
          <Text>{selectedWorkflowRow?.FullName || "---"}</Text>
          <Tag color="default">{selectedWorkflowRow?.Role || ""}</Tag>
        </div>
      }
      placement="right"
      width="33vw"
      zIndex={1200}
      open={open}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>{t("workflow.close") || "Đóng"}</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(selectedWorkflowRow.ActualStart || selectedWorkflowRow.ActualFinish) && (
              <div
                style={{
                  fontSize: 12,
                  color: "#8c8c8c",
                  background: "#fafafa",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #f0f0f0",
                }}
              >
                {selectedWorkflowRow.ActualStart && (
                  <div>🕐 {t("workflow.startTime") || "Bắt đầu"}: {dayjs(selectedWorkflowRow.ActualStart).format("HH:mm DD/MM/YYYY")}</div>
                )}
                {selectedWorkflowRow.ActualFinish && (
                  <div>✅ {t("workflow.finishTime") || "Hoàn thành"}: {dayjs(selectedWorkflowRow.ActualFinish).format("HH:mm DD/MM/YYYY")}</div>
                )}
              </div>
            )}

            <div>
              <div style={{ marginBottom: 6, fontSize: 13 }}>
                {t("workflow.decision") || "Quyết định"}
              </div>
              <Select
                value={rowDetailDecision || undefined}
                onChange={setRowDetailDecision}
                placeholder={t("workflow.selectDecision") || "Chọn quyết định..."}
                style={{ width: "100%" }}
                loading={loadingProcessingStatus}
                options={
                  processingStatusList.length > 0
                    ? (() => {
                        const seen = new Set<string>();
                        return processingStatusList
                          .map((item: any) => {
                            const raw = item.Description || item.StatusName || item.Value || item.Alias || "";
                            const clean = String(raw).replace(/[✅❌⏳]/g, "").trim();
                            let label = clean || raw;

                            if (language === "en") {
                              const lower = clean.toLowerCase();
                              if (lower === "duyệt" || lower === "chấp thuận" || lower === "đã duyệt" || lower === "approved") {
                                label = "Approved";
                              } else if (lower === "cond-approved" || lower === "cond approved") {
                                label = "Cond-Approved";
                              } else if (lower === "từ chối" || lower === "rejected") {
                                label = "Rejected";
                              } else if (lower === "đang làm" || lower === "dang lam" || lower === "in-progress" || lower === "in progress" || lower === "processing") {
                                label = "In-Progress";
                              } else if (lower === "chưa làm" || lower === "not-started" || lower === "not started") {
                                label = "Not-Started";
                              }
                            } else {
                              const lower = clean.toLowerCase();
                              if (lower === "approved") {
                                label = "Chấp thuận";
                              } else if (lower === "cond-approved") {
                                label = "Duyệt có điều kiện";
                              } else if (lower === "in-progress" || lower === "processing" || lower === "in progress") {
                                label = "Đang làm";
                              } else if (lower === "rejected") {
                                label = "Từ chối";
                              } else if (lower === "not-started" || lower === "not started") {
                                label = "Chưa làm";
                              }
                            }

                            return { value: raw, label: renderStatusDotItem(raw, label) };
                          })
                          .filter((it: any) => {
                            if (!it.value || seen.has(it.value)) return false;
                            seen.add(it.value);
                            return true;
                          });
                      })()
                    : [
                        {
                          value: language === "en" ? "Approved" : "Chấp thuận",
                          label: renderStatusDotItem("Approved", language === "en" ? "Approved" : "Chấp thuận"),
                        },
                        {
                          value: language === "en" ? "In-Progress" : "Đang làm",
                          label: renderStatusDotItem("In-Progress", language === "en" ? "In-Progress" : "Đang làm"),
                        },
                        {
                          value: language === "en" ? "Rejected" : "Từ chối",
                          label: renderStatusDotItem("Rejected", language === "en" ? "Rejected" : "Từ chối"),
                        },
                      ]
                }
              />
            </div>

            <Divider style={{ margin: "4px 0" }} />

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 6, fontSize: 13 }}>
                  {t("workflow.approvedQty") || "Số lượng duyệt"}
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                    ({t("workflow.original") || "Gốc"}: {Number(selectedWorkflowRow.Qnty || 0).toLocaleString(numLocale)})
                  </Text>
                </div>
                <InputNumber
                  value={rowDetailQnty}
                  onChange={(v) => setRowDetailQnty(Number(v || 0))}
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val?.replace(/,/g, "") || 0) as any}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 6, fontSize: 13 }}>
                  {t("workflow.approvedUnitPrice") || "Đơn giá duyệt"}
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                    ({t("workflow.original") || "Gốc"}: {Number(selectedWorkflowRow.UnitPrice || 0).toLocaleString(numLocale)})
                  </Text>
                </div>
                <InputNumber
                  value={rowDetailUnitPrice}
                  onChange={(v) => setRowDetailUnitPrice(Number(v || 0))}
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val?.replace(/,/g, "") || 0) as any}
                />
              </div>
            </div>

            <div
              style={{
                background: "#fafafa",
                borderRadius: 8,
                padding: "12px 16px",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ fontSize: 12, color: "#595959", marginBottom: 4 }}>
                {t("workflow.approvedAmount") || "Thành tiền duyệt"}
              </div>
              <Text style={{ fontSize: 16 }}>
                {(rowDetailQnty * rowDetailUnitPrice).toLocaleString(numLocale)}
              </Text>
            </div>

            <div>
              <div style={{ marginBottom: 6, fontSize: 13 }}>
                {t("workflow.remarks") || "Ý kiến / Ghi chú"}
              </div>
              <Input.TextArea
                value={rowDetailRemarks}
                onChange={(e) => setRowDetailRemarks(e.target.value)}
                rows={3}
                placeholder={t("workflow.remarksPlaceholder") || "Nhập ý kiến phê duyệt..."}
              />
            </div>
          </div>
        </Spin>
      )}
    </Drawer>
  );
}
