import { useMemo, useState, useEffect } from "react";
import { Button, Input, Popover, Space, Table } from "antd";
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
  const { t, language } = useTranslation();
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<{ bottom: number; left: number; width: number } | null>(null);

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
      width: 140,
      render: (value: string) => (
        <span style={{ color: "#718894", fontSize: 13 }}>
          {value || "Hệ thống"}
        </span>
      ),
    },
    {
      title: "",
      key: "_spacer",
      render: () => null,
    },
  ], [onEdit, t]);

  const { columns, handleResizeColumn } = usePersistedColumnWidths(initialColumns, storageKey);

  const activeColumnMeta = useMemo(() => {
    if (!openFilterKey) return null;
    const col = initialColumns.find(
      (c) => String(c.key || c.dataIndex) === openFilterKey
    );
    const label = typeof col?.title === "string" ? col.title : openFilterKey;
    return { label };
  }, [openFilterKey, initialColumns]);

  useEffect(() => {
    if (!openFilterKey) return;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      // Nếu sự kiện scroll xuất phát từ bên trong popup hoặc danh sách gợi ý, tuyệt đối không được đóng popup
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

  const mergedColumns = useMemo(() => columns.map((column, index) => {
    const key = column.key || column.dataIndex;
    if (key === "_spacer") {
      return {
        key: "_spacer",
        title: "",
        width: undefined,
        render: () => null,
      };
    }
    const initialColumn = initialColumns[index];
    const searchable = key && quotationColumnFields[key];
    const onHeaderCell = (headerColumn: any) => ({
      width: headerColumn.width,
      onResize: handleResizeColumn(index),
    });
    if (!searchable) return { ...column, width: column.width, onHeaderCell };
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
        title={language === "en" ? `Click to search by ${rawTitle}` : `Bấm để tìm kiếm / lọc theo ${rawTitle}`}
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
            title={language === "en" ? `Active filter: "${activeValue}"` : `Đang lọc: "${activeValue}"`}
          />
        )}
      </span>
    );

    return {
      ...column,
      title: titleNode,
      onHeaderCell,
    };
  }), [columns, initialColumns, columnFilters, handleResizeColumn, language]);

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
        .quotation-main-table .column-title-clickable {
          transition: color 0.15s ease;
        }
        .quotation-main-table .ant-table-thead > tr > th:hover .column-title-clickable {
          color: #008f89 !important;
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
            placeholder={t.quotation.searchPlaceholder}
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
            {t.common.total || "Tổng"}: <strong style={{ color: "#008f89" }}>{isFiltering ? filteredQuotations.length : pagination.total}</strong> {t.table.records || "bảng giá"}
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
        tableLayout="fixed"
        components={{ header: { cell: ResizableTitle } }}
        dataSource={filteredQuotations}
        columns={mergedColumns}
        rowKey={(record, index) => record.ContractId ?? record.ContractCode ?? `quotation_${index}`}
        loading={loading}
        scroll={{ x: scrollX, y: "calc(100vh - 215px)" }}
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

      {/* SINGLE POPOVER DUY NHẤT (ĐẶT NGOÀI TABLE ĐỂ KHÔNG BỊ NHÂN BẢN DO TABLE HEADER RENDER) */}
      <Popover
        open={Boolean(openFilterKey && anchorRect)}
        onOpenChange={(visible) => {
          if (!visible) {
            setOpenFilterKey(null);
            setAnchorRect(null);
          }
        }}
        trigger="click"
        placement="bottomLeft"
        arrow={false}
        destroyTooltipOnHide
        overlayStyle={{ zIndex: 1050 }}
        overlayInnerStyle={{
          padding: 0,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        }}
        content={
          openFilterKey && activeColumnMeta ? (
            <ColumnFilterDropdown
              colKey={openFilterKey}
              label={activeColumnMeta.label}
              value={columnFilters[openFilterKey] || ""}
              suggestions={columnSuggestions[openFilterKey] || []}
              close={() => {
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
              onApply={(value) => {
                setColumnFilters((previous) => {
                  if (!value || !value.trim()) {
                    const next = { ...previous };
                    delete next[openFilterKey];
                    return next;
                  }
                  return { ...previous, [openFilterKey]: value.trim() };
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
        <div
          style={{
            position: "fixed",
            top: anchorRect ? anchorRect.bottom + 4 : -9999,
            left: anchorRect ? anchorRect.left : -9999,
            width: anchorRect ? Math.max(anchorRect.width, 1) : 0,
            height: 1,
            pointerEvents: "none",
            visibility: openFilterKey && anchorRect ? "visible" : "hidden",
          }}
        />
      </Popover>
    </div>
  );
}