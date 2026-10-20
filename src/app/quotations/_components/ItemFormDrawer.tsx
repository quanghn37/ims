"use client";

import React, { useState } from "react";
import {
  Drawer,
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Divider,
  Checkbox,
  Typography,
  Space,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  SearchOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ItemLovModal from "./ItemLovModal";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface ItemFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingSubmissionItem: any | null;
  form: any;
  submitting: boolean;
  availableItems: any[];
  loadingItems: boolean;
  onSearchItem: (keyword: string) => void;
  onFetchItems: () => void;
  // Real-time totals
  rawItemTotal: number;
  taxItemTotal: number;
  grandItemTotal: number;
  watchedTaxRate: number;
  onFinish: (values: any) => void;
  readOnly?: boolean;
}

export default function ItemFormDrawer({
  open,
  onClose,
  editingSubmissionItem,
  form,
  submitting,
  availableItems,
  loadingItems,
  onSearchItem,
  onFetchItems,
  rawItemTotal,
  taxItemTotal,
  grandItemTotal,
  watchedTaxRate,
  onFinish,
  readOnly = false,
}: ItemFormDrawerProps) {
  const { t, language } = useTranslation();
  const [isItemLovOpen, setIsItemLovOpen] = useState(false);
  const [itemSearchInput, setItemSearchInput] = useState("");

  const handleSelectItem = (record: any) => {
    const matId = record.MaterialId ?? record.ItemId ?? record.Id;
    const name = record.ItemName || record.Description || (language === "en" ? `Item #${matId}` : `Vật tư #${matId}`);
    const unit = record.Unit || (language === "en" ? "Pcs" : "Cái");
    const price = Number(record.UnitPrice ?? record.Price ?? 0);

    form.setFieldsValue({
      MaterialId: matId,
      ItemId: matId,
      ItemName: name,
      Unit: unit,
      UnitPrice: price > 0 ? price : form.getFieldValue("UnitPrice") || 0,
    });
    setIsItemLovOpen(false);
  };

  const handleClearItem = () => {
    form.setFieldsValue({
      MaterialId: undefined,
      ItemId: undefined,
      ItemName: "",
      Unit: "Cái",
    });
  };

  const watchedItemName = Form.useWatch("ItemName", form);
  const isItemLocked = readOnly || Boolean(editingSubmissionItem);

  return (
    <>
      <Drawer
        title={
          <Space>
            {readOnly ? (
              <EyeOutlined style={{ color: "#718894", fontSize: 16 }} />
            ) : editingSubmissionItem ? (
              <EditOutlined style={{ color: "#008f89", fontSize: 16 }} />
            ) : (
              <PlusOutlined style={{ color: "#008f89", fontSize: 16 }} />
            )}
            <Text strong style={{ fontSize: 16, color: "#123443", fontWeight: 700 }}>
              {readOnly
                ? t.itemDrawer.viewTitle
                : editingSubmissionItem
                ? t.itemDrawer.editTitle
                : t.itemDrawer.addTitle}
            </Text>
          </Space>
        }
        placement="right"
        width="45%"
        zIndex={1100}
        open={open}
        onClose={onClose}
        styles={{
          header: { padding: "12px 16px" },
          body: { padding: "12px 16px" },
          footer: { padding: "10px 16px" },
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              onClick={onClose}
              style={{
                borderRadius: 6,
                height: 32,
                borderColor: "#dce5e6",
                background: "#FFFFFF",
                color: "#334155",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {readOnly ? t.itemDrawer.close : t.itemDrawer.cancel}
            </Button>
            {!readOnly && (
              <Button
                type="primary"
                icon={<SaveOutlined style={{ fontSize: 14 }} />}
                style={{
                  background: "#008f89",
                  borderColor: "#008f89",
                  borderRadius: 6,
                  height: 32,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
                onClick={() => form.submit()}
                loading={submitting}
              >
                {t.itemDrawer.saveItem}
              </Button>
            )}
          </div>
        }
      >
        <style>{`
          .quotation-item-compact-card .ant-form-item-control-input {
            min-height: 20px !important;
          }
          .quotation-item-compact-card .ant-form-item-control-input-content {
            line-height: 20px !important;
          }
          .quotation-item-compact-card .ant-input-number {
            line-height: 20px !important;
          }
          .quotation-item-compact-card .ant-input-number-input {
            padding: 0 !important;
            height: 20px !important;
            line-height: 20px !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            color: #123443 !important;
          }
          .quotation-item-compact-card .ant-picker {
            padding: 0 !important;
            height: 20px !important;
          }
          .quotation-item-compact-card .ant-picker-input > input {
            font-weight: 500 !important;
            font-size: 13px !important;
            color: #123443 !important;
            line-height: 20px !important;
          }
          .quotation-item-compact-card .ant-select-single {
            height: 20px !important;
          }
          .quotation-item-compact-card .ant-select-selector {
            padding: 0 !important;
            height: 20px !important;
          }
          .quotation-item-compact-card .ant-select-selection-item {
            font-weight: 500 !important;
            font-size: 13px !important;
            color: #123443 !important;
            line-height: 20px !important;
          }
        `}</style>
        <Form
          form={form}
          layout="vertical"
          disabled={readOnly}
          onFinish={onFinish}
          initialValues={{
            ItemDate: dayjs(),
            Qnty: 0,
            TaxRate: 0.08,
            UnitPrice: 0,
            Unit: "Cái",
            Remarks: "",
            StartProcessNow: false,
          }}
        >
          <Form.Item name="ItemDate" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="MaterialId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="ItemId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="ItemName"
            hidden
            rules={[{ required: true, message: t.itemDrawer.itemNameRequired }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="StartProcessNow" valuePropName="checked" hidden>
            <Checkbox />
          </Form.Item>

          {/* KHUNG THÔNG TIN VẬT TƯ DẠNG COMPACT BORDERED GRID (GIỐNG I. THÔNG TIN CHUNG) */}
          <div
            className="quotation-item-compact-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid #dce5e6",
              borderRadius: 6,
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              marginBottom: 10,
            }}
          >
            {/* Hàng 1: Tên vật tư */}
            <div
              onClick={() => {
                if (!isItemLocked) {
                  setItemSearchInput("");
                  setIsItemLovOpen(true);
                }
              }}
              style={{
                padding: "6px 10px",
                borderBottom: "1px solid #dce5e6",
                background: isItemLocked ? "#f7fbfa" : "#FFFFFF",
                cursor: isItemLocked ? "default" : "pointer",
              }}
            >
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                {t.itemDrawer.itemName} {!editingSubmissionItem && <span style={{ color: "#ff4d4f" }}>*</span>}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  minHeight: 20,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: "18px",
                    color: watchedItemName ? "#123443" : "#94A3B8",
                    wordBreak: "break-word",
                    flex: 1,
                  }}
                >
                  {watchedItemName || t.itemDrawer.itemNamePlaceholder}
                </div>
                {!isItemLocked && (
                  <Space size={4} style={{ flexShrink: 0, marginTop: 1 }}>
                    {watchedItemName && (
                      <CloseCircleOutlined
                        style={{ color: "#94A3B8", cursor: "pointer", fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearItem();
                        }}
                      />
                    )}
                    <SearchOutlined style={{ color: "#008f89", fontSize: 14 }} />
                  </Space>
                )}
              </div>
            </div>

            {/* Hàng 2: Đơn vị tính | Số lượng | Đơn giá */}
            <Row gutter={[0, 0]} align="stretch" style={{ borderBottom: "1px solid #dce5e6" }}>
              <Col
                span={8}
                style={{
                  padding: "6px 10px",
                  borderRight: "1px solid #dce5e6",
                  background: isItemLocked ? "#f7fbfa" : "#FFFFFF",
                }}
              >
                <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  {t.itemDrawer.unit} <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="Unit"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: t.itemDrawer.unitRequired }]}
                >
                  <Input
                    variant="borderless"
                    placeholder={language === "en" ? "e.g.: Pcs" : "vd: Cái"}
                    disabled={Boolean(editingSubmissionItem)}
                    style={{
                      padding: 0,
                      height: 20,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "20px",
                      color: "#123443",
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={8} style={{ padding: "6px 10px", borderRight: "1px solid #dce5e6" }}>
                <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  {t.itemDrawer.quantity} <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="Qnty"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: t.itemDrawer.qtyRequired }]}
                >
                  <InputNumber
                    variant="borderless"
                    min={0}
                    placeholder="0"
                    formatter={(val) => {
                      if (val === undefined || val === null) return "";
                      const [int, dec] = String(val).split(".");
                      const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      return dec !== undefined ? `${formattedInt}.${dec}` : formattedInt;
                    }}
                    parser={(val) => (val ? val.replace(/\$\s?|(,*)/g, "") : "") as any}
                    style={{
                      padding: 0,
                      width: "100%",
                      height: 20,
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#123443",
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={8} style={{ padding: "6px 10px" }}>
                <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  {t.itemDrawer.unitPrice} <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="UnitPrice"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: t.itemDrawer.priceRequired }]}
                >
                  <InputNumber
                    variant="borderless"
                    min={0}
                    placeholder="0"
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0) as any}
                    style={{
                      padding: 0,
                      width: "100%",
                      height: 20,
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#123443",
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Hàng 3: Ngày hiệu lực | Ngày hết hiệu lực | Thuế suất */}
            <Row gutter={[0, 0]} align="stretch" style={{ borderBottom: "1px solid #dce5e6" }}>
              <Col span={8} style={{ padding: "6px 10px", borderRight: "1px solid #dce5e6" }}>
                <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  {t.itemDrawer.effectiveDate}
                </div>
                <Form.Item name="FromDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    placeholder={t.itemDrawer.selectDate}
                    style={{
                      padding: 0,
                      width: "100%",
                      height: 20,
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#123443",
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={8} style={{ padding: "6px 10px", borderRight: "1px solid #dce5e6" }}>
                <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  {t.itemDrawer.expiryDate}
                </div>
                <Form.Item name="ToDate" style={{ margin: 0 }}>
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    placeholder={t.itemDrawer.selectDate}
                    style={{
                      padding: 0,
                      width: "100%",
                      height: 20,
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#123443",
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={8} style={{ padding: "6px 10px" }}>
                <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  {t.itemDrawer.taxRate}
                </div>
                <Form.Item name="TaxRate" style={{ margin: 0 }}>
                  <Select
                    variant="borderless"
                    style={{
                      padding: 0,
                      width: "100%",
                      height: 20,
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#123443",
                    }}
                    options={[
                      { value: 0, label: "0%" },
                      { value: 0.05, label: "5%" },
                      { value: 0.08, label: "8%" },
                      { value: 0.1, label: "10%" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Hàng 4: Ghi chú */}
            <div style={{ padding: "6px 10px" }}>
              <div style={{ fontSize: 11, color: "#718894", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                {t.itemDrawer.remarks}
              </div>
              <Form.Item name="Remarks" style={{ margin: 0 }}>
                <Input.TextArea
                  variant="borderless"
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  placeholder={t.itemDrawer.remarksPlaceholder}
                  style={{
                    padding: 0,
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: "20px",
                    color: "#123443",
                  }}
                />
              </Form.Item>
            </div>
          </div>

          {/* KHỐI TỔNG TIỀN (CHUẨN DESIGN SYSTEM TÍM NHẠT #eef8f6) */}
          <div
            style={{
              background: "#eef8f6",
              border: "1px solid #b2ded9",
              borderRadius: 6,
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12.5, color: "#718894" }}>{t.itemDrawer.subtotal}</Text>
              <Text strong style={{ fontSize: 13, color: "#123443" }}>
                {rawItemTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
              </Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12.5, color: "#718894" }}>
                {t.itemDrawer.taxAmount} ({((watchedTaxRate || 0) * 100).toFixed(0)}%):
              </Text>
              <Text style={{ fontSize: 13, color: "#123443" }}>
                {taxItemTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
              </Text>
            </div>
            <Divider style={{ margin: "6px 0", borderColor: "#b2ded9" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong style={{ fontSize: 13, color: "#123443" }}>
                {t.itemDrawer.totalAmount}
              </Text>
              <Text strong style={{ fontSize: 16, color: "#008f89", fontWeight: 700 }}>
                {grandItemTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
              </Text>
            </div>
          </div>
        </Form>
      </Drawer>

      {/* MODAL POPUP CHỌN VẬT TƯ */}
      <ItemLovModal
        open={isItemLovOpen}
        onClose={() => setIsItemLovOpen(false)}
        itemList={availableItems}
        loadingItems={loadingItems}
        itemSearchInput={itemSearchInput}
        setItemSearchInput={setItemSearchInput}
        onSearchItems={(kw) => onSearchItem(kw.trim())}
        onSelectItem={handleSelectItem}
      />
    </>
  );
}
