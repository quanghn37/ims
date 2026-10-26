"use client";

import React from "react";
import { useTranslation } from "@/locales/LanguageContext";
import { renderStatusBadge, getStatusStyle } from "@/config/statusConfig";

export interface ApprovalBadgeProps {
  val?: any;
  record?: any;
  language?: string;
}

export const renderApprovalBadge = (val: any, record?: any, language?: string) => {
  const rawStatus =
    val !== undefined && val !== null && val !== ""
      ? String(val)
      : record?.StatusCode !== undefined && record?.StatusCode !== null && record?.StatusCode !== ""
      ? String(record.StatusCode)
      : record?.Statuscode || record?.ApprovalStatus || record?.Status || record?.StatusName || "";

  return renderStatusBadge(rawStatus, undefined, language);
};

export const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ val, record, language }) => {
  const { language: currentLang } = useTranslation();
  return renderApprovalBadge(val, record, language || currentLang);
};

export { getStatusStyle, renderStatusBadge };
export default ApprovalBadge;
