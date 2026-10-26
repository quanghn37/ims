"use client";

import React, { useMemo } from "react";
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
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";

interface ItemFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingSubmissionItem: any | null;
  form: any; // Form instance from useForm()
  submitting: boolean;
  availableItems: any[];
  loadingAvailableItems: boolean;
  onSearchItem: (keyword: string) => void;
  onFetchItems: () => void;
  budgetList?: any[];
  loadingBudgetList?: boolean;
  // Real-time totals
  rawItemTotal: number;
  taxItemTotal: number;
  grandItemTotal: number;
  watchedTaxRate: number;
  onFinish: (values: any) => void;
}

export default function ItemFormDrawer({
  open,
  onClose,
  editingSubmissionItem,
  form,
  submitting,
  availableItems,
  loadingAvailableItems,
  onSearchItem,
  onFetchItems,
  budgetList = [],
  loadingBudgetList = false,
  rawItemTotal,
  taxItemTotal,
  grandItemTotal,
  watchedTaxRate,
  onFinish,
}: ItemFormDrawerProps) {
  const { t, language } = useTranslation();
  const isEditable = editingSubmissionItem ? editingSubmissionItem.Editable !== 0 : true;

  // Ghép chuỗi Mã - Tên nếu có
  const displayItemName = editingSubmissionItem
    ? editingSubmissionItem.SystemCode && editingSubmissionItem.Description
      ? `${editingSubmissionItem.SystemCode} - ${editingSubmissionItem.Description}`
      : editingSubmissionItem.Description ||
        editingSubmissionItem.ItemName ||
        editingSubmissionItem.SystemCode ||
        editingSubmissionItem.ItemDisplayName ||
        ""
    : "";

  // Chuẩn bị danh sách option cho Orgcode từ budgetList
  const budgetOptions = useMemo(() => {
    const opts = (budgetList || []).map((b: any) => {
      const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
      const desc = (b.Description || b.ItemName || "").trim();
      const fullLabel = code && desc ? `${code} - ${desc}` : code || desc;
      return {
        value: code,
        label: (
          <div title={fullLabel} style={{ whiteSpace: "normal", wordBreak: "break-word", lineHeight: "1.3", padding: "2px 0" }}>
            <span style={{ fontWeight: 600, color: "#008f89" }}>{code}</span>
            {desc && <span style={{ color: "#595959", marginLeft: 6 }}>- {desc}</span>}
          </div>
        ),
        searchKey: fullLabel.toLowerCase(),
      };
    });

    // Nếu record đang edit có Orgcode nhưng không nằm trong budgetList thì add thêm option tạm
    const currentOrg = (form.getFieldValue("Orgcode") || editingSubmissionItem?.Orgcode || "").trim();
    if (currentOrg) {
      const exists = opts.some((o: any) => o.value === currentOrg);
      if (!exists) {
        opts.unshift({
          value: currentOrg,
          label: (
            <div title={currentOrg} style={{ padding: "2px 0" }}>
              <span style={{ fontWeight: 600, color: "#008f89" }}>{currentOrg}</span>
            </div>
          ),
          searchKey: currentOrg.toLowerCase(),
        });
      }
    }

    return opts;
  }, [budgetList, form, editingSubmissionItem]);

  return (
    <Drawer
      closable={true}
      closeIcon={<CloseOutlined style={{ fontSize: 16, color: "#718894" }} />}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {editingSubmissionItem ? (
            <EditOutlined style={{ color: "#008f89", fontSize: 18 }} />
          ) : (
            <PlusOutlined style={{ color: "#008f89", fontSize: 18 }} />
          )}
          <span style={{ fontSize: 16, fontWeight: 700, color: "#123443" }}>
            {editingSubmissionItem
              ? (language === "en" ? "Edit PO Order Item" : "Chỉnh sửa Mặt hàng trong Đơn hàng PO")
              : (language === "en" ? "Add Item to PO Order" : "Thêm Mặt hàng vào Đơn hàng PO")}
          </span>
        </div>
      }
      placement="right"
      width={460}
      open={open}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button
            onClick={onClose}
            style={{
              height: 38,
              borderRadius: 8,
              borderColor: "#dce5e6",
              color: "#334155",
              padding: "0 18px",
            }}
          >
            {isEditable ? t.common.cancel : t.common.close}
          </Button>
          {isEditable && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              style={{
                background: "#008f89",
                borderColor: "#008f89",
                height: 38,
                borderRadius: 8,
                fontWeight: 500,
                padding: "0 20px",
                boxShadow: "0 2px 6px rgba(0, 143, 137, 0.25)",
              }}
              onClick={() => form.submit()}
              loading={submitting}
            >
              {language === "en" ? "Save Item" : "Lưu mặt hàng"}
            </Button>
          )}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          Orgcode: "",
          WBS: "",
          ItemDate: dayjs(),
          Qnty: 1,
          TaxRate: 0.08,
          UnitPrice: 0,
          Unit: "Cái",
          Remarks: "",
          StartProcessNow: true,
        }}
      >
        {/* Khối Thông tin mặt hàng (Dạng Thẻ Thông Tin Label trên + Giá trị in đậm dưới giống màn hình ngoài) */}
        {editingSubmissionItem ? (
          <div
            style={{
              background: "#f7fbfa",
              border: "1px solid #dce5e6",
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 16,
            }}
          >
            {/* Dòng 1: Tên / Mã mặt hàng */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 3, lineHeight: "16px" }}>
                {language === "en" ? "Item Name / Code" : "Tên / Mã mặt hàng"}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#123443",
                  lineHeight: "20px",
                  wordBreak: "break-word",
                }}
              >
                {displayItemName || form.getFieldValue("ItemDisplayName") || "---"}
              </div>
            </div>

            {/* Dòng 2: Đơn vị tính & Đơn giá */}
            <div
              style={{
                display: "flex",
                gap: 16,
                paddingTop: 10,
                borderTop: "1px solid #dce5e6",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 3, lineHeight: "16px" }}>
                  {t.itemDrawer.unit}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#123443", lineHeight: "20px" }}>
                  {form.getFieldValue("Unit") || editingSubmissionItem?.Unit || "---"}
                </div>
              </div>

              <div style={{ flex: 1.5 }}>
                <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 3, lineHeight: "16px" }}>
                  {t.itemDrawer.unitPrice}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#123443", lineHeight: "20px" }}>
                  {Number(form.getFieldValue("UnitPrice") ?? editingSubmissionItem?.UnitPrice ?? 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
                </div>
              </div>
            </div>

            {/* Hidden fields để giữ giá trị trong form khi submit */}
            <Form.Item name="ItemDisplayName" style={{ display: "none" }}><Input /></Form.Item>
            <Form.Item name="ItemId" style={{ display: "none" }}><Input /></Form.Item>
            <Form.Item name="MaterialId" style={{ display: "none" }}><Input /></Form.Item>
            <Form.Item name="Unit" style={{ display: "none" }}><Input /></Form.Item>
            <Form.Item name="UnitPrice" style={{ display: "none" }}><Input /></Form.Item>
          </div>
        ) : (
          /* Trường hợp Thêm mới mặt hàng */
          <>
            <Form.Item
              name="ItemId"
              label={<span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{language === "en" ? "Item Name / Code" : "Tên / Mã mặt hàng"}</span>}
              rules={[{ required: true, message: language === "en" ? "Please select an item!" : "Vui lòng chọn hoặc nhập mặt hàng!" }]}
              style={{ marginBottom: 16 }}
            >
              <Select
                showSearch
                placeholder={language === "en" ? "Select or search item..." : "Chọn hoặc gõ từ khóa để tìm kiếm..."}
                loading={loadingAvailableItems}
                filterOption={false}
                onSearch={onSearchItem}
                onClear={onFetchItems}
                allowClear
                style={{ width: "100%", height: 38 }}
                onChange={(val) => {
                  const selected = availableItems.find((it) => it.ItemId === val);
                  if (selected) {
                    form.setFieldsValue({
                      Unit: selected.Unit || (language === "en" ? "Pcs" : "Cái"),
                      Remarks: selected.ItemName || "",
                    });
                  }
                }}
                options={availableItems.map((it) => ({
                  value: it.ItemId,
                  label: (
                    <span style={{ fontWeight: 400, color: "#000000" }}>
                      {it.ItemName}
                    </span>
                  ),
                }))}
              />
            </Form.Item>

            <div style={{ display: "flex", gap: 10, marginBottom: 0 }}>
              <Form.Item
                name="Unit"
                label={<span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{t.itemDrawer.unit}</span>}
                style={{ flex: 1, marginBottom: 16 }}
                rules={[{ required: true, message: t.itemDrawer.unitRequired }]}
              >
                <Input
                  placeholder={language === "en" ? "e.g.: Pcs" : "vd: Cái"}
                  style={{ height: 38, borderRadius: 8, borderColor: "#dce5e6" }}
                />
              </Form.Item>

              <Form.Item
                name="UnitPrice"
                label={<span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{t.itemDrawer.unitPrice}</span>}
                style={{ flex: 1.5, marginBottom: 16 }}
                rules={[{ required: true, message: t.itemDrawer.priceRequired }]}
              >
                <InputNumber
                  style={{ width: "100%", height: 38, borderRadius: 8, borderColor: "#dce5e6" }}
                  min={0}
                  placeholder="0"
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0) as any}
                />
              </Form.Item>
            </div>
          </>
        )}

        {/* Ẩn cột ngày áp dụng */}
        <Form.Item
          name="ItemDate"
          label="ItemDate"
          style={{ display: "none" }}
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>

        {/* Orgcode */}
        <Form.Item
          name="Orgcode"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
              Orgcode <span style={{ color: "#ff4d4f" }}>*</span>
            </span>
          }
          rules={[
            {
              required: true,
              message:
                language === "en"
                  ? "Please select Orgcode!"
                  : "Vui lòng chọn Orgcode!",
            },
          ]}
          style={{ marginBottom: 16 }}
        >
          <Select
            showSearch
            disabled={!isEditable}
            placeholder={language === "en" ? "Select or search Orgcode / WBS budget..." : "Chọn hoặc tìm kiếm mã Orgcode / WBS ngân sách..."}
            loading={loadingBudgetList}
            options={budgetOptions}
            onChange={(val) => {
              const cleanVal = String(val || "").trim();
              const matched = budgetList.find((b: any) => {
                const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
                return code === cleanVal;
              });
              form.setFieldsValue({
                OrgName: matched ? (matched.Description || matched.ItemName || "").trim() : "",
              });
            }}
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
              String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: "100%", height: 38 }}
            popupMatchSelectWidth={true}
            dropdownStyle={{ maxHeight: 300, overflowY: "auto" }}
          />
        </Form.Item>
        <Form.Item name="OrgName" style={{ display: "none" }}>
          <Input />
        </Form.Item>

        {/* Cụm 2 cột: Số lượng & Thuế suất */}
        <div style={{ display: "flex", gap: 14, marginBottom: 0 }}>
          <Form.Item
            name="Qnty"
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{t.itemDrawer.quantity} <span style={{ color: "#ff4d4f" }}>*</span></span>}
            style={{ flex: 1, marginBottom: 16 }}
            rules={[{ required: true, message: t.itemDrawer.qtyRequired }]}
          >
            <InputNumber
              disabled={!isEditable}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                borderColor: "#dce5e6",
                ...(isEditable ? {} : { color: "#334155", backgroundColor: "#f7fbfa", cursor: "not-allowed" }),
              }}
              min={1}
              placeholder="1"
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0) as any}
            />
          </Form.Item>

          <Form.Item
            name="TaxRate"
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{t.itemDrawer.taxRate}</span>}
            style={{ flex: 1, marginBottom: 16 }}
          >
            <Select
              disabled={!isEditable}
              style={{ width: "100%", height: 38 }}
              options={[
                { value: 0, label: language === "en" ? "0% (Non-taxable)" : "0% (Không chịu thuế)" },
                { value: 0.05, label: "5%" },
                { value: 0.08, label: language === "en" ? "8% (Decree 44)" : "8% (Nghị định 44)" },
                { value: 0.1, label: "10%" },
              ]}
            />
          </Form.Item>
        </div>

        {/* Diễn giải / Ghi chú */}
        <Form.Item
          name="Remarks"
          label={<span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{t.itemDrawer.remarks}</span>}
          style={{ marginBottom: 16 }}
        >
          <Input.TextArea
            disabled={!isEditable}
            rows={3}
            placeholder={language === "en" ? "e.g.: Main distribution board..." : "vd: Tủ điện phân phối trung tâm..."}
            style={{
              borderRadius: 8,
              borderColor: "#dce5e6",
              padding: "10px 12px",
              ...(isEditable ? {} : { color: "#334155", backgroundColor: "#f7fbfa", cursor: "not-allowed" }),
            }}
          />
        </Form.Item>

        {/* Trình duyệt? */}
        <Form.Item name="StartProcessNow" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox disabled={!isEditable} style={{ fontWeight: 500, color: "#334155" }}>
            {language === "en" ? "Submit for approval?" : "Trình duyệt?"}
          </Checkbox>
        </Form.Item>

        {/* Khối tổng tiền (Summary Box) theo thiết kế Purple #008f89 */}
        <div
          style={{
            background: "#eef8f6",
            border: "1px solid #dce5e6",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#718894", fontWeight: 500 }}>{t.itemDrawer.subtotal}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#123443" }}>
              {rawItemTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#718894", fontWeight: 500 }}>
              {t.itemDrawer.taxAmount} ({((watchedTaxRate || 0) * 100).toFixed(0)}%):
            </span>
            <span style={{ fontSize: 13, color: "#718894" }}>
              {taxItemTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
            </span>
          </div>
          <Divider style={{ margin: "10px 0", borderColor: "#b2ded9" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>{t.itemDrawer.totalAmount}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#008f89", letterSpacing: 0.2 }}>
              {grandItemTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
            </span>
          </div>
        </div>
      </Form>
    </Drawer>
  );
}
