"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconSettings } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ProjectContractItem } from "../types";
import { ResizableTitle } from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";
import ActionIconButton from "@/components/common/ActionIconButton";

interface ProjectContractsTableProps {
  dataSource: ProjectContractItem[];
  loading?: boolean;
  totalRows: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  onPaginationChange: (page: number, pageSize: number) => void;
  onRowDoubleClick?: (record: ProjectContractItem) => void;
  onOpenDetail?: (record: ProjectContractItem) => void;
  onCreateAddendum?: (record: ProjectContractItem) => void;
}

const STORAGE_KEY = "PROJECT_CONTRACTS_COL_WIDTHS";

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const clean = dateStr.trim();
  if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(clean)) {
    return clean.replace(/-/g, "/");
  }
  const d = dayjs(clean);
  return d.isValid() ? d.format("DD/MM/YYYY") : clean;
}

function formatDisplayDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : dateStr;
}

export default function ProjectContractsTable({
  dataSource,
  loading = false,
  totalRows,
  pagination,
  onPaginationChange,
  onRowDoubleClick,
  onOpenDetail,
  onCreateAddendum,
}: ProjectContractsTableProps) {
  const { language } = useTranslation();
  const isEn = language === "en";

  const initialColumns: ColumnsType<ProjectContractItem> = useMemo(
    () => [
      {
        title: isEn ? "No." : "STT",
        dataIndex: "stt",
        key: "stt",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: isEn ? "Subcontract Code" : "Số HĐ Dự án",
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 180,
        align: "left",
        render: (val: string, record: ProjectContractItem) => {
          const code = val || record.ContractCode || "-";
          const isMatEquip = String(record.ContractType || "").trim().toLowerCase() === "mat_equip";
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onOpenDetail) {
                  onOpenDetail(record);
                } else if (onRowDoubleClick) {
                  onRowDoubleClick(record);
                }
              }}
              style={{
                fontFamily: "monospace",
                color: isMatEquip ? "#008f89" : "#123443",
                fontSize: 12.5,
                cursor: "pointer",
                textDecoration: "none",
              }}
              title={isEn ? "Click to view contract details" : "Nhấn để xem chi tiết hợp đồng"}
            >
              {code}
            </a>
          );
        },
      },
      {
        title: isEn ? "Contract Name / Description" : "Tên / Diễn giải HĐ",
        dataIndex: "Description",
        key: "Description",
        width: 260,
        align: "left",
        render: (val: string) => (
          <span style={{ color: "#123443", fontWeight: 400, fontSize: 12.5 }} title={val}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Subcontractor / Vendor" : "Nhà thầu / Đối tác",
        dataIndex: "Venname",
        key: "Venname",
        width: 240,
        align: "left",
        render: (val: string) => (
          <span style={{ color: "#123443", fontWeight: 400, fontSize: 12.5 }} title={val}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Main Contract Code" : "Số HĐ CĐT",
        dataIndex: "MainCode",
        key: "MainCode",
        width: 170,
        align: "left",
        render: (val: string) => (
          <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Contract Amount" : "Giá trị HĐ",
        dataIndex: "ContractedAmount",
        key: "ContractedAmount",
        width: 130,
        align: "right",
        render: (val: number) => (
          <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
            {val != null ? Number(val).toLocaleString("vi-VN") : "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Type" : "Loại",
        dataIndex: "S_Type",
        key: "S_Type",
        width: 70,
        align: "center",
        render: (val: string) => (
          <span style={{ fontSize: 12, color: "#123443" }}>{val || "-"}</span>
        ),
      },
      {
        title: isEn ? "Signed Date" : "Ngày ký",
        dataIndex: "Contractdate",
        key: "Contractdate",
        width: 100,
        align: "center",
        render: (val: string) => (
          <span style={{ fontSize: 12 }}>{formatDisplayDate(val)}</span>
        ),
      },
      {
        title: isEn ? "Start Date" : "Ngày bắt đầu",
        dataIndex: "StartDate",
        key: "StartDate",
        width: 100,
        align: "center",
        render: (val: string) => (
          <span style={{ fontSize: 12 }}>{formatDisplayDate(val)}</span>
        ),
      },
      {
        title: isEn ? "End Date" : "Ngày kết thúc",
        dataIndex: "EndDate",
        key: "EndDate",
        width: 100,
        align: "center",
        render: (val: string) => (
          <span style={{ fontSize: 12 }}>{formatDisplayDate(val)}</span>
        ),
      },
      {
        title: isEn ? "Status" : "Trạng thái",
        dataIndex: "StatusName",
        key: "StatusName",
        width: 125,
        align: "center",
        render: (statusName: string, record: ProjectContractItem) => {
          const name = statusName || (record.StatusCode === 1 ? "Chờ duyệt" : record.StatusCode === 0 ? "Đang lập" : "Hiệu lực");
          const lower = String(name).toLowerCase();

          let bg = "#f1f5f9";
          let color = "#475569";
          let border = "#cbd5e1";
          let dotColor = "#94a3b8";

          if (lower.includes("chờ") || lower.includes("pending") || record.StatusCode === 1) {
            bg = "#f0fdfa";
            color = "#0f766e";
            border = "#99f6e4";
            dotColor = "#0d9488";
          } else if (lower.includes("lập") || lower.includes("draft") || record.StatusCode === 0) {
            bg = "#eff6ff";
            color = "#1d4ed8";
            border = "#bfdbfe";
            dotColor = "#3b82f6";
          } else if (lower.includes("hiệu lực") || lower.includes("active") || lower.includes("duyệt")) {
            bg = "#ecfdf5";
            color = "#047857";
            border = "#a7f3d0";
            dotColor = "#10b981";
          } else if (lower.includes("hết") || lower.includes("hủy") || lower.includes("close")) {
            bg = "#fef2f2";
            color = "#b91c1c";
            border = "#fecaca";
            dotColor = "#ef4444";
          }

          return (
            <Tag
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: bg,
                color: color,
                border: `1px solid ${border}`,
                borderRadius: 12,
                fontSize: 11.5,
                fontWeight: 500,
                padding: "2px 8px",
                margin: 0,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: dotColor,
                  display: "inline-block",
                }}
              />
              {name}
            </Tag>
          );
        },
      },
      {
        title: isEn ? "Assignee" : "Người xử lý",
        dataIndex: "CurrentAssignee",
        key: "CurrentAssignee",
        width: 130,
        align: "left",
        render: (val: string) => (
          <span style={{ color: "#334155", fontSize: 12 }}>{val || "-"}</span>
        ),
      },
      {
        title: isEn ? "Created By" : "Người tạo",
        dataIndex: "CreatedBy",
        key: "CreatedBy",
        width: 100,
        align: "left",
        render: (val: string) => (
          <span style={{ color: "#64748b", fontSize: 12 }}>{val || "-"}</span>
        ),
      },
      {
        title: isEn ? "Created Date" : "Ngày tạo",
        dataIndex: "CreatedDate",
        key: "CreatedDate",
        width: 135,
        align: "center",
        render: (val: string) => (
          <span style={{ fontSize: 12, color: "#64748b" }}>{formatDisplayDateTime(val)}</span>
        ),
      },
      {
        title: (
          <Tooltip title={isEn ? "Action" : "Tác vụ"}>
            <IconSettings size={15} strokeWidth={1.8} style={{ color: "#718894" }} />
          </Tooltip>
        ),
        key: "action",
        width: 55,
        align: "center" as const,
        fixed: "right" as const,
        onCell: () => ({ style: { padding: "4px 2px", whiteSpace: "nowrap" } }),
        render: (_: unknown, record: ProjectContractItem) => {
          // Nếu "IsAddendum": "N" thì mới hiện icon tạo, nếu "IsAddendum": "Y" thì không hiện
          const isAddendumY = String(record.IsAddendum || "").trim().toUpperCase() === "Y";
          if (isAddendumY) return null;

          return (
            <ActionIconButton
              action="add"
              tooltip={isEn ? "Create Addendum" : "Tạo phụ lục HĐ"}
              size="small"
              onClick={(e) => {
                e?.stopPropagation?.();
                onCreateAddendum?.(record);
              }}
            />
          );
        },
      },
    ],
    [isEn, pagination, onCreateAddendum, onOpenDetail, onRowDoubleClick]
  );

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleResize = useCallback(
    (colKey: string) => (_: unknown, { size }: { size: { width: number } }) => {
      setColumnWidths((prev) => {
        const next = { ...prev, [colKey]: Math.max(size.width, 50) };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const finalColumns = useMemo(() => {
    return (initialColumns as any[]).map((col) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = columnWidths[colKey] || col.width || 100;
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (headerCol: any) => ({
          width: headerCol.width,
          onResize: handleResize(colKey),
        }),
      };
    });
  }, [initialColumns, columnWidths, handleResize]);

  const scrollX = useMemo(() => {
    let total = 0;
    finalColumns.forEach((col: any) => {
      total += Number(col.width) || 100;
    });
    return Math.max(total, 1860);
  }, [finalColumns]);

  const components = useMemo(
    () => ({
      header: {
        cell: ResizableTitle,
      },
    }),
    []
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 6, overflow: "hidden" }}>
      <Table<ProjectContractItem>
        bordered
        size="small"
        tableLayout="fixed"
        className="erp-detail-table erp-full-table"
        components={components}
        columns={finalColumns as any}
        dataSource={dataSource}
        rowKey="ContractId"
        loading={loading}
        scroll={{ x: scrollX, y: "100%" }}
        onRow={(record) => ({
          onDoubleClick: () => onRowDoubleClick?.(record),
        })}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: totalRows,
          showSizeChanger: true,
          pageSizeOptions: ["50", "100", "200", "500"],
          size: "small",
          showTotal: (total, range) =>
            `${range[0]}–${range[1]} / ${total} ${isEn ? "contracts" : "hợp đồng dự án"}`,
          onChange: (page, pageSize) => onPaginationChange(page, pageSize),
        }}
      />
    </div>
  );
}
