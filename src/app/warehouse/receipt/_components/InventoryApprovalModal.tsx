"use client";

import React from "react";
import { Modal, Table, Spin, Empty, Typography, Descriptions, Button } from "antd";
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
