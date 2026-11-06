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
  const isReadOnly = Boolean(editingItem && editingItem.Editable === 0);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        form.setFieldsValue({
          orgCode: editingItem.Orgcode || editingItem.orgCode || "",
          orgName: editingItem.OrgName || editingItem.orgName || "",
          itemCode: editingItem.SystemCode || editingItem.itemCode || "",
          itemName: editingItem.Description || editingItem.itemName || "",
          unit: editingItem.Unit || editingItem.unit || "",
          stockQty: editingItem.OnHandQty ?? editingItem.stockQty ?? 0,
          availableQty: editingItem.AvailableQty ?? editingItem.availableQty ?? editingItem.OnHandQty ?? editingItem.stockQty ?? 0,
          actualQty: editingItem.Qnty ?? editingItem.actualQty ?? 0,
          approvedQty: editingItem.ApprovedQnty ?? editingItem.approvedQty ?? undefined,
          unitPrice: editingItem.UnitPrice ?? editingItem.unitPrice ?? 0,
          note: editingItem.Remarks || editingItem.note || "",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          actualQty: 1,
          unitPrice: 0,
        });
      }
    }
  }, [open, editingItem, form]);

  const handleOk = () => {
    if (isReadOnly) {
      onClose();
      return;
    }
    form.validateFields().then((vals) => {
      const actualQty = Number(vals.actualQty) || 0;
      const unitPrice = Number(vals.unitPrice) || 0;
      const totalPrice = actualQty * unitPrice;

      if (editingItem) {
        onSave({
          ...editingItem,
          ...vals,
          Orgcode: vals.orgCode || editingItem.Orgcode || "",
          orgCode: vals.orgCode || editingItem.orgCode || "",
          OrgName: vals.orgName || editingItem.OrgName || "",
          orgName: vals.orgName || editingItem.orgName || "",
          SystemCode: vals.itemCode,
          itemCode: vals.itemCode,
          Description: vals.itemName,
          itemName: vals.itemName,
          Unit: vals.unit,
          unit: vals.unit,
          OnHandQty: vals.stockQty ?? editingItem.OnHandQty ?? 0,
          stockQty: vals.stockQty ?? editingItem.stockQty ?? 0,
          AvailableQty: vals.availableQty ?? editingItem.AvailableQty ?? 0,
          availableQty: vals.availableQty ?? editingItem.availableQty ?? 0,
          Qnty: actualQty,
          actualQty,
          UnitPrice: unitPrice,
          unitPrice,
          Amount: totalPrice,
          totalPrice,
          Remarks: vals.note || "",
          note: vals.note || "",
        });
      } else {
        const newItem: StockItemDetail = {
          id: `oit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          Orgcode: vals.orgCode || "",
          orgCode: vals.orgCode || "",
          OrgName: vals.orgName || "",
          orgName: vals.orgName || "",
          SystemCode: vals.itemCode,
          itemCode: vals.itemCode,
          Description: vals.itemName,
          itemName: vals.itemName,
          Unit: vals.unit,
          unit: vals.unit,
          OnHandQty: vals.stockQty || 0,
          stockQty: vals.stockQty || 0,
          AvailableQty: vals.availableQty || vals.stockQty || 0,
          availableQty: vals.availableQty || vals.stockQty || 0,
          Qnty: actualQty,
          actualQty,
          UnitPrice: unitPrice,
          unitPrice,
          Amount: totalPrice,
          totalPrice,
          Remarks: vals.note || "",
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
        isReadOnly
          ? language === "en" ? "View Stock-out Material" : "Chi tiết vật tư xuất kho"
          : editingItem
          ? language === "en" ? "Edit Stock-out Material" : "Chỉnh sửa vật tư xuất kho"
          : language === "en" ? "Add Stock-out Material" : "Thêm vật tư xuất kho"
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={t.common.confirm || (language === "en" ? "Confirm" : "Xác nhận")}
      cancelText={isReadOnly ? (t.common.close || "Đóng") : t.common.cancel}
      okButtonProps={{
        style: isReadOnly
          ? { display: "none" }
          : { background: "#008f89", borderColor: "#008f89" },
      }}
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" disabled={isReadOnly} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="orgCode" label="OrgCode">
              <Input placeholder="Mã hạng mục..." />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="orgName" label="OrgName">
              <Input placeholder="Tên hạng mục..." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="itemCode"
              label={language === "en" ? "Select Material from Catalog" : "Mã vật tư"}
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
                      availableQty: found.stockQty,
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
            <Form.Item name="stockQty" label={language === "en" ? "Current Stock" : "Tồn kho"}>
              <InputNumber
                style={{ width: "100%" }}
                disabled
                formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0")}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="availableQty" label={language === "en" ? "Available Qty" : "Khả dụng"}>
              <InputNumber
                style={{ width: "100%" }}
                disabled
                formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0")}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="actualQty"
              label={language === "en" ? "Actual Issued Qty" : "SL Thực xuất"}
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
                formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                parser={(val) => (val ? Number(val.replace(/,/g, "")) : 0) as any}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="approvedQty" label={language === "en" ? "Approved Qty" : "SL Duyệt"}>
              <InputNumber
                style={{ width: "100%" }}
                disabled
                placeholder="---"
                formatter={(val) => (val !== undefined && val !== null && val !== "" ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
              />
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
