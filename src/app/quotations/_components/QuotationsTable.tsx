import { useMemo } from "react";
import { Button, Input, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  IconSearch,
  IconCircleX,
  IconRefresh,
  IconPlus,
} from "@tabler/icons-react";
import { ContractItem } from "@/types";
import ResizableTitle from "@/components/table/ResizableTitle";
import ColumnFilterDropdown from "@/components/table/ColumnFilterDropdown";
import { usePersistedColumnWidths } from "@/lib/table-utils";
import { quotationColumnFields } from "../_hooks/useQuotations";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;
type PaginationState = { current: number; pageSize: number; total: number };

interface QuotationsTableProps {
  filteredQuotations: ContractItem[];
  storageKey: string;
  loading: boolean;
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  columnFilters: Record<string, string>;
  setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  isFiltering: boolean;
  columnSuggestions: Record<string, string[]>;
  onRefresh: (page: number, pageSize: number) => void;
  onCreate: () => void;
  onEdit: (record: ContractItem) => void;
  onDelete: (contractId: ContractItem["ContractId"]) => void;
}

export default function QuotationsTable({
  filteredQuotations,
  storageKey,
  loading,
  searchKeyword,
  setSearchKeyword,
  columnFilters,
  setColumnFilters,
  pagination,
  setPagination,
  isFiltering,
  columnSuggestions,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: QuotationsTableProps) {
  const { t } = useTranslation();

  const initialColumns = useMemo(() => [
    {
      title: t.quotation.code,
      dataIndex: "ContractCode",
      key: "ContractCode",
      width: 160,
      render: (value: any, record: ContractItem) => (
        <span
          onClick={() => onEdit(record)}
          style={{
            cursor: "pointer",
            fontWeight: 600,
            color: "#008f89",
            fontFamily: "monospace",
            fontSize: 13,
          }}
          title="Bấm để xem chi tiết"
        >
          {value || "---"}
        </span>
      ),
    },
    {
      title: t.quotation.name,
      dataIndex: "Description",
      key: "Description",
      width: 260,
      render: (value: string) => (
        <span style={{ color: "#123443", fontSize: 13 }}>
          {value || "Bảng giá vật tư NCC"}
        </span>
      ),
    },
    {
      title: t.quotation.vendor,
      dataIndex: "Venname",
      key: "Venname",
      width: 220,
      render: (_: any, record: any) => (
        <span style={{ color: "#123443", fontSize: 13 }}>
          {record.Venname || "---"}
        </span>
      ),
    },
    {
      title: t.quotation.mainContract,
      dataIndex: "MainContractCode",
      key: "MainContractCode",
      width: 180,
      render: (_: any, record: any) => {
        const text = record.MainContractCode || record.MainContractName || (record.MainContractId ? `#${record.MainContractId}` : "");
        return text ? (
          <span style={{ color: "#123443", fontSize: 13 }}>{text}</span>
        ) : (
          <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>
        );
      },
    },
    {
      title: t.table.effectiveDate,
      dataIndex: "EffectiveDate",
      key: "EffectiveDate",
      width: 140,
      render: (_: any, record: ContractItem) => (
        <span style={{ color: "#718894", fontSize: 13, whiteSpace: "nowrap" }}>
          {record.StartDate && record.StartDate !== "01-01-1900" ? record.StartDate : "---"}
        </span>
      ),
    },
    {
      title: t.table.createdDate,
      dataIndex: "Contractdate",
      key: "Contractdate",
      width: 130,
      render: (value: string) => (
        <span style={{ color: "#718894", fontSize: 13, whiteSpace: "nowrap" }}>
          {value || "---"}
        </span>
      ),
    },
    {
      title: t.table.creator,
      dataIndex: "CreatedBy",
      key: "CreatedBy",
      width: 130,
      render: (value: string) => (
        <span style={{ color: "#718894", fontSize: 13 }}>
          {value || "Hệ thống"}
        </span>
      ),
    },
  ], [onEdit, t]);

  const { columns, handleResizeColumn } = usePersistedColumnWidths(initialColumns, storageKey);

  const mergedColumns = useMemo(() => columns.map((column, index) => {
    const key = column.key || column.dataIndex;
    const initialColumn = initialColumns[index];
    const searchable = key && quotationColumnFields[key];
    const onHeaderCell = (headerColumn: any) => ({
      width: headerColumn.width,
      onResize: handleResizeColumn(index),
    });
    if (!searchable) return { ...column, width: column.width, onHeaderCell };
    const activeValue = columnFilters[key] || "";
    return {
      ...column,
      filterDropdown: ({ close }: { close: () => void }) => (
        <ColumnFilterDropdown
          colKey={key}
          label={typeof initialColumn?.title === "string" ? initialColumn.title : key}
          value={activeValue}
          suggestions={columnSuggestions[key] || []}
          close={close}
          onApply={(value) => setColumnFilters((previous) => {
            if (!value || !value.trim()) { const next = { ...previous }; delete next[key]; return next; }
            return { ...previous, [key]: value.trim() };
          })}
          onClear={() => setColumnFilters((previous) => { const next = { ...previous }; delete next[key]; return next; })}
        />
      ),
      filterIcon: () => <IconSearch size={14} strokeWidth={1.8} style={{ color: activeValue ? "#008f89" : undefined }} />,
      filtered: !!activeValue,
      onHeaderCell,
    };
  }), [columns, initialColumns, columnFilters, columnSuggestions, setColumnFilters]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "16px 24px",
        minHeight: "calc(100vh - 110px)",
        boxSizing: "border-box",
      }}
    >
      {/* STYLE OVERRIDES DÀNH CHO BẢNG QUẢN LÝ BẢNG GIÁ */}
      <style>{`
        .quotation-main-table .ant-table {
          font-family: inherit;
        }
        .quotation-main-table .ant-table-thead > tr > th {
          background-color: #f7fbfa !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
        }
        .quotation-main-table .ant-table-tbody > tr > td {
          color: #123443 !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .quotation-main-table .ant-table-container {
          border: 1px solid #dce5e6 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .quotation-main-table .ant-pagination .ant-pagination-item-active {
          border-color: #008f89 !important;
          background-color: #008f89 !important;
        }
        .quotation-main-table .ant-pagination .ant-pagination-item-active a {
          color: #FFFFFF !important;
        }
      `}</style>

      {/* TOOLBAR HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text strong style={{ fontSize: 18, color: "#008f89", fontWeight: 700, lineHeight: "28px" }}>
            {t.pageTitles.quotations}
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
            {isFiltering ? `${filteredQuotations.length} / ${pagination.total} ${t.table.records}` : `${pagination.total} ${t.table.records}`}
          </Tag>
        </div>

        <Space size={10}>
          <Input
            placeholder={t.quotation.searchPlaceholder}
            prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            allowClear
            style={{
              width: 240,
              height: 36,
              borderRadius: 8,
              borderColor: "#dce5e6",
              fontSize: 14,
              color: "#123443",
            }}
          />
          {isFiltering && (
            <Button
              icon={<IconCircleX size={16} strokeWidth={1.8} style={{ color: "#EF4444" }} />}
              onClick={() => { setSearchKeyword(""); setColumnFilters({}); }}
              style={{
                height: 36,
                borderRadius: 8,
                borderColor: "#FED7AA",
                background: "#FFF7ED",
                color: "#F97316",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {t.common.clearFilter}
            </Button>
          )}
          <Button
            icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={() => onRefresh(pagination.current, pagination.pageSize)}
            style={{
              height: 36,
              borderRadius: 8,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {t.common.refresh}
          </Button>
          <Button
            type="primary"
            icon={<IconPlus size={16} strokeWidth={2} />}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 36,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "#FFFFFF",
            }}
            onClick={onCreate}
          >
            {t.common.createQuotation}
          </Button>
        </Space>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <Table
        className="quotation-main-table"
        components={{ header: { cell: ResizableTitle } }}
        dataSource={filteredQuotations}
        columns={mergedColumns}
        rowKey={(record, index) => record.ContractId ?? record.ContractCode ?? `quotation_${index}`}
        loading={loading}
        scroll={{ x: 1300 }}
        onRow={(record) => ({ onDoubleClick: () => onEdit(record) })}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: isFiltering ? filteredQuotations.length : pagination.total,
          onChange: (page, pageSize) => isFiltering
            ? setPagination((previous) => ({ ...previous, current: page, pageSize }))
            : onRefresh(page, pageSize),
          showSizeChanger: true,
          pageSizeOptions: ["100", "200", "500", "1000"],
          showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.table.records}`,
        }}
      />
    </div>
  );
}