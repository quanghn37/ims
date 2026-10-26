"use client";

import React from "react";
import { useInventory } from "./_hooks/useInventory";
import InventoryTable from "./_components/InventoryTable";
import StockCardDrawer from "./_components/StockCardDrawer";
import { useTranslation } from "@/locales/LanguageContext";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";

export default function InventoryPage() {
  const { t } = useTranslation();
  const {
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
  } = useInventory();

  return (
    <ErpPageContainer>
      {/* BẢNG TỒN KHO TỨC THỜI */}
      <InventoryTable
        items={stockItems}
        loading={loading}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        selectedWarehouseId={selectedWarehouseId}
        setSelectedWarehouseId={setSelectedWarehouseId}
        warehouses={warehouses}
        pagination={pagination}
        onOpenStockCard={openStockCard}
        onRefresh={refreshInventory}
        onPageChange={(page, pageSize, whIdOverride) => {
          fetchInventory(page, pageSize, searchKeyword, whIdOverride ?? selectedWarehouseId);
        }}
      />

      {/* DRAWER TRA CỨU THẺ KHO */}
      <StockCardDrawer
        open={isStockCardOpen}
        onClose={closeStockCard}
        item={selectedItemForCard}
        data={stockCardReport}
        loading={loadingStockCard}
        dateRange={stockCardDateRange}
        onDateRangeChange={changeStockCardDateRange}
        onRefresh={() => {
          if (selectedItemForCard) {
            changeStockCardDateRange(stockCardDateRange[0], stockCardDateRange[1]);
          }
        }}
      />
    </ErpPageContainer>
  );
}
