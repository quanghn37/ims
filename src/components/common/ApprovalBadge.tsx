"use client";

import React from "react";
import { Typography } from "antd";
import {
  IconCheck,
  IconClockHour4,
  IconMessageDots,
  IconX,
} from "@tabler/icons-react";

import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

export interface ApprovalBadgeProps {
  val?: any;
  record?: any;
}

export const renderApprovalBadge = (val: any, record?: any, language: string = "vi") => {
  const rawStatus =
    val !== undefined && val !== null && val !== ""
      ? String(val)
      : record?.StatusCode !== undefined && record?.StatusCode !== null && record?.StatusCode !== ""
      ? String(record.StatusCode)
      : record?.Statuscode || record?.ApprovalStatus || record?.Status || record?.StatusName || "";

  if (!rawStatus) {
    return <Text type="secondary" style={{ fontSize: 13 }}>---</Text>;
  }

  // Loại bỏ icon emoji cũ nếu có trong string
  const cleanStatus = String(rawStatus)
    .replace(/^[🕒✓💬✕\s]+/, "")
    .trim();
  const lower = cleanStatus.toLowerCase();

  const isDone =
    lower === "chấp thuận" ||
    lower === "chap thuan" ||
    lower === "đã duyệt" ||
    lower === "da duyet" ||
    lower === "duyệt" ||
    lower === "approved" ||
    lower === "1";

  const isProcessing =
    lower === "dang làm" ||
    lower === "đang làm" ||
    lower === "dang lam" ||
    lower === "đang xử lý" ||
    lower === "dang xu ly" ||
    lower === "processing";

  const isRejected =
    lower === "từ chối" ||
    lower === "tu choi" ||
    lower === "rejected" ||
    lower === "hủy" ||
    lower === "huy";

  let bg = "#f59e0b";
  let IconComp = IconClockHour4;
  let displayLabel = cleanStatus || rawStatus;

  if (isDone) {
    bg = "#0d9488";
    IconComp = IconCheck;
    displayLabel = cleanStatus || (language === "en" ? "Approved" : "Chấp thuận");
  } else if (isProcessing) {
    bg = "#f97316";
    IconComp = IconMessageDots;
    displayLabel = cleanStatus || (language === "en" ? "Processing" : "Đang làm");
  } else if (isRejected) {
    bg = "#ef4444";
    IconComp = IconX;
    displayLabel = cleanStatus || (language === "en" ? "Rejected" : "Từ chối");
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        boxShadow: `0 2px 6px ${bg}55`,
        border: "none",
        whiteSpace: "nowrap",
      }}
    >
      <IconComp size={14} strokeWidth={2.2} />
      <span>{displayLabel}</span>
    </span>
  );
};

export const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ val, record }) => {
  const { language } = useTranslation();
  return renderApprovalBadge(val, record, language);
};

export default ApprovalBadge;
