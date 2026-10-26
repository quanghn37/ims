"use client";

import React, { useState } from "react";
import {
  Drawer,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Modal,
  Input,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { MaterialRequisition, MaterialRequisitionItem } from "../../types";
import { useTranslation } from "@/locales/LanguageContext";

const { Text, Title } = Typography;

export interface RequisitionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  requisition: MaterialRequisition | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSubmitForApproval: (id: string) => void;
}

export default function RequisitionDetailDrawer({
  open,
  onClose,
  requisition,
  onApprove,
  onReject,
  onSubmitForApproval,
}: RequisitionDetailDrawerProps) {
  const { t, language } = useTranslation();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!requisition) return null;

  const numLocale = language === "en" ? "en-US" : "vi-VN";

  const handleConfirmReject = () => {
    onReject(
      requisition.id,
      rejectReason || (language === "en" ? "Does not meet approval requirements" : "Không đạt yêu cầu phê duyệt")
    );
    setRejectModalOpen(false);
    setRejectReason("");
  };

  const columns: ColumnsType<MaterialRequisitionItem> = [
    {
      title: "STT",
      key: "stt",
      width: 50,
      align: "center",
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: language === "en" ? "Item Code" : "Mã VT",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 130,
      render: (val: string) => (
        <span style={{ fontWeight: 600, color: "#008f89", fontFamily: "monospace" }}>{val}</span>
      ),
    },
    {
      title: t.lov.colItemName,
      dataIndex: "itemName",
      key: "itemName",
      width: 260,
      render: (val: string) => <span style={{ fontWeight: 600, color: "#123443" }}>{val}</span>,
    },
    {
      title: t.lov.colUnit,
      dataIndex: "unit",
      key: "unit",
      width: 70,
      align: "center",
      render: (val: string) => val || (language === "en" ? "Pcs" : "Cái"),
    },
    {
      title: language === "en" ? "Available Stock" : "Tồn khả dụng",
      dataIndex: "availableQty",
      key: "availableQty",
      width: 105,
      align: "right",
      render: (val: number) => (
        <span style={{ color: "#10B981", fontWeight: 600 }}>
          {Number(val || 0).toLocaleString(numLocale)}
        </span>
      ),
    },
    {
      title: language === "en" ? "Requested Qty" : "SL Yêu cầu",
      dataIndex: "requestedQty",
      key: "requestedQty",
      width: 105,
      align: "right",
      render: (val: number) => (
        <span style={{ fontWeight: 700, color: "#123443" }}>
          {Number(val || 0).toLocaleString(numLocale)}
        </span>
      ),
    },
    {
      title: language === "en" ? "Approved Qty" : "SL Duyệt",
      dataIndex: "approvedQty",
      key: "approvedQty",
      width: 100,
      align: "right",
      render: (val: number) =>
        val !== undefined && val !== null ? (
          <span style={{ color: "#008f89", fontWeight: 700 }}>
            {Number(val).toLocaleString(numLocale)}
          </span>
        ) : (
          <span style={{ color: "#94A3B8" }}>-</span>
        ),
    },
    {
      title: language === "en" ? "Location / Work Area" : "Vị trí thi công",
      dataIndex: "workLocation",
      key: "workLocation",
      width: 160,
      render: (val: string) => val || "-",
    },
    {
      title: t.itemDrawer.notes,
      dataIndex: "note",
      key: "note",
      width: 150,
      render: (val: string) => val || "-",
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ color: "#008f89", fontSize: 18 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#123443", fontSize: 15 }}>
                {language === "en" ? "Requisition Details: " : "Chi tiết Phiếu yêu cầu: "}{requisition.requisitionCode}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {language === "en" ? "Project: " : "Dự án: "}{requisition.projectName} | {language === "en" ? "Package: " : "Gói: "}{requisition.workPackage || (language === "en" ? "Entire Project" : "Toàn dự án")}
              </Text>
            </div>
          </div>
        }
        open={open}
        onClose={onClose}
        width={1000}
        styles={{ body: { padding: 20 } }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button onClick={onClose} style={{ borderRadius: 6 }}>
              {t.common.close}
            </Button>
            <Space size={8}>
              {requisition.status === "DRAFT" && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => onSubmitForApproval(requisition.id)}
                  style={{ background: "#008f89", borderColor: "#008f89", borderRadius: 6 }}
                >
                  {language === "en" ? "Submit for Approval" : "Gửi duyệt"}
                </Button>
              )}
              {requisition.status === "PENDING" && (
                <>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setRejectModalOpen(true)}
                    style={{ borderRadius: 6 }}
                  >
                    {language === "en" ? "Reject" : "Từ chối"}
                  </Button>
                  <Popconfirm
                    title={language === "en" ? "Are you sure you want to approve this requisition?" : "Xác nhận phê duyệt phiếu yêu cầu này?"}
                    onConfirm={() => onApprove(requisition.id)}
                    okText={language === "en" ? "Approve" : "Duyệt"}
                    cancelText={t.common.cancel}
                  >
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      style={{ background: "#10B981", borderColor: "#10B981", borderRadius: 6 }}
                    >
                      {language === "en" ? "Approve Requisition" : "Phê duyệt phiếu"}
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>
        }
      >
        <Card size="small" style={{ borderRadius: 8, marginBottom: 16, background: "#f7fbfa" }}>
          <Row gutter={[16, 12]}>
            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Requisition Code (MR):" : "Mã yêu cầu (MR):"}</div>
              <div style={{ fontWeight: 600, color: "#008f89", fontSize: 13.5 }}>
                {requisition.requisitionCode}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Created Date:" : "Ngày lập phiếu:"}</div>
              <div style={{ fontWeight: 500, color: "#123443" }}>
                {dayjs(requisition.requisitionDate).format("DD/MM/YYYY")}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Required Date:" : "Ngày cần có vật tư:"}</div>
              <div style={{ fontWeight: 600, color: "#EF4444" }}>
                {dayjs(requisition.expectedDate).format("DD/MM/YYYY")}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Status:" : "Trạng thái:"}</div>
              <div style={{ marginTop: 2 }}>
                <Tag color={requisition.status === "APPROVED" ? "success" : requisition.status === "PENDING" ? "warning" : "default"}>
                  {requisition.status}
                </Tag>
              </div>
            </Col>

            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Issuing Warehouse:" : "Kho xuất cấp:"}</div>
              <div style={{ fontWeight: 500, color: "#123443" }}>{requisition.warehouseName}</div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Requester:" : "Kỹ sư yêu cầu:"}</div>
              <div style={{ fontWeight: 500, color: "#123443" }}>
                {requisition.requesterName} {requisition.requesterPhone ? `(${requisition.requesterPhone})` : ""}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Contractor / Team:" : "Đội / Đơn vị thi công:"}</div>
              <div style={{ fontWeight: 500, color: "#123443" }}>{requisition.contractorName}</div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Approver:" : "Người duyệt:"}</div>
              <div style={{ fontWeight: 500, color: "#123443" }}>
                {requisition.approverName || (language === "en" ? "None" : "Chưa có")}
              </div>
            </Col>

            <Col span={24}>
              <div style={{ fontSize: 12, color: "#718894" }}>{language === "en" ? "Description / Purpose:" : "Diễn giải / Mục đích xuất:"}</div>
              <div style={{ color: "#334155", fontSize: 13, marginTop: 2 }}>
                {requisition.description || "-"}
              </div>
            </Col>
            {requisition.rejectReason && (
              <Col span={24}>
                <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{language === "en" ? "Rejection Reason:" : "Lý do từ chối:"}</div>
                <div style={{ color: "#EF4444", fontSize: 13, marginTop: 2 }}>
                  {requisition.rejectReason}
                </div>
              </Col>
            )}
          </Row>
        </Card>

        <Card
          size="small"
          title={
            <span style={{ fontWeight: 600, color: "#123443" }}>
              {language === "en"
                ? `Requested Materials (${requisition.items?.length || 0} items)`
                : `Danh mục vật tư yêu cầu (${requisition.items?.length || 0} mặt hàng)`}
            </span>
          }
          style={{ borderRadius: 8 }}
        >
          <Table
            size="small"
            bordered
            rowKey="id"
            columns={columns}
            dataSource={requisition.items || []}
            pagination={false}
          />
        </Card>
      </Drawer>

      <Modal
        title={language === "en" ? "Reject Requisition" : "Từ chối phiếu yêu cầu"}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleConfirmReject}
        okText={language === "en" ? "Confirm Rejection" : "Xác nhận từ chối"}
        cancelText={t.common.cancel}
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: 12, color: "#718894", marginBottom: 6 }}>
            {language === "en" ? "Please enter rejection reason:" : "Vui lòng nhập lý do từ chối phiếu yêu cầu:"}
          </div>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={language === "en" ? "Enter detailed reason..." : "Nhập lý do chi tiết..."}
          />
        </div>
      </Modal>
    </>
  );
}
