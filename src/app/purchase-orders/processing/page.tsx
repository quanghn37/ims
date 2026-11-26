"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Table,
  Input,
  InputNumber,
  Button,
  Space,
  Select,
  Checkbox,
  Tag,
  Modal,
  Tabs,
  Popconfirm,
  message,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { IconBan, IconHistory, IconScale } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { warehouseApi } from "@/app/warehouse/api";
import { useTranslation } from "@/locales/LanguageContext";

interface PendingPoCancelItem {
  RowNum?: number;
  ContractId?: number;
  ContractCode?: string;
  ContractDate?: string;
  SubconOf?: number;
  SubconCode?: string;
  ClientId?: number;
  ClientName?: string;
  WarehouseId?: number;
  WarehouseCode?: string;
  WarehouseName?: string;
  SubmissionId?: number;
  SourceSubmissionId?: number;
  MaterialId?: number;
  ItemCode?: string;
  ItemName?: string;
  UomCode?: string;
  UnitPrice?: number;
  TaxRate?: number;
  PO_Qnty?: number;
  Total_Received_Qnty?: number;
  Remaining_Qnty?: number;
  Orgcode?: string;
  OrgCode?: string;
  OrgName?: string;
  Orgname?: string;
  BudgetDescription?: string;
  WBS?: string;
  Wbs?: string;
  Cancel_Qnty?: number;
  CancelReason?: string;
}

interface CancelledPoHistoryItem extends PendingPoCancelItem {
  CancelId: string;
  CancelledAt: string;
  CancelledQty: number;
  PreviousRemainingQty: number;
}

const getPoRowKey = (record: PendingPoCancelItem): string => {
  return `${record.ContractId || "po"}_${record.SourceSubmissionId || record.SubmissionId || "sub"}_${record.MaterialId || record.ItemCode || record.RowNum || ""}`;
};

