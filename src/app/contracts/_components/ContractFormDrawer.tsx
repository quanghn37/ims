"use client";

import React, { useState } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Checkbox,
  Divider,
} from "antd";
import type { FormInstance } from "antd";
import {
  IconCircleX,
  IconX,
  IconSearch,
  IconList,
  IconPaperclip,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { AttachmentFile, PriceListItem } from "../types";
import ContractPriceListsSection from "./ContractPriceListsSection";
import ContractAttachmentsModal from "./ContractAttachmentsModal";
import { useContractMaterialsAndPriceLists } from "../_hooks/useContractMaterialsAndPriceLists";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

export type { PriceListItem };

interface ContractFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingContract?: any | null;
  form: FormInstance;
  submitting: boolean;
  selectedClientDisplay: string;
  onOpenClientLov: () => void;
  onClearClient: () => void;
  selectedMainContractDisplay: string;
  onOpenMainContractLov: () => void;
  onClearMainContract: () => void;
  attachments: AttachmentFile[];
  selectedAttachmentKeys: React.Key[];
  setSelectedAttachmentKeys: (keys: React.Key[]) => void;
  onUploadAttachment: (options: any) => void;
  onDeleteAttachment: (id: string) => void;
  onBatchDeleteAttachments: () => void;
  onToggleClientDoc: (id: string, checked: boolean) => void;
  onFinish: (values: any) => void;
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
  attachments,
  selectedAttachmentKeys,
  setSelectedAttachmentKeys,
  onUploadAttachment,
  onDeleteAttachment,
  onBatchDeleteAttachments,
  onToggleClientDoc,
  onFinish,
}: ContractFormDrawerProps) {
  const { t } = useTranslation();
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const isEditing = Boolean(editingContract);

  const {
    isPriceListSectionExpanded,
    setIsPriceListSectionExpanded,
    assignedPriceLists,
    availablePriceLists,
    loadingAvailable,
    searchAssigned,
    setSearchAssigned,
    filteredAssignedPriceLists,
    viewingPriceList,
    setViewingPriceList,
    materialItems,
    loadingMaterials,
    effectiveClientId,
    effectiveSubconOf,
    effectiveContractId,
    fetchAvailableQuotations,
    handleReconcileItems,
    handleDeleteMaterialItem,
    handleUpdateMaterialItem,
    handleRemoveSingleFromContract,
    handleRefreshMaterials,
  } = useContractMaterialsAndPriceLists(open, editingContract, form);

  const watchedPayTerms = Form.useWatch("PayTerms", form);
  const payTermsOptions = React.useMemo(() => {
    const base = [
      { value: "DK03", label: "DK03 - Thanh toán 100% sau 60 ngày" },
      { value: "DK01", label: "DK01 - Thanh toán ngay khi nhận hàng" },
      { value: "DK02", label: "DK02 - Thanh toán 100% sau 30 ngày" },
      { value: "TM", label: "TM - Tiền mặt" },
      { value: "CK", label: "CK - Chuyển khoản" },
      { value: "CN30", label: "CN30 - Công nợ 30 ngày" },
      { value: "CN60", label: "CN60 - Công nợ 60 ngày" },
      { value: "CN90", label: "CN90 - Công nợ 90 ngày" },
    ];
    if (watchedPayTerms && !base.some((b) => b.value === watchedPayTerms)) {
      base.unshift({ value: watchedPayTerms, label: watchedPayTerms });
    }
    return base;
  }, [watchedPayTerms]);

  if (!open) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "12px 20px",
        minHeight: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ IsVcontract: false }}
        onFinish={(values) => {
          onFinish({
            ...values,
            IsVcontract: values.IsVcontract ? 1 : 0,
          });
        }}
      >
        <Form.Item name="ClientId" style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name="MainContractId" style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name="ParentContractId" style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name="SourceId" style={{ display: "none" }}>
          <Input />
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: "1px solid #dce5e6",
          }}
        >
          <Text strong style={{ fontSize: 13, color: "#008f89", fontWeight: 700, textTransform: "uppercase" }}>
            {t.section.generalInfo}
          </Text>

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
              {t.contract.attachments}
              {attachments.length > 0 && (
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
              )}
            </Button>
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
            {!(isEditing && (assignedPriceLists.length > 0 || materialItems.length > 0)) && (
              <Button
                type="primary"
                icon={<IconDeviceFloppy size={16} strokeWidth={2} />}
                loading={submitting}
                onClick={() => form.submit()}
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
              >
                {isEditing ? t.contract.updateContract : t.contract.saveContract}
              </Button>
            )}
          </Space>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #dce5e6",
            borderRadius: 6,
            padding: "5px 12px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            marginBottom: 8,
          }}
        >
          {/* Hàng 1: 5 Cột */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: HĐ chủ đầu tư */}
            <Col span={5} style={{ paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.mainContract} {!isEditing && <span style={{ color: "#ff4d4f" }}>*</span>}
              </div>
              <div
                onClick={!isEditing ? onOpenMainContractLov : undefined}
                style={{
                  cursor: isEditing ? "default" : "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  lineHeight: "18px",
                  color: selectedMainContractDisplay ? "#123443" : "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 20,
                }}
                title={selectedMainContractDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedMainContractDisplay || t.contract.selectMainContract}
                </span>
                {!isEditing && (
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
            <Col span={6} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.vendor} {!isEditing && <span style={{ color: "#ff4d4f" }}>*</span>}
              </div>
              <div
                onClick={!isEditing ? onOpenClientLov : undefined}
                style={{
                  cursor: isEditing ? "default" : "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  lineHeight: "18px",
                  color: selectedClientDisplay ? "#123443" : "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 20,
                }}
                title={selectedClientDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedClientDisplay || t.contract.selectVendor}
                </span>
                {!isEditing && (
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
                    <IconList size={14} strokeWidth={1.8} style={{ color: "#94A3B8", marginLeft: 4 }} />
                  </Space>
                )}
              </div>
            </Col>

            {/* Cột 3: Số hợp đồng NCC */}
            <Col span={4} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.code}
              </div>
              <Form.Item name="ContractCode" style={{ margin: 0 }}>
                <Input
                  variant="borderless"
                  disabled={isEditing}
                  placeholder={isEditing ? "" : "(Auto-generated)"}
                  style={{
                    padding: 0,
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: "#123443",
                    fontFamily: "monospace",
                  }}
                />
              </Form.Item>
            </Col>

            {/* Cột 4: PLHĐ của */}
            <Col span={3} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.addendumOf}
              </div>
              <Form.Item name="ParentContractCode" style={{ margin: 0 }}>
                <Input
                  variant="borderless"
                  disabled={isEditing}
                  placeholder={isEditing ? "" : t.contract.originalContractPlaceholder}
                  allowClear={!isEditing}
                  style={{ padding: 0, fontWeight: 500, fontSize: 13, lineHeight: "18px", color: "#123443" }}
                  onChange={(e) => {
                    if (!isEditing && !e.target.value) {
                      form.setFieldsValue({ ParentContractId: undefined });
                    }
                  }}
                />
              </Form.Item>
            </Col>

            {/* Cột 5: Diễn giải hợp đồng */}
            <Col span={6} style={{ paddingLeft: 8 }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.description} <span style={{ color: "#ff4d4f" }}>*</span>
              </div>
              <Form.Item
                name="Description"
                style={{ margin: 0 }}
                rules={[{ required: true, message: t.contract.descriptionRequired }]}
              >
                <Input
                  variant="borderless"
                  placeholder={t.contract.descriptionPlaceholder}
                  style={{ padding: 0, fontWeight: 500, fontSize: 13, lineHeight: "18px", color: "#123443" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "3px 0", borderColor: "#dce5e6" }} />

          {/* Hàng 2: 7 Cột */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: Ngày ký */}
            <Col span={3} style={{ paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.signDate}
              </div>
              <Form.Item name="SignDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  format="DD-MM-YYYY"
                  placeholder="DD-MM-YYYY"
                  style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#123443" }}
                />
              </Form.Item>
            </Col>

            {/* Cột 2: Ngày bắt đầu */}
            <Col span={3} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.startDate}
              </div>
              <Form.Item name="FromDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  format="DD-MM-YYYY"
                  placeholder="DD-MM-YYYY"
                  style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#123443" }}
                />
              </Form.Item>
            </Col>

            {/* Cột 3: Ngày kết thúc */}
            <Col span={3} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.endDate}
              </div>
              <Form.Item name="ToDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  format="DD-MM-YYYY"
                  placeholder="DD-MM-YYYY"
                  allowClear
                  style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#123443" }}
                />
              </Form.Item>
            </Col>

            {/* Cột 4: Điều khoản TT */}
            <Col span={4} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.paymentTerm}
              </div>
              <Form.Item name="PayTerms" style={{ margin: 0 }}>
                <Select
                  variant="borderless"
                  showSearch
                  allowClear
                  placeholder={t.contract.selectPaymentTerm}
                  style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#123443" }}
                  options={payTermsOptions}
                />
              </Form.Item>
            </Col>

            {/* Cột 5: Giá trị hợp đồng */}
            <Col span={4} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.amount}
              </div>
              <Form.Item name="Amount" style={{ margin: 0 }}>
                <InputNumber
                  variant="borderless"
                  style={{ padding: 0, width: "100%", fontWeight: 600, fontSize: 13, color: "#123443" }}
                  min={0}
                  placeholder="0"
                  formatter={(val) => String(val || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val ? val.replace(/\$\s?|(,*)/g, "") : 0) as any}
                />
              </Form.Item>
            </Col>

            {/* Cột 6: Loại tiền */}
            <Col span={2} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.currency}
              </div>
              <Form.Item name="Currency" style={{ margin: 0 }}>
                <Select
                  variant="borderless"
                  style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#123443" }}
                  options={[
                    { value: "VND", label: "VND" },
                    { value: "USD", label: "USD" },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Cột 7: Loại HĐ */}
            <Col span={3} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #dce5e6" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.contractCategory}
              </div>
              <Form.Item name="S_Type" style={{ margin: 0 }}>
                <Select
                  variant="borderless"
                  allowClear
                  placeholder={t.contract.contractCategory}
                  style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#123443" }}
                  options={[
                    { value: "XD", label: "XD" },
                    { value: "MEP", label: "MEP" },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Cột 8: E-Contract */}
            <Col span={2} style={{ paddingLeft: 8 }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                {t.contract.contractType}
              </div>
              <Form.Item
                name="IsVcontract"
                valuePropName="checked"
                style={{ margin: 0, minHeight: 20, display: "flex", alignItems: "center" }}
              >
                <Checkbox>
                  <span style={{ color: "#008f89", fontSize: 12, fontWeight: 500 }}>
                    {t.contract.vcontract}
                  </span>
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>

      {/* SECTION II: CHI TIẾT VẬT TƯ */}
      <ContractPriceListsSection
        isPriceListSectionExpanded={isPriceListSectionExpanded}
        setIsPriceListSectionExpanded={setIsPriceListSectionExpanded}
        searchAssigned={searchAssigned}
        setSearchAssigned={setSearchAssigned}
        filteredAssignedPriceLists={filteredAssignedPriceLists}
        availablePriceLists={availablePriceLists}
        loadingAvailable={loadingAvailable}
        effectiveClientId={effectiveClientId}
        effectiveSubconOf={effectiveSubconOf}
        effectiveContractId={effectiveContractId}
        fetchAvailableQuotations={fetchAvailableQuotations}
        handleReconcileItems={handleReconcileItems}
        handleRemoveSingle={handleRemoveSingleFromContract}
        viewingPriceList={viewingPriceList}
        setViewingPriceList={setViewingPriceList}
        isEditing={isEditing}
        materialItems={materialItems}
        loadingMaterials={loadingMaterials}
        onDeleteMaterialItem={handleDeleteMaterialItem}
        onUpdateMaterialItem={handleUpdateMaterialItem}
        onRefreshMaterials={handleRefreshMaterials}
      />

      {/* POPUP MODAL TỆP ĐÍNH KÈM */}
      <ContractAttachmentsModal
        open={isAttachmentModalOpen}
        onCancel={() => setIsAttachmentModalOpen(false)}
        attachments={attachments}
        selectedAttachmentKeys={selectedAttachmentKeys}
        setSelectedAttachmentKeys={setSelectedAttachmentKeys}
        onUploadAttachment={onUploadAttachment}
        onDeleteAttachment={onDeleteAttachment}
        onBatchDeleteAttachments={onBatchDeleteAttachments}
        onToggleClientDoc={onToggleClientDoc}
      />
    </div>
  );
}