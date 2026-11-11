"use client";

import React, { useMemo } from "react";
import { Table, Dropdown, Input, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SubmissionRow,
  DecisionStatus,
  STATUS_OPTIONS,
  ProcessingStatusItem,
  ProcessingStatusWithRoleItem,
  getStatusDotColor,
} from "../types";
import { ResizableTitle } from "@/components/table/ResizableTitle";
import { usePersistedColumnWidths } from "@/lib/table-utils";
import { useTranslation } from "@/locales/LanguageContext";

interface SubmissionApprovalTableProps {
  dataSource: SubmissionRow[];
  onDataChange: (newData: SubmissionRow[]) => void;
  loading?: boolean;
  processingStatuses?: ProcessingStatusItem[];
  statusesWithRole?: ProcessingStatusWithRoleItem[];
}

const STORAGE_KEY = "SUBMISSION_APPROVAL_DETAIL_COL_WIDTHS";

export default function SubmissionApprovalTable({
  dataSource,
  onDataChange,
  loading = false,
  processingStatuses = [],
  statusesWithRole = [],
}: SubmissionApprovalTableProps) {
  const { language } = useTranslation();
  const isEn = language === "en";

  // Danh mục quyết định duyệt từ API get-processing-status-list (bỏ mục "All")
  const decisionOptions = useMemo(() => {
    if (processingStatuses && processingStatuses.length > 0) {
      return processingStatuses
        .filter((item) => item.Alias.toLowerCase() !== "all")
        .map((item) => ({
          key: item.Alias,
          alias: item.Alias,
          description: item.Description,
          dotColor: getStatusDotColor(item.Alias),
        }));
    }
    return STATUS_OPTIONS.filter((s) => s.key.toLowerCase() !== "all").map((opt) => ({
      key: opt.alias || opt.key,
      alias: opt.alias || opt.key,
      description: isEn ? opt.labelEn : opt.labelVi,
      dotColor: opt.dotColor,
    }));
  }, [processingStatuses, isEn]);

  // Cập nhật giá trị ô trực tiếp trên từng dòng
  const handleCellChange = (
    key: string,
    field: "apprQty" | "apprPrice" | "remarks" | "decision" | "reviewedWorkCat",
    value: any,
    customDescription?: string
  ) => {
    const updated = dataSource.map((item) => {
      if (item.key === key) {
        const next = { ...item, [field]: value };
        if (field === "decision") {
          next.statusAlias = value;
          const role = (item.role || "A").toUpperCase();
          const roleStatuses = (statusesWithRole || []).filter(
            (s) => s.Role.toUpperCase() === role
          );
          const matched = roleStatuses.find(
            (s) => s.Alias.toLowerCase() === String(value).toLowerCase()
          );
          if (matched) {
            next.statusDescription = matched.Description;
          } else if (customDescription) {
            next.statusDescription = customDescription;
          }
        }
        if (field === "apprQty" || field === "apprPrice") {
          const qty = Number(field === "apprQty" ? value : item.apprQty) || 0;
          const price = Number(field === "apprPrice" ? value : item.apprPrice) || 0;
          next.apprAmount = qty * price;
        }
        return next;
      }
      return item;
    });
    onDataChange(updated);
  };

  // Cấu hình các cột (2 tầng header)
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
        <span style={{ fontFamily: "monospace", color: "#008f89", fontWeight: 500, fontSize: 12.5 }}>
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
      children: [
        {
          title: isEn ? "Quantity" : "Khối lượng",
          dataIndex: "subQty",
          key: "subQty",
          width: 85,
          align: "right",
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
          align: "right",
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
            <span style={{ fontFamily: "monospace", color: "#1d4ed8", fontWeight: 500, fontSize: 12.5 }}>
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
      children: [
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

            // Tìm option tương ứng với Role của dòng trực tiếp từ API
            let currentOpt: { alias: string; description: string; dotColor: string } | undefined;
            if (roleStatuses.length > 0) {
              const matched =
                (record.statusDescription &&
                  roleStatuses.find(
                    (s) =>
                      s.Description.trim().toLowerCase() ===
                      record.statusDescription?.trim().toLowerCase()
                  )) ||
                roleStatuses.find(
                  (s) =>
                    s.Alias.toLowerCase() ===
                    String(record.statusAlias || decisionVal || "").toLowerCase()
                ) ||
                roleStatuses.find(
                  (s) =>
                    s.Description.toLowerCase() === String(decisionVal || "").toLowerCase()
                ) ||
                roleStatuses[0];
              currentOpt = {
                alias: matched.Alias,
                description: matched.Description,
                dotColor: getStatusDotColor(matched.Alias),
              };
            } else {
              const fallback =
                decisionOptions.find(
                  (s) =>
                    s.alias.toLowerCase() ===
                    String(record.statusAlias || decisionVal || "").toLowerCase()
                ) || decisionOptions[0];
              currentOpt = fallback;
            }

            const optionsToUse =
              roleStatuses.length > 0
                ? roleStatuses.map((opt) => ({
                    alias: opt.Alias,
                    description: opt.Description,
                    dotColor: getStatusDotColor(opt.Alias),
                  }))
                : decisionOptions;

            const menuItems = optionsToUse.map((opt) => ({
              key: opt.alias,
              label: (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "3px 4px",
                    minWidth: 120,
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 7.5,
                        height: 7.5,
                        borderRadius: "50%",
                        background: opt.dotColor,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight:
                          opt.alias.toLowerCase() === currentOpt?.alias.toLowerCase() ? 600 : 400,
                      }}
                    >
                      {opt.description}
                    </span>
                  </div>
                  {opt.alias.toLowerCase() === currentOpt?.alias.toLowerCase() && (
                    <span style={{ color: "#008f89", fontWeight: 700, fontSize: 13, marginLeft: "auto" }}>
                      ✓
                    </span>
                  )}
                </div>
              ),
              onClick: () => handleCellChange(record.key, "decision", opt.alias, opt.description),
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
                    justifyContent: "flex-start",
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
                      background: currentOpt.dotColor,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentOpt.description}
                  </span>
                </button>
              </Dropdown>
            );
          },
        },
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
          align: "right",
          render: (val: number, record: SubmissionRow) => (
            <InputNumber
              size="small"
              value={val}
              min={0}
              step={0.01}
              precision={2}
              style={{ width: "100%", textAlign: "right", fontFamily: "monospace", fontSize: 12 }}
              onChange={(v) => handleCellChange(record.key, "apprQty", v)}
            />
          ),
        },
        {
          title: isEn ? "Appr. Price" : "ĐG duyệt",
          dataIndex: "apprPrice",
          key: "apprPrice",
          width: 95,
          align: "right",
          render: (val: number, record: SubmissionRow) => (
            <InputNumber
              size="small"
              value={val}
              min={0}
              step={1000}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => (v ? Number(v.replace(/\./g, "")) : 0)}
              style={{ width: "100%", textAlign: "right", fontFamily: "monospace", fontSize: 12 }}
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
            <span style={{ fontFamily: "monospace", color: "#008f89", fontWeight: 600, fontSize: 12.5 }}>
              {val != null ? Number(val).toLocaleString("vi-VN") : "0"}
            </span>
          ),
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
  ], [isEn, dataSource, decisionOptions, statusesWithRole]);

  // Hook ghi nhớ và thay đổi độ rộng cột vào localStorage
  const { columns: resizableColumns, handleResizeColumn } = usePersistedColumnWidths(
    initialColumns as any[],
    STORAGE_KEY
  );

  const finalColumns = useMemo(() => {
    return (resizableColumns as any[]).map((col, index) => {
      if (col.children) {
        return {
          ...col,
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          children: col.children.map((childCol: any, childIdx: number) => ({
            ...childCol,
            onHeaderCell: (headerCol: any) => ({
              width: headerCol.width,
              onResize: handleResizeColumn(100 + index * 10 + childIdx),
              style: { textAlign: "center" },
            }),
          })),
        };
      }
      return {
        ...col,
        onHeaderCell: (headerCol: any) => ({
          width: headerCol.width,
          onResize: handleResizeColumn(index),
          style: { textAlign: "center" },
        }),
      };
    });
  }, [resizableColumns, handleResizeColumn]);

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
            .submission-approval-table .ant-table-thead > tr > th {
              text-align: center !important;
            }
          `,
        }}
      />
      <Table<SubmissionRow>
        bordered
        size="small"
        className="erp-detail-table submission-approval-table"
        components={components}
        columns={finalColumns as any}
        dataSource={dataSource}
        rowKey="key"
        pagination={false}
        loading={loading}
        scroll={{ x: 1960, y: "calc(100vh - 355px)" }}
        summary={() => (
          <Table.Summary fixed="bottom">
            <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: 700 }}>
              <Table.Summary.Cell index={0} colSpan={8} align="right">
                <span style={{ fontSize: 13, color: "#123443" }}>
                  {isEn ? "Σ TOTAL:" : "Σ TỔNG CỘNG:"}
                </span>
              </Table.Summary.Cell>
              {/* Tổng đệ trình */}
              <Table.Summary.Cell index={1} align="right">-</Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">-</Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <span style={{ fontFamily: "monospace", color: "#1d4ed8", fontSize: 13.5 }}>
                  {totalSubAmount.toLocaleString("vi-VN")}
                </span>
              </Table.Summary.Cell>
              {/* Vai trò */}
              <Table.Summary.Cell index={4} align="center">-</Table.Summary.Cell>
              {/* Tổng duyệt */}
              <Table.Summary.Cell index={5} align="center">-</Table.Summary.Cell>
              {/* Nhóm CV duyệt (ReviewedWorkCat) */}
              <Table.Summary.Cell index={6} align="center">-</Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">-</Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">-</Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right">
                <span style={{ fontFamily: "monospace", color: "#008f89", fontSize: 13.5 }}>
                  {totalApprAmount.toLocaleString("vi-VN")}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}
