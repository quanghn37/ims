"use client";

import React from "react";
import { Typography, Space } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useInventory } from "./_hooks/useInventory";
import InventoryTable from "./_components/InventoryTable";
import StockCardDrawer from "./_components/StockCardDrawer";
import { useTranslation } from "@/locales/LanguageContext";

const { Title, Text } = Typography;

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
    <div style={{ padding: "20px 24px", background: "#FFFFFF", borderRadius: 16, border: "1px solid #dce5e6", minHeight: "calc(100vh - 100px)", boxShadow: "0 1px 3px rgba(18, 52, 67, 0.04)" }}>
      {/* TIÊU ĐỀ TRANG */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <Space size={10} align="center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#eef8f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#008f89",
            }}
          >
            <InboxOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: "#123443", fontWeight: 700 }}>
              {t.inventory.title}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t.inventory.subtitle}
            </Text>
          </div>
        </Space>
      </div>

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
    </div>
  );
}
