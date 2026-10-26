"use client";

import React, { useEffect, useMemo } from "react";
import {
  Drawer,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Popconfirm,
} from "antd";
import { IconPencil, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";
import {
  ContractMaterialItem,
  UpsertMatequipSubmissionParams,
  parseDateSafe,
} from "../types";

const { Text } = Typography;

interface ContractMaterialEditDrawerProps {
  open: boolean;
  onClose: () => void;
  material: ContractMaterialItem | null;
  onSave: (payload: UpsertMatequipSubmissionParams) => Promise<boolean | void>;
  onDelete?: (material: ContractMaterialItem) => Promise<boolean | void> | void;
  submitting?: boolean;
  isTaskAssigned?: boolean;
}

export default function ContractMaterialEditDrawer({
  open,
  onClose,
  material,
  onSave,
  onDelete,
  submitting = false,
  isTaskAssigned = false,
}: ContractMaterialEditDrawerProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();

  const watchedQnty = Form.useWatch("Qnty", form) ?? 0;
  const watchedUnitPrice = Form.useWatch("UnitPrice", form) ?? 0;
  const watchedTaxRate = Form.useWatch("TaxRate", form) ?? 0.08;

  const rawItemTotal = useMemo(() => {
    return Number(watchedQnty || 0) * Number(watchedUnitPrice || 0);
  }, [watchedQnty, watchedUnitPrice]);

  const taxItemTotal = useMemo(() => {
    return rawItemTotal * Number(watchedTaxRate || 0);
  }, [rawItemTotal, watchedTaxRate]);

  const grandItemTotal = useMemo(() => {
    return rawItemTotal + taxItemTotal;
  }, [rawItemTotal, taxItemTotal]);

  useEffect(() => {
    if (open && material) {
      const itemDateVal = material.signDate || material.ItemDate;
      const itemDateDayjs = itemDateVal && parseDateSafe(itemDateVal)
        ? parseDateSafe(itemDateVal)
        : (itemDateVal && dayjs(itemDateVal).isValid() ? dayjs(itemDateVal) : dayjs());

      const endDateVal = material.EndDate || material.Enddate;
      const is1900 = !endDateVal || String(endDateVal).startsWith("1900");
      const endDateDayjs = !is1900 && parseDateSafe(endDateVal)
        ? parseDateSafe(endDateVal)
        : (!is1900 && dayjs(endDateVal).isValid() ? dayjs(endDateVal) : null);

      const rawTax = material.TaxRate !== undefined ? Number(material.TaxRate) : 0.08;
      const taxRateVal = isNaN(rawTax) ? 0.08 : (rawTax > 1 ? rawTax / 100 : rawTax);

      form.setFieldsValue({
        SubmissionId: material.SubmissionId ?? material.LocalId ?? material.id,
        ItemName: material.ItemName || material.Description,
        Unit: material.Unit || "kg",
        Qnty: Number(material.Qnty ?? 1),
        UnitPrice: Number(material.UnitPrice ?? 0),
        TaxRate: taxRateVal,
        ItemDate: itemDateDayjs,
        EndDate: endDateDayjs,
        Remarks: material.Remarks || "",
      });
    }
  }, [open, material, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!material) return;

      const subId = material.SubmissionId ?? material.LocalId ?? material.id;
      if (!subId) {
        message.warning(
          language === "en"
            ? "Cannot find item SubmissionId to update!"
            : "Không tìm thấy SubmissionId của mặt hàng để cập nhật!"
        );
        return;
      }

      const origItemDate = material.ItemDate || material.signDate;
      const itemDateFormatted = values.ItemDate
        ? values.ItemDate.format("YYYY-MM-DD")
        : (origItemDate && !String(origItemDate).startsWith("1900")
            ? dayjs(origItemDate).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"));

      const origEndDate = material.EndDate || material.Enddate;
      const endDateFormatted = values.EndDate
        ? values.EndDate.format("YYYY-MM-DD")
        : (origEndDate && !String(origEndDate).startsWith("1900")
            ? dayjs(origEndDate).format("YYYY-MM-DD")
            : "");

      const payload: UpsertMatequipSubmissionParams = {
        UpdateMode: "Update_MatequipSubmission",
        SubmissionId: Number(subId),
        Qnty: Number(values.Qnty ?? 0),
        UnitPrice: Number(values.UnitPrice ?? material.UnitPrice ?? 0),
        TaxRate: Number(values.TaxRate ?? 0.08),
        ItemDate: itemDateFormatted,
        EndDate: endDateFormatted,
        Remarks: values.Remarks || "",
        WSId: "",
      };

      const ok = await onSave(payload);
      if (ok !== false) {
        onClose();
      }
    } catch (err) {
      // Form validation error
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <IconPencil size={18} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <Text strong style={{ fontSize: 16, color: "#123443", fontWeight: 700 }}>
            {isTaskAssigned
              ? language === "en"
                ? "View Contract Material Item"
                : "Chi tiết Vật tư trong Hợp đồng"
              : language === "en"
              ? "Edit Contract Material Item"
              : "Chỉnh sửa Vật tư trong Hợp đồng"}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {onDelete && material && !isTaskAssigned && (
              <Popconfirm
                title={
                  language === "en"
                    ? `Remove item "${material.ItemName || material.Description}" from contract?`
                    : `Xóa mặt hàng "${material.ItemName || material.Description}" khỏi hợp đồng?`
                }
                onConfirm={async () => {
                  await onDelete(material);
                  onClose();
                }}
                okText={t.common.delete}
                cancelText={t.common.cancel}
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<IconTrash size={15} strokeWidth={1.8} />}
                  style={{ borderRadius: 6, height: 32 }}
                >
                  {language === "en" ? "Delete this row" : "Xóa dòng này"}
                </Button>
              </Popconfirm>
            )}
          </div>
          <Space size={8}>
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
              {isTaskAssigned ? (t.common.close || (language === "en" ? "Close" : "Đóng")) : t.common.cancel}
            </Button>
            {!isTaskAssigned && (
              <Button
                type="primary"
                icon={<IconDeviceFloppy size={16} strokeWidth={2} />}
                style={{
                  background: "#008f89",
                  borderColor: "#008f89",
                  borderRadius: 6,
                  height: 32,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
                onClick={handleSubmit}
                loading={submitting}
              >
                {t.itemDrawer.saveItem}
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <style>{`
        .contract-item-compact-card .ant-form-item-control-input {
          min-height: 20px !important;
        }
        .contract-item-compact-card .ant-form-item-control-input-content {
          line-height: 20px !important;
        }
        .contract-item-compact-card .ant-input-number {
          line-height: 20px !important;
        }
        .contract-item-compact-card .ant-input-number-input {
          padding: 0 !important;
          height: 20px !important;
          line-height: 20px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          color: #123443 !important;
        }
        .contract-item-compact-card .ant-picker {
          padding: 0 !important;
          height: 20px !important;
        }
        .contract-item-compact-card .ant-picker-input > input {
          font-weight: 500 !important;
          font-size: 13px !important;
          color: #123443 !important;
          line-height: 20px !important;
        }
        .contract-item-compact-card .ant-select-single {
          height: 20px !important;
        }
        .contract-item-compact-card .ant-select-selector {
          padding: 0 !important;
          height: 20px !important;
        }
        .contract-item-compact-card .ant-select-selection-item {
          font-weight: 500 !important;
          font-size: 13px !important;
          color: #123443 !important;
          line-height: 20px !important;
        }
        .contract-item-compact-card .ant-input-disabled,
        .contract-item-compact-card .ant-input-number-disabled,
        .contract-item-compact-card .ant-picker-disabled {
          background: transparent !important;
          cursor: not-allowed !important;
        }
        .contract-item-compact-card .ant-input-disabled input,
        .contract-item-compact-card .ant-input-number-disabled input,
        .contract-item-compact-card .ant-picker-disabled input {
          color: #718894 !important;
          -webkit-text-fill-color: #718894 !important;
          cursor: not-allowed !important;
        }
      `}</style>
      <Form
        form={form}
        layout="vertical"
        disabled={isTaskAssigned}
        onFinish={handleSubmit}
      >
        {/* KHUNG THÔNG TIN VẬT TƯ DẠNG COMPACT BORDERED GRID */}
        <div
          className="contract-item-compact-card"
          style={{
            background: "#FFFFFF",
            border: "1px solid #dce5e6",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            marginBottom: 10,
          }}
        >
          {/* Hàng 1: Tên vật tư (Xám - không cho sửa) */}
          <div
            style={{
              padding: "6px 10px",
              borderBottom: "1px solid #dce5e6",
              background: "#f7fbfa",
            }}
          >
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
              {t.itemDrawer.itemName}
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                lineHeight: "18px",
                color: "#475569",
                wordBreak: "break-word",
                minHeight: 20,
                cursor: "not-allowed",
              }}
            >
              {material?.ItemName || material?.Description || "---"}
            </div>
          </div>

          {/* Hàng 2: Đơn vị tính (Xám) | Số lượng (CHO SỬA) | Đơn giá (Xám) */}
          <Row gutter={[0, 0]} align="stretch" style={{ borderBottom: "1px solid #dce5e6" }}>
            <Col
              span={8}
              style={{
                padding: "6px 10px",
                borderRight: "1px solid #dce5e6",
                background: "#f7fbfa",
              }}
            >
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                {t.itemDrawer.unit}
              </div>
              <Form.Item
                name="Unit"
                style={{ margin: 0 }}
              >
                <Input
                  variant="borderless"
                  placeholder={language === "en" ? "e.g.: Pcs" : "vd: Cái"}
                  disabled
                  style={{
                    padding: 0,
                    height: 20,
                    fontWeight: 500,
                    fontSize: 13,
                    lineHeight: "20px",
                    color: "#718894",
                    cursor: "not-allowed",
                  }}
                />
              </Form.Item>
            </Col>

            <Col
              span={8}
              style={{
                padding: "6px 10px",
                borderRight: "1px solid #dce5e6",
                background: "#FFFFFF",
              }}
            >
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 2, fontWeight: 600, lineHeight: "14px" }}>
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

            <Col span={8} style={{ padding: "6px 10px", background: "#f7fbfa" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                {t.itemDrawer.unitPrice}
              </div>
              <Form.Item
                name="UnitPrice"
                style={{ margin: 0 }}
              >
                <InputNumber
                  variant="borderless"
                  disabled
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
                    fontWeight: 500,
                    fontSize: 13,
                    color: "#718894",
                    cursor: "not-allowed",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Hàng 3: Ngày hiệu lực (Xám) | Ngày hết hiệu lực (Xám) | Thuế suất (CHO SỬA) */}
          <Row gutter={[0, 0]} align="stretch" style={{ borderBottom: "1px solid #dce5e6" }}>
            <Col span={8} style={{ padding: "6px 10px", borderRight: "1px solid #dce5e6", background: "#f7fbfa" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                {t.itemDrawer.effectiveDate}
              </div>
              <Form.Item name="ItemDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  disabled
                  format="DD/MM/YYYY"
                  placeholder="---"
                  style={{
                    padding: 0,
                    width: "100%",
                    height: 20,
                    fontWeight: 500,
                    fontSize: 13,
                    color: "#718894",
                    cursor: "not-allowed",
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={8} style={{ padding: "6px 10px", borderRight: "1px solid #dce5e6", background: "#f7fbfa" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                {t.itemDrawer.expiryDate}
              </div>
              <Form.Item name="EndDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  disabled
                  format="DD/MM/YYYY"
                  placeholder="---"
                  allowClear={false}
                  style={{
                    padding: 0,
                    width: "100%",
                    height: 20,
                    fontWeight: 500,
                    fontSize: 13,
                    color: "#718894",
                    cursor: "not-allowed",
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={8} style={{ padding: "6px 10px", background: "#FFFFFF" }}>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 2, fontWeight: 600, lineHeight: "14px" }}>
                {t.itemDrawer.taxRate}
              </div>
              <Form.Item name="TaxRate" style={{ margin: 0 }}>
                <Select
                  variant="borderless"
                  style={{
                    padding: 0,
                    width: "100%",
                    height: 20,
                    fontWeight: 600,
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

          {/* Hàng 4: Ghi chú (CHO SỬA) */}
          <div style={{ padding: "6px 10px", background: "#FFFFFF" }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 2, fontWeight: 600, lineHeight: "14px" }}>
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
  );
}
