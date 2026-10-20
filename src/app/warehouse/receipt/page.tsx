"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Card,
  Popconfirm,
  Tabs,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import {
  IconPackage,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconList,
  IconPencil,
  IconScale,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import dayjs from "dayjs";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { StockInReceipt, StockItemDetail, MOCK_WAREHOUSES } from "../types";
import { warehouseApi } from "../api";
import StockInEditTab from "./_components/StockInEditTab";
import PendingPoReconcileTab, { PendingPoItem } from "./_components/PendingPoReconcileTab";
import InventoryWorkflowDrawer from "./_components/InventoryWorkflowDrawer";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import { useTranslation } from "@/locales/LanguageContext";

const { Title, Text } = Typography;

export default function StockInPage() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<StockInReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string | number>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // --- Tab quản lý: Danh sách (list) vs Chi tiết/Chỉnh sửa (edit) ---
  const [activeTabKey, setActiveTabKey] = useState<string>("list");
  const [hasLoadedReconcileTab, setHasLoadedReconcileTab] = useState(false);
  const [isEditTabOpen, setIsEditTabOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<StockInReceipt | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | number | null>(null);

  // --- Chi tiết vật tư cho Tab chi tiết ---
  const [items, setItems] = useState<StockItemDetail[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // --- Workflow / Quy trình duyệt ---
  const [selectedWorkflowItem, setSelectedWorkflowItem] = useState<StockItemDetail | null>(null);

  // ---------------------------------------------------------------------------
  // Load data from API: api/get-inventory-transaction
  // ---------------------------------------------------------------------------
  const fetchReceipts = useCallback(
    async (page = 1, pageSize = 20, keyword = "") => {
      setLoading(true);
      try {
        const data = await warehouseApi.getInventoryTransactions({
          DisplayMode: "Receipt",
          WSId: "",
          Keyword: keyword,
          PageNum: page,
          PageSize: pageSize,
        });

        const list = extractApiList<any>(data);
        const mapped: StockInReceipt[] = list.map((r: any, index: number) => {
          const id = String(r.TransactionId ?? r.Id ?? r.DocCode ?? `rec_${page}_${index}`);
          const docCode = r.DocCode || r.receiptCode || "";
          const docDate = r.DocDate || r.receiptDate || "";
          const subType = r.SubType || r.receiptType || "Purchase";
          const poCode = r.ReferenceNo || r.poCode || "";
          const contractCode = r.ContractCode || r.Contractcode || "";
          const vendorName = r.VenName || r.venname || r.vendorName || r.ClientName || "";
          const warehouseId = r.WarehouseId ?? r.warehouseId ?? "";
          const warehouseName =
            r.WarehouseName || r.warehouseName || (warehouseId ? `Kho #${warehouseId}` : "");
          const description = r.Description || r.description || "";
          const totalQty = Number(r.TotalQty ?? r.totalQty ?? r.Qnty ?? 0);
          const totalAmount = Number(r.TotalAmount ?? r.totalAmount ?? r.Amount ?? 0);
          const status = r.StatusCode || r.Status || r.status || "COMPLETED";

          return {
            ...r,
            id,
            receiptCode: docCode,
            receiptDate: docDate,
            receiptType: subType === "Purchase" ? "PO" : subType,
            poCode,
            contractCode,
            vendorName,
            warehouseId,
            warehouseName,
            deliverer: r.deliverer || r.Deliverer || "",
            receiver: r.receiver || r.Receiver || "",
            description,
            totalQty,
            totalAmount,
            status,
            createdBy: r.CreatedBy || r.createdBy || "",
            createdDate: r.CreatedDate || r.createdDate || "",
            items: r.items || [],

            // Raw API fields
            TransactionId: r.TransactionId ?? r.Id,
            SubType: r.SubType,
            DocCode: docCode,
            DocDate: docDate,
            Description: description,
            WarehouseId: warehouseId,
            WarehouseName: warehouseName,
            VenName: vendorName,
            venname: vendorName,
            ReferenceNo: poCode,
            ReferenceId: r.ReferenceId ?? r.referenceId,
            ContractCode: contractCode,
            ContractId: r.ReferenceId ?? r.referenceId ?? r.ContractId ?? r.contractId,
            SubconOf: r.SubconOf ?? r.subconof ?? r.SubConOf,
            subconOf: r.SubconOf ?? r.subconof ?? r.SubConOf,
          };
        });

        setReceipts(mapped);
        const total = extractTotalRows(data, mapped.length);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: total || mapped.length,
        }));
        return mapped;
      } catch (err: any) {
        console.error("Error loading inventory receipts:", err);
        message.error(err?.message || "Không thể tải danh sách phiếu nhập kho từ máy chủ");
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchReceipts(1, pagination.pageSize, "");
  }, [fetchReceipts, pagination.pageSize]);

  // ---------------------------------------------------------------------------
  // Load Detail Items from API: api/get-inventory-submission
  // ---------------------------------------------------------------------------
  const fetchReceiptItems = useCallback(async (transactionId: any) => {
    if (!transactionId) return;
    setLoadingItems(true);
    try {
      const res = await warehouseApi.getInventorySubmissions({
        DisplayMode: "Receipt",
        TransactionId: Number(transactionId),
        WSId: "",
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList(res);
      const mapped: StockItemDetail[] = list.map((item: any, idx: number) => {
        const qnty = Number(item.Qnty ?? item.actualQty ?? 0);
        const unitPrice = Number(item.UnitPrice ?? item.unitPrice ?? 0);
        const amount = Number(
          item.Amount ?? item.totalPrice ?? qnty * unitPrice
        );
        const taxRate = Number(item.TaxRate ?? 0);
        const taxAmount = Number(
          item.TaxAmount !== undefined && item.TaxAmount !== null
            ? item.TaxAmount
            : amount * taxRate
        );

        return {
          ...item,
          id: String(item.LocalId || item.SubmissionId || `sub_${idx}`),
          itemCode: item.SystemCode || item.itemCode || "",
          itemName: item.Description || item.itemName || "",
          unit: item.Unit || item.unit || "",
          actualQty: qnty,
          unitPrice,
          totalPrice: amount,
          orderQty: qnty,
          note: item.Remarks || item.note || "",

          // Raw API fields from get-inventory-submission
          LocalId: item.LocalId,
          ContractId: item.ContractId,
          SystemCode: item.SystemCode || item.itemCode || "",
          Description: item.Description || item.itemName || "",
          Unit: item.Unit || item.unit || "",
          UnitPrice: unitPrice,
          Qnty: qnty,
          Amount: amount,
          TaxRate: taxRate,
          TaxAmount: taxAmount,
          SubmissionId: item.SubmissionId,
          ItemDate: item.ItemDate,
          StageMode: item.StageMode,
          CreatedBy: item.CreatedBy,
          ApprovalStatus: item.ApprovalStatus,
          ApprovedOn: item.ApprovedOn,
          ApprovalStart: item.ApprovalStart,
          TaskId: item.TaskId,
          ApprovalUserId: item.ApprovalUserId,
          ApprovalAssignmentId: item.ApprovalAssignmentId,
          StatusCode: item.StatusCode || "Not-Started",
          Editable: item.Editable,
          Orgcode: item.Orgcode || item.OrgCode || item.WBS || item.Wbs || item.WbsCode || "",
          OrgName: item.OrgName || item.Orgname || item.BudgetDescription || "",
          Orgname: item.Orgname || item.OrgName || item.BudgetDescription || "",
          WBS: item.Orgcode || item.OrgCode || item.WBS || item.Wbs || item.WbsCode || "",
        };
      });
      setItems(mapped);
    } catch (err: any) {
      console.error("Lỗi tải chi tiết vật tư phiếu nhập kho:", err);
      message.error(err?.message || "Không thể tải chi tiết phiếu nhập kho");
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Tab Navigation Actions
  // ---------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setEditingReceipt(null);
    setItems([]);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleOpenCreateFromPo = (selectedPoItems: PendingPoItem[]) => {
    if (!selectedPoItems || selectedPoItems.length === 0) return;
    const first = selectedPoItems[0];

    const mappedItems: StockItemDetail[] = selectedPoItems.map((item, idx) => {
      const qnty = Number(item.Suggested_Qnty !== undefined ? item.Suggested_Qnty : item.Remaining_Qnty ?? 0);
      const unitPrice = Number(item.UnitPrice ?? 0);
      const taxRate = Number(item.TaxRate ?? 0.1);
      const amount = qnty * unitPrice;
      const taxAmount = amount * taxRate;

      return {
        ...item,
        id: `item_po_${item.SourceSubmissionId || item.MaterialId || idx}_${Date.now()}`,
        itemCode: item.ItemCode || "",
        itemName: item.ItemName || "",
        unit: item.UomCode || "",
        actualQty: qnty,
        unitPrice: unitPrice,
        totalPrice: amount,
        orderQty: Number(item.PO_Qnty || qnty),
        note: item.Remarks || "",

        // Raw fields from API
        ContractId: item.ContractId,
        SystemCode: item.ItemCode || "",
        Description: item.ItemName || "",
        Unit: item.UomCode || "",
        UnitPrice: unitPrice,
        Qnty: qnty,
        Amount: amount,
        TaxRate: taxRate,
        TaxAmount: taxAmount,
        MaterialId: item.MaterialId,
        SourceSubmissionId: item.SourceSubmissionId,
        StatusCode: "Not-Started",
        Orgcode: item.Orgcode || item.OrgCode || item.WBS || item.Wbs || item.WbsCode || "",
        OrgName: item.OrgName || item.Orgname || item.BudgetDescription || "",
        Orgname: item.Orgname || item.OrgName || item.BudgetDescription || "",
        WBS: item.Orgcode || item.OrgCode || item.WBS || item.Wbs || item.WbsCode || "",
      };
    });

    const totalQty = mappedItems.reduce((sum, i) => sum + (i.actualQty || 0), 0);
    const totalAmount = mappedItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
    const autoCode = `PNK-${dayjs().format("YYYY-MM")}/${String(Math.floor(Math.random() * 900) + 100)}`;

    const newReceipt: StockInReceipt = {
      id: `rec_new_${Date.now()}`,
      receiptCode: autoCode,
      DocCode: autoCode,
      receiptDate: dayjs().format("YYYY-MM-DD"),
      DocDate: dayjs().format("YYYY-MM-DD"),
      receiptType: "PO",
      SubType: "Purchase",
      poCode: first.ContractCode || "",
      contractCode: first.ContractCode || "",
      ContractCode: first.ContractCode || "",
      ContractId: first.ContractId,
      ReferenceId: first.ContractId,
      ReferenceNo: first.ContractCode || "",
      SubconOf: first.SubconOf,
      subconOf: first.SubconOf,
      vendorName: first.ClientName || "",
      VenName: first.ClientName || "",
      warehouseId: first.WarehouseId || "",
      WarehouseId: first.WarehouseId || "",
      warehouseName: first.WarehouseName || "",
      WarehouseName: first.WarehouseName || "",
      deliverer: "",
      receiver: "r@gmail.com",
      description: first.ContractCode
        ? `Nhập kho theo đơn hàng ${first.ContractCode}`
        : "Nhập kho theo đơn hàng",
      status: "Chưa nhập kho",
      totalQty,
      totalAmount,
      items: mappedItems,
    };

    setEditingReceipt(newReceipt);
    setItems(mappedItems);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleReceiptCreated = async (transactionData: any, sourcePoItem?: any) => {
    const transId = transactionData?.TransactionId;
    const docCode = transactionData?.DocCode;

    // 1. Tải lại danh sách phiếu nhập kho và lấy danh sách mới nhất từ máy chủ
    const latestReceipts = await fetchReceipts(1, pagination.pageSize, "");

    // 2. Tìm phiếu nhập vừa tạo trong danh sách vừa lấy về
    const matchedReceipt = latestReceipts?.find(
      (r) =>
        (transId && (String(r.TransactionId) === String(transId) || String(r.id) === String(transId))) ||
        (docCode && r.DocCode === docCode)
    );

    if (matchedReceipt) {
      handleOpenEdit(matchedReceipt);
      return;
    }

    // 3. Dự phòng nếu chưa kịp xuất hiện trong trang 1, dựng thông tin đầy đủ từ sourcePoItem & transactionData
    if (transId || docCode) {
      const createdReceipt: StockInReceipt = {
        id: String(transId || docCode),
        TransactionId: transId,
        receiptCode: docCode || `PNK-${transId}`,
        DocCode: docCode,
        receiptDate: dayjs().format("YYYY-MM-DD"),
        DocDate: dayjs().format("YYYY-MM-DD"),
        receiptType: "PO",
        SubType: "Purchase",
        poCode: sourcePoItem?.ContractCode || "",
        ReferenceNo: sourcePoItem?.ContractCode || "",
        contractCode: sourcePoItem?.SubconCode || sourcePoItem?.ContractCode || "",
        ContractCode: sourcePoItem?.SubconCode || sourcePoItem?.ContractCode || "",
        ContractId: sourcePoItem?.ContractId,
        ReferenceId: sourcePoItem?.ContractId,
        SubconOf: sourcePoItem?.SubconOf ?? transactionData?.SubconOf,
        subconOf: sourcePoItem?.SubconOf ?? transactionData?.SubconOf,
        vendorName: sourcePoItem?.ClientName || "",
        VenName: sourcePoItem?.ClientName || "",
        warehouseId: sourcePoItem?.WarehouseId || "",
        WarehouseId: sourcePoItem?.WarehouseId || "",
        warehouseName: sourcePoItem?.WarehouseName || "",
        WarehouseName: sourcePoItem?.WarehouseName || "",
        description: sourcePoItem?.ContractCode
          ? `Phiếu nhập kho từ đơn hàng ${sourcePoItem.ContractCode}`
          : `Phiếu nhập ${docCode || ""}`,
        status: transactionData?.StatusCode || transactionData?.Status || "COMPLETED",
        items: [],
      };
      handleOpenEdit(createdReceipt);
    }
  };

  const handleOpenEdit = (record: StockInReceipt) => {
    setEditingReceipt(record);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");

    const tId =
      record.TransactionId ??
      record.Id ??
      (!isNaN(Number(record.id)) ? Number(record.id) : undefined);
    if (tId) {
      fetchReceiptItems(tId);
    } else {
      setItems(record.items || []);
    }
  };

  const handleCloseEditTab = () => {
    setIsEditTabOpen(false);
    setActiveTabKey("list");
    setEditingReceipt(null);
    setItems([]);
  };

  const handleDelete = async (record: StockInReceipt) => {
    const tId =
      record.TransactionId ??
      record.Id ??
      (!isNaN(Number(record.id)) ? Number(record.id) : undefined);

    if (!tId) {
      message.error("Không tìm thấy TransactionId của phiếu để xóa!");
      return;
    }

    setDeletingTransactionId(tId);
    try {
      const res = await warehouseApi.deleteInventoryTransaction(tId);
      message.success(res?.Message || "Đã xóa phiếu nhập kho thành công!");

      // Nếu đang mở tab edit của phiếu vừa xóa thì đóng tab
      if (
        editingReceipt &&
        (editingReceipt.TransactionId === tId || editingReceipt.id === record.id)
      ) {
        handleCloseEditTab();
      }

      // Tải lại danh sách phiếu nhập kho từ API
      fetchReceipts(pagination.current, pagination.pageSize, searchKeyword.trim());
    } catch (err: any) {
      console.error("Lỗi xóa phiếu nhập kho:", err);
      message.error(err?.message || "Xóa phiếu nhập kho thất bại!");
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const handleSaveReceipt = async (saved: StockInReceipt) => {
    if (editingReceipt) {
      const rawId =
        editingReceipt.TransactionId ??
        editingReceipt.Id ??
        (!isNaN(Number(editingReceipt.id)) ? Number(editingReceipt.id) : undefined);
      const transactionId = !isNaN(Number(rawId)) ? Number(rawId) : rawId;

      if (!transactionId) {
        message.error("Không tìm thấy mã TransactionId để cập nhật phiếu kho!");
        return;
      }

      try {
        const payload = {
          TransactionId: transactionId,
          DocDate: saved.receiptDate,
          Description: saved.description,
        };

        const res: any = await warehouseApi.updateInventoryTransactionInfo(payload);
        message.success(res?.Message || "Cập nhật thông tin phiếu kho thành công.");

        const updatedDocDate = saved.receiptDate;
        const updatedDesc = saved.description;

        setEditingReceipt((prev) =>
          prev
            ? {
                ...prev,
                receiptDate: updatedDocDate,
                DocDate: updatedDocDate,
                description: updatedDesc,
                Description: updatedDesc,
              }
            : null
        );

        setReceipts((prev) =>
          prev.map((r) => {
            const rId = r.TransactionId ?? r.Id ?? (!isNaN(Number(r.id)) ? Number(r.id) : r.id);
            if (String(rId) === String(transactionId)) {
              return {
                ...r,
                receiptDate: updatedDocDate,
                DocDate: updatedDocDate,
                description: updatedDesc,
                Description: updatedDesc,
              };
            }
            return r;
          })
        );

        fetchReceipts(pagination.current, pagination.pageSize, searchKeyword.trim());
      } catch (err: any) {
        console.error("Lỗi cập nhật thông tin phiếu kho:", err);
        message.error(err?.message || "Cập nhật phiếu nhập kho thất bại!");
        throw err;
      }
    } else {
      setReceipts((prev) => [saved, ...prev]);
      message.success("Tạo mới phiếu nhập kho thành công!");
      handleCloseEditTab();
    }
  };


  // ---------------------------------------------------------------------------
  // Warehouse & Status Filter options
  // ---------------------------------------------------------------------------
  const warehouseOptions = useMemo(() => {
    const map = new Map<string | number, string>();
    receipts.forEach((r) => {
      if (r.warehouseId && r.warehouseName) {
        map.set(r.warehouseId, r.warehouseName);
      }
    });
    MOCK_WAREHOUSES.forEach((w) => {
      if (!map.has(w.id)) {
        map.set(w.id, w.name);
      }
    });
    return [
      { value: "ALL", label: "Tất cả kho nhập" },
      ...Array.from(map.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ];
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchWarehouse =
        selectedWarehouseFilter === "ALL" ||
        String(r.warehouseId) === String(selectedWarehouseFilter);

      const matchStatus =
        selectedStatusFilter === "ALL" || r.status === selectedStatusFilter;

      return matchWarehouse && matchStatus;
    });
  }, [receipts, selectedWarehouseFilter, selectedStatusFilter]);

  const renderType = (type: string) => {
    switch (type) {
      case "PO":
      case "Purchase":
        return "Mua hàng (PO)";
      case "TRANSFER":
      case "Transfer":
        return "Điều chuyển";
      case "RETURN":
      case "Return":
        return "Trả lại";
      default:
        return type || "Khác";
    }
  };

  const baseColumns: (ColumnType<StockInReceipt> & { cannotHide?: boolean })[] = useMemo(
    () => [
      {
        title: t("table.stt"),
        key: "stt",
        width: 55,
        align: "center",
        cannotHide: false,
        render: (_, __, index) =>
          (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: t("table.warehouse"),
        dataIndex: "WarehouseName",
        key: "WarehouseName",
        width: 250,
        render: (val, r) =>
          val || r.warehouseName || (r.WarehouseId ? `Kho #${r.WarehouseId}` : "---"),
      },
      {
        title: t("table.poCode"),
        dataIndex: "ReferenceNo",
        key: "ReferenceNo",
        width: 190,
        render: (val, r) => val || r.poCode || "---",
      },
      {
        title: t("table.contractCode"),
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 220,
        render: (val, r) => val || r.ContractCode || "---",
      },
      {
        title: t("table.receiptType"),
        dataIndex: "SubType",
        key: "SubType",
        width: 140,
        render: (val, r) => {
          const typeStr = renderType(val || r.receiptType || "");
          return (
            <span style={{ color: "#334155", fontWeight: 500, fontSize: 13 }}>
              {typeStr}
            </span>
          );
        },
      },
      {
        title: t("table.vendorName"),
        dataIndex: "VenName",
        key: "VenName",
        width: 260,
        render: (val, r) =>
          val || r.VenName || r.venname || r.vendorName || "---",
      },
      {
        title: t("table.receiptCode"),
        dataIndex: "DocCode",
        key: "DocCode",
        width: 190,
        render: (val, record) => (
          <a
            onClick={() => handleOpenEdit(record)}
            style={{ color: "#008f89", fontWeight: 600, cursor: "pointer" }}
          >
            {val || record.receiptCode || "---"}
          </a>
        ),
      },
      {
        title: t("table.receiptDate"),
        dataIndex: "DocDate",
        key: "DocDate",
        width: 110,
        align: "center",
        render: (val, record) => {
          const d = val || record.receiptDate;
          return d ? dayjs(d).format("DD/MM/YYYY") : "---";
        },
      },
      {
        title: t("table.description"),
        dataIndex: "Description",
        key: "Description",
        width: 280,
        ellipsis: true,
        render: (val, r) => val || r.description || "---",
      },
      {
        title: t("common.actions"),
        key: "action",
        width: 90,
        align: "center",
        fixed: "right",
        cannotHide: true,
        render: (_, record) => (
          <Space size={6}>
            <ActionIconButton
              action="edit"
              size="small"
              onClick={() => handleOpenEdit(record)}
            />
            <Popconfirm
              title="Xác nhận xóa phiếu này?"
              description="Hành động này sẽ xóa phiếu nhập kho và không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{
                danger: true,
                loading:
                  deletingTransactionId ===
                  (record.TransactionId ?? record.Id ?? record.id),
              }}
              onConfirm={() => handleDelete(record)}
            >
              <ActionIconButton
                action="delete"
                size="small"
                loading={
                  deletingTransactionId ===
                  (record.TransactionId ?? record.Id ?? record.id)
                }
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [pagination.current, pagination.pageSize, deletingTransactionId]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_import_receipts",
    columns: baseColumns,
    actionColumnKey: "action",
    defaultScrollX: 1350,
  });

  // ---------------------------------------------------------------------------
  // Tab configuration
  // ---------------------------------------------------------------------------
  const tabItems = [
    {
      key: "list",
      label: (
        <Space size={6}>
          <IconList size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span>{t("receipt.tabList")}</span>
        </Space>
      ),
      closable: false,
      children: (
        <div style={{ padding: 24 }}>
          {/* Scoped CSS for stockin main table and tabs */}
          <style jsx global>{`
            .stockin-main-table .ant-table-thead > tr > th {
              background: #f7fbfa !important;
              color: #123443 !important;
              font-size: 12px !important;
              font-weight: 600 !important;
              line-height: 18px !important;
              border-color: #dce5e6 !important;
              padding: 8px 10px !important;
            }
            .stockin-main-table .ant-table-tbody > tr > td {
              color: #123443 !important;
              font-size: 12px !important;
              line-height: 18px !important;
              border-color: #dce5e6 !important;
              padding: 8px 10px !important;
              height: 40px !important;
            }
            .stockin-main-table .ant-table-tbody > tr:hover > td {
              background-color: #eef8f6 !important;
            }
            .stockin-main-table .ant-table-container {
              border: 1px solid #dce5e6 !important;
              border-radius: 8px !important;
              overflow: hidden;
            }
            .stockin-main-table .ant-pagination .ant-pagination-item-active {
              border-color: #008f89 !important;
              background-color: #008f89 !important;
            }
            .stockin-main-table .ant-pagination .ant-pagination-item-active a {
              color: #FFFFFF !important;
            }
            .stockin-page-tabs .ant-tabs-nav {
              margin-bottom: 0 !important;
              background: #f7fbfa !important;
              border-bottom: 1px solid #dce5e6 !important;
              padding: 6px 16px 0 16px !important;
            }
            .stockin-page-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
              color: #008f89 !important;
              font-weight: 600 !important;
            }
            .stockin-page-tabs .ant-tabs-ink-bar {
              background: #008f89 !important;
            }
          `}</style>

          {/* Header bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Text
                strong
                style={{
                  fontSize: 14,
                  color: "#008f89",
                  fontWeight: 700,
                  lineHeight: "22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconPackage size={18} strokeWidth={1.8} style={{ color: "#008f89" }} /> {t("receipt.listTitle")}
              </Text>
              <Tag
                style={{
                  background: "#dce5e6",
                  color: "#008f89",
                  borderRadius: 12,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: "16px",
                  padding: "2px 8px",
                  margin: 0,
                }}
              >
                {pagination.total || filteredReceipts.length} {t("table.receiptsCount")}
              </Tag>
            </div>

            <Space size={8} wrap>
              <Select
                value={selectedWarehouseFilter}
                onChange={setSelectedWarehouseFilter}
                style={{ width: 220, height: 36 }}
                options={warehouseOptions}
              />

              <Select
                value={selectedStatusFilter}
                onChange={setSelectedStatusFilter}
                style={{ width: 150, height: 36 }}
                options={[
                  { value: "ALL", label: t("common.allStatus") },
                  { value: "DRAFT", label: t("receipt.draft") },
                  { value: "PENDING", label: t("receipt.pending") },
                  { value: "COMPLETED", label: t("receipt.completed") },
                ]}
              />

              <Input
                placeholder={t("receipt.searchPlaceholder")}
                allowClear
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={() => fetchReceipts(1, pagination.pageSize, searchKeyword.trim())}
                style={{ width: 230, height: 36, borderRadius: 8 }}
                prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
              />

              <Button
                icon={<IconSearch size={16} strokeWidth={1.8} />}
                onClick={() => fetchReceipts(1, pagination.pageSize, searchKeyword.trim())}
                style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
              >
                {t("common.search")}
              </Button>

              <Button
                icon={<IconRefresh size={16} strokeWidth={1.8} />}
                loading={loading}
                onClick={() => {
                  setSearchKeyword("");
                  setSelectedWarehouseFilter("ALL");
                  setSelectedStatusFilter("ALL");
                  fetchReceipts(1, pagination.pageSize, "");
                }}
                style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
              >
                {t("common.refresh")}
              </Button>

              <Button
                type="primary"
                icon={<IconPlus size={16} strokeWidth={2} />}
                style={{
                  background: "#008f89",
                  borderColor: "#008f89",
                  height: 36,
                  borderRadius: 8,
                  fontWeight: 500,
                  boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                }}
                onClick={handleOpenCreate}
              >
                {t("common.createReceipt")}
              </Button>
            </Space>
          </div>

          {/* Main Table */}
          <Card
            bodyStyle={{ padding: 0 }}
            bordered={false}
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              borderRadius: 8,
              border: "1px solid #dce5e6",
              overflow: "hidden",
            }}
          >
            <Table
              className="stockin-main-table"
              components={{ header: { cell: ResizableTitle } }}
              rowKey="id"
              size="middle"
              columns={tableColumns}
              dataSource={filteredReceipts}
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (page, pageSize) => {
                  fetchReceipts(page, pageSize, searchKeyword.trim());
                },
                showTotal: (total) => `${t.common.total} ${total} ${t.receipt.receiptCount}`,
              }}
              scroll={{ x: scrollX }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: "reconcile",
      label: (
        <Space size={6}>
          <IconScale size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span>{t.receipt.reconcilePO}</span>
        </Space>
      ),
      closable: false,
      children:
        activeTabKey === "reconcile" || hasLoadedReconcileTab ? (
          <PendingPoReconcileTab
            warehouseOptions={warehouseOptions}
            onReceiptCreated={handleReceiptCreated}
          />
        ) : null,
    },
    ...(isEditTabOpen
      ? [
          {
            key: "edit",
            label: (
              <Space size={6}>
                <IconPencil size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
                <span>
                  {editingReceipt
                    ? `${t.receipt.updateReceipt}: ${editingReceipt.DocCode || editingReceipt.receiptCode || ""}`
                    : t.receipt.saveReceipt}
                </span>
              </Space>
            ),
            closable: true,
            children: (
              <div style={{ background: "#fff", minHeight: "calc(100vh - 110px)" }}>
                <StockInEditTab
                  open={isEditTabOpen}
                  onClose={handleCloseEditTab}
                  editingReceipt={editingReceipt}
                  onSave={handleSaveReceipt}
                  onFetchWorkflow={(item) => setSelectedWorkflowItem(item)}
                  items={items}
                  setItems={setItems}
                  loadingItems={loadingItems}
                  onRefreshItems={() => {
                    const tId =
                      editingReceipt?.TransactionId ??
                      editingReceipt?.Id ??
                      (!isNaN(Number(editingReceipt?.id)) ? Number(editingReceipt?.id) : undefined);
                    if (tId) fetchReceiptItems(tId);
                  }}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ padding: 0, width: "100%", minHeight: "calc(100vh - 100px)", background: "#FFFFFF", borderRadius: 16, border: "1px solid #dce5e6", overflow: "hidden", boxShadow: "0 1px 3px rgba(18, 52, 67, 0.04)" }}>
      <Tabs
        className="stockin-page-tabs"
        type="editable-card"
        hideAdd
        activeKey={activeTabKey}
        onChange={(key) => {
          setActiveTabKey(key);
          if (key === "reconcile") {
            setHasLoadedReconcileTab(true);
          }
        }}
        onEdit={(targetKey, action) => {
          if (action === "remove" && targetKey === "edit") {
            handleCloseEditTab();
          }
        }}
        items={tabItems}
        tabBarStyle={{
          margin: 0,
          background: "#f7fbfa",
          padding: "6px 16px 0 16px",
          borderBottom: "1px solid #dce5e6",
        }}
      />

      {/* Drawer xem quy trình phê duyệt & duyệt từng phân công */}
      <InventoryWorkflowDrawer
        open={Boolean(selectedWorkflowItem)}
        onClose={() => setSelectedWorkflowItem(null)}
        itemDetail={selectedWorkflowItem}
        onWorkflowUpdated={() => {
          const tId =
            editingReceipt?.TransactionId ??
            editingReceipt?.Id ??
            (!isNaN(Number(editingReceipt?.id)) ? Number(editingReceipt?.id) : undefined);
          if (tId) {
            fetchReceiptItems(tId);
          }
        }}
      />
    </div>
  );
}
