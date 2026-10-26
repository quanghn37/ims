import { useEffect, useState } from "react";
import { message } from "antd";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useColumnFiltering } from "@/lib/table-utils";
import { purchaseOrdersApi } from "../api";
import { ContractItem } from "@/types";

type PaginationState = { current: number; pageSize: number; total: number };

export const purchaseOrderColumnFields: Record<string, string[]> = {
  ContractCode: ["ContractCode", "Contractcode", "Code"],
  Description: ["Description", "Remarks"],
  Venname: ["Venname", "ClientName", "ClientId", "VendorName"],
  ParentId: ["ParentContractCode", "ParentCode", "SubconCode", "ContractRefCode", "ParentId"],
  SourceId: ["SourceContractCode", "SourceCode", "QuotationCode", "SourceId"],
  WarehouseName: ["WarehouseName", "WarehouseId"],
  StatusName: ["StatusName", "Status", "StatusCode"],
  CreatedBy: ["CreatedBy", "Createdby"],
};

const getOrderSearchValues = (order: any) => [
  order.ContractCode,
  order.ContractId,
  order.Description,
  order.Venname,
  order.ClientName,
  order.ParentContractCode,
  order.ParentCode,
  order.SourceContractCode,
  order.WarehouseName,
  order.StatusName,
  order.Status,
  order.CreatedBy,
];

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 10, total: 0 });

  const {
    columnFilters,
    setColumnFilters,
    columnSuggestions,
    filteredRows: filteredOrders,
    isFiltering,
  } = useColumnFiltering({
    rows: orders,
    fields: purchaseOrderColumnFields,
    searchKeyword,
    getSearchValues: getOrderSearchValues,
  });

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const data = await purchaseOrdersApi.getPurchaseOrders({
        DisplayMode: "purchase_order",
        ClientId: "",
        WSId: "",
        PageNum: page,
        PageSize: pageSize,
      });
      const list = extractApiList<ContractItem>(data);
      setOrders(list);
      setPagination({ current: page, pageSize, total: extractTotalRows(data, list.length) });
    } catch (e: any) {
      message.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
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
  };
}
