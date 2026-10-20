"use client";

import React, { useMemo } from "react";
import { Button, Typography } from "antd";
import { IconBuildingWarehouse } from "@tabler/icons-react";
import BaseLovModal from "@/components/lov/BaseLovModal";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

export interface WarehouseItem {
  id?: string | number;
  Id?: string | number;
  WarehouseCode?: string;
  WarehouseName: string;
  Address?: string;
}

export interface WarehouseLovModalProps {
  open: boolean;
  onClose: () => void;
  warehouseList: WarehouseItem[];
  loadingWarehouses: boolean;
  warehouseSearchInput: string;
  setWarehouseSearchInput: (v: string) => void;
  onSearchWarehouses: (keyword: string) => void;
  onSelectWarehouse: (record: WarehouseItem) => void;
}

export default function WarehouseLovModal({
  open,
  onClose,
  warehouseList,
  loadingWarehouses,
  warehouseSearchInput,
  setWarehouseSearchInput,
  onSearchWarehouses,
  onSelectWarehouse,
}: WarehouseLovModalProps) {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      {
        title: t.lov.colWarehouseCode,
        dataIndex: "WarehouseCode",
        key: "WarehouseCode",
        width: 110,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 500 }}>
            {val || r.Code || `WH-${r.Id || r.id || ""}`}
          </span>
        ),
      },
      {
        title: t.lov.colWarehouseName,
        dataIndex: "WarehouseName",
        key: "WarehouseName",
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || r.Name || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colWarehouseAddress,
        dataIndex: "Address",
        key: "Address",
        render: (val: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colAction,
        key: "action",
        width: 80,
        align: "center" as const,
        render: (_: any, record: WarehouseItem) => (
          <Button
            type="primary"
            size="small"
            style={{ background: "#008f89", borderColor: "#008f89", borderRadius: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectWarehouse(record);
            }}
          >
            {t.lov.select}
          </Button>
        ),
      },
    ],
    [onSelectWarehouse, t]
  );

  return (
    <BaseLovModal
      open={open}
      onClose={onClose}
      title={t.lov.warehouseTitle}
      icon={<IconBuildingWarehouse size={20} strokeWidth={1.8} style={{ color: "#008f89" }} />}
      searchPlaceholder={t.lov.warehouseSearchPlaceholder}
      searchInput={warehouseSearchInput}
      setSearchInput={setWarehouseSearchInput}
      onSearch={onSearchWarehouses}
      onSelectRow={onSelectWarehouse}
      dataSource={warehouseList}
      loading={loadingWarehouses}
      columns={columns}
      rowKey={(r, index) => r.Id ?? r.id ?? `wh_${index}`}
      width={750}
      primaryColor="#008f89"
    />
  );
}
