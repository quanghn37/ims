"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  Divider,
  Popconfirm,
  Space,
  Typography,
  Row,
  Col,
} from "antd";
import {
  IconTrash,
  IconCircleX,
  IconSearch,
  IconDeviceFloppy,
  IconPaperclip,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { AttachmentFile, parseDateSafe } from "./types";
import { SubmissionItem } from "@/types";
import QuotationItemsSection from "./QuotationItemsSection";
import QuotationAttachmentsModal from "./QuotationAttachmentsModal";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface ContractFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingContract: any | null;
  form: any;
  submitting: boolean;
  selectedClientDisplay: string;
  onOpenClientLov: () => void;
  onClearClient: () => void;
  selectedMainContractDisplay: string;
  onOpenMainContractLov: () => void;
  onClearMainContract: () => void;
  submissions?: SubmissionItem[];
  loadingSubmissions?: boolean;
  onOpenAddItem?: () => void;
  onOpenEditItem?: (record: any) => void;
  onDeleteSubmission?: (submissionId: any) => void;
  onFetchWorkflow?: (submissionId: any) => void;
  onOpenImportExcel?: () => void;
  attachments: AttachmentFile[];
  selectedAttachmentKeys: React.Key[];
  setSelectedAttachmentKeys: (keys: React.Key[]) => void;
  onUploadAttachment: (options: any) => void;
  onDeleteAttachment: (id: string) => void;
  onBatchDeleteAttachments: () => void;
  onToggleClientDoc: (id: string, checked: boolean) => void;
  onFinish: (values: any) => void;
  onDeleteContract?: (contractId: any) => void;
}

