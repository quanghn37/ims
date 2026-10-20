"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Drawer, Form, Button, Select, InputNumber, Input, Checkbox, message } from "antd";
import { EditOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { MaterialRequisitionItem } from "../../types";
import { warehouseApi } from "../../api";
import { extractApiList } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";

export interface RequisitionItemEditDrawerProps {
  open: boolean;
  onClose: () => void;
  editingItem: MaterialRequisitionItem | null;
  contractId?: number | string | null;
  subconOf?: number | string | null;
  orgCodeOptions?: Array<{ value: string; label: string; title?: string }>;
  loadingOrgCodes?: boolean;
  onSave: (updatedItem: MaterialRequisitionItem) => void;
}

export default function RequisitionItemEditDrawer({
  open,
  onClose,
  editingItem,
  contractId,
  subconOf,
  orgCodeOptions = [],
  loadingOrgCodes = false,
  onSave,
}: RequisitionItemEditDrawerProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // State danh sách Orgcode (Approved Budget: api/get-approvedbudget-list)
  const [internalBudgetList, setInternalBudgetList] = useState<any[]>([]);
  const [loadingInternalBudgets, setLoadingInternalBudgets] = useState(false);

  // Reset danh sách nội bộ khi hợp đồng cha thay đổi
  useEffect(() => {
    setInternalBudgetList([]);
  }, [subconOf, contractId]);

  // Tải danh mục Orgcode theo Hợp đồng / SubconOf khi mở drawer (chỉ gọi nếu chưa có dữ liệu từ props hoặc internal state)
  useEffect(() => {
    if (!open) return;
    if (orgCodeOptions && orgCodeOptions.length > 0) return;
    if (internalBudgetList && internalBudgetList.length > 0) return;

    const cId =
      subconOf ??
      contractId ??
      (editingItem as any)?.ContractId ??
      (editingItem as any)?.SubconOf;

    if (cId) {
      setLoadingInternalBudgets(true);
      warehouseApi
        .getApprovedBudgetList({
          ContractId: !isNaN(Number(cId)) ? Number(cId) : cId,
          PageNum: 1,
          PageSize: 100,
        })
        .then((res) => {
          const list = extractApiList<any>(res);
          setInternalBudgetList(list);
        })
        .catch((err) => {
          console.error("Lỗi khi tải danh sách Orgcode (Approved Budget) trong drawer:", err);
        })
        .finally(() => {
          setLoadingInternalBudgets(false);
        });
    }
  }, [open, subconOf, contractId, editingItem, orgCodeOptions, internalBudgetList]);

  // Options Orgcode chuẩn hóa theo định dạng "Mã - Tên" (vd: "2.1.1 - Công tác giao thầu...")
  const effectiveOptions = useMemo(() => {
    const list = internalBudgetList.length > 0 ? internalBudgetList : [];
    if (list.length > 0) {
      return list.map((item) => {
        const code = String(item.OrgCode || item.orgCode || item.ItemId || "");
        const desc = item.Description || item.description || item.OrgName || item.orgName || "";
        return {
          value: code,
          label: desc ? `${code} - ${desc}` : code,
          title: desc ? `${code} - ${desc}` : code,
          OrgCode: code,
          OrgName: desc,
        };
      });
    }
    if (orgCodeOptions && orgCodeOptions.length > 0) {
      return orgCodeOptions;
    }
    const currentCode = (editingItem as any)?.Orgcode || editingItem?.orgCode;
    const currentName = (editingItem as any)?.OrgName || (editingItem as any)?.orgName;
    if (currentCode) {
      return [
        {
          value: String(currentCode),
          label: currentName ? `${currentCode} - ${currentName}` : String(currentCode),
          title: currentName ? `${currentCode} - ${currentName}` : String(currentCode),
        },
      ];
    }
    return [
      { value: "HM01-MONG", label: "HM01-MONG", title: "HM01-MONG" },
      { value: "HM02-THAN", label: "HM02-THAN", title: "HM02-THAN" },
      { value: "HM03-MAI", label: "HM03-MAI", title: "HM03-MAI" },
      { value: "HM04-HOANTHIEN", label: "HM04-HOANTHIEN", title: "HM04-HOANTHIEN" },
      { value: "WBS-ME-01", label: "WBS-ME-01", title: "WBS-ME-01" },
    ];
  }, [internalBudgetList, orgCodeOptions, editingItem]);

  useEffect(() => {
    if (open && editingItem) {
      form.resetFields();
      form.setFieldsValue({
        itemCode: editingItem.itemCode,
        itemName: editingItem.itemName,
        orgCode: (editingItem as any).orgCode || (editingItem as any).Orgcode || "HM01-MONG",
        unit: editingItem.unit || "Cái",
        requestedQty: editingItem.requestedQty || 1,
        note: (editingItem as any).note || (editingItem as any).remarks || "",
        startProcessNow: (editingItem as any).status === "APPROVED",
      });
    }
  }, [open, editingItem, form]);

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      if (!editingItem) return;

      setSubmitting(true);
      const qnty = Number(vals.requestedQty || 0);

      const subId =
        (editingItem as any)?.SubmissionId ??
        (editingItem as any)?.submissionId ??
        (editingItem as any)?.LocalId ??
        (!isNaN(Number(editingItem.id)) ? Number(editingItem.id) : null);

      const selectedBudget = internalBudgetList.find(
        (b) => String(b.OrgCode || b.orgCode || b.ItemId) === String(vals.orgCode)
      );
      const chosenOrgCode = String(
        vals.orgCode ||
          (editingItem as any)?.OrgCode ||
          (editingItem as any)?.Orgcode ||
          editingItem.orgCode ||
          ""
      );
      const chosenOrgName =
        selectedBudget?.Description ||
        selectedBudget?.description ||
        selectedBudget?.OrgName ||
        selectedBudget?.orgName ||
        (editingItem as any)?.OrgName ||
        "";

      let apiResponse: any = null;
      if (subId) {
        apiResponse = await warehouseApi.updateInventorySubmission({
          SubmissionId: Number(subId),
          Qnty: qnty,
          Remarks: vals.note || "",
          Orgcode: chosenOrgCode,
          OrgName: chosenOrgName,
          StartProcessNow: vals.startProcessNow ? "Yes" : "No",
        });
      }

      const updated: MaterialRequisitionItem = {
        ...editingItem,
        requestedQty: qnty,
        orgCode: chosenOrgCode,
        Orgcode: chosenOrgCode,
        OrgCode: chosenOrgCode,
        OrgName: chosenOrgName,
        orgName: chosenOrgName,
        status: vals.startProcessNow ? "APPROVED" : editingItem.status || "PENDING",
        ...(vals.note ? { note: vals.note } : {}),
        ...(apiResponse?.Data?.Amount !== undefined
          ? { amount: Number(apiResponse.Data.Amount), Amount: Number(apiResponse.Data.Amount) }
          : {}),
      };

      onSave(updated);
      message.success(apiResponse?.Message || (language === "en" ? "Item updated successfully!" : "Cập nhật mặt hàng thành công!"));
      onClose();
    } catch (e: any) {
      console.error("Lỗi cập nhật dòng vật tư yêu cầu:", e);
      message.error(e?.message || (language === "en" ? "Failed to update item!" : "Cập nhật mặt hàng không thành công!"));
    } finally {
      setSubmitting(false);
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
            {language === "en" ? "Edit Material Requisition Item" : "Chỉnh sửa Mặt hàng trong Phiếu yêu cầu xuất"}
          </span>
        </div>
      }
      placement="right"
      width={460}
      open={open}
      onClose={onClose}
      destroyOnClose
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
            onClick={handleSave}
            loading={submitting}
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
            <div
              style={{
                fontSize: 12,
                color: "#718894",
                fontWeight: 500,
                marginBottom: 3,
                lineHeight: "16px",
              }}
            >
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
              {editingItem?.itemCode
                ? `${editingItem.itemCode} - ${editingItem.itemName}`
                : editingItem?.itemName || "---"}
            </div>
          </div>

          {/* Dòng 2: Đơn vị tính */}
          <div
            style={{
              paddingTop: 10,
              borderTop: "1px solid #dce5e6",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#718894",
                fontWeight: 500,
                marginBottom: 3,
                lineHeight: "16px",
              }}
            >
              {t.itemDrawer.unit}
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: "#123443",
                lineHeight: "20px",
              }}
            >
              {editingItem?.unit || "---"}
            </div>
          </div>
        </div>

        {/* Orgcode / WBS */}
        <Form.Item
          name="orgCode"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
              Orgcode / WBS <span style={{ color: "#ff4d4f" }}>*</span>
            </span>
          }
          rules={[
            {
              required: true,
              message:
                language === "en"
                  ? "Please select Orgcode / WBS!"
                  : "Vui lòng chọn Orgcode / WBS!",
            },
          ]}
          style={{ marginBottom: 16 }}
        >
          <Select
            style={{ width: "100%", height: 38 }}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            loading={loadingInternalBudgets || loadingOrgCodes}
            placeholder={language === "en" ? "Select Orgcode / WBS..." : "Chọn Orgcode / WBS..."}
            options={effectiveOptions}
          />
        </Form.Item>

        {/* Số lượng */}
        <Form.Item
          name="requestedQty"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
              {t.itemDrawer.quantity} <span style={{ color: "#ff4d4f" }}>*</span>
            </span>
          }
          style={{ marginBottom: 16 }}
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

        {/* Diễn giải / Ghi chú */}
        <Form.Item
          name="note"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
              {t.itemDrawer.remarks}
            </span>
          }
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
        <Form.Item
          name="startProcessNow"
          valuePropName="checked"
          style={{ marginBottom: 16 }}
        >
          <Checkbox style={{ fontWeight: 500, color: "#334155" }}>
            {language === "en" ? "Submit for approval?" : "Trình duyệt?"}
          </Checkbox>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
