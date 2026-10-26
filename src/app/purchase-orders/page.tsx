"use client";

import React, { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Form, message, Spin } from "antd";
import { useSearchParams } from "next/navigation";
import { extractApiList } from "@/lib/api-client";
import { purchaseOrdersApi } from "./api";
import { ContractItem } from "@/types";
import dayjs from "dayjs";

import { useAuth } from "@/lib/auth-context";
import { AttachmentFile, parseDateSafe } from "./_components/types";
import PurchaseOrdersTable from "./_components/PurchaseOrdersTable";
import OrderLovModals from "./_components/OrderLovModals";
import { usePurchaseOrders } from "./_hooks/usePurchaseOrders";
import { useOrderLovModals } from "./_hooks/useOrderLovModals";
import { usePriceCompare } from "./_hooks/usePriceCompare";
import { useOrderWorkflow } from "./_hooks/useOrderWorkflow";
import { useOrderSubmissionItem } from "./_hooks/useOrderSubmissionItem";
import { useTranslation } from "@/locales/LanguageContext";
import { ErpPageContainer, ErpDetailContainer } from "@/components/layout/ErpPageContainer";

// Dynamic imports for heavy drawers/modals to optimize initial JS bundle
const OrderFormDrawer = dynamic(() => import("./_components/OrderFormDrawer"), {
  loading: () => (
    <div style={{ padding: 40, textAlign: "center" }}>
      <Spin />
      <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>Đang tải biểu mẫu đơn hàng...</div>
    </div>
  ),
  ssr: false,
});
const ItemFormDrawer = dynamic(() => import("./_components/ItemFormDrawer"), { ssr: false });
const PriceCompareDrawer = dynamic(() => import("./_components/PriceCompareDrawer"), { ssr: false });
const ImportExcelModal = dynamic(() => import("./_components/ImportExcelModal"), { ssr: false });
const WorkflowDrawer = dynamic(() => import("./_components/WorkflowDrawer"), { ssr: false });

function PurchaseOrdersPageContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const queryOrderId = searchParams.get("id") || searchParams.get("contractId");
  const queryAction = searchParams.get("action");
  const isDetailPage = Boolean(queryOrderId || queryAction);

  const currentUserId = user?.LogIn || "";
  const STORAGE_KEY_MAIN = `table_cols_purchase_orders_main_${currentUserId}`;

  // ===============================================================
  // STATE CHO MÀN HÌNH DANH SÁCH (KHI Ở TAB DANH SÁCH /purchase-orders)
  // ===============================================================
  const {
    loading,
    searchKeyword,
    setSearchKeyword,
    columnFilters,
    setColumnFilters,
    columnSuggestions,
    isFiltering,
    pagination,
    setPagination,
    fetchOrders,
    filteredOrders,
  } = usePurchaseOrders();

  // Tự động đồng bộ danh sách khi có cập nhật từ tab chi tiết khác
  useEffect(() => {
    if (isDetailPage) return;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "consims_po_updated") {
        fetchOrders(pagination.current, pagination.pageSize);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isDetailPage, pagination.current, pagination.pageSize, fetchOrders]);

  // ===============================================================
  // STATE CHO MÀN HÌNH CHI TIẾT ĐƠN HÀNG
  // ===============================================================
  const [orderForm] = Form.useForm();
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [loadingSingleOrder, setLoadingSingleOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ContractItem | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachmentKeys, setSelectedAttachmentKeys] = useState<React.Key[]>([]);

  // LOV Modals Hook
  const lov = useOrderLovModals(orderForm);
  const {
    setIsClientLovOpen,
    setClientSearchInput,
    selectedClientDisplay,
    setSelectedClientDisplay,
    setClientList,
    fetchClientList,
    handleClearClient,

    setIsContractLovOpen,
    setContractSearchInput,
    selectedContractDisplay,
    setSelectedContractDisplay,
    contractRefList,
    setContractRefList,
    fetchContractRefList,
    handleClearContract,

    setIsPriceListLovOpen,
    setPriceListSearchInput,
    selectedPriceListDisplay,
    setSelectedPriceListDisplay,
    setPriceListRefList,
    fetchPriceListRefList,
    handleClearPriceList,

    setIsWarehouseLovOpen,
    setWarehouseSearchInput,
    selectedWarehouseDisplay,
    setSelectedWarehouseDisplay,
    fetchWarehouseList,
    handleClearWarehouse,
  } = lov;

  // Detail Items directly in OrderFormDrawer (Master-Detail)
  const [orderDrawerItems, setOrderDrawerItems] = useState<any[]>([]);
  const [loadingDrawerItems, setLoadingDrawerItems] = useState(false);
  const [deletedDrawerItemIds, setDeletedDrawerItemIds] = useState<any[]>([]);

  // Selected Order for actions/modals
  const [selectedOrder, setSelectedOrder] = useState<ContractItem | null>(null);

  // Import Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const fetchOrderDrawerItems = useCallback(async (contractId: any) => {
    if (!contractId) return;
    setLoadingDrawerItems(true);
    try {
      const data = await purchaseOrdersApi.getSubmissions({
        ContractType: "purchase_order",
        ContractId: Number(contractId),
        Stage: "plan",
        FromDate: "2020-01-01",
        ToDate: "2030-12-31",
        LocalId: "",
        Keyword: "",
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList(data);
      const mapped = list.map((it: any) => {
        const subId =
          it.SubmissionId ??
          it.SubmissionID ??
          it.Submissionid ??
          it.Id ??
          it.LocalId;
        const matId = it.MaterialId ? Number(it.MaterialId) : undefined;
        const itemId = it.ItemId ? Number(it.ItemId) : matId;
        return {
          ...it,
          id: String(subId || `item_${Date.now()}_${Math.random()}`),
          SubmissionId: subId,
          LocalId: it.LocalId || subId,
          MaterialId: matId || itemId,
          ItemId: itemId,
          StatusCode: it.StatusCode !== undefined && it.StatusCode !== null ? String(it.StatusCode).trim() : it.StatusCode,
          Qnty: Number(it.Qnty ?? it.Quantity ?? 0),
          UnitPrice: Number(it.UnitPrice ?? it.Price ?? 0),
          Amount: Number(it.Amount ?? (Number(it.Qnty ?? 0) * Number(it.UnitPrice ?? 0))),
          TaxRate: Number(it.TaxRate ?? 0),
          TaxAmount: Number(it.TaxAmount ?? 0),
          TotalAmount: Number(it.TotalAmount ?? (Number(it.Amount ?? 0) + Number(it.TaxAmount ?? 0))),
        };
      });
      setOrderDrawerItems(mapped);
    } catch (e: any) {
      console.error("Error fetching order items:", e);
    } finally {
      setLoadingDrawerItems(false);
    }
  }, []);

  // Hook for editing items modal
  const {
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
    handleOpenEditItem,
    handleCreateSubmission,
  } = useOrderSubmissionItem({
    editingOrder,
    selectedOrder,
    orderForm,
    contractRefList,
    fetchOrderDrawerItems,
  });

  // Hook for price comparison
  const {
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
  } = usePriceCompare({
    editingOrder,
    selectedOrder,
    orderForm,
    orderDrawerItems,
    fetchApprovedBudgetList,
    fetchOrderDrawerItems,
  });

  // Hook for order workflow
  const {
    isWorkflowDrawerOpen,
    setIsWorkflowDrawerOpen,
    workflowData,
    loadingWorkflow,
    currentSubmissionId,
    selectedWorkflowRow,
    isRowDetailOpen,
    setIsRowDetailOpen,
    processingStatusList,
    loadingProcessingStatus,
    rowDetailDecision,
    setRowDetailDecision,
    rowDetailQnty,
    setRowDetailQnty,
    rowDetailUnitPrice,
    setRowDetailUnitPrice,
    rowDetailRemarks,
    setRowDetailRemarks,
    savingRowDetail,
    itemDetail,
    fetchWorkflowStatus,
    openRowDetail,
    handleSaveRowDetail,
  } = useOrderWorkflow({
    editingOrder,
    selectedOrder: editingOrder || selectedOrder,
    fetchOrderDrawerItems,
  });

  // Điền dữ liệu một bản ghi đơn hàng vào Form
  const applyOrderToForm = useCallback((record: ContractItem) => {
    setEditingOrder(record);
    setSelectedOrder(record);
    orderForm.resetFields();

    const currentClientId = record.ClientID ?? record.ClientId ?? "";
    const currentParentId = (record as any).ParentId || undefined;
    const currentSourceId = (record as any).SourceId || undefined;
    const currentWarehouseId = (record as any).WarehouseId || undefined;

    const orderDate = parseDateSafe(record.ContractDate || record.Contractdate || record.FromDate || record.StartDate);
    const deliveryDate = parseDateSafe((record as any).DeliveryDate || (record as any).Deliverydate || record.ToDate || record.EndDate);

    const rawSubcon =
      (record as any).SubconOf ||
      (record as any).subconof ||
      (record as any).SubConOf ||
      (record as any).MaincontractId ||
      (record as any).MainContractId;
    const currentSubconOf = rawSubcon || currentParentId;

    orderForm.setFieldsValue({
      Description: record.Description,
      ClientId: currentClientId,
      ContractCode: record.ContractCode || "",
      Currency: record.Currency || "VND",
      Amount: Number((record as any).ContractedAmount ?? record.Amount ?? 0),
      PaymentTerm: record.PaymentTerm || undefined,
      ContractDate: orderDate,
      FromDate: orderDate,
      DeliveryDate: deliveryDate,
      ToDate: deliveryDate,
      ParentId: currentParentId,
      SubconOf: currentSubconOf,
      SourceId: currentSourceId,
      WarehouseId: currentWarehouseId,
    });

    const cName = record.Venname || (record as any).ClientName || (currentClientId ? `NCC #${currentClientId}` : "");
    setSelectedClientDisplay(cName);

    const rawCt =
      (record as any).ParentContractCode ||
      (record as any).ParentCode ||
      (record as any).ContractRefCode ||
      (currentParentId ? `${currentParentId}` : "");
    const ctName = rawCt ? String(rawCt).replace(/^#+/, "").trim() : "";
    setSelectedContractDisplay(ctName);

    const rawPlCode =
      (record as any).SourceContractCode ||
      (record as any).SourceCode ||
      (record as any).QuotationCode ||
      "";
    const rawPlName =
      (record as any).SourceContractName ||
      (record as any).SourceDescription ||
      "";
    let plName = rawPlCode;
    if (rawPlCode && rawPlName) {
      plName = `${rawPlCode} - ${rawPlName}`;
    } else if (!rawPlCode && currentSourceId) {
      plName = `${currentSourceId}`;
    }
    setSelectedPriceListDisplay(plName ? String(plName).replace(/^#+/, "").trim() : "");

    const whName =
      (record as any).WarehouseName ||
      (currentWarehouseId ? `Kho #${currentWarehouseId}` : "");
    setSelectedWarehouseDisplay(whName);

    setContractRefList([]);
    setPriceListRefList([]);

    if (currentClientId) {
      setClientList((prev) => {
        const exists = prev.some((c) => String(c.ClientId ?? c.CompanyId ?? c.Id) === String(currentClientId));
        if (exists) return prev;
        return [
          ...prev,
          {
            ClientId: currentClientId,
            CompanyName: record.Venname || (record as any).ClientName || `NCC #${currentClientId}`,
          },
        ];
      });
    }

    if (currentParentId) {
      setContractRefList((prev) => {
        if (prev.some((c) => String(c.ContractId) === String(currentParentId))) return prev;
        return [
          ...prev,
          {
            ContractId: currentParentId,
            ContractCode: (record as any).ParentContractCode,
            Description: (record as any).ParentDescription,
          },
        ];
      });
      if (!rawPlCode && currentSourceId) {
        fetchPriceListRefList("", currentClientId, currentParentId).then((list) => {
          if (list && list.length > 0) {
            const matched = list.find((p: any) => String(p.ContractId) === String(currentSourceId));
            if (matched) {
              const mName = matched.ContractName || matched.Description || "";
              const autoPlText = matched.ContractCode
                ? (mName ? `${matched.ContractCode} - ${mName}` : matched.ContractCode)
                : `${matched.ContractId}`;
              setSelectedPriceListDisplay(autoPlText ? String(autoPlText).replace(/^#+/, "").trim() : "");
            }
          }
        });
      }
    }

    if (currentSourceId) {
      setPriceListRefList((prev) => {
        if (prev.some((c) => String(c.ContractId) === String(currentSourceId))) return prev;
        return [
          ...prev,
          {
            ContractId: currentSourceId,
            ContractCode: (record as any).SourceContractCode,
            Description: (record as any).SourceDescription,
          },
        ];
      });
    }

    setAttachments([{ id: "1", fileName: "PO_Attachment_Doc_01.pdf", fileUrl: "#", uploadedBy: currentUserId, uploadingDate: "14/09/2026 21:27", isClientDoc: false, hasSign: true }]);
    setSelectedAttachmentKeys([]);
    setOrderDrawerItems([]);
    setDeletedDrawerItemIds([]);

    fetchOrderDrawerItems(record.ContractId);
  }, [currentUserId, fetchOrderDrawerItems, fetchPriceListRefList, orderForm, setClientList, setContractRefList, setPriceListRefList, setSelectedClientDisplay, setSelectedContractDisplay, setSelectedPriceListDisplay, setSelectedWarehouseDisplay]);

  // Load đơn hàng khi mở tab trình duyệt có id
  useEffect(() => {
    if (!queryOrderId) return;
    const loadSingleOrder = async () => {
      setLoadingSingleOrder(true);
      try {
        const data = await purchaseOrdersApi.getPurchaseOrders({
          DisplayMode: "purchase_order",
          ClientId: "",
          WSId: "",
          PageNum: 1,
          PageSize: 10,
          ContractId: queryOrderId,
        });
        const list = extractApiList<ContractItem>(data);
        const found = list.find((c) => String(c.ContractId) === String(queryOrderId)) || list[0];
        if (found) {
          applyOrderToForm(found);
          if (typeof document !== "undefined") {
            document.title = `${found.ContractCode || found.ContractId} - Chi tiết đơn hàng`;
          }
        } else {
          message.error("Không tìm thấy thông tin đơn hàng.");
        }
      } catch (e) {
        console.error("Lỗi tải đơn hàng:", e);
        message.error("Không thể tải thông tin đơn hàng.");
      } finally {
        setLoadingSingleOrder(false);
      }
    };
    loadSingleOrder();
  }, [queryOrderId, applyOrderToForm]);

  // Mở tab tạo mới
  useEffect(() => {
    if (queryAction === "create") {
      setEditingOrder(null);
      setSelectedOrder(null);
      orderForm.resetFields();
      orderForm.setFieldsValue({
        Currency: "VND",
        Amount: 0,
        ContractDate: dayjs(),
        FromDate: dayjs(),
        DeliveryDate: dayjs().add(7, "day"),
        ToDate: dayjs().add(7, "day"),
        ContractCode: "",
        PaymentTerm: undefined,
      });
      setSelectedClientDisplay("");
      setSelectedContractDisplay("");
      setSelectedPriceListDisplay("");
      setSelectedWarehouseDisplay("");
      setAttachments([]);
      setSelectedAttachmentKeys([]);
      setContractRefList([]);
      setPriceListRefList([]);
      setOrderDrawerItems([]);
      setDeletedDrawerItemIds([]);
      if (typeof document !== "undefined") {
        document.title = "Tạo Đơn Hàng Mới";
      }
    }
  }, [queryAction, orderForm, setContractRefList, setPriceListRefList, setSelectedClientDisplay, setSelectedContractDisplay, setSelectedPriceListDisplay, setSelectedWarehouseDisplay]);

  const handleRefreshDrawerItems = async () => {
    const targetId = editingOrder?.ContractId || selectedOrder?.ContractId;
    if (targetId) {
      await fetchOrderDrawerItems(targetId);
      message.success("Đã làm mới danh mục vật tư đơn hàng!");
    }
  };

  const handleDeleteDrawerItem = async (record: any) => {
    const subId =
      record.SubmissionId ??
      record.SubmissionID ??
      record.Submissionid ??
      record.LocalId ??
      record.Id;

    if (!subId) {
      setOrderDrawerItems((prev) => prev.filter((it) => it.id !== record.id));
      message.success("Đã xóa mặt hàng khỏi danh sách!");
      return;
    }

    try {
      const parentContractId =
        editingOrder?.ContractId ||
        selectedOrder?.ContractId ||
        record.ContractId;

      await purchaseOrdersApi.upsertSubmission(
        {
          ContractId: Number(parentContractId),
          SubmissionId: Number(subId),
          ContractType: "purchase_order",
          UpdateMode: "delete_purchaseordersubmission",
        },
        "delete_purchaseordersubmission"
      );

      message.success("Đã xóa mặt hàng thành công!");
      setDeletedDrawerItemIds((prev) => [...prev, subId]);
      setOrderDrawerItems((prev) =>
        prev.filter((it) => {
          const itSubId = it.SubmissionId ?? it.SubmissionID ?? it.LocalId ?? it.Id;
          return String(itSubId) !== String(subId) && it.id !== record.id;
        })
      );
    } catch (err: any) {
      console.error("Error deleting order item:", err);
      message.error(err.message || "Không thể xóa: Mặt hàng đang trong quy trình duyệt hoặc bạn không có quyền.");
    }
  };

  const handleSubmitOrder = async (values: any) => {
    setSubmittingOrder(true);
    try {
      const orderDateVal = values.ContractDate || values.FromDate;
      const deliveryDateVal = values.DeliveryDate || values.ToDate;
      const orderDateFormatted = orderDateVal ? orderDateVal.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
      const deliveryDateFormatted = deliveryDateVal ? deliveryDateVal.format("YYYY-MM-DD") : "";

      let targetContractId = editingOrder ? Number(editingOrder.ContractId) : undefined;

      if (editingOrder) {
        await purchaseOrdersApi.updateContractInfo({
          ContractId: Number(editingOrder.ContractId),
          ContractType: "purchase_order",
          Description: values.Description,
          Amount: Number(values.Amount || 0),
          ContractedAmount: Number(values.Amount || 0),
          FromDate: orderDateFormatted,
          StartDate: orderDateFormatted,
          ContractDate: orderDateFormatted,
          Contractdate: orderDateFormatted,
          ToDate: deliveryDateFormatted,
          EndDate: deliveryDateFormatted,
          DeliveryDate: deliveryDateFormatted,
          Deliverydate: deliveryDateFormatted,
          PaytermId: values.PaymentTerm || undefined,
          PaymentTerm: values.PaymentTerm || undefined,
          PayTerms: values.PaymentTerm || undefined,
          WarehouseId: values.WarehouseId || undefined,
          WSId: "",
          Attachments: attachments,
        }, "update_purchase_order");
      } else {
        const createRes: any = await purchaseOrdersApi.updateContractInfo({
          ClientId: values.ClientId || "5081",
          ContractType: "purchase_order",
          Description: values.Description,
          Amount: Number(values.Amount || 0),
          ContractedAmount: Number(values.Amount || 0),
          Currency: values.Currency || "VND",
          FromDate: orderDateFormatted,
          StartDate: orderDateFormatted,
          ContractDate: orderDateFormatted,
          Contractdate: orderDateFormatted,
          ToDate: deliveryDateFormatted,
          EndDate: deliveryDateFormatted,
          DeliveryDate: deliveryDateFormatted,
          Deliverydate: deliveryDateFormatted,
          MatequipId: values.ParentId ? String(values.ParentId) : "",
          SourceId: values.SourceId ? String(values.SourceId) : "",
          PaytermId: values.PaymentTerm || undefined,
          PaymentTerm: values.PaymentTerm || undefined,
          PayTerms: values.PaymentTerm || undefined,
          WarehouseId: values.WarehouseId || undefined,
          WSId: "",
          Attachments: attachments,
        }, "create_purchase_order");
        targetContractId = Number(
          createRes?.ContractId ||
            createRes?.Data?.ContractId ||
            createRes?.data?.ContractId ||
            createRes?.Data?.[0]?.ContractId ||
            createRes?.data?.[0]?.ContractId ||
            createRes?.[0]?.ContractId ||
            createRes?.Id
        );
      }

      if (deletedDrawerItemIds.length > 0) {
        for (const delId of deletedDrawerItemIds) {
          try {
            await purchaseOrdersApi.upsertSubmission(
              {
                ContractId: Number(targetContractId),
                SubmissionId: Number(delId),
                ContractType: "purchase_order",
                UpdateMode: "delete_purchaseordersubmission",
              },
              "delete_purchaseordersubmission"
            );
          } catch (delErr) {
            console.error("Error committing delete submission:", delErr);
          }
        }
        setDeletedDrawerItemIds([]);
      }

      if (targetContractId && orderDrawerItems.length > 0) {
        for (const item of orderDrawerItems) {
          const subId = item.SubmissionId ?? item.SubmissionID ?? item.LocalId;
          const isEditItem = subId && !String(subId).startsWith("item_") && !String(subId).startsWith("mat_");
          const matId = item.MaterialId || item.ItemId || item.SourceId;

          const payload: any = {
            ContractId: Number(targetContractId),
            ContractType: "purchase_order",
            Stage: "plan",
            ItemId: matId ? Number(matId) : undefined,
            MaterialId: matId ? Number(matId) : undefined,
            Qnty: Number(item.Qnty || 0),
            UnitPrice: Number(item.UnitPrice || 0),
            Amount: Number(item.Amount || (Number(item.Qnty || 0) * Number(item.UnitPrice || 0))),
            TaxRate: Number(item.TaxRate || 0),
            TaxAmount: Number(item.TaxAmount || 0),
            TotalAmount: Number(item.TotalAmount || 0),
            Brand: item.Brand || "",
            Origin: item.Origin || "",
            Unit: item.Unit || "",
            Remarks: item.Remarks || "",
            SourceId: item.SourceId ? String(item.SourceId) : (values.SourceId ? String(values.SourceId) : ""),
            StartProcessNow: item.StartProcessNow || "No",
            ApplyDefinedAssignment: "Yes",
          };
          if (item.Orgcode) {
            payload.Orgcode = item.Orgcode;
            payload.Orgname = item.Orgname || item.OrgName || "";
          }
          if (isEditItem) {
            const numSubId = Number(subId);
            if (!isNaN(numSubId) && numSubId > 0) {
              payload.SubmissionId = numSubId;
            }
            payload.UpdateMode = "Update_PurchaseorderSubmission";
          } else {
            payload.UpdateMode = "Create_PurchaseorderSubmission";
          }
          try {
            await purchaseOrdersApi.upsertSubmission(
              payload,
              isEditItem ? "Update_PurchaseorderSubmission" : "Create_PurchaseorderSubmission"
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
                isEditItem ? "Update_PurchaseorderSubmission" : "Create_PurchaseorderSubmission"
              );
            } else {
              console.error("Error saving PO item:", err);
            }
          }
        }
      }

      try {
        localStorage.setItem("consims_po_updated", String(Date.now()));
      } catch (e) {}

      let refreshedOrder: any = null;
      try {
        const refreshedData = await purchaseOrdersApi.getPurchaseOrders({
          DisplayMode: "purchase_order",
          ClientId: "",
          WSId: "",
          PageNum: 1,
          PageSize: 10,
        });
        const refreshedList = extractApiList<ContractItem>(refreshedData);
        if (targetContractId) {
          refreshedOrder = refreshedList.find((c: any) => Number(c.ContractId) === targetContractId);
        }
        if (!refreshedOrder && refreshedList.length > 0 && !editingOrder) {
          refreshedOrder = refreshedList[0];
          targetContractId = Number(refreshedOrder.ContractId);
        }
      } catch (err) {
        console.error("Error fetching refreshed order:", err);
      }

      if (refreshedOrder) {
        applyOrderToForm(refreshedOrder);
        message.success(
          editingOrder
            ? "Cập nhật đơn hàng thành công!"
            : "Tạo mới đơn hàng PO thành công! Đã chuyển sang màn hình chi tiết."
        );
        if (!editingOrder && refreshedOrder.ContractId) {
          window.location.href = `/purchase-orders?id=${refreshedOrder.ContractId}`;
        }
      } else if (!editingOrder && targetContractId) {
        const fallbackOrder: any = {
          ContractId: targetContractId,
          ContractCode: `PO-${targetContractId}`,
          ClientId: values.ClientId,
          ClientID: values.ClientId,
          ClientName: selectedClientDisplay,
          Venname: selectedClientDisplay,
          ParentId: values.ParentId,
          SourceId: values.SourceId,
          WarehouseId: values.WarehouseId,
          Description: values.Description,
          Currency: values.Currency || "VND",
          PaymentTerm: values.PaymentTerm,
          ContractDate: orderDateFormatted,
          DeliveryDate: deliveryDateFormatted,
        };
        applyOrderToForm(fallbackOrder);
        message.success("Tạo mới đơn hàng PO thành công! Đã chuyển sang màn hình chi tiết.");
        window.location.href = `/purchase-orders?id=${targetContractId}`;
      } else {
        message.success("Cập nhật đơn hàng thành công!");
      }
    } catch (e: any) {
      message.error(e.message || "Lưu đơn hàng thất bại.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleDeleteContract = async (contractId: any) => {
    try {
      await purchaseOrdersApi.updateContractInfo(
        {
          ContractId: String(contractId),
          ContractType: "purchase_order",
          WSId: "",
        },
        "delete_contract"
      );
      message.success("Đã xóa đơn hàng thành công!");
      try {
        localStorage.setItem("consims_po_updated", String(Date.now()));
      } catch (e) {}
      if (isDetailPage) {
        if (typeof window !== "undefined") {
          if (window.opener) {
            window.close();
          } else {
            window.location.href = "/purchase-orders";
          }
        }
      }
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (e: any) {
      message.error(e.message || "Xóa đơn hàng thất bại.");
    }
  };

  const handleCustomUploadAttachment = (options: any) => {
    const { file, onSuccess } = options;
    setTimeout(() => {
      const newFile: AttachmentFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        fileName: file.name,
        fileUrl: "#",
        uploadedBy: currentUserId,
        uploadingDate: dayjs().format("DD/MM/YYYY HH:mm"),
        isClientDoc: false,
        hasSign: file.name.endsWith(".pdf"),
      };
      setAttachments((prev) => [newFile, ...prev]);
      onSuccess("ok");
      message.success(`Đã tải lên: ${file.name}`);
    }, 400);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    setSelectedAttachmentKeys((prev) => prev.filter((key) => key !== id));
    message.success("Đã xóa tệp đính kèm");
  };

  const handleBatchDeleteAttachments = () => {
    setAttachments((prev) => prev.filter((item) => !selectedAttachmentKeys.includes(item.id)));
    setSelectedAttachmentKeys([]);
    message.success("Đã xóa các tệp đã chọn");
  };

  const handleToggleClientDoc = (id: string, checked: boolean) => {
    setAttachments((prev) => prev.map((item) => (item.id === id ? { ...item, isClientDoc: checked } : item)));
  };

  const handleImportExcel = async () => {
    if (!selectedOrder || importFileList.length === 0) {
      message.warning("Vui lòng chọn file Excel!");
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFileList[0].originFileObj || importFileList[0]);
      formData.append("ContractId", String(selectedOrder.ContractId));
      formData.append("Stage", "plan");
      formData.append("StartProcessNow", "No");
      formData.append("ApplyDefinedAssignment", "Yes");
      await purchaseOrdersApi.importSubmission(formData);
      message.success("Tải lên và xử lý file Excel thành công!");
      setIsImportModalOpen(false);
      setImportFileList([]);
      const cId = selectedOrder?.ContractId || editingOrder?.ContractId;
      if (cId) fetchOrderDrawerItems(cId);
    } catch (e: any) {
      message.error(e.message || "Import Excel thất bại.");
    } finally {
      setImporting(false);
    }
  };

  const handleCloseDetail = () => {
    if (typeof window !== "undefined") {
      if (window.opener) {
        window.close();
      } else {
        window.location.href = "/purchase-orders";
      }
    }
  };

  const existingOrderItemIds = useMemo(() => {
    return new Set(
      orderDrawerItems
        .map((it) => String(it.ItemId ?? it.MaterialId ?? it.ItemCode ?? ""))
        .filter(Boolean)
    );
  }, [orderDrawerItems]);

  // ===============================================================
  // GIAO DIỆN 1: MÀN HÌNH CHI TIẾT ĐƠN HÀNG (/purchase-orders?id=...)
  // ===============================================================
  if (isDetailPage) {
    if (loadingSingleOrder) {
      return (
        <ErpDetailContainer>
          <div style={{ padding: 60, textAlign: "center" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: "#718894", fontSize: 13 }}>
              Đang tải chi tiết đơn hàng #{queryOrderId}...
            </div>
          </div>
        </ErpDetailContainer>
      );
    }

    return (
      <ErpDetailContainer>
        <OrderFormDrawer
          open={true}
          onClose={handleCloseDetail}
          editingOrder={editingOrder}
          form={orderForm}
          submitting={submittingOrder}
          selectedClientDisplay={selectedClientDisplay}
          onOpenClientLov={() => {
            setClientSearchInput("");
            fetchClientList("");
            setIsClientLovOpen(true);
          }}
          onClearClient={handleClearClient}
          selectedContractDisplay={selectedContractDisplay}
          onOpenContractLov={() => {
            setContractSearchInput("");
            fetchContractRefList("", orderForm.getFieldValue("ClientId"));
            setIsContractLovOpen(true);
          }}
          onClearContract={handleClearContract}
          selectedPriceListDisplay={selectedPriceListDisplay}
          onOpenPriceListLov={() => {
            setPriceListSearchInput("");
            const cId = orderForm.getFieldValue("ClientId");
            const pId = orderForm.getFieldValue("ParentId");
            fetchPriceListRefList("", cId, pId);
            setIsPriceListLovOpen(true);
          }}
          onClearPriceList={handleClearPriceList}
          selectedWarehouseDisplay={selectedWarehouseDisplay}
          onOpenWarehouseLov={() => {
            setWarehouseSearchInput("");
            fetchWarehouseList("");
            setIsWarehouseLovOpen(true);
          }}
          onClearWarehouse={handleClearWarehouse}
          items={orderDrawerItems}
          setItems={setOrderDrawerItems}
          availableItems={availableItems}
          loadingItems={loadingDrawerItems}
          onSearchItem={handleSearchItem}
          onDeleteItem={handleDeleteDrawerItem}
          onEditItem={handleOpenEditItem}
          attachments={attachments}
          selectedAttachmentKeys={selectedAttachmentKeys}
          setSelectedAttachmentKeys={setSelectedAttachmentKeys}
          onUploadAttachment={handleCustomUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onBatchDeleteAttachments={handleBatchDeleteAttachments}
          onToggleClientDoc={handleToggleClientDoc}
          onFinish={handleSubmitOrder}
          onOpenPriceCompare={openPriceCompare}
          onFetchWorkflow={fetchWorkflowStatus}
          onRefreshItems={handleRefreshDrawerItems}
          onDeleteOrder={handleDeleteContract}
        />

        {isItemModalOpen && (
          <ItemFormDrawer
            open={isItemModalOpen}
            onClose={() => setIsItemModalOpen(false)}
            editingSubmissionItem={editingSubmissionItem}
            form={itemForm}
            submitting={submittingItem}
            availableItems={availableItems}
            loadingAvailableItems={loadingAvailableItems}
            onSearchItem={handleSearchItem}
            onFetchItems={fetchAvailableItems}
            budgetList={budgetList}
            loadingBudgetList={loadingBudgetList}
            rawItemTotal={rawItemTotal}
            taxItemTotal={taxItemTotal}
            grandItemTotal={grandItemTotal}
            watchedTaxRate={watchedTaxRate}
            onFinish={handleCreateSubmission}
          />
        )}

        {isPriceCompareOpen && (
          <PriceCompareDrawer
            open={isPriceCompareOpen}
            onClose={() => setIsPriceCompareOpen(false)}
            selectedOrderId={selectedOrder?.ContractId}
            priceCompareItems={priceCompareItems}
            loadingPriceCompare={loadingPriceCompare}
            selectedPriceCompareKeys={selectedPriceCompareKeys}
            setSelectedPriceCompareKeys={setSelectedPriceCompareKeys}
            priceCompareStartProcess={priceCompareStartProcess}
            setPriceCompareStartProcess={setPriceCompareStartProcess}
            submittingPriceCompare={submittingPriceCompare}
            onChangeQnty={handleChangePriceCompareQnty}
            onChangeOrgcode={handleChangePriceCompareOrgcode}
            onAddSelectedToOrder={handleAddSelectedToOrder}
            existingItemIds={existingOrderItemIds}
            budgetList={budgetList}
            loadingBudgetList={loadingBudgetList}
          />
        )}

        {isImportModalOpen && (
          <ImportExcelModal
            open={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            selectedOrderId={selectedOrder?.ContractId}
            importFileList={importFileList}
            setImportFileList={setImportFileList}
            importing={importing}
            onImport={handleImportExcel}
          />
        )}

        {isWorkflowDrawerOpen && (
          <WorkflowDrawer
            open={isWorkflowDrawerOpen}
            onClose={() => {
              setIsWorkflowDrawerOpen(false);
              const targetContractId = editingOrder?.ContractId || selectedOrder?.ContractId;
              if (targetContractId) {
                fetchOrderDrawerItems(targetContractId);
              }
            }}
            currentSubmissionId={currentSubmissionId}
            itemDetail={itemDetail}
            workflowData={workflowData}
            loadingWorkflow={loadingWorkflow}
            isRowDetailOpen={isRowDetailOpen}
            selectedWorkflowRow={selectedWorkflowRow}
            processingStatusList={processingStatusList}
            loadingProcessingStatus={loadingProcessingStatus}
            rowDetailDecision={rowDetailDecision}
            setRowDetailDecision={setRowDetailDecision}
            rowDetailQnty={rowDetailQnty}
            setRowDetailQnty={setRowDetailQnty}
            rowDetailUnitPrice={rowDetailUnitPrice}
            setRowDetailUnitPrice={setRowDetailUnitPrice}
            rowDetailRemarks={rowDetailRemarks}
            setRowDetailRemarks={setRowDetailRemarks}
            savingRowDetail={savingRowDetail}
            onOpenRowDetail={openRowDetail}
            onCloseRowDetail={() => setIsRowDetailOpen(false)}
            onSaveRowDetail={handleSaveRowDetail}
          />
        )}

        <OrderLovModals lov={lov} orderForm={orderForm} />
      </ErpDetailContainer>
    );
  }

  // ===============================================================
  // GIAO DIỆN 2: MÀN HÌNH DANH SÁCH ĐƠN HÀNG (/purchase-orders) - FULL TRÀN VIỀN
  // ===============================================================
  return (
    <ErpPageContainer>
      <PurchaseOrdersTable
        filteredOrders={filteredOrders}
        loading={loading}
        pagination={pagination}
        setPagination={setPagination}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        columnSuggestions={columnSuggestions}
        isFiltering={isFiltering}
        storageKey={STORAGE_KEY_MAIN}
        onRefresh={fetchOrders}
        onCreate={() => {
          window.open("/purchase-orders?action=create", "_blank");
        }}
        onEdit={(record) => {
          window.open(`/purchase-orders?id=${record.ContractId}`, "_blank");
        }}
      />
    </ErpPageContainer>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 60, textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: "#718894", fontSize: 13 }}>
            Đang tải dữ liệu Đơn hàng...
          </div>
        </div>
      }
    >
      <PurchaseOrdersPageContent />
    </Suspense>
  );
}
