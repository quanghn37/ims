"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { MainContractItem } from "../types";
import { ResizableTitle } from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";

interface MainContractsTableProps {
  dataSource: MainContractItem[];
  loading?: boolean;
  totalRows: number;
  pagination: {
    current: number;
    pageSize: number;
  };
  onPaginationChange: (page: number, pageSize: number) => void;
  onRowDoubleClick?: (record: MainContractItem) => void;
}

const STORAGE_KEY = "MAIN_CONTRACTS_COL_WIDTHS";

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

export default function MainContractsTable({
  dataSource,
  loading = false,
  totalRows,
  pagination,
  onPaginationChange,
  onRowDoubleClick,
}: MainContractsTableProps) {
  const { language } = useTranslation();
  const isEn = language === "en";

  // Cấu hình các cột hiển thị
  const initialColumns: ColumnsType<MainContractItem> = useMemo(
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
        title: isEn ? "Contract Code" : "Số HĐ CĐT",
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 170,
        align: "left",
        render: (val: string) => (
          <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Contract Name / Description" : "Tên / Diễn giải HĐ",
        dataIndex: "Description",
        key: "Description",
        width: 250,
        align: "left",
        render: (val: string) => (
          <span style={{ color: "#123443", fontWeight: 400, fontSize: 12.5 }} title={val}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Client / Owner" : "Chủ đầu tư",
        dataIndex: "CompanyName",
        key: "CompanyName",
        width: 220,
        align: "left",
        render: (val: string) => (
          <span style={{ color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Tax ID" : "Mã số thuế",
        dataIndex: "TaxID",
        key: "TaxID",
        width: 130,
        align: "center",
        render: (val: string) => (
          <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 400, fontSize: 12 }}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Contract Date" : "Ngày ký",
        dataIndex: "ContractDate",
        key: "ContractDate",
        width: 110,
        align: "center",
        render: (val: string) => formatDisplayDate(val),
      },
      {
        title: isEn ? "Start Date" : "Ngày bắt đầu",
        dataIndex: "StartDate",
        key: "StartDate",
        width: 115,
        align: "center",
        render: (val: string) => formatDisplayDate(val),
      },
      {
        title: isEn ? "End Date" : "Ngày kết thúc",
        dataIndex: "EndDate",
        key: "EndDate",
        width: 115,
        align: "center",
        render: (val: string) => formatDisplayDate(val),
      },
      {
        title: isEn ? "Actual Start" : "Khởi công TT",
        dataIndex: "ActualStart",
        key: "ActualStart",
        width: 115,
        align: "center",
        render: (val: string) => formatDisplayDate(val),
      },
      {
        title: isEn ? "Status" : "Trạng thái",
        dataIndex: "StatusName",
        key: "StatusName",
        width: 120,
        align: "center",
        render: (_: any, record: MainContractItem) => {
          const isDraft = record.StatusCode === 0;
          const statusText = record.StatusName || (isDraft ? "Đang lập" : "Hiệu lực");
          return (
            <Tag
              color={isDraft ? "orange" : "blue"}
              style={{
                borderRadius: 12,
                padding: "1px 10px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {statusText}
            </Tag>
          );
        },
      },
      {
        title: isEn ? "Current Assignee" : "Người xử lý",
        dataIndex: "CurrentAssignee",
        key: "CurrentAssignee",
        width: 150,
        align: "left",
        render: (val: string, record: MainContractItem) => (
          <span style={{ color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
            {val || record.CreatedBy || "-"}
          </span>
        ),
      },
      {
        title: isEn ? "Created By" : "Người tạo",
        dataIndex: "CreatedBy",
        key: "CreatedBy",
        width: 120,
        align: "center",
        render: (val: string) => val || "-",
      },
      {
        title: isEn ? "Created Date" : "Ngày tạo",
        dataIndex: "CreatedDate",
        key: "CreatedDate",
        width: 140,
        align: "center",
        render: (val: string) => formatDisplayDateTime(val),
      },
    ],
    [isEn, pagination.current, pagination.pageSize]
  );

  // Quản lý kéo giãn độ rộng cột và lưu vào localStorage
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
    (colKey: string) => (_: React.SyntheticEvent, { size }: { size: { width: number } }) => {
      setColumnWidths((prev) => {
        const next = { ...prev, [colKey]: Math.max(size.width, 60) };
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
    return Math.max(total, 1680);
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
      <Table<MainContractItem>
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
            `${range[0]}–${range[1]} / ${total} ${isEn ? "contracts" : "hợp đồng CĐT"}`,
          onChange: (page, pageSize) => onPaginationChange(page, pageSize),
        }}
      />
    </div>
  );
}
