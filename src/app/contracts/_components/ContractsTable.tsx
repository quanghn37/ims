import React, { useMemo } from "react";
import { Button, Card, Input, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  IconCircleX,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import { ContractItem } from "@/types";
import ResizableTitle from "@/components/table/ResizableTitle";
import { parseDateSafe } from "./types";
import { contractColumnFields } from "../_hooks/useContracts";
import ColumnFilterDropdown from "@/components/table/ColumnFilterDropdown";
import { usePersistedColumnWidths } from "@/lib/table-utils";
import { useTranslation } from "@/locales/LanguageContext";

const { Text, Title } = Typography;
type PaginationState = { current: number; pageSize: number; total: number };

interface ContractsTableProps {
  filteredContracts: ContractItem[];
  loading: boolean;
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  columnFilters: Record<string, string>;
  setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  isFiltering: boolean;
  columnSuggestions: Record<string, string[]>;
  storageKey: string;
  onRefresh: (page: number, pageSize: number) => void;
  onCreate: () => void;
  onEdit: (record: ContractItem) => void;
  onCreateAddendum: (record: ContractItem) => void;
  onDelete: (record: ContractItem) => void;
}

export default function ContractsTable({ filteredContracts, loading, searchKeyword, setSearchKeyword, columnFilters, setColumnFilters, pagination, setPagination, isFiltering, columnSuggestions, storageKey, onRefresh, onCreate, onEdit, onCreateAddendum, onDelete }: ContractsTableProps) {
  const { t } = useTranslation();
  const initialMainColumns = useMemo(
    () => [
      {
        title: t.contract.code,
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 160,
        render: (val: string, r: ContractItem) => {
          const code = val || (r as any).Contractcode || (r as any).Code;
          if (!code) return <span>---</span>;
          return (
            <span
              onClick={() => onEdit(r)}
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "#008f89",
                fontSize: 13,
              }}
              title="Bấm để xem chi tiết / chỉnh sửa"
            >
              {code}
            </span>
          );
        },
      },
      {
        title: t.contract.contractCategory,
        dataIndex: "S_Type",
        key: "S_Type",
        width: 100,
        align: "center" as const,
        render: (val: string, r: any) => {
          const type = val || r.s_type || r.S_type || r.ContractCategory || r.Category;
          if (!type) return <span style={{ color: "#a0aec0" }}>---</span>;
          return <span style={{ color: "#262626" }}>{String(type).trim()}</span>;
        },
      },
      {
        title: t.contract.mainContract,
        dataIndex: "MainCode",
        key: "MainCode",
        width: 220,
        render: (val: string, r: any) => <Text>{val || r.MainContractCode || r.MainContractName || "---"}</Text>,
      },
      {
        title: t.contract.vendor,
        dataIndex: "Venname",
        key: "Venname",
        width: 220,
        render: (_: any, record: any) => (
          <Text>{record.Venname || record.ClientName || record.CompanyName || record.VendorName || "---"}</Text>
        ),
      },
      {
        title: t.contract.description,
        dataIndex: "Description",
        key: "Description",
        width: 260,
        render: (val: string, r: any) => (
          <Text>{val || r.Remarks || r.ContractName || "Hợp đồng cung cấp vật tư & thiết bị"}</Text>
        ),
      },
      {
        title: t.contract.signDate,
        key: "ContractDate",
        width: 130,
        render: (_: any, record: any) => {
          const raw = record.ContractDate || record.Contractdate || record.SignDate || record.Signdate;
          const d = parseDateSafe(raw);
          return (
            <Text type="secondary">
              {d ? d.format("DD-MM-YYYY") : raw || "---"}
            </Text>
          );
        },
      },
      {
        title: t.contract.amount,
        dataIndex: "ContractedAmount",
        key: "ContractedAmount",
        width: 160,
        align: "right" as const,
        render: (val: number | null | undefined, r: any) => (
          <Text style={{ color: "#262626" }}>
            {Number(val ?? r.Amount ?? r.ContractedAmount ?? r.TotalAmount ?? 0).toLocaleString("vi-VN")}
          </Text>
        ),
      },
      {
        title: t.contract.paymentTerm,
        dataIndex: "PayTerms",
        key: "PayTerms",
        width: 180,
        render: (val: string, r: any) => <Text>{val || r.PaymentTerm || r.PaytermId || "---"}</Text>,
      },
      {
        title: t.contract.currency,
        dataIndex: "Currency",
        key: "Currency",
        width: 90,
        align: "center" as const,
        render: (val: string, r: any) => <span style={{ color: "#262626" }}>{val || r.Currency || "VND"}</span>,
      },
      {
        title: t.table.createdDate,
        dataIndex: "CreatedDate",
        key: "CreatedDate",
        width: 120,
        render: (val: string, r: any) => {
          const raw = val || r.Contractdate || r.SignDate || r.CreatedDate;
          if (!raw) return "---";
          const d = parseDateSafe(raw);
          return d ? d.format("DD-MM-YYYY") : String(raw).substring(0, 10);
        },
      },
      {
        title: t.table.createdBy,
        dataIndex: "CreatedBy",
        key: "CreatedBy",
        width: 120,
        render: (val: string, r: any) => <span style={{ color: "#123443", fontSize: 13 }}>{val || r.Createdby || "Hệ thống"}</span>,
      },
      {
        title: (
          <Tooltip title={t.table.action}>
            <IconSettings size={15} strokeWidth={1.8} style={{ color: "#718894" }} />
          </Tooltip>
        ),
        key: "action",
        width: 80,
        align: "center" as const,
        fixed: "right" as const,
        onCell: () => ({ style: { padding: "4px 2px", whiteSpace: "nowrap" } }),
        render: (_: any, record: ContractItem) => (
          <Space size={6} wrap={false}>
            <ActionIconButton
              action="add"
              tooltip={t.contract.createAddendumTooltip}
              size="small"
              onClick={() => onCreateAddendum(record)}
            />
            <Popconfirm
              title={t.contract.deleteContract}
              description={t.common.confirmDelete}
              onConfirm={() => onDelete(record)}
              okText={t.common.delete}
              cancelText={t.common.cancel}
              okButtonProps={{ danger: true }}
            >
              <ActionIconButton
                action="delete"
                tooltip={t.contract.deleteContractTooltip}
                size="small"
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onEdit, onCreateAddendum, onDelete, t]
  );
  const { columns: mainColumns, handleResizeColumn } = usePersistedColumnWidths(initialMainColumns, storageKey);
  const mergedColumns = useMemo(() => mainColumns.map((column, index) => {
    const key = column.key || column.dataIndex;
    const initialColumn = initialMainColumns[index];
    const searchable = key && contractColumnFields[key];
    const isFixedAction = key === "action";
    const onHeaderCell = (headerColumn: any) => ({
      width: isFixedAction ? 80 : headerColumn.width,
      onResize: isFixedAction ? undefined : handleResizeColumn(index),
      style: isFixedAction ? ({ padding: "4px 2px", textAlign: "center" } as React.CSSProperties) : undefined,
    });
    const colWidth = isFixedAction ? 80 : column.width;
    if (!searchable) return { ...column, width: colWidth, onHeaderCell };
    const activeValue = columnFilters[key] || "";
    return {
      ...column,
      width: colWidth,
      filterDropdown: ({ close }: { close: () => void }) => (
        <ColumnFilterDropdown
          colKey={key}
          label={typeof initialColumn?.title === "string" ? initialColumn.title : key}
          value={activeValue}
          suggestions={columnSuggestions[key] || []}
          close={close}
          onApply={(value) => setColumnFilters((previous) => { if (!value || !value.trim()) { const next = { ...previous }; delete next[key]; return next; } return { ...previous, [key]: value.trim() }; })}
          onClear={() => setColumnFilters((previous) => { const next = { ...previous }; delete next[key]; return next; })}
        />
      ),
      filterIcon: () => <IconSearch size={14} strokeWidth={1.8} style={{ color: activeValue ? "#008f89" : undefined }} />,
      filtered: !!activeValue,
      onHeaderCell,
    };
  }), [mainColumns, initialMainColumns, columnFilters, columnSuggestions, setColumnFilters]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "16px 24px",
        minHeight: "calc(100vh - 110px)",
        boxSizing: "border-box",
      }}
    >
      {/* STYLE OVERRIDES DÀNH CHO BẢNG QUẢN LÝ HỢP ĐỒNG NCC */}
      <style>{`
        .contract-main-table .ant-table {
          font-family: inherit;
        }
        .contract-main-table .ant-table-thead > tr > th {
          background-color: #f7fbfa !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
        }
        .contract-main-table .ant-table-tbody > tr > td {
          color: #123443 !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .contract-main-table .ant-table-container {
          border: 1px solid #dce5e6 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .contract-main-table .ant-pagination .ant-pagination-item-active {
          border-color: #008f89 !important;
          background-color: #008f89 !important;
        }
        .contract-main-table .ant-pagination .ant-pagination-item-active a {
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
            {t.pageTitles.contracts}
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
            {isFiltering ? `${filteredContracts.length} / ${pagination.total} ${t.contract.contractCount}` : `${pagination.total} ${t.contract.contractCount}`}
          </Tag>
        </div>

        <Space size={10}>
          <Input
            placeholder={t.contract.searchPlaceholder}
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
            {t.common.createContract}
          </Button>
        </Space>
      </div>

      <Table
        className="contract-main-table"
        tableLayout="fixed"
        components={{ header: { cell: ResizableTitle } }}
        dataSource={filteredContracts}
        columns={mergedColumns}
        rowKey={(record, index) => record.ContractId ?? record.ContractID ?? record.Id ?? record.ID ?? record.ContractCode ?? record.Code ?? `contract_${index}`}
        loading={loading}
        scroll={{ x: 1400 }}
        onRow={(record) => ({
          onDoubleClick: () => onEdit(record),
        })}
        summary={(pageData) => {
          let totalAmount = 0;
          pageData.forEach((item: any) => { totalAmount += Number(item.ContractedAmount ?? item.Amount ?? 0); });
          return (
            <Table.Summary.Row style={{ background: "#eef8f6" }}>
              <Table.Summary.Cell index={0} colSpan={5}>
                <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>{t.common.total}:</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <span style={{ fontWeight: 700, color: "#008f89", fontSize: 14 }}>
                  {totalAmount.toLocaleString("vi-VN")}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={6} />
            </Table.Summary.Row>
          );
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: isFiltering ? filteredContracts.length : pagination.total,
          onChange: (page, pageSize) => isFiltering ? setPagination((previous) => ({ ...previous, current: page, pageSize })) : onRefresh(page, pageSize),
          showSizeChanger: true,
          pageSizeOptions: ["100", "200", "500", "1000"],
          showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.table.records}`,
        }}
      />
    </div>
  );
}
