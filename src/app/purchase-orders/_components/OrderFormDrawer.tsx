"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Divider,
  Space,
  Typography,
  Row,
  Col,
  Popconfirm,
} from "antd";
import {
  IconDeviceFloppy,
  IconPaperclip,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { CaretDownOutlined } from "@ant-design/icons";
import { AttachmentFile } from "./types";
import OrderAttachmentsModal from "./OrderAttachmentsModal";
import OrderDetailItemsSection from "./OrderDetailItemsSection";
import { useTranslation } from "@/locales/LanguageContext";
import { ApprovalBadge } from "@/components/common/ApprovalBadge";

const { Text } = Typography;

interface OrderFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingOrder: any | null;
  form: any;
  submitting: boolean;
  // Client LOV
  selectedClientDisplay: string;
  onOpenClientLov: () => void;
  onClearClient: () => void;
  // Contract LOV
  selectedContractDisplay: string;
  onOpenContractLov: () => void;
  onClearContract: () => void;
  // PriceList LOV
  selectedPriceListDisplay: string;
  onOpenPriceListLov: () => void;
  onClearPriceList: () => void;
  // Warehouse LOV
  selectedWarehouseDisplay: string;
  onOpenWarehouseLov: () => void;
  onClearWarehouse: () => void;
  // Items detail
  items?: any[];
  setItems?: React.Dispatch<React.SetStateAction<any[]>>;
  availableItems?: any[];
  loadingItems?: boolean;
  onSearchItem?: (keyword: string) => void;
  onDeleteItem?: (record: any) => void;
  onEditItem?: (record: any) => void;
  // Attachments
  attachments: AttachmentFile[];
  selectedAttachmentKeys: React.Key[];
  setSelectedAttachmentKeys: (keys: React.Key[]) => void;
  onUploadAttachment: (options: any) => void;
  onDeleteAttachment: (id: string) => void;
  onBatchDeleteAttachments: () => void;
  onToggleClientDoc: (id: string, checked: boolean) => void;
  onFinish: (values: any) => void;
  onOpenPriceCompare?: () => void;
  onFetchWorkflow?: (submissionId: any, item?: any) => void;
  onRefreshItems?: () => void;
  onDeleteOrder?: (contractId: any) => void;
}

