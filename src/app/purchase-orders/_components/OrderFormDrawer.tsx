"use client";

import React, { useState } from "react";
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
} from "antd";
import {
  IconSearch,
  IconDeviceFloppy,
  IconPaperclip,
  IconX,
} from "@tabler/icons-react";
import { AttachmentFile } from "./types";
import OrderAttachmentsModal from "./OrderAttachmentsModal";
import OrderDetailItemsSection from "./OrderDetailItemsSection";
import { useTranslation } from "@/locales/LanguageContext";

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
}: OrderFormDrawerProps) {
  const { t } = useTranslation();
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const hasOrderHeader = Boolean(
    editingOrder && (editingOrder.ContractId || editingOrder.ContractCode)
  );

  const watchedOrderClientId = Form.useWatch("ClientId", form);
  const watchedOrderParentId = Form.useWatch("ParentId", form);

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
      {/* STYLE OVERRIDES DÀNH RIÊNG CHO PO ĐỂ CHUẨN DESIGN SYSTEM */}
      <style>{`
        .po-order-table .ant-table {
          font-family: inherit;
        }
        .po-order-table .ant-table-thead > tr > th {
          background-color: #F8FAFC !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 10px 12px !important;
        }
        .po-order-table .ant-table-tbody > tr > td {
          color: #0F172A !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .po-order-table .ant-table-container {
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
      `}</style>

      {/* HEADER SECTION I: TIÊU ĐỀ + NÚT TỆP ĐÍNH KÈM & ĐÓNG/LƯU */}
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
            {t.section.generalInfoOrder}
          </Text>
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
          {!(hasOrderHeader && items.length > 0) && (
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
              {/* Cột 1: Hợp đồng */}
              <Col span={6} style={{ paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.mainContract} <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <div
                  onClick={() => !editingOrder && onOpenContractLov()}
                  style={{
                    cursor: editingOrder ? "default" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: selectedContractDisplay ? "#0F172A" : "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 20,
                  }}
                  title={selectedContractDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedContractDisplay || t.purchaseOrder.selectContract}
                  </span>
                  {!editingOrder && (
                    <IconSearch size={14} strokeWidth={1.8} style={{ color: "#94A3B8", marginLeft: 4 }} />
                  )}
                </div>
              </Col>

              {/* Cột 2: Nhà Cung Cấp */}
              <Col span={6} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.vendor}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: selectedClientDisplay ? "#0F172A" : "#94A3B8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minHeight: 20,
                  }}
                  title={selectedClientDisplay}
                >
                  {selectedClientDisplay || t.purchaseOrder.vendorAutoNote}
                </div>
              </Col>

              {/* Cột 3: Bảng giá */}
              <Col span={6} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.priceList}
                </div>
                <div
                  onClick={() => {
                    const hasContract = Boolean(watchedOrderParentId || watchedOrderClientId);
                    if (hasContract && !editingOrder) onOpenPriceListLov();
                  }}
                  style={{
                    cursor: !(watchedOrderParentId || watchedOrderClientId) || editingOrder ? "default" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: selectedPriceListDisplay ? "#0F172A" : "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 20,
                  }}
                  title={selectedPriceListDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedPriceListDisplay || (watchedOrderParentId || watchedOrderClientId ? t.purchaseOrder.selectPriceList : t.purchaseOrder.selectContract)}
                  </span>
                  {!editingOrder && (watchedOrderParentId || watchedOrderClientId) && (
                    <IconSearch size={14} strokeWidth={1.8} style={{ color: "#94A3B8", marginLeft: 4 }} />
                  )}
                </div>
              </Col>

              {/* Cột 4: Kho nhận hàng */}
              <Col span={6} style={{ paddingLeft: 10 }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.deliveryWarehouse}
                </div>
                <div
                  onClick={onOpenWarehouseLov}
                  style={{
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: selectedWarehouseDisplay ? "#0F172A" : "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 20,
                  }}
                  title={selectedWarehouseDisplay}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedWarehouseDisplay || t.purchaseOrder.selectWarehouse}
                  </span>
                  <IconSearch size={14} strokeWidth={1.8} style={{ color: "#94A3B8", marginLeft: 4 }} />
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: "3px 0", borderColor: "#E2E8F0" }} />

            {/* Hàng 2: 6 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Số đơn hàng */}
              <Col span={4} style={{ paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.orderCode}
                </div>
                <Form.Item name="ContractCode" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    disabled={!!editingOrder}
                    placeholder={editingOrder ? "" : t.quotation.autoGenerated}
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

              {/* Cột 2: Diễn giải * */}
              <Col span={6} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.orderDesc} <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="Description"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: t.purchaseOrder.orderDescRequired }]}
                >
                  <Input
                    variant="borderless"
                    placeholder={t.purchaseOrder.orderDescPlaceholder}
                    style={{ padding: 0, fontWeight: 500, fontSize: 13, lineHeight: "18px", color: "#0F172A" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Ngày đơn hàng */}
              <Col span={3} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.orderDate}
                </div>
                <Form.Item name="ContractDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#0F172A" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Ngày giao hàng */}
              <Col span={3} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.purchaseOrder.deliveryDate}
                </div>
                <Form.Item name="DeliveryDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    placeholder={t.quotation.selectDate}
                    style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 13, color: "#0F172A" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 5: Giá trị đơn hàng */}
              <Col span={5} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.table.amount}
                </div>
                <Form.Item name="Amount" style={{ margin: 0 }}>
                  <InputNumber
                    variant="borderless"
                    style={{ padding: 0, width: "100%", fontWeight: 600, fontSize: 13, color: "#0F172A" }}
                    min={0}
                    placeholder="0"
                    formatter={(val) => String(val || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(val) => Number(val ? val.replace(/\$\s?|(,*)/g, "") : 0) as any}
                  />
                </Form.Item>
              </Col>

              {/* Cột 6: Loại tiền */}
              <Col span={3} style={{ paddingLeft: 10 }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                  {t.quotation.currency}
                </div>
                <Form.Item name="Currency" style={{ margin: 0 }}>
                  <Select
                    variant="borderless"
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