export default function ContractFormDrawer({
  open,
  onClose,
  editingContract,
  form,
  submitting,
  selectedClientDisplay,
  onOpenClientLov,
  onClearClient,
  selectedMainContractDisplay,
  onOpenMainContractLov,
  onClearMainContract,
  submissions = [],
  loadingSubmissions = false,
  onOpenAddItem,
  onOpenEditItem,
  onDeleteSubmission,
  onOpenImportExcel,
  attachments,
  selectedAttachmentKeys,
  onUploadAttachment,
  onDeleteAttachment,
  onBatchDeleteAttachments,
  onToggleClientDoc,
  onFinish,
  onDeleteContract,
}: ContractFormDrawerProps) {
  const isEditing = Boolean(editingContract);
  const isReadOnly = Boolean(
    editingContract && (editingContract.Editable === 0 || editingContract.Editable === "0")
  );

  const { t } = useTranslation();

  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingContract) {
        form.setFieldsValue({
          ClientId: editingContract.ClientID ?? editingContract.ClientId,
          MainContractId: editingContract.MainContractId,
          MainContractCode: editingContract.MainContractCode,
          ContractCode: editingContract.ContractCode,
          Description: editingContract.Description,
          FromDate: parseDateSafe(
            editingContract.StartDate ||
              editingContract.FromDate ||
              editingContract.EffectiveDate
          ),
          ToDate: parseDateSafe(
            editingContract.EndDate ||
              editingContract.ToDate ||
              editingContract.ExpiredDate ||
              editingContract.ExpireDate
          ),
          ContractDate: parseDateSafe(
            editingContract.Contractdate || editingContract.ContractDate
          ),
          PaymentTerm: editingContract.PaymentTerm || "DK03",
          Currency: editingContract.Currency || "VND",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          Currency: "VND",
          PaymentTerm: "DK03",
          FromDate: dayjs(),
          ContractDate: dayjs(),
        });
      }
    }
  }, [open, editingContract, form]);

  if (!open) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "16px 24px",
        minHeight: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* STYLE OVERRIDES DÀNH CHO CHI TIẾT BẢNG GIÁ */}
      <style>{`
        .quotation-detail-table .ant-table {
          font-family: inherit;
        }
        .quotation-detail-table .ant-table-thead > tr > th {
          background-color: #F8FAFC !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 10px 12px !important;
        }
        .quotation-detail-table .ant-table-tbody > tr > td {
          color: #0F172A !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .quotation-detail-table .ant-table-container {
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
      `}</style>

      {/* HEADER SECTION I: TIÊU ĐỀ + NÚT TỆP ĐÍNH KÈM / ĐÓNG / LƯU */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text strong style={{ fontSize: 13, color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>
            {t.section.generalInfoQuotation}
          </Text>
          {isReadOnly && (
            <span
              style={{
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                color: "#F97316",
                borderRadius: 12,
                padding: "1px 8px",
                fontSize: 11,
                fontWeight: 500,
                display: "inline-block",
              }}
            >
              {t.quotation.lockedEdit}
            </span>
          )}
        </div>

        <Space size={8}>
          <Button
            icon={<IconPaperclip size={16} strokeWidth={1.8} style={{ color: "#7C3AED" }} />}
            onClick={() => setIsAttachmentModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: 13,
              fontWeight: 500,
              height: 32,
              borderRadius: 6,
              borderColor: "#E2E8F0",
              background: "#FFFFFF",
              color: "#334155",
            }}
          >
            {t.quotation.attachments}
            {attachments.length > 0 ? (
              <span
                style={{
                  background: "#EDE9FE",
                  color: "#7C3AED",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 600,
                  marginLeft: 5,
                }}
              >
                {attachments.length}
              </span>
            ) : null}
          </Button>

          {isEditing && !isReadOnly && submissions.length === 0 && onDeleteContract && editingContract?.ContractId && (
            <Popconfirm
              title={t.quotation.deleteQuotation}
              description={t.common.confirmDelete}
              onConfirm={() => onDeleteContract(editingContract.ContractId)}
              okText={t.common.delete}
              cancelText={t.common.cancel}
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<IconTrash size={15} strokeWidth={1.8} />}
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 6,
                  background: "#FEE2E2",
                  borderColor: "#FECACA",
                  color: "#DC2626",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.common.delete}
              </Button>
            </Popconfirm>
          )}

          <Button
            icon={<IconX size={15} strokeWidth={1.8} style={{ color: "#64748B" }} />}
            onClick={onClose}
            style={{
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              borderColor: "#E2E8F0",
              background: "#FFFFFF",
              color: "#334155",
            }}
          >
            {t.common.close}
          </Button>

          {!isReadOnly && !(isEditing && submissions.length > 0) && (
            <Button
              type="primary"
              icon={<IconDeviceFloppy size={16} strokeWidth={2} />}
              style={{
                background: "#7C3AED",
                borderColor: "#7C3AED",
                height: 32,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                color: "#FFFFFF",
                boxShadow: "0 2px 4px rgba(124, 58, 237, 0.2)",
              }}
              onClick={() => form.submit()}
              loading={submitting}
            >
              {isEditing ? t.quotation.updateQuotation : t.quotation.saveQuotation}
            </Button>
          )}
        </Space>
      </div>

      {/* CARD THÔNG TIN CHUNG BẢNG GIÁ (COMPACT) */}
      <div style={{ width: "100%", marginBottom: 8 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="ClientId" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="MainContractId" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="MainContractCode" style={{ display: "none" }}><Input /></Form.Item>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 6,
              padding: "5px 12px",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Hàng 1: 4 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: HĐ chủ đầu tư */}
              <Col span={6} style={{ paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.mainContract}
                </div>
                <div
                  onClick={() => !isEditing && !isReadOnly && onOpenMainContractLov()}
                  style={{
                    cursor: (isEditing || isReadOnly) ? "default" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: selectedMainContractDisplay ? "#0F172A" : "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 20,
                  }}
                  title={selectedMainContractDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedMainContractDisplay || t.quotation.selectMainContract}
                  </span>
                  {!isEditing && !isReadOnly && (
                    <Space size={2}>
                      {selectedMainContractDisplay && (
                        <IconCircleX
                          size={14}
                          strokeWidth={1.8}
                          style={{ color: "#94A3B8", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearMainContract();
                          }}
                        />
                      )}
                      <IconSearch size={14} strokeWidth={1.8} style={{ color: "#94A3B8", marginLeft: 4 }} />
                    </Space>
                  )}
                </div>
              </Col>

              {/* Cột 2: Đối tượng (NCC) */}
              <Col span={6} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.vendor} <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <div
                  onClick={() => !isEditing && !isReadOnly && onOpenClientLov()}
                  style={{
                    cursor: (isEditing || isReadOnly) ? "default" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: selectedClientDisplay ? "#0F172A" : "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 20,
                  }}
                  title={selectedClientDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedClientDisplay || t.quotation.selectVendor}
                  </span>
                  {!isEditing && !isReadOnly && (
                    <Space size={2}>
                      {selectedClientDisplay && (
                        <IconCircleX
                          size={14}
                          strokeWidth={1.8}
                          style={{ color: "#94A3B8", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearClient();
                          }}
                        />
                      )}
                      <IconSearch size={14} strokeWidth={1.8} style={{ color: "#94A3B8", marginLeft: 4 }} />
                    </Space>
                  )}
                </div>
              </Col>

              {/* Cột 3: Số hiệu bảng giá */}
              <Col span={5} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.code}
                </div>
                <Form.Item name="ContractCode" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    disabled={isEditing}
                    placeholder={isEditing ? "" : t.quotation.autoGenerated}
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "18px",
                      color: "#0F172A",
                      fontFamily: "monospace",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Tên bảng giá */}
              <Col span={7} style={{ paddingLeft: 10 }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.name} <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="Description"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: t.quotation.nameRequired }]}
                >
                  <Input
                    variant="borderless"
                    disabled={isReadOnly}
                    placeholder={t.quotation.namePlaceholder}
                    style={{ padding: 0, fontWeight: 500, fontSize: 13, lineHeight: "18px", color: "#0F172A" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: "3px 0", borderColor: "#E2E8F0" }} />

            {/* Hàng 2: 5 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Ngày bảng giá */}
              <Col span={5} style={{ paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.date}
                </div>
                <Form.Item name="ContractDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    disabled={isReadOnly}
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#0F172A" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 2: Ngày hiệu lực */}
              <Col span={5} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.effectiveDate}
                </div>
                <Form.Item name="FromDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    disabled={isReadOnly}
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#0F172A" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Ngày hết hiệu lực */}
              <Col span={5} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.expiryDate}
                </div>
                <Form.Item name="ToDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    disabled={isReadOnly}
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#0F172A" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Điều khoản thanh toán */}
              <Col span={6} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.paymentTerm}
                </div>
                <Form.Item name="PaymentTerm" style={{ margin: 0 }}>
                  <Select
                    variant="borderless"
                    disabled={isReadOnly}
                    placeholder={t.quotation.selectPaymentTerm}
                    style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#0F172A" }}
                    options={[
                      { value: "DK03", label: "DK03 - Thanh toán 100% sau 60 ngày" },
                      { value: "DK01", label: "DK01 - Thanh toán ngay khi nhận hàng" },
                      { value: "DK02", label: "DK02 - Thanh toán 100% sau 30 ngày" },
                      { value: "TM", label: "TM - Tiền mặt" },
                      { value: "CK", label: "CK - Chuyển khoản" },
                    ]}
                  />
                </Form.Item>
              </Col>

              {/* Cột 5: Loại tiền */}
              <Col span={3} style={{ paddingLeft: 10 }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.currency}
                </div>
                <Form.Item name="Currency" style={{ margin: 0 }}>
                  <Select
                    variant="borderless"
                    disabled={isReadOnly}
                    style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#0F172A" }}
                    options={[
                      { value: "VND", label: "VND" },
                      { value: "USD", label: "USD" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </div>

      {/* PHẦN II: THÔNG TIN VẬT TƯ */}
      <QuotationItemsSection
        isEditing={isEditing}
        isReadOnly={isReadOnly}
        editingContract={editingContract}
        submissions={submissions}
        loadingSubmissions={loadingSubmissions}
        onOpenAddItem={onOpenAddItem}
        onOpenEditItem={onOpenEditItem}
        onDeleteSubmission={onDeleteSubmission}
        onOpenImportExcel={onOpenImportExcel}
      />

      {/* POPUP MODAL TỆP ĐÍNH KÈM */}
      <QuotationAttachmentsModal
        open={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        isReadOnly={isReadOnly}
        attachments={attachments}
        selectedAttachmentKeys={selectedAttachmentKeys}
        onUploadAttachment={onUploadAttachment}
        onDeleteAttachment={onDeleteAttachment}
        onBatchDeleteAttachments={onBatchDeleteAttachments}
        onToggleClientDoc={onToggleClientDoc}
      />
    </div>
  );
}