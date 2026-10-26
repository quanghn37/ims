"use client";

import React from "react";
import { Table, Tag, Button } from "antd";
import { IconGitBranch, IconClock, IconCheck, IconRefresh } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";
import { renderStatusBadge } from "@/config/statusConfig";

export interface WorkflowRaciTableProps {
  dataSource: any[];
  loading?: boolean;
  onRefresh?: () => void;
  onOpenRowDetail?: (record: any) => void;
  title?: React.ReactNode;
  showHint?: boolean;
  emptyText?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * RACI Role badge renderer
 * R = Responsible (Blue), A = Accountable (Red/Coral), C = Consulted (Amber), I = Informed (Green)
 */
export const renderRaciRoleBadge = (role: string) => {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    R: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
    A: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
    C: { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
    I: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  };
  const style = colors[role] || { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };

  return (
    <Tag
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: 4,
        fontWeight: 700,
        fontSize: 12,
        padding: "1px 8px",
        margin: 0,
      }}
    >
      {role || "?"}
    </Tag>
  );
};

export const WorkflowRaciTable: React.FC<WorkflowRaciTableProps> = ({
  dataSource = [],
  loading = false,
  onRefresh,
  onOpenRowDetail,
  title,
  showHint = true,
  emptyText,
  className = "",
  style,
}) => {
  const { t, language } = useTranslation();

  const columns = [
    {
      title: "#",
      dataIndex: "RowNum",
      key: "RowNum",
      width: 55,
      align: "center" as const,
      render: (val: any, _: any, idx: number) => (
        <span style={{ fontFamily: "monospace", color: "#718894", fontWeight: 600, fontSize: 13 }}>
          #{val || idx + 1}
        </span>
      ),
    },
    {
      title: language === "en" ? "Role" : "Vai trò",
      dataIndex: "Role",
      key: "Role",
      width: 85,
      align: "center" as const,
      render: (val: string) => renderRaciRoleBadge(val),
    },
    {
      title: language === "en" ? "Assignee" : "Người phụ trách",
      dataIndex: "FullName",
      key: "FullName",
      width: 170,
      render: (val: string, r: any) => (
        <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
          {val || r.UserName || "---"}
        </span>
      ),
    },
    {
      title: language === "en" ? "Decision / Status" : "Quyết định",
      dataIndex: "ApprovalStatus",
      key: "ApprovalStatus",
      width: 145,
      align: "center" as const,
      render: (val: string) => renderStatusBadge(val, undefined, language),
    },
    {
      title: language === "en" ? "Remarks / Comments" : "Ý kiến / Ghi chú",
      dataIndex: "Remarks",
      key: "Remarks",
      ellipsis: true,
      render: (val: string) =>
        val ? (
          <span style={{ fontSize: 13, color: "#334155" }} title={val}>
            {val}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
            {language === "en" ? "None" : "Chưa có"}
          </span>
        ),
    },
    {
      title: language === "en" ? "Execution Time" : "Thời gian",
      key: "time",
      width: 155,
      render: (_: any, r: any) => {
        const start = r.ActualStart ? dayjs(r.ActualStart).format("HH:mm DD/MM/YYYY") : null;
        const finish = r.ActualFinish ? dayjs(r.ActualFinish).format("HH:mm DD/MM/YYYY") : null;
        return (
          <div style={{ fontSize: 12, color: "#718894", lineHeight: "18px" }}>
            {start && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IconClock size={12} strokeWidth={1.8} style={{ color: "#F59E0B" }} />
                <span>{start}</span>
              </div>
            )}
            {finish && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#008f89", fontWeight: 500 }}>
                <IconCheck size={12} strokeWidth={2.2} />
                <span>{finish}</span>
              </div>
            )}
            {!start && !finish && <span style={{ color: "#94A3B8" }}>---</span>}
          </div>
        );
      },
    },
  ];

  return (
    <div className={`erp-workflow-raci-container ${className}`} style={style}>
      <style jsx global>{`
        .erp-workflow-raci-table .ant-table-thead > tr > th {
          background: #f7fbfa !important;
          color: #123443 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
        }
        .erp-workflow-raci-table .ant-table-tbody > tr > td {
          color: #123443 !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .erp-workflow-raci-table .ant-table-tbody > tr:hover > td {
          background-color: #eef8f6 !important;
        }
        .erp-workflow-raci-table .ant-table-container {
          border: 1px solid #dce5e6 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
      `}</style>

      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {title ? (
            title
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#718894",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {language === "en" ? "RACI APPROVAL STEPS" : "CÁC BƯỚC PHÊ DUYỆT RACI"}
            </span>
          )}
          <Tag
            style={{
              background: "#dce5e6",
              color: "#008f89",
              borderRadius: 12,
              border: "none",
              fontSize: 11,
              fontWeight: 600,
              padding: "1px 8px",
              margin: 0,
            }}
          >
            {dataSource.length} {language === "en" ? "steps" : "bước"}
          </Tag>
        </div>

        {onRefresh && (
          <Button
            size="small"
            icon={<IconRefresh size={14} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={onRefresh}
            loading={loading}
            style={{
              borderRadius: 6,
              borderColor: "#dce5e6",
              fontSize: 12,
              fontWeight: 500,
              color: "#334155",
            }}
          >
            {language === "en" ? "Refresh" : "Làm mới"}
          </Button>
        )}
      </div>

      {/* Click hint */}
      {showHint && onOpenRowDetail && (
        <div
          style={{
            fontSize: 12,
            color: "#718894",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>💡</span>
          {t("workflow.clickHint") ||
            (language === "en"
              ? "Click a row below to view / enter decision"
              : "Nhấn vào dòng bên dưới để xem / nhập quyết định")}
        </div>
      )}

      {/* The Table */}
      <Table
        className="erp-workflow-raci-table"
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey={(r, index) => r.AssignmentId ?? r.RowNum ?? `wf_${index}`}
        pagination={false}
        size="middle"
        onRow={(record) => ({
          onClick: () => onOpenRowDetail && onOpenRowDetail(record),
          style: { cursor: onOpenRowDetail ? "pointer" : "default" },
        })}
        locale={{
          emptyText: emptyText || (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#94A3B8" }}>
              <IconGitBranch size={36} strokeWidth={1.4} style={{ opacity: 0.4, marginBottom: 8 }} />
              <div>
                {language === "en"
                  ? "No workflow steps found."
                  : "Chưa có quy trình duyệt cho hạng mục này."}
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default WorkflowRaciTable;
