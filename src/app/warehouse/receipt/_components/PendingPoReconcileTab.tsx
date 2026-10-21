"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Tag,
  Space,
  Typography,
  Card,
  message,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FileSyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { warehouseApi } from "../../api";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import { useTranslation } from "@/locales/LanguageContext";

const { Title, Text } = Typography;

export interface PendingPoItem {
  RowNum?: number;
  WarehouseId?: number;
  WarehouseCode?: string;
  WarehouseName?: string;
  ContractId?: number;
  ContractCode?: string;
  ContractDate?: string;
  SubconOf?: number;
  SubconCode?: string;
  ClientID?: number;
  ClientName?: string;
  VenCode?: string;
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
  Suggested_Qnty?: number;
  Remarks?: string;
  Orgcode?: string;
  OrgCode?: string;
  OrgName?: string;
  Orgname?: string;
  WBS?: string;
  [key: string]: any;
}

interface PendingPoReconcileTabProps {
  warehouseOptions?: Array<{ value: string | number; label: string }>;
  onReceiptCreated?: (transaction: any, sourceItem?: PendingPoItem) => void;
}

export const getPendingPoRowKey = (record: PendingPoItem): string => {
  return String(
    record.SourceSubmissionId ??
      `${record.ContractId}_${record.MaterialId}_${record.RowNum}`
  );
};

