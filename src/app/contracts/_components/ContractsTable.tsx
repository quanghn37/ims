import React, { useMemo, useState, useEffect } from "react";
import { Button, Input, Popover, Space, Table, Tag, Tooltip, Typography } from "antd";
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
import { ApprovalBadge } from "@/components/common/ApprovalBadge";

const { Text } = Typography;
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
  onDelete?: (record: ContractItem) => void;
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
            <a
              href={`/contracts?id=${r.ContractId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                onEdit(r);
              }}
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "#008f89",
                fontSize: 13,
                textDecoration: "none",
              }}
              title="Mở chi tiết hợp đồng trong tab mới"
            >
              {code}
            </a>
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
        title: t.table.status,
        dataIndex: "StatusName",
        key: "StatusName",
        width: 120,
        align: "center" as const,
        render: (val: string, r: any) => {
          const raw = val ?? r.Status ?? r.StatusCode ?? "";
          return <ApprovalBadge val={raw} record={r} />;
        },
      },
      {
        title: t.table.currentAssignee,
        dataIndex: "CurrentAssignee",
        key: "CurrentAssignee",
        width: 140,
        render: (val: string, r: any) => {
          const name = String(val || r.Assignee || r.CurrentRole || "").trim();
          const clean = name.toLowerCase();
          const isDone =
            !name ||
            clean === "đã hoàn tất" ||
            clean === "da hoan tat" ||
            clean === "hoàn tất" ||
            clean === "hoan tat" ||
            clean === "completed" ||
            clean === "done" ||
            clean === "finish" ||
            clean === "finished";

          if (isDone) {
            return null;
          }

          return (
            <span style={{ color: "#123443", fontSize: 13, fontWeight: 500 }}>
              {name}
            </span>
          );
        },
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
        key: "_spacer",
        title: "",
        width: undefined,
        render: () => null,
      },
      {
        title: (
          <Tooltip title={t.table.action}>
            <IconSettings size={15} strokeWidth={1.8} style={{ color: "#718894" }} />
          </Tooltip>
        ),
        key: "action",
        width: 55,
        align: "center" as const,
        fixed: "right" as const,
        onCell: () => ({ style: { padding: "4px 2px", whiteSpace: "nowrap" } }),
        render: (_: any, record: ContractItem) => (
          <ActionIconButton
            action="add"
            tooltip={t.contract.createAddendumTooltip}
            size="small"
            onClick={() => onCreateAddendum(record)}
          />
        ),
      },
    ],
    [onEdit, onCreateAddendum, t]
  );
  const { columns: mainColumns, handleResizeColumn } = usePersistedColumnWidths(initialMainColumns, storageKey);

  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<{ bottom: number; left: number; width: number } | null>(null);

  const activeColumnMeta = useMemo(() => {
    if (!openFilterKey) return null;
    const col = initialMainColumns.find((c) => (c.key || c.dataIndex) === openFilterKey);
    const label = typeof col?.title === "string" ? col.title : openFilterKey;
    const suggestions = columnSuggestions[openFilterKey] || [];
    return { label, suggestions };
  }, [openFilterKey, initialMainColumns, columnSuggestions]);

  useEffect(() => {
    if (!openFilterKey) return;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest(".ant-popover")
      ) {
        return;
      }
      setOpenFilterKey(null);
      setAnchorRect(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [openFilterKey]);

  const mergedColumns = useMemo(() => mainColumns.map((column, index) => {
    const key = column.key || column.dataIndex;
    if (key === "_spacer") {
      return {
        key: "_spacer",
        title: "",
        width: undefined,
        render: () => null,
      };
    }
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
    const rawTitle = typeof initialColumn?.title === "string" ? initialColumn.title : key;
    const titleNode = (
      <span
        className="column-title-clickable"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setAnchorRect({
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
          });
          setOpenFilterKey((prev) => (prev === key ? null : key));
        }}
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: activeValue ? "#008f89" : "inherit",
          fontWeight: activeValue ? 600 : "inherit",
          userSelect: "none",
        }}
        title={`Bấm để tìm kiếm / lọc theo ${rawTitle}`}
      >
        <span>{rawTitle}</span>
        {activeValue && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#008f89",
              flexShrink: 0,
            }}
            title={`Đang lọc: "${activeValue}"`}
          />
        )}
      </span>
    );

    return {
      ...column,
      width: colWidth,
      title: titleNode,
      onHeaderCell,
    };
  }), [mainColumns, initialMainColumns, columnFilters, handleResizeColumn]);

  const scrollX = useMemo(() => {
    return mergedColumns.reduce((sum, col) => {
      if (col.key === "_spacer") return sum;
      return sum + (Number(col.width) || 130);
    }, 0);
  }, [mergedColumns]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: 0,
        minHeight: "calc(100vh - 100px)",
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
        .contract-main-table .column-title-clickable {
          transition: color 0.15s ease;
        }
        .contract-main-table .ant-table-thead > tr > th:hover .column-title-clickable {
          color: #008f89 !important;
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

      {/* TOOLBAR HEADER - LIỀN MẠCH, KHÔNG TRÙNG LẶP TIÊU ĐỀ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Input
            placeholder={t.contract.searchPlaceholder}
            prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            allowClear
            style={{
              width: 280,
              height: 36,
              borderRadius: 8,
              borderColor: "#dce5e6",
              fontSize: 13.5,
              color: "#123443",
            }}
          />
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {t.common.total || "Tổng"}: <strong style={{ color: "#008f89" }}>{isFiltering ? filteredContracts.length : pagination.total}</strong> {t.table.records || "hợp đồng"}
          </span>
          {isFiltering && (
            <Button
              icon={<IconCircleX size={15} strokeWidth={1.8} style={{ color: "#EF4444" }} />}
              onClick={() => { setSearchKeyword(""); setColumnFilters({}); }}
              style={{
                height: 32,
                borderRadius: 6,
                borderColor: "#FED7AA",
                background: "#FFF7ED",
                color: "#F97316",
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              {t.common.clearFilter}
            </Button>
          )}
        </div>

        <Space size={10}>
          <Button
            icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={() => onRefresh(pagination.current, pagination.pageSize)}
            style={{
              height: 36,
              borderRadius: 8,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
              fontSize: 13.5,
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
              fontSize: 13.5,
              fontWeight: 500,
              color: "#FFFFFF",
              boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
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
        scroll={{ x: scrollX, y: "calc(100vh - 215px)" }}
        onRow={(record) => ({
          onDoubleClick: () => onEdit(record),
        })}
        summary={(pageData) => {
          let totalAmount = 0;
          pageData.forEach((item: any) => { totalAmount += Number(item.ContractedAmount ?? item.Amount ?? 0); });
          return (
            <Table.Summary.Row style={{ background: "#eef8f6" }}>
              {mergedColumns.map((col: any, index: number) => {
                const key = String(col.key || col.dataIndex || index);
                if (key === "_spacer") {
                  return <Table.Summary.Cell key="_spacer" index={index} />;
                }
                const isAmount = key === "ContractedAmount";
                const isFirst = index === 0;
                return (
                  <Table.Summary.Cell
                    key={key}
                    index={index}
                    align={isAmount ? "right" : col.align}
                  >
                    {isFirst && (
                      <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
                        {t.common.total}:
                      </span>
                    )}
                    {isAmount && (
                      <span style={{ fontWeight: 700, color: "#008f89", fontSize: 14 }}>
                        {totalAmount.toLocaleString("vi-VN")}
                      </span>
                    )}
                  </Table.Summary.Cell>
                );
              })}
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

      {/* SINGLE POPOVER DUY NHẤT NGOÀI TABLE */}
      <Popover
        open={Boolean(openFilterKey && anchorRect)}
        onOpenChange={(visible) => {
          if (!visible) {
            setOpenFilterKey(null);
            setAnchorRect(null);
          }
        }}
        trigger={[]}
        placement="bottomLeft"
        overlayStyle={{ zIndex: 1050 }}
        content={
          openFilterKey && activeColumnMeta ? (
            <ColumnFilterDropdown
              colKey={openFilterKey}
              label={activeColumnMeta.label}
              value={columnFilters[openFilterKey] || ""}
              suggestions={activeColumnMeta.suggestions}
              close={() => {
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
              onApply={(val) => {
                const trimmed = val ? val.trim() : "";
                setColumnFilters((previous) => {
                  if (!trimmed) {
                    const next = { ...previous };
                    delete next[openFilterKey];
                    return next;
                  }
                  return { ...previous, [openFilterKey]: trimmed };
                });
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
              onClear={() => {
                setColumnFilters((previous) => {
                  const next = { ...previous };
                  delete next[openFilterKey];
                  return next;
                });
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
            />
          ) : null
        }
      >
        {anchorRect ? (
          <div
            style={{
              position: "fixed",
              top: anchorRect.bottom,
              left: anchorRect.left,
              width: anchorRect.width,
              height: 1,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </Popover>
    </div>
  );
}