export default function OrderProcessingPage() {
  const { t, language } = useTranslation();
  const isEn = language === "en";

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [items, setItems] = useState<PendingPoCancelItem[]>([]);
  const [cancelledHistory, setCancelledHistory] = useState<CancelledPoHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string | number>("ALL");
  const [warehouseOptions, setWarehouseOptions] = useState<{ value: string | number; label: string }[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Modal xác nhận hủy (wireframe thao tác trước khi map API)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [commonCancelReason, setCommonCancelReason] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const pendingRequestIdRef = useRef(0);

  // Tải danh mục kho từ API
  useEffect(() => {
    let mounted = true;
    warehouseApi
      .getWarehouseList({ PageSize: 200 })
      .then((data) => {
        if (!mounted) return;
        const list = extractApiList<any>(data);
        const mapped = list
          .map((w: any) => ({
            value: w.WarehouseId ?? w.Id ?? w.id,
            label: w.WarehouseName || w.Name || w.name || "",
          }))
          .filter((o: any) => o.value !== undefined && o.value !== null && o.label);
        setWarehouseOptions(mapped);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const effectiveWarehouseOptions = useMemo(() => {
    const allLabel = t.receipt?.allWarehouses || (isEn ? "All Warehouses" : "Tất cả kho nhập");
    return [{ value: "ALL", label: allLabel }, ...warehouseOptions];
  }, [warehouseOptions, t.receipt, isEn]);

  // Lấy dữ liệu từ API Đối chiếu đơn hàng: api/get-pendinginventory-po
  const fetchPendingItems = useCallback(
    async (
      page = 1,
      pageSize = 20,
      whFilter: string | number = selectedWarehouseFilter,
      search: string = searchKeyword
    ) => {
      const requestId = ++pendingRequestIdRef.current;
      setLoading(true);
      try {
        const whId =
          whFilter && whFilter !== "ALL"
            ? !isNaN(Number(whFilter))
              ? Number(whFilter)
              : whFilter
            : null;

        const data = await warehouseApi.getPendingInventoryPo({
          WSId: "",
          WarehouseId: whId,
          ContractId: null,
          SearchKey: search ? search.trim() : "",
          PageNum: page,
          PageSize: pageSize,
        });

        if (requestId !== pendingRequestIdRef.current) return;

        const rawList = extractApiList<PendingPoCancelItem>(data);
        const list = rawList.map((item) => ({
          ...item,
          Cancel_Qnty: Number(item.Remaining_Qnty ?? 0),
          CancelReason: "",
        }));

        setItems(list);
        const total = extractTotalRows(data, list.length);
        setPagination({
          current: Number(data?.PageNum || page),
          pageSize: Number(data?.PageSize || pageSize),
          total,
        });
      } catch (err: any) {
        if (requestId !== pendingRequestIdRef.current) return;
        console.error("Lỗi tải danh sách xử lý đơn hàng:", err);
        message.error(
          err?.message ||
            (isEn ? "Failed to load pending purchase order items" : "Không thể tải danh sách đơn hàng chờ xử lý")
        );
        setItems([]);
      } finally {
        if (requestId === pendingRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [selectedWarehouseFilter, searchKeyword, isEn]
  );

  useEffect(() => {
    fetchPendingItems(1, 20, "ALL", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setSelectedRowKeys([]);
    fetchPendingItems(1, pagination.pageSize, selectedWarehouseFilter, searchKeyword);
  };

  const handleRefresh = () => {
    setSelectedRowKeys([]);
    fetchPendingItems(pagination.current, pagination.pageSize, selectedWarehouseFilter, searchKeyword);
  };

  const handleWarehouseChange = (val: string | number) => {
    setSelectedWarehouseFilter(val);
    setSelectedRowKeys([]);
    fetchPendingItems(1, pagination.pageSize, val, searchKeyword);
  };

  // Cập nhật SL Hủy (ràng buộc <= SL còn lại)
  const handleCancelQntyChange = (key: string, val: number | null) => {
    const targetItem = items.find((item) => getPoRowKey(item) === key);
    const remaining = Math.max(0, Number(targetItem?.Remaining_Qnty ?? 0));
    let nextVal = val !== null && val !== undefined ? Number(val) : 0;
    if (nextVal < 0) nextVal = 0;
    if (targetItem && nextVal > remaining) {
      message.warning(
        isEn
          ? `Cancel quantity (${nextVal}) cannot exceed remaining quantity (${remaining})!`
          : `Số lượng hủy (${nextVal}) không được vượt quá số lượng còn lại (${remaining})!`
      );
      nextVal = remaining;
    }

    setItems((prev) =>
      prev.map((item) =>
        getPoRowKey(item) === key ? { ...item, Cancel_Qnty: nextVal } : item
      )
    );
  };

  // Cập nhật Lý do Hủy
  const handleCancelReasonChange = (key: string, val: string) => {
    setItems((prev) =>
      prev.map((item) =>
        getPoRowKey(item) === key ? { ...item, CancelReason: val } : item
      )
    );
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(getPoRowKey(item))),
    [items, selectedRowKeys]
  );

  // Mở popup Xác nhận Hủy
  const handleOpenConfirmCancel = () => {
    if (selectedItems.length === 0) {
      message.warning(
        isEn
          ? "Please select at least 1 item to cancel!"
          : "Vui lòng chọn ít nhất 1 dòng vật tư để hủy!"
      );
      return;
    }

    const invalidQtyItem = selectedItems.find(
      (i) => i.Cancel_Qnty === undefined || i.Cancel_Qnty === null || Number(i.Cancel_Qnty) <= 0
    );
    if (invalidQtyItem) {
      message.warning(
        isEn
          ? `Cancel quantity of item "${invalidQtyItem.ItemName || invalidQtyItem.ItemCode}" must be greater than 0!`
          : `Số lượng hủy của vật tư "${invalidQtyItem.ItemName || invalidQtyItem.ItemCode}" phải lớn hơn 0!`
      );
      return;
    }

    const exceededItem = selectedItems.find(
      (i) => Number(i.Cancel_Qnty || 0) > Math.max(0, Number(i.Remaining_Qnty ?? 0))
    );
    if (exceededItem) {
      const remaining = Math.max(0, Number(exceededItem.Remaining_Qnty ?? 0));
      message.warning(
        isEn
          ? `Cancel quantity of item "${exceededItem.ItemName || exceededItem.ItemCode}" cannot exceed remaining quantity (${remaining})!`
          : `Số lượng hủy của vật tư "${exceededItem.ItemName || exceededItem.ItemCode}" không được vượt quá số lượng còn lại (${remaining})!`
      );
      return;
    }

    setCommonCancelReason("");
    setConfirmModalOpen(true);
  };

  // Thực thi Xác nhận Hủy trên Wireframe (API map sau)
  const handleConfirmCancelWireframe = async () => {
    const missingReason = selectedItems.some(
      (it) => !(it.CancelReason || "").trim() && !commonCancelReason.trim()
    );
    if (missingReason) {
      message.warning(
        isEn
          ? "Please enter a cancel reason for the selected items!"
          : "Vui lòng nhập Lý do hủy cho các dòng đã chọn!"
      );
      return;
    }

    setConfirmingCancel(true);
    try {
      const nowStr = dayjs().format("DD/MM/YYYY HH:mm");
      const newHistoryEntries: CancelledPoHistoryItem[] = selectedItems.map((it) => {
        const cancelQty = Number(it.Cancel_Qnty || 0);
        const prevRemaining = Number(it.Remaining_Qnty || 0);
        const finalReason = (it.CancelReason || "").trim() || commonCancelReason.trim();
        return {
          ...it,
          CancelId: `${getPoRowKey(it)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          CancelledAt: nowStr,
          CancelledQty: cancelQty,
          PreviousRemainingQty: prevRemaining,
          CancelReason: finalReason,
        };
      });

      const selectedMap = new Map(
        selectedItems.map((it) => [getPoRowKey(it), Number(it.Cancel_Qnty || 0)])
      );

      setItems((prev) =>
        prev
          .map((it) => {
            const key = getPoRowKey(it);
            if (!selectedMap.has(key)) return it;
            const cancelQty = selectedMap.get(key) || 0;
            const nextRemaining = Math.max(0, Number(it.Remaining_Qnty || 0) - cancelQty);
            return {
              ...it,
              Remaining_Qnty: nextRemaining,
              Cancel_Qnty: nextRemaining,
              CancelReason: "",
            };
          })
          .filter((it) => Number(it.Remaining_Qnty || 0) > 0)
      );

      setCancelledHistory((prev) => [...newHistoryEntries, ...prev]);
      setSelectedRowKeys([]);
      setConfirmModalOpen(false);
      message.success(
        isEn
          ? `Cancelled ${selectedItems.length} item(s) (Wireframe preview - API pending).`
          : `Đã xác nhận hủy ${selectedItems.length} dòng vật tư (Wireframe - chờ map API).`
      );
    } finally {
      setConfirmingCancel(false);
    }
  };

  // Hoàn tác / Mở lại dòng đã hủy trên Wireframe
  const handleReopenItem = (historyItem: CancelledPoHistoryItem) => {
    setCancelledHistory((prev) => prev.filter((h) => h.CancelId !== historyItem.CancelId));

    const targetKey = getPoRowKey(historyItem);
    setItems((prev) => {
      const exists = prev.some((it) => getPoRowKey(it) === targetKey);
      if (exists) {
        return prev.map((it) => {
          if (getPoRowKey(it) !== targetKey) return it;
          const restoredRemaining = Number(it.Remaining_Qnty || 0) + historyItem.CancelledQty;
          return {
            ...it,
            Remaining_Qnty: restoredRemaining,
            Cancel_Qnty: restoredRemaining,
          };
        });
      }
      const restored: PendingPoCancelItem = {
        ...historyItem,
        Remaining_Qnty: historyItem.CancelledQty,
        Cancel_Qnty: historyItem.CancelledQty,
        CancelReason: "",
      };
      return [restored, ...prev];
    });

    message.success(
      isEn
        ? `Reopened "${historyItem.ItemName || historyItem.ItemCode}" (${historyItem.CancelledQty}).`
        : `Đã mở lại "${historyItem.ItemName || historyItem.ItemCode}" (SL: ${historyItem.CancelledQty}).`
    );
  };

  const isAllCurrentPageSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => selectedRowKeys.includes(getPoRowKey(item)));
  }, [items, selectedRowKeys]);

  const isSomeCurrentPageSelected = useMemo(() => {
    return (
      items.some((item) => selectedRowKeys.includes(getPoRowKey(item))) &&
      !isAllCurrentPageSelected
    );
  }, [items, selectedRowKeys, isAllCurrentPageSelected]);

  const handleToggleSelectAll = (checked: boolean) => {
    const currentPageKeys = items.map(getPoRowKey);
    if (checked) {
      setSelectedRowKeys((prev) => Array.from(new Set([...prev, ...currentPageKeys])));
    } else {
      setSelectedRowKeys((prev) => prev.filter((k) => !currentPageKeys.includes(k)));
    }
  };

  const rawColumns: (ColumnType<PendingPoCancelItem> & { cannotHide?: boolean })[] = useMemo(
    () => [
      {
        title: t.table?.stt || (isEn ? "No." : "STT"),
        key: "stt",
        width: 60,
        align: "center",
        cannotHide: true,
        render: (_val, record, index) =>
          record.RowNum ?? (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: t.table?.warehouse || (isEn ? "Warehouse" : "Kho nhập"),
        dataIndex: "WarehouseName",
        key: "WarehouseName",
        width: 220,
        render: (text: string, record) => (
          <div>
            <div>{text || "---"}</div>
            {record.WarehouseCode && (
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                {isEn ? "Code: " : "Mã kho: "}
                {record.WarehouseCode}
              </div>
            )}
          </div>
        ),
      },
      {
        title: t.receipt?.colPoNo || (isEn ? "PO No." : "Số đơn hàng PO"),
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 190,
        render: (text: string, record) => (
          <div>
            <div>{text || "---"}</div>
            {record.ContractDate && (
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                {isEn ? "Date: " : "Ngày: "}
                {dayjs(record.ContractDate).format("DD/MM/YYYY")}
              </div>
            )}
          </div>
        ),
      },
      {
        title: t.receipt?.colVendorContract || (isEn ? "Vendor Contract" : "HĐ NCC"),
        dataIndex: "SubconCode",
        key: "SubconCode",
        width: 220,
        render: (text: string, record) => (
          <div>
            <div style={{ color: "#123443" }}>{text || "---"}</div>
            {record.ClientName && (
              <div style={{ fontSize: 12, color: "#718894" }}>{record.ClientName}</div>
            )}
          </div>
        ),
      },
      {
        title: "Orgcode",
        dataIndex: "Orgcode",
        key: "Orgcode",
        width: 220,
        render: (val: any, record: PendingPoCancelItem) => {
          const raw = String(
            val || record.Orgcode || record.OrgCode || record.WBS || record.Wbs || ""
          ).trim();
          let orgName = record.OrgName || record.Orgname || record.BudgetDescription || "";
          let orgCode = "";

          if (raw.includes(" - ")) {
            const parts = raw.split(" - ");
            orgCode = parts[0].trim();
            if (!orgName) {
              orgName = parts.slice(1).join(" - ").trim();
            }
          } else {
            orgCode = raw;
          }

          if (!orgName && !orgCode) {
            return <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>;
          }

          if (!orgName) {
            return <span style={{ color: "#123443", fontSize: 13 }}>{orgCode}</span>;
          }

          return (
            <div>
              <div style={{ color: "#123443", fontSize: 13, lineHeight: "17px" }}>{orgName}</div>
              {orgCode && (
                <div style={{ fontSize: 11.5, color: "#718894", marginTop: 2 }}>
                  {orgCode.startsWith("(") ? orgCode : `(${orgCode})`}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: t.table?.itemName || (isEn ? "Item Name" : "Tên vật tư"),
        dataIndex: "ItemName",
        key: "ItemName",
        width: 280,
        render: (text: string, record) => (
          <div>
            <div style={{ color: "#123443" }}>{text || "---"}</div>
            {record.ItemCode && (
              <div style={{ fontSize: 12, color: "#718894" }}>{record.ItemCode}</div>
            )}
          </div>
        ),
      },
      {
        title: t.table?.unit || (isEn ? "Unit" : "ĐVT"),
        dataIndex: "UomCode",
        key: "UomCode",
        width: 80,
        align: "center",
        render: (text: string) => text || "---",
      },
      {
        title: t.receipt?.colOrderQty || (isEn ? "Order Qty" : "SL đơn hàng"),
        dataIndex: "PO_Qnty",
        key: "PO_Qnty",
        width: 120,
        align: "right",
        render: (val: any) =>
          Number(val || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
      {
        title: t.receipt?.colReceivedQty || (isEn ? "Received Qty" : "SL Nhập kho"),
        dataIndex: "Total_Received_Qnty",
        key: "Total_Received_Qnty",
        width: 110,
        align: "right",
        render: (val: any) =>
          Number(val || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
      {
        title: t.receipt?.colRemainingQty || (isEn ? "Remaining Qty" : "SL còn lại"),
        dataIndex: "Remaining_Qnty",
        key: "Remaining_Qnty",
        width: 120,
        align: "right",
        render: (val: any) =>
          Number(val || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
      {
        title: isEn ? "Cancel Qty" : "SL Hủy",
        dataIndex: "Cancel_Qnty",
        key: "Cancel_Qnty",
        width: 140,
        align: "right",
        render: (val: any, record: PendingPoCancelItem) => {
          const key = getPoRowKey(record);
          return (
            <InputNumber
              min={0}
              max={Math.max(0, Number(record.Remaining_Qnty ?? 0))}
              value={val}
              onChange={(newVal) => handleCancelQntyChange(key, newVal)}
              style={{ width: "100%" }}
              precision={2}
              step={1}
              formatter={(value) => {
                if (value === undefined || value === null || value === "") return "";
                const parts = `${value}`.split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return parts.join(".");
              }}
              parser={(value) => (value ? value.replace(/,/g, "") : "")}
            />
          );
        },
      },
      {
        title: isEn ? "Cancel Reason" : "Lý do Hủy",
        dataIndex: "CancelReason",
        key: "CancelReason",
        width: 220,
        render: (val: string, record: PendingPoCancelItem) => {
          const key = getPoRowKey(record);
          return (
            <Input
              placeholder={isEn ? "Cancel reason..." : "Lý do hủy..."}
              value={val || ""}
              onChange={(e) => handleCancelReasonChange(key, e.target.value)}
              size="small"
              style={{ borderRadius: 4 }}
            />
          );
        },
      },
      {
        title: (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Checkbox
              checked={isAllCurrentPageSelected}
              indeterminate={isSomeCurrentPageSelected}
              onChange={(e) => handleToggleSelectAll(e.target.checked)}
            />
          </div>
        ),
        key: "selection",
        width: 60,
        align: "center" as const,
        fixed: "right" as const,
        cannotHide: true,
        render: (_val: any, record: PendingPoCancelItem) => {
          const key = getPoRowKey(record);
          const isSelected = selectedRowKeys.includes(key);
          return (
            <Checkbox
              checked={isSelected}
              onChange={(e) => {
                const checked = e.target.checked;
                setSelectedRowKeys((prev) =>
                  checked ? [...prev, key] : prev.filter((k) => k !== key)
                );
              }}
            />
          );
        },
      },
    ],
    [
      pagination.current,
      pagination.pageSize,
      items,
      selectedRowKeys,
      isAllCurrentPageSelected,
      isSomeCurrentPageSelected,
      t,
      isEn,
    ]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns<PendingPoCancelItem>({
    tableKey: "purchase_order_processing_table_v1",
    columns: rawColumns,
    defaultScrollX: 1820,
  });

  const historyColumns: ColumnType<CancelledPoHistoryItem>[] = useMemo(
    () => [
      {
        title: t.table?.stt || "STT",
        key: "stt",
        width: 60,
        align: "center",
        render: (_v, _r, idx) => idx + 1,
      },
      {
        title: isEn ? "PO No." : "Số đơn hàng PO",
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 190,
      },
      {
        title: isEn ? "Vendor" : "Nhà cung cấp",
        dataIndex: "ClientName",
        key: "ClientName",
        width: 220,
      },
      {
        title: isEn ? "Item Name" : "Tên vật tư",
        dataIndex: "ItemName",
        key: "ItemName",
        width: 260,
        render: (text: string, record) => (
          <div>
            <div style={{ color: "#123443" }}>{text || "---"}</div>
            {record.ItemCode && (
              <div style={{ fontSize: 12, color: "#718894" }}>{record.ItemCode}</div>
            )}
          </div>
        ),
      },
      {
        title: isEn ? "Unit" : "ĐVT",
        dataIndex: "UomCode",
        key: "UomCode",
        width: 80,
        align: "center",
      },
      {
        title: isEn ? "Cancelled Qty" : "SL đã hủy",
        dataIndex: "CancelledQty",
        key: "CancelledQty",
        width: 120,
        align: "right",
        render: (val: number) =>
          Number(val || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
      {
        title: isEn ? "Cancel Reason" : "Lý do Hủy",
        dataIndex: "CancelReason",
        key: "CancelReason",
        width: 220,
      },
      {
        title: isEn ? "Cancelled At" : "Thời gian hủy",
        dataIndex: "CancelledAt",
        key: "CancelledAt",
        width: 150,
        align: "center",
      },
      {
        title: isEn ? "Action" : "Thao tác",
        key: "action",
        width: 120,
        align: "center",
        fixed: "right",
        render: (_val, record) => (
          <Popconfirm
            title={isEn ? "Reopen this item?" : "Mở lại dòng vật tư này?"}
            description={
              isEn
                ? "Remaining quantity will be restored to the pending list."
                : "Số lượng hủy sẽ được hoàn lại về danh sách chờ xử lý."
            }
            onConfirm={() => handleReopenItem(record)}
            okText={isEn ? "Reopen" : "Mở lại"}
            cancelText={t.common?.cancel || "Hủy"}
          >
            <Button
              size="small"
              icon={<UndoOutlined />}
              style={{
                borderRadius: 6,
                borderColor: "#b2ded9",
                color: "#008f89",
                background: "#eef8f6",
                fontSize: 12.5,
              }}
            >
              {isEn ? "Reopen" : "Mở lại"}
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [t, isEn]
  );

  return (
    <ErpPageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "pending" | "history")}
        style={{ marginBottom: 8 }}
        items={[
          {
            key: "pending",
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconScale size={16} strokeWidth={1.8} />
                {isEn ? "Pending Orders" : "Đơn hàng chờ xử lý"}
              </span>
            ),
          },
          {
            key: "history",
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconHistory size={16} strokeWidth={1.8} />
                {isEn
                  ? `Cancelled History (${cancelledHistory.length})`
                  : `Lịch sử đã hủy (${cancelledHistory.length})`}
              </span>
            ),
          },
        ]}
      />

      {activeTab === "pending" ? (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Toolbar: Bộ lọc bên trái, Thao tác Xác nhận Hủy bên phải */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              gap: 12,
            }}
          >
            <Space size={10} wrap align="center" style={{ flex: 1 }}>
              <Select
                value={selectedWarehouseFilter}
                onChange={handleWarehouseChange}
                style={{ width: 220, height: 36 }}
                options={effectiveWarehouseOptions}
              />

              <Input
                placeholder={
                  t.receipt?.searchReconcilePlaceholder ||
                  (isEn
                    ? "Search PO, item code, item name, vendor..."
                    : "Tìm mã PO, mã VT, tên VT, nhà cung cấp...")
                }
                allowClear
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 260, height: 36, borderRadius: 8, fontSize: 13.5 }}
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              />

              <Button
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", fontSize: 13.5 }}
              >
                {t.common?.search || (isEn ? "Search" : "Tìm kiếm")}
              </Button>

              <Button
                icon={<ReloadOutlined style={{ color: "#008f89" }} />}
                onClick={handleRefresh}
                loading={loading}
                style={{
                  height: 36,
                  borderRadius: 8,
                  borderColor: "#dce5e6",
                  fontSize: 13.5,
                  color: "#334155",
                }}
              >
                {t.common?.refresh || (isEn ? "Refresh" : "Làm mới")}
              </Button>

              {selectedRowKeys.length > 0 && (
                <Tag
                  style={{
                    background: "#eef8f6",
                    color: "#008f89",
                    border: "1px solid #79c7bf",
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontWeight: 600,
                    lineHeight: "18px",
                    margin: 0,
                  }}
                >
                  {isEn
                    ? `Selected: ${selectedRowKeys.length} items`
                    : `Đã chọn: ${selectedRowKeys.length} dòng`}
                </Tag>
              )}
            </Space>

            <Space size={10} align="center">
              <Button
                type="primary"
                danger
                icon={<CloseCircleOutlined />}
                style={{
                  height: 36,
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 500,
                }}
                disabled={selectedRowKeys.length === 0}
                onClick={handleOpenConfirmCancel}
              >
                {isEn ? "Confirm Cancel" : "Xác nhận Hủy"}{" "}
                {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ""}
              </Button>
            </Space>
          </div>

          {/* Main Table (Full Canvas) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #dce5e6",
              borderRadius: 8,
              overflow: "hidden",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Table
              className="erp-full-table"
              components={{ header: { cell: ResizableTitle } }}
              rowKey={getPoRowKey}
              size="middle"
              columns={tableColumns}
              dataSource={items}
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (page, pageSize) => {
                  setSelectedRowKeys([]);
                  fetchPendingItems(page, pageSize, selectedWarehouseFilter, searchKeyword);
                },
                showTotal: (total, range) =>
                  `${range[0]}–${range[1]} / ${total} ${isEn ? "items" : "dòng vật tư"}`,
              }}
              scroll={{ x: scrollX, y: "100%" }}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #dce5e6",
            borderRadius: 8,
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Table
            className="erp-full-table"
            rowKey="CancelId"
            size="middle"
            columns={historyColumns}
            dataSource={cancelledHistory}
            pagination={false}
            scroll={{ x: 1400, y: "100%" }}
          />
        </div>
      )}

      {/* Modal Xác nhận Hủy (Wireframe tương tác - chờ map API) */}
      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#123443" }}>
            <IconBan size={18} strokeWidth={1.8} style={{ color: "#dc2626" }} />
            {isEn
              ? `Confirm Cancel Purchase Order Items (${selectedItems.length})`
              : `Xác nhận Hủy phần còn lại đơn hàng (${selectedItems.length} dòng)`}
          </span>
        }
        width={820}
        centered
        footer={[
          <Button key="close" onClick={() => setConfirmModalOpen(false)}>
            {t.common?.cancel || (isEn ? "Cancel" : "Đóng")}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={confirmingCancel}
            onClick={handleConfirmCancelWireframe}
          >
            {isEn ? "Confirm Cancel" : "Xác nhận Hủy"}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5, color: "#334155", marginBottom: 6 }}>
            {isEn
              ? "Common Cancel Reason (applied to rows without individual reason):"
              : "Lý do hủy chung (áp dụng cho các dòng chưa nhập lý do riêng):"}
          </div>
          <Input.TextArea
            rows={2}
            value={commonCancelReason}
            onChange={(e) => setCommonCancelReason(e.target.value)}
            placeholder={
              isEn
                ? "Enter reason for cancelling remaining PO quantity..."
                : "Nhập lý do hủy số lượng còn lại của đơn hàng..."
            }
          />
        </div>

        <Table
          size="small"
          bordered
          pagination={false}
          rowKey={getPoRowKey}
          dataSource={selectedItems}
          scroll={{ y: 260 }}
          columns={[
            {
              title: isEn ? "PO No." : "Số PO",
              dataIndex: "ContractCode",
              width: 150,
            },
            {
              title: isEn ? "Item" : "Vật tư",
              dataIndex: "ItemName",
              render: (text, r) => `${text || ""} (${r.ItemCode || ""})`,
            },
            {
              title: isEn ? "Remaining" : "SL còn lại",
              dataIndex: "Remaining_Qnty",
              width: 95,
              align: "right",
              render: (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }),
            },
            {
              title: isEn ? "Cancel Qty" : "SL Hủy",
              dataIndex: "Cancel_Qnty",
              width: 95,
              align: "right",
              render: (v) => (
                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                  {Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              title: isEn ? "Reason" : "Lý do Hủy",
              dataIndex: "CancelReason",
              width: 180,
              render: (v) =>
                (v || "").trim() ||
                commonCancelReason.trim() || (
                  <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                    {isEn ? "Required" : "Chưa nhập"}
                  </span>
                ),
            },
          ]}
        />
      </Modal>
    </ErpPageContainer>
  );
}