export default function PendingPoReconcileTab({
  warehouseOptions = [],
  onReceiptCreated,
}: PendingPoReconcileTabProps) {
  const { t, language } = useTranslation();
  const isEn = language === "en";

  const [items, setItems] = useState<PendingPoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingReceipt, setCreatingReceipt] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string | number>("ALL");
  const [startProcessNow, setStartProcessNow] = useState(true); // Checkbox Trình duyệt (mặc định Yes)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Checkbox lựa chọn 1 hoặc nhiều dòng
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Tự động tải danh mục kho từ API nếu parent chưa truyền danh sách
  const [internalWarehouses, setInternalWarehouses] = useState<Array<{ value: string | number; label: string }>>([]);

  useEffect(() => {
    if (warehouseOptions.filter((w) => w.value !== "ALL").length === 0) {
      warehouseApi
        .getWarehouseList({ PageNum: 1, PageSize: 100 })
        .then((data) => {
          const list = extractApiList<any>(data);
          if (list && list.length > 0) {
            setInternalWarehouses(
              list.map((w: any) => ({
                value: w.WarehouseId ?? w.id ?? w.Id,
                label: w.WarehouseName || w.Name || w.warehouseName || (isEn ? `Warehouse #${w.WarehouseId}` : `Kho #${w.WarehouseId}`),
              }))
            );
          }
        })
        .catch((err) => console.error("Lỗi tải danh mục kho:", err));
    }
  }, [warehouseOptions, isEn]);

  const effectiveWarehouseOptions = useMemo(() => {
    const allLabel = t.receipt?.allWarehouses || (isEn ? "All Warehouses" : "Tất cả kho nhập");
    const fromProps = warehouseOptions.filter((w) => w.value !== "ALL");
    if (fromProps.length > 0) {
      return [
        { value: "ALL", label: allLabel },
        ...fromProps,
      ];
    }
    return [
      { value: "ALL", label: allLabel },
      ...internalWarehouses,
    ];
  }, [warehouseOptions, internalWarehouses, t.receipt, isEn]);

  // ---------------------------------------------------------------------------
  // Load data from API: api/get-pendinginventory-po
  // ---------------------------------------------------------------------------
  const fetchPendingItems = useCallback(
    async (
      page = 1,
      pageSize = 20,
      whFilter: string | number = selectedWarehouseFilter,
      search: string = searchKeyword
    ) => {
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

        const rawList = extractApiList<PendingPoItem>(data);
        const list = rawList.map((item) => ({
          ...item,
          Suggested_Qnty:
            item.Suggested_Qnty !== undefined && item.Suggested_Qnty !== null
              ? Number(item.Suggested_Qnty)
              : Number(item.Remaining_Qnty ?? 0),
          Remarks: item.Remarks || "",
        }));

        setItems(list);
        const total = extractTotalRows(data, list.length);
        setPagination({
          current: Number(data?.PageNum || page),
          pageSize: Number(data?.PageSize || pageSize),
          total,
        });
      } catch (err: any) {
        console.error("Lỗi tải danh sách đối chiếu đơn hàng:", err);
        message.error(err?.message || (isEn ? "Failed to load reconcile PO items" : "Không thể tải danh sách đối chiếu đơn hàng"));
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedWarehouseFilter, searchKeyword]
  );

  useEffect(() => {
    fetchPendingItems(1, pagination.pageSize);
  }, []); // Initial load

  const handleSearch = () => {
    fetchPendingItems(1, pagination.pageSize, selectedWarehouseFilter, searchKeyword);
  };

  const handleWarehouseChange = (val: string | number) => {
    setSelectedWarehouseFilter(val);
    fetchPendingItems(1, pagination.pageSize, val, searchKeyword);
  };

  const handleRefresh = () => {
    fetchPendingItems(pagination.current, pagination.pageSize, selectedWarehouseFilter, searchKeyword);
  };

  // Cập nhật giá trị số lượng gợi ý nhập
  const handleSuggestedQntyChange = (key: string, val: number | null) => {
    setItems((prev) =>
      prev.map((item) => {
        if (getPendingPoRowKey(item) === key) {
          return {
            ...item,
            Suggested_Qnty: val !== null && val !== undefined ? val : 0,
          };
        }
        return item;
      })
    );
  };

  // Cập nhật giá trị ghi chú
  const handleRemarksChange = (key: string, val: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (getPendingPoRowKey(item) === key) {
          return {
            ...item,
            Remarks: val,
          };
        }
        return item;
      })
    );
  };

  // ---------------------------------------------------------------------------
  // Bấm nút "Tạo Phiếu Nhập" gọi POST api/create-inventory-receipt
  // ---------------------------------------------------------------------------
  const handleBatchCreateReceipt = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t.receipt?.selectAtLeastOneItem || (isEn ? "Please select at least 1 item to create a receipt!" : "Vui lòng chọn ít nhất 1 dòng vật tư để tạo phiếu nhập!"));
      return;
    }

    const selectedItems = items.filter((item) =>
      selectedRowKeys.includes(getPendingPoRowKey(item))
    );

    if (selectedItems.length === 0) {
      message.warning(isEn ? "No selected items found!" : "Không tìm thấy dữ liệu dòng vật tư được chọn!");
      return;
    }

    // 1. Kiểm tra nếu chọn các dòng thuộc các PO khác nhau
    const uniquePos = Array.from(
      new Set(selectedItems.map((i) => i.ContractCode || i.ContractId).filter(Boolean))
    );
    if (uniquePos.length > 1) {
      message.warning(
        isEn
          ? `You are selecting items from ${uniquePos.length} different purchase orders (${uniquePos.join(", ")}). Please select items from the same PO to create a receipt.`
          : `Bạn đang chọn vật tư từ ${uniquePos.length} đơn hàng khác nhau (${uniquePos.join(
              ", "
            )}). Vui lòng chỉ chọn các dòng trong cùng 1 đơn hàng PO để tạo phiếu nhập.`
      );
      return;
    }

    // 2. Kiểm tra số lượng nhập > 0
    const invalidQtyItem = selectedItems.find(
      (i) => i.Suggested_Qnty === undefined || i.Suggested_Qnty === null || Number(i.Suggested_Qnty) <= 0
    );
    if (invalidQtyItem) {
      message.warning(
        isEn
          ? `Receipt quantity of item "${invalidQtyItem.ItemName || invalidQtyItem.ItemCode}" must be greater than 0!`
          : `Số lượng nhập của vật tư "${invalidQtyItem.ItemName || invalidQtyItem.ItemCode}" phải lớn hơn 0!`
      );
      return;
    }

    // 2.1 Kiểm tra Orgcode bắt buộc nhập, không được để trống / null
    const missingOrgItem = selectedItems.find(
      (i) => !(i.Orgcode || i.OrgCode || i.WBS || i.Wbs || "").trim()
    );
    if (missingOrgItem) {
      message.warning(
        isEn
          ? `Item "${missingOrgItem.ItemName || missingOrgItem.ItemCode}" is missing Orgcode. Orgcode is required, cannot be empty!`
          : `Vật tư "${missingOrgItem.ItemName || missingOrgItem.ItemCode}" chưa có Orgcode. Orgcode là bắt buộc, không được để trống!`
      );
      return;
    }

    const first = selectedItems[0];
    const contractId = first.ContractId;
    if (!contractId) {
      message.error(isEn ? "ContractId not found for selected purchase order!" : "Không tìm thấy ContractId của đơn hàng đã chọn!");
      return;
    }

    // 3. Chuẩn bị payload Items theo đúng định dạng API yêu cầu
    const payloadItems = selectedItems.map((item) => ({
      MaterialId: item.MaterialId ?? 0,
      SourceSubmissionId: item.SourceSubmissionId ?? 0,
      SubmissionName: item.ItemName || item.SubmissionName || "",
      Qnty: Number(item.Suggested_Qnty),
      Orgcode: item.Orgcode || item.OrgCode || item.WBS || item.Wbs || "",
      Orgname: item.Orgname || item.OrgName || item.BudgetDescription || "",
      OrgName: item.Orgname || item.OrgName || item.BudgetDescription || "",
      Remarks: (item.Remarks || "").trim() || (isEn ? "Receipt from PO" : "Nhập kho theo PO"),
    }));

    setCreatingReceipt(true);
    try {
      const res = await warehouseApi.createInventoryReceiptFromPoItems({
        ContractId: contractId,
        StartProcessNow: startProcessNow ? "Yes" : "No",
        WSId: "",
        Items: payloadItems,
      });

      message.success(
        res?.Message ||
          (isEn
            ? `Successfully created goods receipt from selected items of PO ${first.ContractCode || contractId}!`
            : `Đã tạo thành công phiếu nhập kho từ các vật tư được chọn của đơn hàng ${first.ContractCode || contractId}!`)
      );

      // Xóa các dòng đã chọn
      setSelectedRowKeys([]);

      // Tải lại danh sách đối chiếu để cập nhật số lượng còn lại
      fetchPendingItems(pagination.current, pagination.pageSize, selectedWarehouseFilter, searchKeyword);

      // Thông báo cho component cha cập nhật danh sách phiếu nhập
      const newTransaction = res?.Data?.Transactions?.[0] || res?.Data;
      onReceiptCreated?.(newTransaction, first);
    } catch (err: any) {
      console.error("Lỗi tạo phiếu nhập kho từ đơn hàng PO:", err);
      message.error(err?.message || (isEn ? "Failed to create goods receipt!" : "Tạo phiếu nhập kho thất bại!"));
    } finally {
      setCreatingReceipt(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Checkbox Selection Logic (Cột chọn bên phải)
  // ---------------------------------------------------------------------------
  const isAllCurrentPageSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => selectedRowKeys.includes(getPendingPoRowKey(item)));
  }, [items, selectedRowKeys]);

  const isSomeCurrentPageSelected = useMemo(() => {
    return (
      items.some((item) => selectedRowKeys.includes(getPendingPoRowKey(item))) &&
      !isAllCurrentPageSelected
    );
  }, [items, selectedRowKeys, isAllCurrentPageSelected]);

  const handleToggleSelectAll = (checked: boolean) => {
    const currentPageKeys = items.map(getPendingPoRowKey);
    if (checked) {
      setSelectedRowKeys((prev) => Array.from(new Set([...prev, ...currentPageKeys])));
    } else {
      setSelectedRowKeys((prev) => prev.filter((k) => !currentPageKeys.includes(String(k))));
    }
  };

  // ---------------------------------------------------------------------------
  // Table Columns Definition
  // ---------------------------------------------------------------------------
  const rawColumns: (ColumnType<PendingPoItem> & { cannotHide?: boolean })[] = useMemo(
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
                {isEn ? "Code: " : "Mã kho: "}{record.WarehouseCode}
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
                {isEn ? "Date: " : "Ngày: "}{dayjs(record.ContractDate).format("DD/MM/YYYY")}
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
              <div style={{ fontSize: 12, color: "#718894" }}>
                {record.ClientName}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Orgcode",
        dataIndex: "Orgcode",
        key: "Orgcode",
        width: 220,
        render: (val: any, record: PendingPoItem) => {
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
            return (
              <span style={{ color: "#123443", fontSize: 13 }}>
                {orgCode}
              </span>
            );
          }

          return (
            <div>
              <div style={{ color: "#123443", fontSize: 13, lineHeight: "17px" }}>
                {orgName}
              </div>
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
              <div style={{ fontSize: 12, color: "#718894" }}>
                {record.ItemCode}
              </div>
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
      /*
      {
        title: "Đơn giá",
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        width: 120,
        align: "right",
        render: (val: any) =>
          val !== undefined && val !== null ? `${Number(val).toLocaleString("vi-VN")} ₫` : "---",
      },
      {
        title: "VAT",
        dataIndex: "TaxRate",
        key: "TaxRate",
        width: 80,
        align: "center",
        render: (val: any) =>
          val !== undefined && val !== null
            ? `${(Number(val) * 100).toFixed(0)}%`
            : "---",
      },
      */
      {
        title: t.receipt?.colOrderQty || (isEn ? "Order Qty" : "SL đơn hàng"),
        dataIndex: "PO_Qnty",
        key: "PO_Qnty",
        width: 120,
        align: "right",
        render: (val: any) =>
          Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        title: t.receipt?.colReceivedQty || (isEn ? "Received Qty" : "SL Nhập kho"),
        dataIndex: "Total_Received_Qnty",
        key: "Total_Received_Qnty",
        width: 110,
        align: "right",
        render: (val: any) =>
          Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        title: t.receipt?.colRemainingQty || (isEn ? "Remaining Qty" : "SL còn lại"),
        dataIndex: "Remaining_Qnty",
        key: "Remaining_Qnty",
        width: 120,
        align: "right",
        render: (val: any) =>
          Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        title: t.receipt?.colReceiptQty || (isEn ? "Receipt Qty" : "SL Nhập"),
        dataIndex: "Suggested_Qnty",
        key: "Suggested_Qnty",
        width: 140,
        align: "right",
        render: (val: any, record: PendingPoItem) => {
          const key = getPendingPoRowKey(record);
          return (
            <InputNumber
              min={0}
              value={val}
              onChange={(newVal) => handleSuggestedQntyChange(key, newVal)}
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
        title: t.table?.remarks || (isEn ? "Remarks" : "Ghi chú"),
        dataIndex: "Remarks",
        key: "Remarks",
        width: 200,
        render: (val: string, record: PendingPoItem) => {
          const key = getPendingPoRowKey(record);
          return (
            <Input
              placeholder={t.receipt?.receiptNotePlaceholder || (isEn ? "Receipt note..." : "Ghi chú nhập...")}
              value={val || ""}
              onChange={(e) => handleRemarksChange(key, e.target.value)}
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
        render: (_val: any, record: PendingPoItem) => {
          const key = getPendingPoRowKey(record);
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

  const { tableColumns, scrollX } = usePersistedTableColumns<PendingPoItem>({
    tableKey: "warehouse_pending_po_table_v8",
    columns: rawColumns,
    defaultScrollX: 1800,
  });

  return (
    <div style={{ padding: 24 }}>
      {/* 1. Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Space align="center" size={12}>
          <Title
            level={4}
            style={{
              margin: 0,
              color: "#1f1f1f",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FileSyncOutlined style={{ color: "#722ed1" }} />{" "}
            {t.receipt?.reconcileTitle || (isEn ? "Reconcile Purchase Orders (Pending Items)" : "Đối chiếu đơn hàng PO (Pending Items)")}
          </Title>
          <Tag color="purple" style={{ fontSize: 13, padding: "2px 10px", borderRadius: 12 }}>
            {pagination.total || items.length}{" "}
            {t.receipt?.pendingItemsCount || (isEn ? "items pending receipt" : "vật tư chờ nhập")}
          </Tag>
          {selectedRowKeys.length > 0 && (
            <Tag color="cyan" style={{ fontSize: 13, padding: "2px 10px", borderRadius: 12, fontWeight: 600 }}>
              {isEn ? `Selected: ${selectedRowKeys.length} items` : `Đã chọn: ${selectedRowKeys.length} dòng`}
            </Tag>
          )}
        </Space>
      </div>

      {/* 2. Toolbar: Bộ lọc bên trái, Thao tác tạo phiếu bên phải */}
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
        {/* Cụm bộ lọc bên trái */}
        <Space size={8} wrap align="center">
          <Select
            value={selectedWarehouseFilter}
            onChange={handleWarehouseChange}
            style={{ width: 220 }}
            options={effectiveWarehouseOptions}
          />

          <Input
            placeholder={t.receipt?.searchReconcilePlaceholder || (isEn ? "Search PO, item code, item name, vendor..." : "Tìm mã PO, mã VT, tên VT, nhà cung cấp...")}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260 }}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />

          <Button icon={<SearchOutlined />} onClick={handleSearch}>
            {t.common?.search || (isEn ? "Search" : "Tìm kiếm")}
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            {t.common?.refresh || (isEn ? "Refresh" : "Làm mới")}
          </Button>
        </Space>

        {/* Cụm thao tác đưa sang sát mép bên phải */}
        <Space size={12} align="center">
          <Checkbox
            checked={startProcessNow}
            onChange={(e) => setStartProcessNow(e.target.checked)}
            style={{ fontWeight: 500, color: "#123443" }}
          >
            {t.receipt?.submitForApproval || (isEn ? "Submit for approval" : "Trình duyệt")}
          </Checkbox>

          {/* Nút Tạo Phiếu Nhập gọi POST api/create-inventory-receipt */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: selectedRowKeys.length > 0 ? "#008f89" : undefined,
              borderColor: selectedRowKeys.length > 0 ? "#008f89" : undefined,
              fontWeight: 600,
            }}
            disabled={selectedRowKeys.length === 0}
            loading={creatingReceipt}
            onClick={handleBatchCreateReceipt}
          >
            {t.receipt?.createReceiptFromPo || (isEn ? "Create Goods Receipt" : "Tạo Phiếu Nhập")}{" "}
            {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ""}
          </Button>
        </Space>
      </div>

      {/* Main Table */}
      <Card
        bodyStyle={{ padding: 0 }}
        bordered={false}
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <Table
          components={{ header: { cell: ResizableTitle } }}
          rowKey={getPendingPoRowKey}
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
              fetchPendingItems(page, pageSize, selectedWarehouseFilter, searchKeyword);
            },
            showTotal: (total) =>
              isEn ? `Total ${total} order items` : `Tổng cộng ${total} dòng vật tư đơn hàng`,
          }}
          scroll={{ x: scrollX }}
        />
      </Card>
    </div>
  );
}
