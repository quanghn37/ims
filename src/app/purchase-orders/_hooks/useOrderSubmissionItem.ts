import { useState, useCallback } from "react";
import { Form, message } from "antd";
import dayjs from "dayjs";
import { extractApiList } from "@/lib/api-client";
import { purchaseOrdersApi } from "../api";
import { ContractItem } from "@/types";
import { parseDateSafe, debounce } from "../_components/types";

interface UseOrderSubmissionItemParams {
  editingOrder: ContractItem | null;
  selectedOrder: ContractItem | null;
  orderForm: any;
  contractRefList: any[];
  fetchOrderDrawerItems: (contractId: any) => Promise<void>;
}

export function useOrderSubmissionItem({
  editingOrder,
  selectedOrder,
  orderForm,
  contractRefList,
  fetchOrderDrawerItems,
}: UseOrderSubmissionItemParams) {
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingSubmissionItem, setEditingSubmissionItem] = useState<any | null>(null);
  const [itemForm] = Form.useForm();
  const [submittingItem, setSubmittingItem] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loadingAvailableItems, setLoadingAvailableItems] = useState(false);

  // Approved Budget list (for Orgcode)
  const [budgetList, setBudgetList] = useState<any[]>([]);
  const [loadingBudgetList, setLoadingBudgetList] = useState(false);

  // Watch form fields for calculations
  const watchedQnty = Form.useWatch("Qnty", itemForm) || 0;
  const watchedUnitPrice = Form.useWatch("UnitPrice", itemForm) || 0;
  const watchedTaxRate = Form.useWatch("TaxRate", itemForm) ?? 0.08;
  const rawItemTotal = (Number(watchedQnty) || 0) * (Number(watchedUnitPrice) || 0);
  const taxItemTotal = rawItemTotal * (Number(watchedTaxRate) || 0);
  const grandItemTotal = rawItemTotal + taxItemTotal;

  const fetchAvailableItems = useCallback(async (keyword = "") => {
    setLoadingAvailableItems(true);
    try {
      const data = await purchaseOrdersApi.getItems({
        ContractType: "purchase_order",
        Stage: "plan",
        Keyword: keyword,
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList(data);
      const mapped = list.map((it: any) => ({
        ...it,
        MaterialId: it.MaterialId ?? it.ItemId ?? it.Id,
        ItemId: it.MaterialId ?? it.ItemId ?? it.Id,
        ItemName:
          it.ItemName ||
          it.Description ||
          it.Remarks ||
          (it.MaterialId ? `Vật tư #${it.MaterialId}` : ""),
      }));
      setAvailableItems(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAvailableItems(false);
    }
  }, []);

  const fetchApprovedBudgetList = useCallback(
    async (contractId?: number | string) => {
      const currentOrder = selectedOrder || editingOrder;

      const candidates = [
        contractId,
        currentOrder?.SubconOf,
        (currentOrder as any)?.subconof,
        (currentOrder as any)?.SubConOf,
        (currentOrder as any)?.MaincontractId,
        (currentOrder as any)?.MainContractId,
        orderForm?.getFieldValue("SubconOf"),
        orderForm?.getFieldValue("ParentId"),
        (currentOrder as any)?.ParentId,
        (currentOrder as any)?.ParentContractId,
        (currentOrder as any)?.MatequipId,
        currentOrder?.ContractId,
      ];

      let numContractId: number | undefined;
      for (const c of candidates) {
        if (c !== undefined && c !== null && c !== "") {
          const n = Number(c);
          if (!isNaN(n) && n > 0) {
            numContractId = n;
            break;
          }
        }
      }

      if (!numContractId) {
        const codeCandidate = String(
          contractId ||
            orderForm?.getFieldValue("ParentId") ||
            currentOrder?.ParentId ||
            ""
        ).trim();
        if (codeCandidate && contractRefList?.length > 0) {
          const matched = contractRefList.find(
            (c: any) =>
              String(c.ContractCode || "").trim().toLowerCase() ===
                codeCandidate.toLowerCase() ||
              String(c.ContractId || "") === codeCandidate
          );
          if (matched) {
            numContractId = Number(matched.ContractId || matched.SubconOf);
          }
        }
      }

      if (!numContractId && currentOrder?.ContractId) {
        numContractId = Number(currentOrder.ContractId);
      }

      if (!numContractId || isNaN(numContractId) || numContractId <= 0) {
        console.warn(
          "fetchApprovedBudgetList: Không tìm thấy ContractId hợp lệ để tải ngân sách."
        );
        setBudgetList([]);
        return [];
      }

      setLoadingBudgetList(true);
      try {
        const data = await purchaseOrdersApi.getApprovedBudgetList({
          ContractId: numContractId,
          WSId: "",
          PageNum: 1,
          PageSize: 1000,
        });
        const list = extractApiList(data);
        setBudgetList(list);
        return list;
      } catch (err) {
        console.error("Lỗi tải danh mục ngân sách approved budget:", err);
        setBudgetList([]);
        return [];
      } finally {
        setLoadingBudgetList(false);
      }
    },
    [selectedOrder, editingOrder, orderForm, contractRefList]
  );

  const handleSearchItem = useCallback(
    debounce((keyword: string) => fetchAvailableItems(keyword.trim()), 300),
    [fetchAvailableItems]
  );

  const handleOpenAddItem = useCallback(() => {
    setEditingSubmissionItem(null);
    itemForm.resetFields();
    itemForm.setFieldsValue({
      Orgcode: "",
      WBS: "",
      ItemId: undefined,
      ItemDisplayName: "",
      ItemDate: dayjs(),
      Qnty: 1,
      TaxRate: 0.08,
      UnitPrice: 0,
      Unit: "Cái",
      Remarks: "",
      StartProcessNow: true,
    });
    const currentOrder = selectedOrder || editingOrder;
    const targetSubconOf =
      currentOrder?.SubconOf ??
      (currentOrder as any)?.subconof ??
      (currentOrder as any)?.SubConOf ??
      (currentOrder as any)?.MaincontractId ??
      (currentOrder as any)?.MainContractId ??
      orderForm.getFieldValue("SubconOf") ??
      orderForm.getFieldValue("ParentId");
    fetchApprovedBudgetList(targetSubconOf);
    setIsItemModalOpen(true);
    if (availableItems.length === 0) fetchAvailableItems();
  }, [
    selectedOrder,
    editingOrder,
    orderForm,
    itemForm,
    availableItems.length,
    fetchApprovedBudgetList,
    fetchAvailableItems,
  ]);

  const handleOpenEditItem = useCallback(
    (record: any) => {
      setEditingSubmissionItem(record);
      itemForm.resetFields();
      if (record.ItemId) {
        setAvailableItems((prev) => {
          if (prev.some((it) => it.ItemId === record.ItemId)) return prev;
          return [
            ...prev,
            {
              ItemId: record.ItemId,
              ItemName:
                record.Description ||
                record.Remarks ||
                `Vật tư #${record.ItemId}`,
              Unit: record.Unit || "Cái",
            },
          ];
        });
      }

      const sCode = record.SystemCode || record.ItemCode || "";
      const desc = record.Description || record.ItemName || "";
      const displayItemName =
        sCode && desc
          ? `${sCode} - ${desc}`
          : sCode || desc || (record.ItemId ? `Vật tư #${record.ItemId}` : "");
      const rawOrgVal =
        record.Orgcode ||
        record.OrgCode ||
        record.WBS ||
        record.Wbs ||
        record.WbsCode ||
        "";
      const orgCodeVal = rawOrgVal.includes(" - ")
        ? rawOrgVal.split(" - ")[0].trim()
        : rawOrgVal.trim();

      const effectiveMaterialId = record.MaterialId
        ? Number(record.MaterialId)
        : record.ItemId
        ? Number(record.ItemId)
        : undefined;
      const orgNameVal = record.OrgName || record.Orgname || "";
      itemForm.setFieldsValue({
        Orgcode: orgCodeVal,
        OrgName: orgNameVal,
        WBS: orgCodeVal,
        ItemId:
          effectiveMaterialId ||
          (record.ItemId ? Number(record.ItemId) : undefined),
        MaterialId: effectiveMaterialId,
        ItemDisplayName: displayItemName,
        ItemDate: parseDateSafe(record.ItemDate) || dayjs(),
        Unit: record.Unit || "Cái",
        Qnty: Number(record.Qnty || 1),
        UnitPrice: Number(record.UnitPrice || 0),
        TaxRate: Number(record.TaxRate ?? 0.08),
        Remarks: record.Remarks || record.Description || "",
        StartProcessNow:
          record.StartProcessNow === "Yes" ||
          record.StartProcessNow === true ||
          true,
      });
      const currentOrder = selectedOrder || editingOrder;
      const targetSubconOf =
        currentOrder?.SubconOf ??
        (currentOrder as any)?.subconof ??
        (currentOrder as any)?.SubConOf ??
        (currentOrder as any)?.MaincontractId ??
        (currentOrder as any)?.MainContractId ??
        orderForm.getFieldValue("SubconOf") ??
        orderForm.getFieldValue("ParentId") ??
        record.SubconOf ??
        record.MaincontractId ??
        record.ParentId;
      fetchApprovedBudgetList(targetSubconOf);
      setIsItemModalOpen(true);
    },
    [selectedOrder, editingOrder, orderForm, itemForm, fetchApprovedBudgetList]
  );

  const handleCreateSubmission = useCallback(
    async (values: any) => {
      const currentOrder = selectedOrder || editingOrder;
      if (!currentOrder) return;
      setSubmittingItem(true);
      try {
        const rawMatId = values.MaterialId ?? editingSubmissionItem?.MaterialId;
        const targetMaterialId = rawMatId
          ? Number(rawMatId)
          : Number(values.ItemId ?? editingSubmissionItem?.ItemId ?? 0);
        const targetItemId = values.ItemId
          ? Number(values.ItemId)
          : targetMaterialId;
        const targetUnitPrice =
          values.UnitPrice !== undefined
            ? Number(values.UnitPrice)
            : Number(editingSubmissionItem?.UnitPrice || 0);

        const rawOrg =
          values.Orgcode !== undefined
            ? values.Orgcode
            : values.WBS !== undefined
            ? values.WBS
            : editingSubmissionItem?.Orgcode || editingSubmissionItem?.WBS || "";
        const cleanOrgCode = (rawOrg || "").includes(" - ")
          ? rawOrg.split(" - ")[0].trim()
          : (rawOrg || "").trim();

        let targetOrgName =
          values.OrgName ||
          editingSubmissionItem?.OrgName ||
          editingSubmissionItem?.Orgname ||
          "";
        if (cleanOrgCode) {
          if (!targetOrgName && budgetList.length > 0) {
            const matched = budgetList.find(
              (b: any) =>
                (b.OrgCode || b.Orgcode || b.WBS || "").trim() === cleanOrgCode
            );
            if (matched) {
              targetOrgName = (matched.Description || matched.ItemName || "").trim();
            }
          }
        }

        const numContractId = Number(currentOrder.ContractId);
        const payload: any = {
          ContractType: "purchase_order",
          ContractId: !isNaN(numContractId)
            ? numContractId
            : currentOrder.ContractId,
          ItemDate: values.ItemDate
            ? values.ItemDate.format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
          UnitPrice: targetUnitPrice,
          Qnty: Number(values.Qnty || 1),
          TaxRate: Number(values.TaxRate ?? 0.08),
          Remarks: values.Remarks || "",
          StartProcessNow: values.StartProcessNow ? "Yes" : "No",
          ApplyDefinedAssignment: "Yes",
          Stage: "plan",
        };

        const chosenMaterialId =
          !isNaN(targetMaterialId) && targetMaterialId > 0
            ? targetMaterialId
            : !isNaN(targetItemId) && targetItemId > 0
            ? targetItemId
            : undefined;
        if (chosenMaterialId) {
          payload.MaterialId = chosenMaterialId;
        }

        if (cleanOrgCode) {
          payload.Orgcode = cleanOrgCode;
          if (targetOrgName) {
            payload.Orgname = targetOrgName;
          }
        }

        if (editingSubmissionItem) {
          const rawSubId =
            editingSubmissionItem.SubmissionId ??
            editingSubmissionItem.SubmissionID ??
            editingSubmissionItem.LocalId;
          const numSubId = Number(rawSubId);
          if (!isNaN(numSubId) && numSubId > 0) {
            payload.SubmissionId = numSubId;
          }
          payload.UpdateMode = "Update_PurchaseorderSubmission";
        } else {
          const rawParentId = (currentOrder as any)?.ParentId;
          const numParentId = Number(rawParentId);
          payload.ParentId =
            !isNaN(numParentId) && numParentId > 0 ? numParentId : "";
          payload.UpdateMode = "Create_PurchaseorderSubmission";
        }

        try {
          await purchaseOrdersApi.upsertSubmission(
            payload,
            editingSubmissionItem
              ? "Update_PurchaseorderSubmission"
              : "Create_PurchaseorderSubmission"
          );
        } catch (err: any) {
          if (
            err?.message &&
            err.message.includes("Task_TypicalAssignment") &&
            payload.StartProcessNow === "Yes" &&
            payload.Orgcode
          ) {
            const retryPayload = { ...payload };
            delete retryPayload.Orgcode;
            delete retryPayload.Orgname;
            await purchaseOrdersApi.upsertSubmission(
              retryPayload,
              editingSubmissionItem
                ? "Update_PurchaseorderSubmission"
                : "Create_PurchaseorderSubmission"
            );
          } else {
            throw err;
          }
        }

        message.success(
          editingSubmissionItem
            ? "Cập nhật mặt hàng thành công!"
            : "Thêm mặt hàng vào đơn hàng thành công!"
        );
        setIsItemModalOpen(false);
        itemForm.resetFields();
        if (currentOrder?.ContractId)
          fetchOrderDrawerItems(currentOrder.ContractId);
      } catch (e: any) {
        message.error(e.message || "Không thể lưu mặt hàng.");
      } finally {
        setSubmittingItem(false);
      }
    },
    [
      selectedOrder,
      editingOrder,
      editingSubmissionItem,
      budgetList,
      itemForm,
      fetchOrderDrawerItems,
    ]
  );

  return {
    isItemModalOpen,
    setIsItemModalOpen,
    editingSubmissionItem,
    itemForm,
    submittingItem,
    availableItems,
    loadingAvailableItems,
    fetchAvailableItems,
    budgetList,
    loadingBudgetList,
    fetchApprovedBudgetList,
    watchedTaxRate,
    rawItemTotal,
    taxItemTotal,
    grandItemTotal,
    handleSearchItem,
    handleOpenAddItem,
    handleOpenEditItem,
    handleCreateSubmission,
  };
}
