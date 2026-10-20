import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { purchaseOrdersApi } from "../api";
import { ContractItem } from "@/types";

type PaginationState = { current: number; pageSize: number; total: number };

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 10, total: 0 });

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

  const filteredOrders = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order: any) => {
      const searchFields = [
        order.ContractCode,
        order.ContractId,
        order.Description,
        order.Venname,
        order.ClientName,
        order.ParentContractCode,
        order.ParentCode,
        order.SourceContractCode,
        order.CreatedBy,
      ];
      return searchFields.some((field) => field && String(field).toLowerCase().includes(keyword));
    });
  }, [orders, searchKeyword]);

  return { orders, loading, searchKeyword, setSearchKeyword, pagination, fetchOrders, filteredOrders };
}
