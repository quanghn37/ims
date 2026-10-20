"use client";

import React, { useEffect } from "react";
import { Modal, Form, Row, Col, Select, Input, InputNumber } from "antd";
import { StockItemDetail, MOCK_MATERIALS_CATALOG } from "../../types";
import { useTranslation } from "@/locales/LanguageContext";

interface StockOutItemModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: StockItemDetail | null;
  onSave: (item: StockItemDetail) => void;
}

export default function StockOutItemModal({
  open,
  onClose,
  editingItem,
  onSave,
}: StockOutItemModalProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editingItem) {
        form.setFieldsValue({
          itemCode: editingItem.itemCode,
          itemName: editingItem.itemName,
          unit: editingItem.unit,
          stockQty: editingItem.stockQty || 0,
          orderQty: editingItem.orderQty || 0,
          actualQty: editingItem.actualQty || 0,
          unitPrice: editingItem.unitPrice || 0,
          binLocation: editingItem.binLocation || "",
          note: editingItem.note || "",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          orderQty: 1,
          actualQty: 1,
          unitPrice: 0,
        });
      }
    }
  }, [open, editingItem, form]);

  const handleOk = () => {
    form.validateFields().then((vals) => {
      const actualQty = Number(vals.actualQty) || 0;
      const unitPrice = Number(vals.unitPrice) || 0;
      const totalPrice = actualQty * unitPrice;

      if (editingItem) {
        onSave({
          ...editingItem,
          ...vals,
          actualQty,
          unitPrice,
          totalPrice,
        });
      } else {
        const newItem: StockItemDetail = {
          id: `oit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          itemCode: vals.itemCode,
          itemName: vals.itemName,
          unit: vals.unit,
          stockQty: vals.stockQty || 0,
          orderQty: vals.orderQty || actualQty,
          actualQty,
          unitPrice,
          totalPrice,
          binLocation: vals.binLocation || "",
          note: vals.note || "",
        };
        onSave(newItem);
      }
      onClose();
      form.resetFields();
    });
  };

  return (
    <Modal
      title={
        editingItem
          ? language === "en" ? "Edit Stock-out Material" : "Chỉnh sửa vật tư xuất kho"
          : language === "en" ? "Add Stock-out Material" : "Thêm vật tư xuất kho"
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={t.common.confirm || (language === "en" ? "Confirm" : "Xác nhận")}
      cancelText={t.common.cancel}
      okButtonProps={{
        style: { background: "#008f89", borderColor: "#008f89" },
      }}
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="itemCode"
              label={language === "en" ? "Select Material from Catalog" : "Chọn vật tư từ danh mục"}
              rules={[{ required: true, message: language === "en" ? "Please select material!" : "Vui lòng chọn vật tư!" }]}
            >
              <Select
                placeholder={language === "en" ? "Type code or name to search..." : "Gõ mã hoặc tên vật tư để tìm kiếm..."}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={MOCK_MATERIALS_CATALOG.map((m) => ({
                  value: m.itemCode,
                  label: `${m.itemCode} - ${m.itemName} (${language === "en" ? "Stock: " : "Tồn: "}${m.stockQty.toLocaleString(language === "en" ? "en-US" : "vi-VN")} ${m.unit})`,
                }))}
                onChange={(val) => {
                  const found = MOCK_MATERIALS_CATALOG.find((m) => m.itemCode === val);
                  if (found) {
                    form.setFieldsValue({
                      itemName: found.itemName,
                      unit: found.unit,
                      stockQty: found.stockQty,
                      unitPrice: found.unitPrice,
                    });
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="itemName"
              label={language === "en" ? "Material / Equipment Name" : "Tên vật tư / Thiết bị"}
              rules={[{ required: true, message: t.itemDrawer.itemNameRequired }]}
            >
              <Input placeholder={language === "en" ? "Material name..." : "Tên vật tư..."} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="unit"
              label={t.itemDrawer.unit}
              rules={[{ required: true, message: t.itemDrawer.unitRequired }]}
            >
              <Input placeholder={language === "en" ? "Kg, Bag, Meter..." : "Kg, Bao, Mét..."} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="stockQty" label={language === "en" ? "Current Stock" : "Tồn kho hiện tại"}>
              <InputNumber
                style={{ width: "100%" }}
                disabled
                formatter={(val) => (val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0")}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="orderQty"
              label={language === "en" ? "Requested Qty" : "Số lượng yêu cầu"}
              rules={[{ required: true, message: language === "en" ? "Please enter requested quantity!" : "Vui lòng nhập SL yêu cầu!" }]}
            >
              <InputNumber<number>
                style={{ width: "100%" }}
                min={1}
                formatter={(val) => (val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                parser={(val) => (val ? Number(val.replace(/,/g, "")) : 0) as any}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="actualQty"
              label={language === "en" ? "Actual Issued Qty" : "Số lượng thực xuất"}
              rules={[{ required: true, message: language === "en" ? "Please enter actual quantity!" : "Vui lòng nhập SL thực xuất!" }]}
            >
              <InputNumber<number>
                style={{ width: "100%" }}
                min={1}
                formatter={(val) => (val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                parser={(val) => (val ? Number(val.replace(/,/g, "")) : 0) as any}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="unitPrice"
              label={t.itemDrawer.unitPrice}
              rules={[{ required: true, message: t.itemDrawer.unitPriceRequired }]}
            >
              <InputNumber<number>
                style={{ width: "100%" }}
                min={0}
                formatter={(val) => (val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                parser={(val) => (val ? Number(val.replace(/,/g, "")) : 0) as any}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="binLocation" label={language === "en" ? "Bin / Storage Location" : "Vị trí lưu kho"}>
              <Input placeholder={language === "en" ? "Rack A1, Row B..." : "Kệ A1, Dãy B, Bãi số 2..."} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="note" label={t.itemDrawer.notes}>
              <Input.TextArea rows={2} placeholder={language === "en" ? "Additional notes on specification, truck plate, purpose..." : "Ghi chú thêm về quy cách, biển số xe, mục đích cấp phát..."} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
