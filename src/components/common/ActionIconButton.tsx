"use client";

import React from "react";
import { Tooltip } from "antd";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconEye,
  IconRoute,
  IconSend,
  IconCircleCheck,
  IconCircleX,
  IconLock,
  IconFileSpreadsheet,
  IconDownload,
  IconScale,
  IconRefresh,
  IconHistory,
  IconCopy,
  TablerIcon,
} from "@tabler/icons-react";
import { useTranslation, SupportedLanguage } from "@/locales/LanguageContext";

export type SystemActionType =
  | "add"
  | "edit"
  | "delete"
  | "view"
  | "workflow"
  | "send"
  | "approve"
  | "reject"
  | "lock"
  | "import-excel"
  | "export"
  | "compare-price"
  | "refresh"
  | "history"
  | "copy";

export interface ActionConfig {
  key: SystemActionType;
  label: string;
  defaultTooltip: string;
  icon: TablerIcon;
  color: string;
  bg: string;
  hoverBg: string;
  border?: string;
}

const ACTION_TOOLTIPS: Record<SupportedLanguage, Record<SystemActionType, string>> = {
  vi: {
    add: "Thêm mới",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    view: "Xem chi tiết",
    workflow: "Quy trình duyệt",
    send: "Gửi duyệt",
    approve: "Duyệt",
    reject: "Từ chối",
    lock: "Khóa",
    "import-excel": "Nhập Excel",
    export: "Xuất file",
    "compare-price": "Đối chiếu bảng giá",
    refresh: "Làm mới dữ liệu",
    history: "Lịch sử",
    copy: "Sao chép",
  },
  en: {
    add: "Add New",
    edit: "Edit",
    delete: "Delete",
    view: "View Details",
    workflow: "Approval Workflow",
    send: "Submit for Approval",
    approve: "Approve",
    reject: "Reject",
    lock: "Lock",
    "import-excel": "Import Excel",
    export: "Export File",
    "compare-price": "Reconcile Price List",
    refresh: "Refresh Data",
    history: "History",
    copy: "Copy",
  },
};

const COMMON_TOOLTIP_TRANSLATIONS_EN: Record<string, string> = {
  "Chỉnh sửa": "Edit",
  "Sửa": "Edit",
  "Xóa": "Delete",
  "Xem chi tiết": "View Details",
  "Thêm mới": "Add New",
  "Thao tác": "Actions",
  "Làm mới": "Refresh",
  "Tạo Phụ lục HĐ": "Create Addendum",
  "Tạo Phụ Lục HĐ": "Create Addendum",
  "Tạo phụ lục": "Create Addendum",
  "Xóa hợp đồng": "Delete Contract",
  "Xóa mặt hàng": "Delete Item",
  "Xóa tệp đính kèm": "Delete Attachment",
  "Quy trình duyệt": "Approval Workflow",
  "Đối chiếu đơn hàng": "Reconcile PO",
  "Đối chiếu bảng giá": "Reconcile Price List",
  "Chỉnh sửa chi tiết": "Edit Details",
  "Xem chi tiết mặt hàng": "View Item Details",
  "Sao chép": "Copy",
  "Xuất file": "Export File",
  "Xem lịch sử": "View History",
};

