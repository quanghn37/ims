"use client";

import React, { useMemo } from "react";
import { Button, Popconfirm } from "antd";
import { IconArrowBackUp } from "@tabler/icons-react";
import { getStatusStyle, STATUS_CONFIG_MAP } from "@/config/statusConfig";
import { useTranslation } from "@/locales/LanguageContext";

export interface UnconfirmTransactionButtonProps {
  record?: any;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  transactionType?: "receipt" | "issue";
}

/**
 * Kiểm tra phiếu nhập/xuất có đang ở trạng thái Đã duyệt hay không
 */
export function isTransactionApproved(record?: any): boolean {
  if (!record) return false;

  const rawStatus =
    record.Status !== undefined && record.Status !== null && record.Status !== ""
      ? record.Status
      : record.StatusCode !== undefined && record.StatusCode !== null && record.StatusCode !== ""
      ? record.StatusCode
      : record.ApprovalStatus !== undefined && record.ApprovalStatus !== null && record.ApprovalStatus !== ""
      ? record.ApprovalStatus
      : record.status;

  if (rawStatus !== undefined && rawStatus !== null && !isNaN(Number(rawStatus))) {
    if (Number(rawStatus) === 1) return true;
  }

  const statusUpper = String(record.status || "").trim().toUpperCase();
  if (statusUpper === "COMPLETED" || statusUpper === "APPROVED") {
    return true;
  }

  const labelCandidate =
    record.ApprovalStatusName ||
    record.StatusName ||
    (typeof rawStatus === "string" ? rawStatus : "");

  if (labelCandidate) {
    const style = getStatusStyle(labelCandidate);
    if (
      style === STATUS_CONFIG_MAP.approved ||
      style === STATUS_CONFIG_MAP.accepted ||
      style === STATUS_CONFIG_MAP.cond_approved
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Kiểm tra phiếu có đang ở trạng thái Đã duyệt hoặc Từ chối hay không (để ẩn nút Lưu/Cập nhật & Xóa)
 */
export function isTransactionApprovedOrRejected(record?: any): boolean {
  if (!record) return false;
  if (isTransactionApproved(record)) return true;

  const rawStatus =
    record.Status !== undefined && record.Status !== null && record.Status !== ""
      ? record.Status
      : record.StatusCode !== undefined && record.StatusCode !== null && record.StatusCode !== ""
      ? record.StatusCode
      : record.ApprovalStatus !== undefined && record.ApprovalStatus !== null && record.ApprovalStatus !== ""
      ? record.ApprovalStatus
      : record.status;

  if (rawStatus !== undefined && rawStatus !== null && !isNaN(Number(rawStatus))) {
    const num = Number(rawStatus);
    if (num === 3 || num === -1) return true;
  }

  const statusUpper = String(record.status || "").trim().toUpperCase();
  if (statusUpper === "REJECTED" || statusUpper === "CANCELLED") {
    return true;
  }

  const labelCandidate =
    record.ApprovalStatusName ||
    record.StatusName ||
    (typeof rawStatus === "string" ? rawStatus : "");

  if (labelCandidate) {
    const style = getStatusStyle(labelCandidate);
    if (style === STATUS_CONFIG_MAP.rejected) {
      return true;
    }
  }

  return false;
}

export default function UnconfirmTransactionButton({
  record,
  loading = false,
  onConfirm,
  transactionType = "receipt",
}: UnconfirmTransactionButtonProps) {
  const { language } = useTranslation();

  const isApproved = useMemo(() => isTransactionApproved(record), [record]);

  if (!isApproved) return null;

  const isEn = language === "en";
  const label = isEn ? "Unconfirm" : "Gỡ xác nhận";
  const confirmTitle = isEn
    ? "Unconfirm this transaction?"
    : transactionType === "issue"
    ? "Xác nhận gỡ xác nhận phiếu xuất kho này?"
    : "Xác nhận gỡ xác nhận phiếu nhập kho này?";
  const confirmDesc = isEn
    ? "After unconfirming, inventory balances will be reverted and the status will return to Draft."
    : transactionType === "issue"
    ? "Sau khi gỡ xác nhận, số lượng tồn kho sẽ được hoàn lại và phiếu chuyển về trạng thái Đang lập."
    : "Sau khi gỡ xác nhận, số lượng tồn kho sẽ được trừ ngược lại và phiếu chuyển về trạng thái Đang lập.";

  return (
    <Popconfirm
      title={confirmTitle}
      description={confirmDesc}
      onConfirm={onConfirm}
      okText={isEn ? "Yes" : "Có"}
      cancelText={isEn ? "No" : "Không"}
      okButtonProps={{
        loading,
        style: {
          background: "#EA580C",
          borderColor: "#EA580C",
        },
      }}
    >
      <Button
        icon={<IconArrowBackUp size={16} strokeWidth={2} />}
        loading={loading}
        style={{
          height: 32,
          padding: "0 14px",
          borderRadius: 6,
          background: "#FFF7ED",
          borderColor: "#FED7AA",
          color: "#EA580C",
          fontSize: 13,
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label}
      </Button>
    </Popconfirm>
  );
}
