"use client";

import { useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { extractApiList } from "@/lib/api-client";
import { purchaseOrdersApi } from "../api";

export function usePriceCompare({
  editingOrder,
  selectedOrder,
  orderForm,
  orderDrawerItems,
  fetchApprovedBudgetList,
  fetchOrderDrawerItems,
}: {
  editingOrder: any;
  selectedOrder: any;
  orderForm: any;
  orderDrawerItems: any[];
  fetchApprovedBudgetList: (contractId?: number | string) => Promise<any[]>;
  fetchOrderDrawerItems: (contractId: any) => Promise<void>;
}) {
  const [isPriceCompareOpen, setIsPriceCompareOpen] = useState(false);
  const [loadingPriceCompare, setLoadingPriceCompare] = useState(false);
  const [priceCompareItems, setPriceCompareItems] = useState<any[]>([]);
  const [selectedPriceCompareKeys, setSelectedPriceCompareKeys] = useState<React.Key[]>([]);
  const [submittingPriceCompare, setSubmittingPriceCompare] = useState(false);
  const [priceCompareStartProcess, setPriceCompareStartProcess] = useState<boolean>(true);

  const openPriceCompare = async () => {
    const targetOrder = editingOrder || selectedOrder;
    const targetContractId = targetOrder?.ContractId ?? orderForm?.getFieldValue("ContractId");
    if (!targetContractId) {
      message.warning("Vui lòng lưu đơn hàng trước khi đối chiếu từ HĐ!");
      return;
    }
    const candidates = [
      targetOrder?.SubconOf,
      (targetOrder as any)?.subconof,
      (targetOrder as any)?.SubConOf,
      (targetOrder as any)?.MaincontractId,
      (targetOrder as any)?.MainContractId,
      orderForm?.getFieldValue("SubconOf"),
      orderForm?.getFieldValue("ParentId"),
      (targetOrder as any)?.ParentId,
      (targetOrder as any)?.ParentContractId,
      (targetOrder as any)?.MatequipId,
      targetContractId,
    ];
    let targetSubconOf: any;
    for (const c of candidates) {
      if (c !== undefined && c !== null && c !== "") {
        const n = Number(c);
        if (!isNaN(n) && n > 0) {
          targetSubconOf = n;
          break;
        }
      }
    }
    if (!targetSubconOf) {
      targetSubconOf =
        targetOrder?.SubconOf ||
        orderForm?.getFieldValue("SubconOf") ||
        orderForm?.getFieldValue("ParentId") ||
        targetContractId;
    }
    fetchApprovedBudgetList(targetSubconOf);

    setIsPriceCompareOpen(true);
    setSelectedPriceCompareKeys([]);
    setPriceCompareStartProcess(true);
    setLoadingPriceCompare(true);
    try {
      const data = await purchaseOrdersApi.getItems({
        ContractType: "purchase_order",
        ContractId: Number(targetContractId),
        Keyword: "",
        PageNum: 1,
        PageSize: 50,
      });
      const list = extractApiList<any>(data);
      const mapped = list.map((it, idx) => {
        const id = it.MaterialId ?? it.ItemId ?? it.ItemCode ?? `mat_${idx}`;
        return {
          ...it,
          MaterialId: id,
          ItemId: id,
          ItemCode: it.ItemCode || "",
          ItemName: it.ItemName || it.Description || "",
          UomCode: it.UomCode || it.Unit || "",
          Qnty: Number(it.Qnty ?? 0),
          UnitPrice: Number(it.UnitPrice ?? 0),
          OrderQnty: 0,
          Orgcode: it.Orgcode || it.OrgCode || it.WBS || "",
          OrgName: it.OrgName || it.Orgname || "",
        };
      });
      setPriceCompareItems(mapped);
    } catch (e: any) {
      message.error("Không thể tải danh sách vật tư đối chiếu từ HĐ.");
    } finally {
      setLoadingPriceCompare(false);
    }
  };

  const handleChangePriceCompareQnty = (itemId: any, qnty: number) => {
    setPriceCompareItems((prev) =>
      prev.map((it) => {
        const id = it.MaterialId ?? it.ItemId ?? it.ItemCode;
        return String(id) === String(itemId) ? { ...it, OrderQnty: qnty } : it;
      })
    );
  };

  const handleChangePriceCompareOrgcode = (itemId: any, orgCode: string, orgName: string) => {
    setPriceCompareItems((prev) =>
      prev.map((it) => {
        const id = it.MaterialId ?? it.ItemId ?? it.ItemCode;
        return String(id) === String(itemId) ? { ...it, Orgcode: orgCode, OrgName: orgName } : it;
      })
    );
  };

  const handleAddSelectedToOrder = async () => {
    const targetOrder = editingOrder || selectedOrder;
    if (!targetOrder) return;
    const selectedRows = priceCompareItems.filter((it) => {
      const id = String(it.MaterialId ?? it.ItemId ?? it.ItemCode);
      return selectedPriceCompareKeys.some((k) => String(k) === id);
    });
    if (selectedRows.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 vật tư!");
      return;
    }
    const invalidRow = selectedRows.find((it) => !it.OrderQnty || Number(it.OrderQnty) <= 0);
    if (invalidRow) {
      message.warning(`Vui lòng nhập số lượng đặt hàng hợp lệ cho "${invalidRow.ItemName || invalidRow.Description}"!`);
      return;
    }

    const existingItemIds = new Set(
      orderDrawerItems
        .map((it) => String(it.ItemId ?? it.MaterialId ?? it.ItemCode ?? ""))
        .filter(Boolean)
    );
    const duplicates = selectedRows.filter((row) => {
      const rId = String(row.MaterialId ?? row.ItemId ?? row.ItemCode ?? "");
      return rId && existingItemIds.has(rId);
    });

    if (duplicates.length > 0) {
      const dupNames = duplicates
        .map((d) => d.ItemName || d.Description || `#${d.MaterialId}`)
        .join(", ");
      message.warning(`Vật tư "${dupNames}" đã tồn tại trong đơn hàng! Vui lòng không chọn trùng.`);
      return;
    }

    setSubmittingPriceCompare(true);
    try {
      for (const row of selectedRows) {
        const targetMaterialId = Number(row.MaterialId ?? row.ItemId ?? 0);
        const payload: any = {
          ContractType: "purchase_order",
          UpdateMode: "Create_PurchaseorderSubmission",
          ContractId: String(targetOrder.ContractId),
          ItemDate: dayjs().format("YYYY-MM-DD"),
          MaterialId: targetMaterialId,
          ParentId: "",
          Qnty: Number(row.OrderQnty || 0),
          UnitPrice: Number(row.UnitPrice || 0),
          TaxRate: 0.08,
          Remarks: row.Remarks || "",
          Stage: "plan",
          StartProcessNow: priceCompareStartProcess ? "Yes" : "No",
          ApplyDefinedAssignment: "Yes",
        };
        if (row.Orgcode) {
          payload.Orgcode = row.Orgcode;
          payload.Orgname = row.Orgname || row.OrgName || "";
        }
        await purchaseOrdersApi.upsertSubmission(payload, "Create_PurchaseorderSubmission");
      }
      message.success(`Đã thêm ${selectedRows.length} vật tư vào đơn hàng PO!`);
      setIsPriceCompareOpen(false);
      setPriceCompareItems([]);
      setSelectedPriceCompareKeys([]);

      const targetContractId = editingOrder?.ContractId || selectedOrder?.ContractId;
      if (targetContractId) {
        fetchOrderDrawerItems(targetContractId);
      }
    } catch (e: any) {
      message.error(e.message || "Thêm vật tư vào đơn hàng thất bại.");
    } finally {
      setSubmittingPriceCompare(false);
    }
  };

  return {
    isPriceCompareOpen,
    setIsPriceCompareOpen,
    loadingPriceCompare,
    priceCompareItems,
    selectedPriceCompareKeys,
    setSelectedPriceCompareKeys,
    submittingPriceCompare,
    priceCompareStartProcess,
    setPriceCompareStartProcess,
    openPriceCompare,
    handleChangePriceCompareQnty,
    handleChangePriceCompareOrgcode,
    handleAddSelectedToOrder,
  };
}
