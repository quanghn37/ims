"use client";

import React from "react";
import { Modal, Table, Steps, Spin, Empty, Typography, Descriptions, Button } from "antd";
import { AuditOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StockItemDetail } from "../../types";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface InventoryApprovalModalProps {
  open: boolean;
  onClose: () => void;
  item: StockItemDetail | null;
  workflowData: any[];
  loading: boolean;
}

export default function InventoryApprovalModal({
  open,
  onClose,
  item,
  workflowData,
  loading,
}: InventoryApprovalModalProps) {
  const { t, language } = useTranslation();
  const subId = item?.SubmissionId ?? item?.LocalId;

  const columns = [
    {
      title: "#",
      dataIndex: "RowNum",
      key: "RowNum",
      width: 50,
      align: "center" as const,
      render: (val: any, _: any, idx: number) => (
        <span style={{ color: "#262626" }}>{val || idx + 1}</span>
      ),
    },
    {
      title: language === "en" ? "Role" : "Vai trò",
      dataIndex: "Role",
      key: "Role",
      width: 90,
      align: "center" as const,
      render: (val: string) => <span style={{ color: "#262626" }}>{val || "---"}</span>,
    },
    {
      title: language === "en" ? "Assignee" : "Người phụ trách",
      dataIndex: "FullName",
      key: "FullName",
      width: 160,
      render: (val: string, r: any) => (
        <span style={{ color: "#262626" }}>{val || r.UserName || r.ApproverName || "---"}</span>
      ),
    },
    {
      title: language === "en" ? "Decision" : "Quyết định",
      dataIndex: "ApprovalStatus",
      key: "ApprovalStatus",
      width: 130,
      align: "center" as const,
      render: (val: string, r: any) => {
        const raw = val || r.Status || r.StatusCode || r.StatusName || "";
        const lower = String(raw).toLowerCase();
        let display = raw;
        if (language === "en") {
          if (lower === "chấp thuận" || lower === "duyệt" || lower === "đã duyệt" || lower === "approved") display = "Approved";
          else if (lower === "đang làm" || lower === "dang lam" || lower === "processing" || lower === "in-progress" || lower === "in progress") display = "In-Progress";
          else if (lower === "từ chối" || lower === "rejected") display = "Rejected";
          else if (lower === "chưa làm" || lower === "not-started" || lower === "pending" || lower === "chờ duyệt") display = "Pending";
        }
        return (
          <span style={{ color: "#262626" }}>
            {display || (language === "en" ? "Pending" : "Chờ duyệt")}
          </span>
        );
      },
    },
    {
      title: language === "en" ? "Comments" : "Ý kiến",
      dataIndex: "Remarks",
      key: "Remarks",
      render: (val: string, r: any) => {
        const text = val || r.Comments || r.Description;
        return <span style={{ color: "#262626" }}>{text || "---"}</span>;
      },
    },
    {
      title: language === "en" ? "Start" : "Bắt đầu",
      dataIndex: "ActualStart",
      key: "ActualStart",
      width: 140,
      align: "center" as const,
      render: (val: string, r: any) => {
        const time = val || r.StartDate || r.ApprovalStart;
        return (
          <span style={{ color: "#262626" }}>
            {time ? dayjs(time).format("DD/MM/YYYY HH:mm") : "---"}
          </span>
        );
      },
    },
    {
      title: language === "en" ? "Finish" : "Hoàn tất",
      dataIndex: "ActualFinish",
      key: "ActualFinish",
      width: 140,
      align: "center" as const,
      render: (val: string, r: any) => {
        const time = val || r.FinishDate || r.ApprovedOn;
        return (
          <span style={{ color: "#262626" }}>
            {time ? dayjs(time).format("DD/MM/YYYY HH:mm") : "---"}
          </span>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AuditOutlined style={{ color: "#262626", fontSize: 18 }} />
          <span style={{ color: "#262626", fontWeight: 600 }}>
            {language === "en" ? "Material Item Approval Workflow" : "Quá trình phê duyệt chi tiết vật tư"}
          </span>
          {subId && (
            <span style={{ color: "#595959", fontSize: 13, fontWeight: "normal" }}>
              (Submission #{subId})
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={850}
      footer={[
        <Button key="close" onClick={onClose} icon={<CloseOutlined />}>
          {t.common.close}
        </Button>,
      ]}
    >
      {item && (
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: 6,
            padding: "10px 14px",
            marginBottom: 16,
          }}
        >
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label={language === "en" ? "Item Code" : "Mã vật tư"}>
              <span style={{ color: "#262626" }}>{item.SystemCode || item.itemCode || "---"}</span>
            </Descriptions.Item>
            <Descriptions.Item label={t.lov.colItemName}>
              <span style={{ color: "#262626" }}>{item.Description || item.itemName || "---"}</span>
            </Descriptions.Item>
            <Descriptions.Item label={t.lov.colUnit}>
              <span style={{ color: "#262626" }}>{item.Unit || item.unit || "---"}</span>
            </Descriptions.Item>
            <Descriptions.Item label={language === "en" ? "Quantity" : "Số lượng"}>
              <span style={{ color: "#262626" }}>
                {Number(item.Qnty ?? item.actualQty ?? 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t.itemDrawer.unitPrice}>
              <span style={{ color: "#262626" }}>
                {Number(item.UnitPrice ?? item.unitPrice ?? 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t.itemDrawer.totalPrice}>
              <span style={{ color: "#262626" }}>
                {Number(item.Amount ?? item.totalPrice ?? 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 12 }}>
            <Text style={{ color: "#262626" }}>{language === "en" ? "Loading approval workflow..." : "Đang tải quá trình phê duyệt..."}</Text>
          </div>
        </div>
      ) : workflowData.length === 0 ? (
        <Empty
          style={{ padding: "30px 0" }}
          description={language === "en" ? "No approval workflow data for this item" : "Chưa có dữ liệu quá trình phê duyệt cho chi tiết này"}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Steps flow */}
          <div
            style={{
              background: "#fafafa",
              padding: "16px",
              borderRadius: 6,
              border: "1px solid #f0f0f0",
            }}
          >
            <Steps
              size="small"
              current={
                workflowData.findIndex((w) => {
                  const l = String(w.ApprovalStatus || "").toLowerCase();
                  return l === "đang làm" || l === "dang làm" || l === "dang lam" || l === "processing" || l === "in progress" || l === "chờ duyệt" || l === "pending";
                }) >= 0
                  ? workflowData.findIndex((w) => {
                      const l = String(w.ApprovalStatus || "").toLowerCase();
                      return l === "đang làm" || l === "dang làm" || l === "dang lam" || l === "processing" || l === "in progress" || l === "chờ duyệt" || l === "pending";
                    })
                  : workflowData.length - 1
              }
              items={workflowData.map((item, idx) => {
                const statusStr = item.ApprovalStatus || item.Status || "";
                const isDone =
                  statusStr === "Chấp thuận" || statusStr === "Approved" || statusStr === "Đã duyệt";
                const isProcessing =
                  statusStr === "Dang làm" || statusStr === "Đang làm" || statusStr === "Processing";
                const isRejected =
                  statusStr === "Từ chối" || statusStr === "Rejected";

                let stepStatus: "finish" | "process" | "wait" | "error" = "wait";
                if (isDone) stepStatus = "finish";
                else if (isProcessing) stepStatus = "process";
                else if (isRejected) stepStatus = "error";

                return {
                  title: (
                    <span style={{ fontSize: 13, color: "#262626" }}>
                      {item.FullName || item.UserName || `Cấp ${idx + 1}`}
                    </span>
                  ),
                  description: (
                    <div style={{ fontSize: 11, color: "#595959", marginTop: 2 }}>
                      <div>{statusStr || (isDone ? "Chấp thuận" : "Chờ duyệt")}</div>
                      {item.ActualFinish && (
                        <div>{dayjs(item.ActualFinish).format("HH:mm DD/MM")}</div>
                      )}
                    </div>
                  ),
                  status: stepStatus,
                };
              })}
            />
          </div>

          {/* Table detail */}
          <Table
            dataSource={workflowData}
            rowKey={(r, idx) => r.AssignmentId || r.RowNum || `wf_${idx}`}
            pagination={false}
            size="small"
            bordered
            columns={columns}
          />
        </div>
      )}
    </Modal>
  );
}
