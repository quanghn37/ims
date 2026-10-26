"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  Popconfirm,
  Space,
  Typography,
  Row,
  Col,
} from "antd";
import {
  IconTrash,
  IconCircleX,
  IconDeviceFloppy,
  IconPaperclip,
  IconX,
} from "@tabler/icons-react";
import { CaretDownOutlined } from "@ant-design/icons";
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
  const isDraft =
    editingContract?.StatusCode === 0 ||
    editingContract?.StatusCode === "0" ||
    editingContract?.Status === 0 ||
    editingContract?.Status === "0" ||
    editingContract?.StatusCode === "DRAFT" ||
    editingContract?.StatusCode === "Draft";
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
      {/* HEADER SECTION I: TIÊU ĐỀ + NÚT TỆP ĐÍNH KÈM / ĐÓNG / LƯU */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid #dce5e6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text strong style={{ fontSize: 13, color: "#008f89", fontWeight: 700, textTransform: "uppercase" }}>
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
            icon={<IconPaperclip size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={() => setIsAttachmentModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: 13,
              fontWeight: 500,
              height: 32,
              borderRadius: 6,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
            }}
          >
            {t.quotation.attachments}
            {attachments.length > 0 ? (
              <span
                style={{
                  background: "#dce5e6",
                  color: "#008f89",
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

          {/* Chỉ hiển thị button Xóa khi bảng giá có StatusCode === 0 (Bản nháp) và đã có ContractId */}
          {isEditing && isDraft && onDeleteContract && editingContract?.ContractId && (
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
            icon={<IconX size={15} strokeWidth={1.8} style={{ color: "#718894" }} />}
            onClick={onClose}
            style={{
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              borderColor: "#dce5e6",
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
                background: "#008f89",
                borderColor: "#008f89",
                height: 32,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                color: "#FFFFFF",
                boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
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

          <div className="erp-general-info-card">
            {/* Hàng 1: 4 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: HĐ chủ đầu tư */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.mainContract}
                </span>
                <div
                  onClick={() => !isEditing && !isReadOnly && onOpenMainContractLov()}
                  className="erp-info-value mono"
                  style={{
                    cursor: (isEditing || isReadOnly) ? "default" : "pointer",
                    color: selectedMainContractDisplay ? "#1e293b" : "#94A3B8",
                    justifyContent: "space-between",
                  }}
                  title={selectedMainContractDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedMainContractDisplay || t.quotation.selectMainContract}
                  </span>
                  {!isEditing && !isReadOnly && selectedMainContractDisplay && (
                    <IconCircleX
                      size={14}
                      strokeWidth={1.8}
                      style={{ color: "#94A3B8", cursor: "pointer", marginLeft: 4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearMainContract();
                      }}
                    />
                  )}
                </div>
              </Col>

              {/* Cột 2: Đối tượng (NCC) */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.vendor} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <div
                  onClick={() => !isEditing && !isReadOnly && onOpenClientLov()}
                  className="erp-info-value"
                  style={{
                    cursor: (isEditing || isReadOnly) ? "default" : "pointer",
                    color: selectedClientDisplay ? "#1e293b" : "#94A3B8",
                    justifyContent: "space-between",
                  }}
                  title={selectedClientDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedClientDisplay || t.quotation.selectVendor}
                  </span>
                  {!isEditing && !isReadOnly && selectedClientDisplay && (
                    <IconCircleX
                      size={14}
                      strokeWidth={1.8}
                      style={{ color: "#94A3B8", cursor: "pointer", marginLeft: 4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearClient();
                      }}
                    />
                  )}
                </div>
              </Col>

              {/* Cột 3: Số hiệu bảng giá */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.code}
                </span>
                <Form.Item name="ContractCode" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    disabled={isEditing}
                    placeholder={isEditing ? "" : t.quotation.autoGenerated}
                    style={{
                      padding: 0,
                      fontWeight: 400,
                      fontSize: 12.5,
                      lineHeight: "16px",
                      color: "#1e293b",
                      fontFamily: "monospace",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Tên bảng giá */}
              <Col span={7} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.name} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="Description"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: t.quotation.nameRequired }]}
                >
                  <Input
                    variant="borderless"
                    disabled={isReadOnly}
                    placeholder={t.quotation.namePlaceholder}
                    style={{ padding: 0, fontWeight: 400, fontSize: 12.5, lineHeight: "16px", color: "#1e293b" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="erp-info-divider" />

            {/* Hàng 2: 5 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Ngày bảng giá */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.date}
                </span>
                <Form.Item name="ContractDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    disabled={isReadOnly}
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 2: Ngày hiệu lực */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.effectiveDate}
                </span>
                <Form.Item name="FromDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    disabled={isReadOnly}
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Ngày hết hiệu lực */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.expiryDate}
                </span>
                <Form.Item name="ToDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    disabled={isReadOnly}
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Điều khoản thanh toán */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.paymentTerm}
                </span>
                <Form.Item name="PaymentTerm" style={{ margin: 0 }}>
                  <Select
                    variant="borderless"
                    disabled={isReadOnly}
                    suffixIcon={<CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />}
                    placeholder={t.quotation.selectPaymentTerm}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
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
              <Col span={3} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.currency}
                </span>
                <Form.Item name="Currency" style={{ margin: 0 }}>
                  <Select
                    variant="borderless"
                    disabled={isReadOnly}
                    suffixIcon={<CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
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