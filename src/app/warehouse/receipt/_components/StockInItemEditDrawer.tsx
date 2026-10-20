"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Drawer, Form, Button, Input, InputNumber, Select, Checkbox, Divider, message } from "antd";
import { EditOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { StockInReceipt, StockItemDetail } from "../../types";
import { warehouseApi } from "../../api";
import { extractApiList } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";

interface StockInItemEditDrawerProps {
  open: boolean;
  onClose: () => void;
  editingItem: StockItemDetail | null;
  editingReceipt?: StockInReceipt | null;
  budgetList?: any[];
  loadingBudgetList?: boolean;
  onSuccess?: () => void;
  onOptimisticUpdate?: (itemId: string, updatedFields: Partial<StockItemDetail>) => void;
}

export default function StockInItemEditDrawer({
  open,
  onClose,
  editingItem,
  editingReceipt,
  budgetList,
  loadingBudgetList,
  onSuccess,
  onOptimisticUpdate,
}: StockInItemEditDrawerProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const [submittingEditItem, setSubmittingEditItem] = useState(false);
  const [internalBudgetList, setInternalBudgetList] = useState<any[]>([]);
  const [internalLoadingBudget, setInternalLoadingBudget] = useState(false);

  const watchedEditQnty = Form.useWatch("Qnty", form);
  const watchedEditUnitPrice = Form.useWatch("UnitPrice", form);

  const rawEditTotal = (Number(watchedEditQnty) || 0) * (Number(watchedEditUnitPrice) || 0);
  const grandEditTotal = rawEditTotal;

  // Reset danh sách nội bộ khi phiếu nhập khác được chọn
  const receiptKey =
    editingReceipt?.TransactionId ??
    (editingReceipt as any)?.Id ??
    editingReceipt?.id ??
    editingReceipt?.SubconOf;

  useEffect(() => {
    setInternalBudgetList([]);
  }, [receiptKey]);

  useEffect(() => {
    if (!open) return;
    if (budgetList && budgetList.length > 0) return;
    if (internalBudgetList && internalBudgetList.length > 0) return;

    const cId =
      editingReceipt?.SubconOf ??
      (editingReceipt as any)?.subconof ??
      (editingReceipt as any)?.SubConOf ??
      (editingItem as any)?.SubconOf ??
      (editingItem as any)?.subconof;

    if (cId) {
      setInternalLoadingBudget(true);
      warehouseApi
        .getApprovedBudgetList({
          ContractId: !isNaN(Number(cId)) ? Number(cId) : cId,
          PageNum: 1,
          PageSize: 1000,
        })
        .then((res) => {
          const list = extractApiList<any>(res);
          setInternalBudgetList(list);
        })
        .catch((err) => {
          console.warn("Lỗi tải approved budget list trong drawer:", err);
        })
        .finally(() => {
          setInternalLoadingBudget(false);
        });
    }
  }, [open, budgetList, internalBudgetList, editingItem, editingReceipt]);

  const effectiveBudgetList = (budgetList && budgetList.length > 0) ? budgetList : internalBudgetList;

  const budgetOptions = useMemo(() => {
    const opts = (effectiveBudgetList || []).map((b: any) => {
      const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
      const desc = (b.Description || b.ItemName || b.OrgName || b.Orgname || "").trim();
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

    const currentOrg = (form.getFieldValue("Orgcode") || editingItem?.Orgcode || editingItem?.orgCode || "").trim();
    if (currentOrg) {
      const exists = opts.some((o: any) => o.value === currentOrg);
      if (!exists) {
        let currentName = (form.getFieldValue("OrgName") || editingItem?.OrgName || editingItem?.Orgname || editingItem?.BudgetDescription || "").trim();
        if (currentOrg.includes(" - ")) {
          const parts = currentOrg.split(" - ");
          const parsedCode = parts[0].trim();
          if (!currentName) currentName = parts.slice(1).join(" - ").trim();
          const full = currentName ? `${parsedCode} - ${currentName}` : parsedCode;
          opts.unshift({
            value: parsedCode,
            label: (
              <div title={full} style={{ padding: "2px 0" }}>
                <span style={{ fontWeight: 600, color: "#008f89" }}>{parsedCode}</span>
                {currentName && <span style={{ color: "#595959", marginLeft: 6 }}>- {currentName}</span>}
              </div>
            ),
            searchKey: full.toLowerCase(),
          });
        } else {
          const full = currentName ? `${currentOrg} - ${currentName}` : currentOrg;
          opts.unshift({
            value: currentOrg,
            label: (
              <div title={full} style={{ padding: "2px 0" }}>
                <span style={{ fontWeight: 600, color: "#008f89" }}>{currentOrg}</span>
                {currentName && <span style={{ color: "#595959", marginLeft: 6 }}>- {currentName}</span>}
              </div>
            ),
            searchKey: full.toLowerCase(),
          });
        }
      }
    }

    return opts;
  }, [effectiveBudgetList, form, editingItem]);

  useEffect(() => {
    if (open && editingItem) {
      const qnty = Number(editingItem.Qnty ?? editingItem.actualQty ?? 1);
      const unitPrice = Number(editingItem.UnitPrice ?? editingItem.unitPrice ?? 0);
      const remarks = editingItem.Remarks || editingItem.note || "";
      let orgCode = (editingItem.Orgcode || editingItem.orgCode || "").trim();
      let orgName = (editingItem.OrgName || editingItem.Orgname || editingItem.BudgetDescription || "").trim();

      if (orgCode.includes(" - ")) {
        const parts = orgCode.split(" - ");
        orgCode = parts[0].trim();
        if (!orgName) {
          orgName = parts.slice(1).join(" - ").trim();
        }
      }

      if (!orgName && orgCode && effectiveBudgetList.length > 0) {
        const matched = effectiveBudgetList.find((b: any) => {
          const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
          return code.toLowerCase() === orgCode.toLowerCase();
        });
        if (matched) {
          orgName = (matched.Description || matched.ItemName || matched.OrgName || matched.Orgname || "").trim();
        }
      }

      form.setFieldsValue({
        itemDisplayName: `${editingItem.SystemCode || editingItem.itemCode ? (editingItem.SystemCode || editingItem.itemCode) + " - " : ""}${editingItem.Description || editingItem.itemName || ""}`,
        Unit: editingItem.Unit || editingItem.unit || "---",
        Qnty: qnty,
        Orgcode: orgCode || undefined,
        OrgName: orgName,
        UnitPrice: unitPrice,
        TaxRate: 0,
        Remarks: remarks,
        StartProcessNow: false,
      });
    }
  }, [open, editingItem, effectiveBudgetList, form]);

  const handleSaveEditItem = async () => {
    try {
      const values = await form.validateFields();
      if (!editingItem) return;

      const rawSubId =
        editingItem.SubmissionId !== undefined && editingItem.SubmissionId !== null
          ? editingItem.SubmissionId
          : editingItem.LocalId !== undefined && editingItem.LocalId !== null
          ? editingItem.LocalId
          : !isNaN(Number(editingItem.id))
          ? Number(editingItem.id)
          : null;

      const newOrgcode = (values.Orgcode || editingItem.Orgcode || editingItem.orgCode || "").trim();
      if (!newOrgcode) {
        message.warning(
          language === "en"
            ? "Please select Orgcode, cannot be empty!"
            : "Vui lòng chọn Orgcode, không được để trống!"
        );
        return;
      }
      let newOrgName = (values.OrgName || editingItem.OrgName || editingItem.Orgname || "").trim();
      if (!newOrgName && newOrgcode && effectiveBudgetList.length > 0) {
        const matched = effectiveBudgetList.find((b: any) => {
          const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
          return code.toLowerCase() === newOrgcode.toLowerCase();
        });
        if (matched) {
          newOrgName = (matched.Description || matched.ItemName || matched.OrgName || matched.Orgname || "").trim();
        }
      }

      const newQnty = Number(values.Qnty || 0);
      const newUnitPrice = Number(editingItem.UnitPrice ?? values.UnitPrice ?? 0);
      const newAmount = newQnty * newUnitPrice;

      const updatedPayload: Partial<StockItemDetail> = {
        Qnty: newQnty,
        actualQty: newQnty,
        UnitPrice: newUnitPrice,
        unitPrice: newUnitPrice,
        Amount: newAmount,
        totalPrice: newAmount,
        TaxRate: 0,
        TaxAmount: 0,
        Orgcode: newOrgcode,
        orgCode: newOrgcode,
        OrgName: newOrgName,
        Orgname: newOrgName,
        WBS: newOrgcode,
        Remarks: values.Remarks || "",
        note: values.Remarks || "",
      };

      if (rawSubId) {
        const subId = Number(rawSubId);
        setSubmittingEditItem(true);
        try {
          await warehouseApi.updateInventoryReceiptSubmission({
            SubmissionId: subId,
            Qnty: newQnty,
            UnitPrice: newUnitPrice,
            TaxRate: 0,
            Orgcode: newOrgcode,
            Orgname: newOrgName,
            OrgName: newOrgName,
            Remarks: values.Remarks || "",
            StartProcessNow: values.StartProcessNow ? "Yes" : "No",
          });
          message.success(language === "en" ? "Item updated successfully!" : "Cập nhật mặt hàng thành công!");
          onClose();

          if (onSuccess) {
            onSuccess();
          } else if (onOptimisticUpdate) {
            onOptimisticUpdate(editingItem.id, updatedPayload);
          }
        } catch (err: any) {
          console.error("Lỗi cập nhật dòng vật tư:", err);
          message.error(err?.message || (language === "en" ? "Failed to update item" : "Cập nhật dòng vật tư không thành công"));
        } finally {
          setSubmittingEditItem(false);
        }
      } else {
        // Trường hợp dòng nháp chưa lưu lên server
        if (onOptimisticUpdate) {
          onOptimisticUpdate(editingItem.id, updatedPayload);
        }
        message.success(language === "en" ? "Item updated successfully!" : "Cập nhật mặt hàng thành công!");
        onClose();
      }
    } catch {
      // Validate form error
    }
  };

  return (
    <Drawer
      closable={true}
      closeIcon={<CloseOutlined style={{ fontSize: 16, color: "#718894" }} />}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EditOutlined style={{ color: "#008f89", fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#123443" }}>
            {language === "en" ? "Edit Goods Receipt Item" : "Chỉnh sửa Mặt hàng trong Phiếu nhập kho"}
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
            {t.common.cancel}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveEditItem}
            loading={submittingEditItem}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 38,
              borderRadius: 8,
              fontWeight: 500,
              padding: "0 20px",
              boxShadow: "0 2px 6px rgba(0, 143, 137, 0.25)",
            }}
          >
            {language === "en" ? "Save Changes" : "Lưu thay đổi"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        {/* Khối Thẻ thông tin mặt hàng (Header Box) */}
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
              {form.getFieldValue("itemDisplayName") ||
                (editingItem?.SystemCode && editingItem?.Description
                  ? `${editingItem.SystemCode} - ${editingItem.Description}`
                  : editingItem?.Description || editingItem?.itemName || "---")}
            </div>
          </div>

          {/* Dòng 2: Đơn vị tính */}
          <div
            style={{
              paddingTop: 10,
              borderTop: "1px solid #dce5e6",
            }}
          >
            <div style={{ fontSize: 12, color: "#718894", fontWeight: 500, marginBottom: 3, lineHeight: "16px" }}>
              {t.itemDrawer.unit}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#123443", lineHeight: "20px" }}>
              {form.getFieldValue("Unit") || editingItem?.Unit || editingItem?.unit || "---"}
            </div>
          </div>

          {/* Hidden fields */}
          <Form.Item name="itemDisplayName" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="Unit" style={{ display: "none" }}><Input /></Form.Item>
          <Form.Item name="UnitPrice" style={{ display: "none" }}><Input /></Form.Item>
        </div>

        {/* Cụm 2 cột: Số lượng & Orgcode */}
        <div style={{ display: "flex", gap: 14, marginBottom: 0 }}>
          <Form.Item
            name="Qnty"
            label={
              <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
                {t.itemDrawer.quantity} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            style={{ flex: 1, marginBottom: 16 }}
            rules={[{ required: true, message: t.itemDrawer.qtyRequired }]}
          >
            <InputNumber<number>
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                borderColor: "#dce5e6",
                fontWeight: 600,
              }}
              min={0}
              precision={2}
              placeholder="1"
              formatter={(val) => String(val || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(val) => Number(val ? val.replace(/\$\s?|(,*)/g, "") : 0)}
            />
          </Form.Item>

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
            style={{ flex: 1, marginBottom: 16 }}
          >
            <Select
              showSearch
              style={{ width: "100%", height: 38 }}
              placeholder={language === "en" ? "Select or search Orgcode / WBS..." : "Chọn hoặc tìm kiếm mã Orgcode / WBS..."}
              loading={loadingBudgetList || internalLoadingBudget}
              options={budgetOptions}
              onChange={(val) => {
                const cleanVal = String(val || "").trim();
                const matched = effectiveBudgetList.find((b: any) => {
                  const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
                  return code === cleanVal;
                });
                form.setFieldsValue({
                  OrgName: matched ? (matched.Description || matched.ItemName || matched.OrgName || matched.Orgname || "").trim() : "",
                });
              }}
              filterOption={(input, option) =>
                String((option as any)?.searchKey ?? option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
              }
              popupMatchSelectWidth={true}
              dropdownStyle={{ maxHeight: 300, overflowY: "auto" }}
            />
          </Form.Item>
          <Form.Item name="OrgName" style={{ display: "none" }}>
            <Input />
          </Form.Item>
        </div>

        {/* Diễn giải / Ghi chú */}
        <Form.Item
          name="Remarks"
          label={<span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{t.itemDrawer.remarks}</span>}
          style={{ marginBottom: 16 }}
        >
          <Input.TextArea
            rows={3}
            placeholder={language === "en" ? "Reason for adjustment notes..." : "Ghi chú lý do điều chỉnh..."}
            style={{
              borderRadius: 8,
              borderColor: "#dce5e6",
              padding: "10px 12px",
            }}
          />
        </Form.Item>

        {/* Trình duyệt? */}
        <Form.Item name="StartProcessNow" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox style={{ fontWeight: 500, color: "#334155" }}>
            {language === "en" ? "Submit for approval?" : "Trình duyệt?"}
          </Checkbox>
        </Form.Item>

        {/* Khối tổng tiền (Summary Box) */}
        <div
          style={{
            background: "#eef8f6",
            border: "1px solid #dce5e6",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#718894", fontWeight: 500 }}>{t.itemDrawer.subtotal}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#123443" }}>
              {rawEditTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
            </span>
          </div>
          <Divider style={{ margin: "10px 0", borderColor: "#b2ded9" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>{t.itemDrawer.totalAmount}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#008f89", letterSpacing: 0.2 }}>
              {grandEditTotal.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
            </span>
          </div>
        </div>
      </Form>
    </Drawer>
  );
}