export default function OrderFormDrawer({
  open,
  onClose,
  editingOrder,
  form,
  submitting,
  selectedClientDisplay,
  onOpenContractLov,
  selectedContractDisplay,
  selectedPriceListDisplay,
  onOpenPriceListLov,
  selectedWarehouseDisplay,
  onOpenWarehouseLov,
  items = [],
  setItems = () => {},
  loadingItems,
  onDeleteItem,
  onEditItem,
  attachments,
  selectedAttachmentKeys,
  onUploadAttachment,
  onDeleteAttachment,
  onBatchDeleteAttachments,
  onToggleClientDoc,
  onFinish,
  onOpenPriceCompare,
  onFetchWorkflow,
  onRefreshItems,
  onDeleteOrder,
}: OrderFormDrawerProps) {
  const { t } = useTranslation();
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const hasOrderHeader = Boolean(
    editingOrder && (editingOrder.ContractId || editingOrder.ContractCode)
  );
  const isEditing = Boolean(editingOrder && (editingOrder.ContractId || editingOrder.ContractCode));
  const isDraft =
    editingOrder?.StatusCode === 0 ||
    editingOrder?.StatusCode === "0" ||
    editingOrder?.Status === 0 ||
    editingOrder?.Status === "0" ||
    editingOrder?.StatusCode === "DRAFT" ||
    editingOrder?.StatusCode === "Draft";

  const watchedOrderClientId = Form.useWatch("ClientId", form);
  const watchedOrderParentId = Form.useWatch("ParentId", form);

  // Tự động đồng bộ Giá trị đơn hàng (Amount) bằng tổng thành tiền có VAT của chi tiết vật tư khi chưa trình duyệt hoặc khi Amount đang là 0
  const isTaskAssigned =
    String(editingOrder?.TaskAssign ?? "").trim().toUpperCase() === "Y" ||
    editingOrder?.TaskAssign === 1;

  useEffect(() => {
    if (!open) return;
    if (items && items.length > 0) {
      const currentFormAmount = Number(form.getFieldValue("Amount") || 0);
      if (!isTaskAssigned || currentFormAmount === 0) {
        const sumTotalVat = items.reduce((acc, it) => {
          const q = Number(it.Qnty ?? 0);
          const p = Number(it.UnitPrice ?? 0);
          const raw =
            it.TotalPrice !== undefined
              ? Number(it.TotalPrice)
              : it.Amount !== undefined
              ? Number(it.Amount)
              : q * p;
          const rawRate =
            it.TaxRate !== undefined && it.TaxRate !== null ? Number(it.TaxRate) : 0.08;
          const rate = rawRate > 1 ? rawRate / 100 : rawRate;
          const tax =
            it.TaxAmount !== undefined && it.TaxAmount !== null && it.TaxAmount !== ""
              ? Number(it.TaxAmount)
              : raw * rate;
          return acc + raw + tax;
        }, 0);

        const roundedTotal = Math.round(sumTotalVat);
        if (currentFormAmount !== roundedTotal) {
          form.setFieldsValue({ Amount: roundedTotal });
          if (editingOrder) {
            editingOrder.Amount = roundedTotal;
            editingOrder.ContractedAmount = roundedTotal;
          }
        }
      }
    }
  }, [items, isTaskAssigned, open, form, editingOrder]);

  if (!open) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "16px 24px",
        minHeight: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER SECTION I: TIÊU ĐỀ + NÚT TỆP ĐÍNH KÈM & ĐÓNG/LƯU */}
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
            {t.section.generalInfoOrder}
          </Text>
        </div>

        <Space size={8}>
          {hasOrderHeader && (
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
          )}
          {/* Chỉ hiển thị button Xóa khi đơn hàng có StatusCode === 0 (Bản nháp) và đã có ContractId */}
          {isEditing && isDraft && onDeleteOrder && editingOrder?.ContractId && (
            <Popconfirm
              title={t.common.deleteConfirmTitle}
              description={t.common.confirmDelete}
              onConfirm={() => onDeleteOrder(editingOrder.ContractId)}
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
          {!(hasOrderHeader && items.length > 0) && (
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
              {hasOrderHeader ? t.purchaseOrder.updateOrder : t.purchaseOrder.saveOrder}
            </Button>
          )}
        </Space>
      </div>

      <div style={{ width: "100%", marginBottom: 8 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Hidden fields */}
          <Form.Item name="ClientId" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="ParentId" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="SubconOf" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="SourceId" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="WarehouseId" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="FromDate" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="ToDate" style={{ display: "none" }}><Input /></Form.Item>

          <div className="erp-general-info-card">
            {/* Hàng 1: 4 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Hợp đồng */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.mainContract} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <div
                  onClick={() => !editingOrder && onOpenContractLov()}
                  className="erp-info-value mono"
                  style={{
                    cursor: editingOrder ? "default" : "pointer",
                    color: selectedContractDisplay ? "#1e293b" : "#94A3B8",
                    justifyContent: "space-between",
                  }}
                  title={selectedContractDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedContractDisplay || t.purchaseOrder.selectContract}
                  </span>
                </div>
              </Col>

              {/* Cột 2: Nhà Cung Cấp */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.vendor}
                </span>
                <div
                  className="erp-info-value"
                  style={{
                    color: selectedClientDisplay ? "#1e293b" : "#94A3B8",
                  }}
                  title={selectedClientDisplay}
                >
                  {selectedClientDisplay || t.purchaseOrder.vendorAutoNote}
                </div>
              </Col>

              {/* Cột 3: Bảng giá */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.priceList}
                </span>
                <div
                  onClick={() => {
                    const hasContract = Boolean(watchedOrderParentId || watchedOrderClientId);
                    if (hasContract && !editingOrder) onOpenPriceListLov();
                  }}
                  className="erp-info-value mono"
                  style={{
                    cursor: !(watchedOrderParentId || watchedOrderClientId) || editingOrder ? "default" : "pointer",
                    color: selectedPriceListDisplay ? "#1e293b" : "#94A3B8",
                    justifyContent: "space-between",
                  }}
                  title={selectedPriceListDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedPriceListDisplay || (watchedOrderParentId || watchedOrderClientId ? t.purchaseOrder.selectPriceList : t.purchaseOrder.selectContract)}
                  </span>
                </div>
              </Col>

              {/* Cột 4: Kho nhận hàng */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.deliveryWarehouse}
                </span>
                <div
                  onClick={onOpenWarehouseLov}
                  className="erp-info-value"
                  style={{
                    cursor: "pointer",
                    color: selectedWarehouseDisplay ? "#1e293b" : "#94A3B8",
                    justifyContent: "space-between",
                  }}
                  title={selectedWarehouseDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedWarehouseDisplay || t.purchaseOrder.selectWarehouse}
                  </span>
                </div>
              </Col>
            </Row>

            <div className="erp-info-divider" />

            {/* Hàng 2: 7 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Số đơn hàng */}
              <Col span={3} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.orderCode}
                </span>
                <Form.Item name="ContractCode" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    disabled={!!editingOrder}
                    placeholder={editingOrder ? "" : t.quotation.autoGenerated}
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

              {/* Cột 2: Diễn giải * */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.orderDesc} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="Description"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: t.purchaseOrder.orderDescRequired }]}
                >
                  <Input
                    variant="borderless"
                    placeholder={t.purchaseOrder.orderDescPlaceholder}
                    style={{ padding: 0, fontWeight: 400, fontSize: 12.5, lineHeight: "16px", color: "#1e293b" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Ngày đơn hàng */}
              <Col span={3} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.orderDate}
                </span>
                <Form.Item name="ContractDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Ngày giao hàng */}
              <Col span={3} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.purchaseOrder.deliveryDate}
                </span>
                <Form.Item name="DeliveryDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 5: Giá trị đơn hàng */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.amount}
                </span>
                <Form.Item name="Amount" style={{ margin: 0 }}>
                  <InputNumber
                    variant="borderless"
                    className="erp-amount-input"
                    style={{ padding: 0, width: "100%", fontWeight: 700, fontSize: 12.5, color: "#008f89" }}
                    min={0}
                    placeholder="0"
                    formatter={(val) => String(val || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(val) => Number(val ? val.replace(/\$\s?|(,*)/g, "") : 0) as any}
                  />
                </Form.Item>
              </Col>

              {/* Cột 6: Loại tiền */}
              <Col span={3} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.quotation.currency}
                </span>
                <Form.Item name="Currency" style={{ margin: 0 }}>
                  <Select
                    variant="borderless"
                    suffixIcon={<CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                    options={[
                      { value: "VND", label: "VND" },
                      { value: "USD", label: "USD" },
                    ]}
                  />
                </Form.Item>
              </Col>

              {/* Cột 7: Trạng thái */}
              <Col span={3} className="erp-info-cell" style={{ borderRight: "none" }}>
                <span className="erp-info-label">
                  {t.table.status}
                </span>
                <div style={{ display: "flex", alignItems: "center", height: 24, paddingLeft: 8 }}>
                  <ApprovalBadge
                    val={
                      editingOrder?.StatusName ||
                      editingOrder?.Status ||
                      (editingOrder?.StatusCode !== undefined && editingOrder?.StatusCode !== null
                        ? (Number(editingOrder.StatusCode) === 0 ? "Draft" : editingOrder.StatusCode)
                        : (editingOrder ? "Chờ duyệt" : "Draft"))
                    }
                    record={editingOrder}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Form>
      </div>

      {/* PHẦN II: DANH MỤC VẬT TƯ / THIẾT BỊ ĐƠN HÀNG */}
      <OrderDetailItemsSection
        hasOrderHeader={hasOrderHeader}
        items={items}
        setItems={setItems}
        loadingItems={loadingItems}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onOpenPriceCompare={onOpenPriceCompare}
        onFetchWorkflow={onFetchWorkflow}
        onRefreshItems={onRefreshItems}
      />

      {/* POPUP MODAL TỆP ĐÍNH KÈM */}
      <OrderAttachmentsModal
        open={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        attachments={attachments}
        selectedAttachmentKeys={selectedAttachmentKeys}
        onUploadAttachment={onUploadAttachment}
        onBatchDeleteAttachments={onBatchDeleteAttachments}
        onDeleteAttachment={onDeleteAttachment}
        onToggleClientDoc={onToggleClientDoc}
      />
    </div>
  );
}
