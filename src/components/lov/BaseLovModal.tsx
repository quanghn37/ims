"use client";

import React, { useMemo } from "react";
import { Modal, Table, Input, Button, Space, Typography } from "antd";
import { IconSearch, IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "@/locales/LanguageContext";
import { ResizableTitle } from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";

const { Text } = Typography;

export interface BaseLovModalProps<T = any> {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  searchPlaceholder?: string;
  searchInput: string;
  setSearchInput: (v: string) => void;
  onSearch: (keyword: string) => void;
  onSelectRow: (record: T) => void;
  dataSource: T[];
  loading: boolean;
  columns: any[];
  rowKey?: (record: T, index?: number) => React.Key;
  width?: number;
  primaryColor?: string;
  pagination?: any;
  zIndex?: number;
  tableKey?: string;
}

export function BaseLovModal<T = any>({
  open,
  onClose,
  title,
  icon,
  searchPlaceholder,
  searchInput,
  setSearchInput,
  onSearch,
  onSelectRow,
  dataSource,
  loading,
  columns,
  rowKey,
  width = 1100,
  primaryColor = "#008f89",
  pagination,
  zIndex = 1300,
  tableKey,
}: BaseLovModalProps<T>) {
  const { t } = useTranslation();
  const effectivePlaceholder = searchPlaceholder || t.lov.defaultSearchPlaceholder;

  const resolvedTableKey = useMemo(() => {
    if (tableKey) return tableKey;
    const colSignature = columns
      .map((c: any, idx: number) => String(c?.key ?? c?.dataIndex ?? `c${idx}`))
      .join("_");
    return `lov_${colSignature}`;
  }, [tableKey, columns]);

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: resolvedTableKey,
    columns,
    defaultScrollX: Math.max(width - 48, 700),
    minColumnWidth: 60,
  });

  const defaultRowKey = (record: any, index?: number): React.Key => {
    if (typeof rowKey === "function") {
      const key = rowKey(record, index);
      if (key !== undefined && key !== null && key !== "") return key;
    }
    return (
      record.ClientId ??
      record.CompanyId ??
      record.ContractId ??
      record.MainContractId ??
      record.WarehouseId ??
      record.Id ??
      record.id ??
      `lov_item_${index ?? 0}`
    );
  };

  return (
    <Modal
      title={
        <Space>
          {icon}
          <Text strong style={{ fontSize: 16 }}>
            {title}
          </Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={width}
      centered
      style={{ maxWidth: "calc(100vw - 48px)" }}
      footer={null}
      destroyOnClose
      zIndex={zIndex}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            placeholder={effectivePlaceholder}
            prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (e.target.value === "") {
                onSearch("");
              }
            }}
            onPressEnter={() => onSearch(searchInput)}
            allowClear
          />
          <Button
            type="primary"
            icon={<IconSearch size={16} strokeWidth={1.8} />}
            style={{ background: primaryColor, borderColor: primaryColor }}
            onClick={() => onSearch(searchInput)}
            loading={loading}
          >
            {t.lov.search}
          </Button>
          <Button
            icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: primaryColor }} />}
            onClick={() => {
              setSearchInput("");
              onSearch("");
            }}
          >
            {t.lov.refresh}
          </Button>
        </div>

        <Table
          size="small"
          tableLayout="fixed"
          components={{ header: { cell: ResizableTitle } }}
          loading={loading}
          dataSource={dataSource}
          rowKey={defaultRowKey}
          scroll={{ x: scrollX }}
          pagination={pagination ?? { pageSize: 8, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              // Nếu người dùng bấm trực tiếp vào nút bấm "Chọn" hoặc thẻ a, dừng lại để nút tự xử lý sự kiện ngắt bọt
              if (target.closest("button") || target.closest("a") || target.closest(".ant-btn")) {
                return;
              }
              onSelectRow(record);
            },
            style: { cursor: "pointer" },
          })}
          columns={tableColumns}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t.lov.tip}
          </Text>
          <Button onClick={onClose}>{t.lov.close}</Button>
        </div>
      </div>
    </Modal>
  );
}

export default BaseLovModal;