export const SYSTEM_ACTION_CONFIGS: Record<SystemActionType, ActionConfig> = {
  add: {
    key: "add",
    label: "Thêm vật tư / mới",
    defaultTooltip: "Thêm mới",
    icon: IconPlus,
    color: "#7C3AED",
    bg: "#F3E8FF",
    hoverBg: "#E9D5FF",
    border: "#E9D5FF",
  },
  edit: {
    key: "edit",
    label: "Sửa",
    defaultTooltip: "Chỉnh sửa",
    icon: IconPencil,
    color: "#7C3AED",
    bg: "#F3E8FF",
    hoverBg: "#E9D5FF",
    border: "#E9D5FF",
  },
  delete: {
    key: "delete",
    label: "Xóa",
    defaultTooltip: "Xóa",
    icon: IconTrash,
    color: "#EF4444",
    bg: "#FEE2E2",
    hoverBg: "#FECACA",
    border: "#FECACA",
  },
  view: {
    key: "view",
    label: "Xem chi tiết",
    defaultTooltip: "Xem chi tiết",
    icon: IconEye,
    color: "#475569",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
  workflow: {
    key: "workflow",
    label: "Quy trình duyệt",
    defaultTooltip: "Quy trình duyệt",
    icon: IconRoute,
    color: "#475569",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
  send: {
    key: "send",
    label: "Gửi duyệt",
    defaultTooltip: "Gửi duyệt",
    icon: IconSend,
    color: "#7C3AED",
    bg: "#F3E8FF",
    hoverBg: "#E9D5FF",
    border: "#E9D5FF",
  },
  approve: {
    key: "approve",
    label: "Duyệt / Chấp thuận",
    defaultTooltip: "Duyệt / Chấp thuận",
    icon: IconCircleCheck,
    color: "#16A34A",
    bg: "#DCFCE7",
    hoverBg: "#BBF7D0",
    border: "#BBF7D0",
  },
  reject: {
    key: "reject",
    label: "Từ chối",
    defaultTooltip: "Từ chối",
    icon: IconCircleX,
    color: "#EF4444",
    bg: "#FEE2E2",
    hoverBg: "#FECACA",
    border: "#FECACA",
  },
  lock: {
    key: "lock",
    label: "Đã khóa (BR-05)",
    defaultTooltip: "Đã khóa",
    icon: IconLock,
    color: "#64748B",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
  "import-excel": {
    key: "import-excel",
    label: "Import Excel",
    defaultTooltip: "Import Excel",
    icon: IconFileSpreadsheet,
    color: "#16A34A",
    bg: "#DCFCE7",
    hoverBg: "#BBF7D0",
    border: "#BBF7D0",
  },
  export: {
    key: "export",
    label: "Xuất file",
    defaultTooltip: "Xuất file",
    icon: IconDownload,
    color: "#475569",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
  "compare-price": {
    key: "compare-price",
    label: "Đối chiếu bảng giá",
    defaultTooltip: "Đối chiếu bảng giá",
    icon: IconScale,
    color: "#475569",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
  refresh: {
    key: "refresh",
    label: "Làm mới",
    defaultTooltip: "Làm mới dữ liệu",
    icon: IconRefresh,
    color: "#475569",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
  history: {
    key: "history",
    label: "Lịch sử giá / xử lý",
    defaultTooltip: "Lịch sử giá / xử lý",
    icon: IconHistory,
    color: "#475569",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
  copy: {
    key: "copy",
    label: "Sao chép",
    defaultTooltip: "Sao chép",
    icon: IconCopy,
    color: "#475569",
    bg: "#F1F5F9",
    hoverBg: "#E2E8F0",
    border: "#E2E8F0",
  },
};

export interface ActionIconButtonProps {
  action: SystemActionType;
  tooltip?: string | React.ReactNode;
  onClick?: React.MouseEventHandler<any>;
  disabled?: boolean;
  loading?: boolean;
  size?: "small" | "middle" | "large";
  variant?: "icon" | "button" | "card";
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const ActionIconButton: React.FC<ActionIconButtonProps> = ({
  action,
  tooltip,
  onClick,
  disabled = false,
  loading = false,
  size = "small",
  variant = "icon",
  label,
  style,
  className,
}) => {
  const { language } = useTranslation();
  const config = SYSTEM_ACTION_CONFIGS[action] || SYSTEM_ACTION_CONFIGS.view;
  const IconComp = config.icon;

  const iconSizes = {
    small: 16,
    middle: 18,
    large: 20,
  };

  const buttonPaddings = {
    small: "4px 8px",
    middle: "6px 12px",
    large: "8px 16px",
  };

  const iconBoxDimensions = {
    small: { width: 28, height: 28, borderRadius: 7 },
    middle: { width: 34, height: 34, borderRadius: 8 },
    large: { width: 40, height: 40, borderRadius: 10 },
  };

  const defaultLocalizedTooltip = ACTION_TOOLTIPS[language]?.[action] || config.defaultTooltip;

  let actualTooltip: React.ReactNode = defaultLocalizedTooltip;
  if (tooltip !== undefined) {
    if (language === "en" && typeof tooltip === "string" && COMMON_TOOLTIP_TRANSLATIONS_EN[tooltip]) {
      actualTooltip = COMMON_TOOLTIP_TRANSLATIONS_EN[tooltip];
    } else {
      actualTooltip = tooltip;
    }
  }

  let actualLabel: string | undefined = label !== undefined ? label : config.label;
  if (language === "en" && typeof actualLabel === "string" && COMMON_TOOLTIP_TRANSLATIONS_EN[actualLabel]) {
    actualLabel = COMMON_TOOLTIP_TRANSLATIONS_EN[actualLabel];
  }

  // Render variant: CARD (như hình mẫu hệ thống)
  if (variant === "card") {
    const cardContent = (
      <div
        onClick={disabled || loading ? undefined : onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          backgroundColor: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "all 0.2s ease",
          ...style,
        }}
        className={className}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: config.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: config.color,
            flexShrink: 0,
          }}
        >
          <IconComp size={20} strokeWidth={1.8} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
            {actualLabel}
          </span>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            {config.key}
          </span>
        </div>
      </div>
    );

    return actualTooltip ? <Tooltip title={actualTooltip}>{cardContent}</Tooltip> : cardContent;
  }

  // Render variant: BUTTON CÓ CHỮ (cho Toolbar / Thanh công cụ)
  if (variant === "button") {
    const buttonContent = (
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: buttonPaddings[size],
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border || config.bg}`,
          borderRadius: 8,
          fontSize: size === "small" ? 12 : 13,
          fontWeight: 600,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.15s ease",
          outline: "none",
          ...style,
        }}
        className={className}
      >
        <IconComp size={iconSizes[size]} strokeWidth={1.8} />
        <span>{actualLabel}</span>
      </button>
    );

    return actualTooltip ? <Tooltip title={actualTooltip}>{buttonContent}</Tooltip> : buttonContent;
  }

  // Render variant: ICON ONLY (cho Table Action Column)
  const iconOnlyContent = (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: iconBoxDimensions[size].width,
        height: iconBoxDimensions[size].height,
        borderRadius: iconBoxDimensions[size].borderRadius,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border || "transparent"}`,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        padding: 0,
        outline: "none",
        ...style,
      }}
      className={className}
    >
      <IconComp size={iconSizes[size]} strokeWidth={1.8} />
    </button>
  );

  return actualTooltip ? <Tooltip title={actualTooltip}>{iconOnlyContent}</Tooltip> : iconOnlyContent;
};

export default ActionIconButton;
