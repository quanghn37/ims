"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import {
  InventoryBalanceItem,
  StockCardReportData,
} from "../../types";
import { purchaseOrdersApi } from "@/app/purchase-orders/api";
import { warehouseApi } from "../../api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import dayjs from "dayjs";

export function useInventory() {
  const [stockItems, setStockItems] = useState<InventoryBalanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | number>("ALL");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Giữ ref cho bộ lọc hiện tại để tránh đưa vào dependency của useCallback gây gọi API thừa mỗi khi gõ phím
  const searchKeywordRef = useRef(searchKeyword);
  searchKeywordRef.current = searchKeyword;
  const selectedWarehouseIdRef = useRef(selectedWarehouseId);
  selectedWarehouseIdRef.current = selectedWarehouseId;

  // Selected item & Stock Card Report Data
  const [selectedItemForCard, setSelectedItemForCard] = useState<any>(null);
  const [isStockCardOpen, setIsStockCardOpen] = useState(false);
  const [loadingStockCard, setLoadingStockCard] = useState(false);
  const [stockCardReport, setStockCardReport] = useState<StockCardReportData | null>(null);
  const [stockCardDateRange, setStockCardDateRange] = useState<[string, string]>([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().endOf("month").format("YYYY-MM-DD"),
  ]);

  // Tải danh mục Kho từ Backend (đã có cache ở tầng api-client)
  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await purchaseOrdersApi.getWarehouseList({
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList(data);
      if (list && list.length > 0) {
        setWarehouses(list);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách kho:", e);
    }
  }, []);

  // Gọi API lấy tồn kho tức thời: api/get-inventory-balance
  const fetchInventory = useCallback(
    async (
      page = 1,
      pageSize = 50,
      keyword = searchKeywordRef.current,
      whId = selectedWarehouseIdRef.current
    ) => {
      setLoading(true);
      try {
        const res = await warehouseApi.getInventoryBalance({
          WarehouseId: whId === "ALL" ? null : Number(whId),
          MaterialId: null,
          Keyword: keyword.trim(),
          OnlyAvailable: 1,
          PageNum: page,
          PageSize: pageSize,
        });

        const list = extractApiList<InventoryBalanceItem>(res);
        const total = extractTotalRows(res, list.length);
        setStockItems(list);
        setPagination({
          current: page,
          pageSize,
          total,
        });
      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu tồn kho tức thời:", err);
        message.error(err?.message || "Không thể tải dữ liệu tồn kho tức thời.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Chỉ gọi 1 lần duy nhất khi mở trang (không gọi lại mỗi khi gõ phím tìm kiếm)
  useEffect(() => {
    fetchWarehouses();
    fetchInventory(1, 50, "", "ALL");
  }, [fetchWarehouses, fetchInventory]);

  // Gọi API lấy Thẻ kho: api/get-inventory-stockcardreport
  const fetchStockCardReport = useCallback(
    async (item: any, fromDate: string, toDate: string) => {
      if (!item) return;
      const whId = item.WarehouseId ?? item.warehouseId;
      const matId = item.MaterialId ?? item.materialId;

      if (!whId || !matId) {
        message.warning("Không tìm thấy WarehouseId hoặc MaterialId để tra cứu Thẻ kho.");
        return;
      }

      setLoadingStockCard(true);
      try {
        const res = await warehouseApi.getInventoryStockCardReport({
          WarehouseId: whId,
          MaterialId: matId,
          FromDate: fromDate,
          ToDate: toDate,
          PageNum: 1,
          PageSize: 50,
        });

        const reportData: StockCardReportData = res?.Data || res;
        setStockCardReport(reportData);
      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu Thẻ kho:", err);
        message.error(err?.message || "Không thể tải dữ liệu Thẻ kho.");
        setStockCardReport(null);
      } finally {
        setLoadingStockCard(false);
      }
    },
    []
  );

  // Mở Thẻ kho cho 1 mặt hàng
  const openStockCard = useCallback(
    (item: any) => {
      setSelectedItemForCard(item);
      setIsStockCardOpen(true);
      const fromDate = stockCardDateRange[0] || "2026-10-01";
      const toDate = stockCardDateRange[1] || "2026-10-31";
      fetchStockCardReport(item, fromDate, toDate);
    },
    [fetchStockCardReport, stockCardDateRange]
  );

  // Đổi khoảng ngày trong Thẻ kho
  const changeStockCardDateRange = useCallback(
    (fromDate: string, toDate: string) => {
      setStockCardDateRange([fromDate, toDate]);
      if (selectedItemForCard) {
        fetchStockCardReport(selectedItemForCard, fromDate, toDate);
      }
    },
    [fetchStockCardReport, selectedItemForCard]
  );

  const closeStockCard = useCallback(() => {
    setIsStockCardOpen(false);
    setSelectedItemForCard(null);
    setStockCardReport(null);
  }, []);

  const refreshInventory = useCallback(async () => {
    await fetchInventory(1, pagination.pageSize, searchKeywordRef.current, selectedWarehouseIdRef.current);
    message.success("Đã làm mới dữ liệu tồn kho tức thời!");
  }, [fetchInventory, pagination.pageSize]);

  return {
    stockItems,
    loading,
    searchKeyword,
    setSearchKeyword,
    selectedWarehouseId,
    setSelectedWarehouseId,
    warehouses,
    pagination,
    selectedItemForCard,
    isStockCardOpen,
    loadingStockCard,
    stockCardReport,
    stockCardDateRange,
    openStockCard,
    closeStockCard,
    changeStockCardDateRange,
    refreshInventory,
    fetchInventory,
  };
}
