"use client";

import React from "react";
import { useTranslation } from "@/locales/LanguageContext";
import { renderStatusBadge, getStatusStyle } from "@/config/statusConfig";

export interface ApprovalBadgeProps {
  val?: any;
  record?: any;
  language?: string;
  customLabel?: string;
}

export const renderApprovalBadge = (val: any, record?: any, language?: string, customLabel?: string) => {
  const displayLabel =
    customLabel ||
    record?.ApprovalStatusName ||
    record?.StatusName ||
    (typeof val === "string" && isNaN(Number(val)) && val.trim() !== "" ? val : undefined);

  const rawStatus =
    (customLabel && String(customLabel).trim()) ||
    (record?.ApprovalStatusName && String(record.ApprovalStatusName).trim()) ||
    (record?.StatusName && String(record.StatusName).trim()) ||
    (val !== undefined && val !== null && val !== "" ? String(val) : "") ||
    (record?.ApprovalStatus !== undefined && record?.ApprovalStatus !== null && record?.ApprovalStatus !== ""
      ? String(record.ApprovalStatus)
      : "") ||
    (record?.StatusCode !== undefined && record?.StatusCode !== null && record?.StatusCode !== ""
      ? String(record.StatusCode)
      : "") ||
    record?.Statuscode ||
    record?.ApprovalStatus ||
    record?.Status ||
    "";

  return renderStatusBadge(rawStatus, displayLabel, language);
};

export const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ val, record, language, customLabel }) => {
  const { language: currentLang } = useTranslation();
  return renderApprovalBadge(val, record, language || currentLang, customLabel);
};

export { getStatusStyle, renderStatusBadge };
export default ApprovalBadge;
