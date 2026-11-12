"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Table, Dropdown, Input, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SubmissionRow,
  DecisionStatus,
  ProcessingStatusItem,
  ProcessingStatusWithRoleItem,
  getStatusDotColor,
} from "../../submissions/types";
import { ResizableTitle } from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";

interface SubmissionApprovalTableV2Props {
  dataSource: SubmissionRow[];
  onDataChange: (newData: SubmissionRow[]) => void;
  loading?: boolean;
  processingStatuses?: ProcessingStatusItem[];
  statusesWithRole?: ProcessingStatusWithRoleItem[];
}

const STORAGE_KEY = "SUBMISSION_APPROVAL_V2_COL_WIDTHS";

export default function SubmissionApprovalTableV2({
  dataSource,
  onDataChange,
  loading = false,
  statusesWithRole,
}: SubmissionApprovalTableV2Props) {
  const { language } = useTranslation();
  const isEn = language === "en";

  // Thay đổi giá trị trên một ô của bảng
  const handleCellChange = (
    key: string,
    field: keyof SubmissionRow,
    value: any,
    extraStatusDescription?: string
  ) => {
    const updated = dataSource.map((item) => {
      if (item.key === key) {
        const next = { ...item, [field]: value };
        if (field === "decision" && extraStatusDescription) {
          next.statusDescription = extraStatusDescription;
          next.statusAlias = String(value);
        }
        if (field === "apprQty" || field === "apprPrice") {
          const q = field === "apprQty" ? Number(value) || 0 : Number(next.apprQty) || 0;
          const p = field === "apprPrice" ? Number(value) || 0 : Number(next.apprPrice) || 0;
          next.apprAmount = q * p;
        }
        return next;
      }
      return item;
    });
    onDataChange(updated);
  };

  // Cấu hình các cột (2 tầng header) theo quy chuẩn ERP
  const initialColumns: ColumnsType<SubmissionRow> = useMemo(() => [
    {
      title: isEn ? "No." : "STT",
      dataIndex: "stt",
      key: "stt",
      width: 50,
      align: "center",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: isEn ? "Doc No." : "Số chứng từ",
      dataIndex: "docNo",
      key: "docNo",
      width: 170,
      align: "left",
      render: (val: string, record: SubmissionRow) => (
        <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
          {val || record.contractCode || "-"}
        </span>
      ),
    },
    {
      title: isEn ? "Description" : "Diễn giải",
      dataIndex: "contractName",
      key: "contractName",
      width: 180,
      align: "left",
      render: (val: string) => (
        <span style={{ color: "#123443", fontWeight: 400, fontSize: 12.5 }} title={val}>
          {val || "-"}
        </span>
      ),
    },
    {
      title: isEn ? "WBS Code" : "Mã WBS",
      dataIndex: "wbsCode",
      key: "wbsCode",
      width: 120,
      align: "left",
      render: (val: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{val || "-"}</span>,
    },
    {
      title: isEn ? "Sub. Date" : "Ngày ĐT",
      dataIndex: "submissionDate",
      key: "submissionDate",
      width: 85,
      align: "center",
      render: (val: string) => <span style={{ fontSize: 12 }}>{val}</span>,
    },
    {
      title: isEn ? "Work Item" : "Hạng mục",
      dataIndex: "itemName",
      key: "itemName",
      width: 250,
      align: "left",
      render: (val: string) => (
        <span style={{ color: "#123443", fontWeight: 400, fontSize: 12.5 }}>{val}</span>
      ),
    },
    {
      title: isEn ? "Unit" : "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 50,
      align: "left",
      render: (val: string) => <span style={{ fontSize: 12 }}>{val}</span>,
    },
    // Nhóm 1: Thông tin Đệ trình
    {
      title: (
        <span style={{ color: "#1d4ed8", fontWeight: 700 }}>
          {isEn ? "1. Submission Info" : "1. Thông tin Đệ trình"}
        </span>
      ),
      key: "subInfoGroup",
      children: [
        {
          title: isEn ? "Work Cat." : "Nhóm CV",
          dataIndex: "submittedWorkCat",
          key: "submittedWorkCat",
          width: 130,
          align: "left",
          render: (val: string | null | undefined, record: SubmissionRow) => {
            const displayVal = val ?? record.workCategory ?? null;
            return <span style={{ fontSize: 12, color: "#123443" }}>{displayVal ?? "-"}</span>;
          },
        },
        {
          title: isEn ? "Quantity" : "Khối lượng",
          dataIndex: "subQty",
          key: "subQty",
          width: 85,
          align: "left",
          render: (val: number) => (
            <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>
              {val != null ? Number(val).toLocaleString("vi-VN", { minimumFractionDigits: 2 }) : "-"}
            </span>
          ),
        },
        {
          title: isEn ? "Unit Price" : "Đơn giá",
          dataIndex: "subPrice",
          key: "subPrice",
          width: 95,
          align: "left",
          render: (val: number) => (
            <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>
              {val != null ? Number(val).toLocaleString("vi-VN") : "-"}
            </span>
          ),
        },
        {
          title: isEn ? "Amount" : "Thành tiền",
          dataIndex: "subAmount",
          key: "subAmount",
          width: 110,
          align: "right",
          render: (val: number) => (
            <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
              {val != null ? Number(val).toLocaleString("vi-VN") : "-"}
            </span>
          ),
        },
      ],
    },
    {
      title: isEn ? "Role" : "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 45,
      align: "center",
      render: (val: string) => {
        const bg = val === "A" ? "#fef3c7" : val === "R" ? "#dbeafe" : val === "C" ? "#f3e8ff" : "#f1f5f9";
        const color = val === "A" ? "#92400e" : val === "R" ? "#1e40af" : val === "C" ? "#6b21a8" : "#475569";
        const border = val === "A" ? "#fde68a" : val === "R" ? "#bfdbfe" : val === "C" ? "#e9d5ff" : "#cbd5e1";
        return (
          <span
            style={{
              display: "inline-block",
              width: 20,
              height: 20,
              lineHeight: "18px",
              borderRadius: "50%",
              fontSize: 11,
              fontWeight: 700,
              background: bg,
              color: color,
              border: `1px solid ${border}`,
              textAlign: "center",
            }}
          >
            {val}
          </span>
        );
      },
    },
    // Nhóm 2: Quyết định & Phê duyệt
    {
      title: (
        <span style={{ color: "#15803d", fontWeight: 700 }}>
          {isEn ? "2. Decision & Approval" : "2. Quyết định & Phê duyệt"}
        </span>
      ),
      key: "decisionGroup",
      children: [
        {
          title: isEn ? "Work Cat." : "Nhóm CV",
          dataIndex: "reviewedWorkCat",
          key: "reviewedWorkCat",
          width: 130,
          align: "left",
          render: (val: string | null | undefined, record: SubmissionRow) => {
            const displayVal = val ?? record.reviewedWorkCat ?? null;
            return <span style={{ fontSize: 12, color: "#123443" }}>{displayVal ?? "-"}</span>;
          },
        },
        {
          title: isEn ? "Appr. Qty" : "KL duyệt",
          dataIndex: "apprQty",
          key: "apprQty",
          width: 85,
          align: "left",
          render: (val: number, record: SubmissionRow) => (
            <InputNumber
              size="small"
              value={val}
              min={0}
              step={0.01}
              precision={2}
              style={{ width: "100%", textAlign: "left", fontFamily: "monospace", fontSize: 12 }}
              onChange={(v) => handleCellChange(record.key, "apprQty", v)}
            />
          ),
        },
        {
          title: isEn ? "Appr. Price" : "ĐG duyệt",
          dataIndex: "apprPrice",
          key: "apprPrice",
          width: 95,
          align: "left",
          render: (val: number, record: SubmissionRow) => (
            <InputNumber
              size="small"
              value={val}
              min={0}
              step={1000}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => (v ? Number(v.replace(/\./g, "")) : 0)}
              style={{ width: "100%", textAlign: "left", fontFamily: "monospace", fontSize: 12 }}
              onChange={(v) => handleCellChange(record.key, "apprPrice", v)}
            />
          ),
        },
        {
          title: isEn ? "Amount" : "Thành tiền",
          dataIndex: "apprAmount",
          key: "apprAmount",
          width: 115,
          align: "right",
          render: (val: number) => (
            <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 400, fontSize: 12.5 }}>
              {val != null ? Number(val).toLocaleString("vi-VN") : "0"}
            </span>
          ),
        },
        {
          title: isEn ? "Decision" : "Quyết định",
          dataIndex: "decision",
          key: "decision",
          width: 135,
          align: "left",
          render: (decisionVal: DecisionStatus, record: SubmissionRow) => {
            const role = (record.role || "A").toUpperCase();
            const roleStatuses = (statusesWithRole || []).filter(
              (s) => s.Role.toUpperCase() === role
            );

            const displayLabel = record.statusDescription || decisionVal || (isEn ? "Select..." : "Chọn...");
            const dotColor = getStatusDotColor(record.statusAlias || String(decisionVal));

            const menuItems = roleStatuses.map((opt) => ({
              key: opt.Alias,
              label: (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "3px 4px" }}>
                  <span
                    style={{
                      width: 7.5,
                      height: 7.5,
                      borderRadius: "50%",
                      background: getStatusDotColor(opt.Alias),
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12 }}>{opt.Description}</span>
                </div>
              ),
              onClick: () => handleCellChange(record.key, "decision", opt.Alias, opt.Description),
            }));

            return (
              <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                <button
                  type="button"
                  style={{
                    height: 28,
                    padding: "0 8px",
                    borderRadius: 5,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    fontWeight: 500,
                    background: "#ffffff",
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    cursor: "pointer",
                    outline: "none",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 7.5,
                      height: 7.5,
                      borderRadius: "50%",
                      background: dotColor,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayLabel}
                  </span>
                </button>
              </Dropdown>
            );
          },
        },
        {
          title: isEn ? "Comments" : "Ý kiến",
          dataIndex: "remarks",
          key: "remarks",
          width: 150,
          render: (val: string, record: SubmissionRow) => (
            <Input
              size="small"
              value={val}
              placeholder={isEn ? "Comments..." : "Ý kiến..."}
              style={{ fontSize: 12 }}
              onChange={(e) => handleCellChange(record.key, "remarks", e.target.value)}
            />
          ),
        },
      ],
    },
  ], [isEn, dataSource, statusesWithRole]);

  // Quản lý độ rộng cột ResizableTitle & lưu localStorage
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
      if (col.children) {
        return {
          ...col,
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          children: col.children.map((childCol: any) => {
            const childKey = String(childCol.key || childCol.dataIndex);
            const currentWidth = columnWidths[childKey] || childCol.width || 100;
            return {
              ...childCol,
              width: currentWidth,
              onHeaderCell: (headerCol: any) => ({
                width: headerCol.width,
                onResize: handleResize(childKey),
                style: { textAlign: "center" },
              }),
            };
          }),
        };
      }
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = columnWidths[colKey] || col.width || 100;
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (headerCol: any) => ({
          width: headerCol.width,
          onResize: handleResize(colKey),
          style: { textAlign: "center" },
        }),
      };
    });
  }, [initialColumns, columnWidths, handleResize]);

  const scrollX = useMemo(() => {
    let total = 0;
    finalColumns.forEach((col: any) => {
      if (col.children) {
        col.children.forEach((childCol: any) => {
          total += Number(childCol.width) || 100;
        });
      } else {
        total += Number(col.width) || 100;
      }
    });
    return Math.max(total, 1960);
  }, [finalColumns]);

  // Gắn ResizableTitle component
  const components = useMemo(() => ({
    header: {
      cell: ResizableTitle,
    },
  }), []);

  // Tính tổng đệ trình và tổng duyệt
  const totalSubAmount = useMemo(() => {
    return dataSource.reduce((acc, row) => acc + (Number(row.subAmount) || 0), 0);
  }, [dataSource]);

  const totalApprAmount = useMemo(() => {
    return dataSource.reduce((acc, row) => acc + (Number(row.apprAmount) || 0), 0);
  }, [dataSource]);

  return (
    <div style={{ background: "#ffffff", borderRadius: 6, overflow: "hidden" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .submission-approval-table-v2 .ant-table-thead > tr > th {
              text-align: center !important;
            }
          `,
        }}
      />
      <Table<SubmissionRow>
        bordered
        size="small"
        tableLayout="fixed"
        className="erp-detail-table submission-approval-table-v2"
        components={components}
        columns={finalColumns as any}
        dataSource={dataSource}
        rowKey="key"
        pagination={false}
        loading={loading}
        scroll={{ x: scrollX, y: "calc(100vh - 355px)" }}
        summary={() => (
          <Table.Summary fixed="bottom">
            <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: 700 }}>
              <Table.Summary.Cell index={0} colSpan={7} align="right">
                <span style={{ fontSize: 13, color: "#123443" }}>
                  {isEn ? "Σ TOTAL:" : "Σ TỔNG CỘNG:"}
                </span>
              </Table.Summary.Cell>
              {/* Nhóm 1: Thông tin Đệ trình */}
              {/* Nhóm CV */}
              <Table.Summary.Cell index={1} align="center">-</Table.Summary.Cell>
              {/* Khối lượng */}
              <Table.Summary.Cell index={2} align="left">-</Table.Summary.Cell>
              {/* Đơn giá */}
              <Table.Summary.Cell index={3} align="left">-</Table.Summary.Cell>
              {/* Thành tiền */}
              <Table.Summary.Cell index={4} align="right">
                <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 700, fontSize: 13.5 }}>
                  {totalSubAmount.toLocaleString("vi-VN")}
                </span>
              </Table.Summary.Cell>
              {/* Vai trò */}
              <Table.Summary.Cell index={5} align="center">-</Table.Summary.Cell>
              {/* Nhóm 2: Quyết định & Phê duyệt */}
              {/* Nhóm CV duyệt */}
              <Table.Summary.Cell index={6} align="center">-</Table.Summary.Cell>
              {/* KL duyệt */}
              <Table.Summary.Cell index={7} align="left">-</Table.Summary.Cell>
              {/* ĐG duyệt */}
              <Table.Summary.Cell index={8} align="left">-</Table.Summary.Cell>
              {/* Thành tiền duyệt */}
              <Table.Summary.Cell index={9} align="right">
                <span style={{ fontFamily: "monospace", color: "#123443", fontWeight: 700, fontSize: 13.5 }}>
                  {totalApprAmount.toLocaleString("vi-VN")}
                </span>
              </Table.Summary.Cell>
              {/* Quyết định */}
              <Table.Summary.Cell index={10} align="center">-</Table.Summary.Cell>
              {/* Ý kiến */}
              <Table.Summary.Cell index={11} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}
