"use client";

import React, { useState, useEffect } from "react";
import { Button, Modal, Select, Tag, Typography, message } from "antd";
import {
  IconRefresh,
  IconCheck,
  IconCircleX,
  IconSearch,
  IconAlertTriangle,
  IconCircleCheck,
  IconExclamationCircle,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";
import UserSelectField from "./UserSelectField";
import {
  ClientUserItem,
  ReplaceTaskUpdateMode,
  WORK_TYPE_KEYS,
  replaceTaskAssignmentApi,
} from "../api";

const { Text } = Typography;

export interface SyncPayload {
  version: number;
  subconOfId: number | null;
  subconOfDisplay: string;
  workType: string | null;
  oldUserId: number | null;
  oldUserObj: ClientUserItem | null;
  newUserId: number | null;
  newUserObj: ClientUserItem | null;
}

interface ExecutionResult {
  success: boolean;
  timestamp: string;
  message: string;
  payload: {
    SubconOf: number;
    WorkType: string | null;
    OldUserId: number;
    NewUserId: number;
    UpdateMode: ReplaceTaskUpdateMode;
  };
  rawResponse?: any;
}

interface AssignmentReplaceCardProps {
  title: string;
  subtitle: string;
  updateMode: ReplaceTaskUpdateMode;
  badgeColor: string;
  initialUsers: ClientUserItem[];
  syncData?: SyncPayload | null;
  onRequestMainContractLov: (
    callback: (contractId: number, displayLabel: string) => void
  ) => void;
}

export default function AssignmentReplaceCard({
  title,
  subtitle,
  updateMode,
  badgeColor,
  initialUsers,
  syncData,
  onRequestMainContractLov,
}: AssignmentReplaceCardProps) {
  const { t } = useTranslation();
  const [subconOfId, setSubconOfId] = useState<number | null>(null);
  const [subconOfDisplay, setSubconOfDisplay] = useState<string>("");
  const [workType, setWorkType] = useState<string | null>(null);

  const [oldUserId, setOldUserId] = useState<number | null>(null);
  const [oldUserObj, setOldUserObj] = useState<ClientUserItem | null>(null);

  const [newUserId, setNewUserId] = useState<number | null>(null);
  const [newUserObj, setNewUserObj] = useState<ClientUserItem | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);

  // Đồng bộ dữ liệu từ thanh điền nhanh ở trên khi người dùng bấm "Áp dụng cho cả 2 khung"
  useEffect(() => {
    if (!syncData || syncData.version === 0) return;
    setSubconOfId(syncData.subconOfId);
    setSubconOfDisplay(syncData.subconOfDisplay);
    setWorkType(syncData.workType ?? null);
    setOldUserId(syncData.oldUserId);
    setOldUserObj(syncData.oldUserObj);
    setNewUserId(syncData.newUserId);
    setNewUserObj(syncData.newUserObj);
  }, [syncData]);

  const handleReset = () => {
    setSubconOfId(null);
    setSubconOfDisplay("");
    setWorkType(null);
    setOldUserId(null);
    setOldUserObj(null);
    setNewUserId(null);
    setNewUserObj(null);
    setLastResult(null);
  };

  const handleSubmit = () => {
    const rt = t.replaceTaskAssignment;
    if (!subconOfId) {
      message.warning(rt.mainContractRequired);
      return;
    }
    if (!oldUserId) {
      message.warning(rt.oldApproverRequired);
      return;
    }
    if (!newUserId) {
      message.warning(rt.newApproverRequired);
      return;
    }
    if (Number(oldUserId) === Number(newUserId)) {
      message.error(rt.sameUserError);
      return;
    }

    const oldLabel = oldUserObj
      ? `${oldUserObj.FullName} (${oldUserObj.Account}) - #${oldUserId}`
      : `#${oldUserId}`;
    const newLabel = newUserObj
      ? `${newUserObj.FullName} (${newUserObj.Account}) - #${newUserId}`
      : `#${newUserId}`;

    const workTypeDisplay = workType
      ? (rt.workTypes as Record<string, string>)[workType] || workType
      : rt.allWorkTypesLabel;

    Modal.confirm({
      title: `${rt.confirmTitlePrefix} ${title}`,
      icon: <IconAlertTriangle size={20} style={{ color: "#f59e0b", marginRight: 8 }} />,
      width: 520,
      content: (
        <div style={{ fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>
            {rt.confirmDesc}
          </div>
          <div
            style={{
              background: "#f7fbfa",
              border: "1px solid #dce5e6",
              borderRadius: 6,
              padding: "10px 12px",
            }}
          >
            <div>
              <strong>{rt.confirmModeLabel}</strong>{" "}
              <Tag color={badgeColor} style={{ marginLeft: 4 }}>
                {updateMode}
              </Tag>
            </div>
            <div>
              <strong>{rt.confirmMainContractLabel}</strong>{" "}
              <span style={{ color: "#123443" }}>{subconOfDisplay || `#${subconOfId}`}</span>
            </div>
            <div>
              <strong>{rt.confirmWorkTypeLabel}</strong>{" "}
              <span style={{ color: "#123443" }}>{workTypeDisplay}</span>
            </div>
            <div>
              <strong>{rt.confirmOldApproverLabel}</strong>{" "}
              <span style={{ color: "#dc2626" }}>{oldLabel}</span>
            </div>
            <div>
              <strong>{rt.confirmNewApproverLabel}</strong>{" "}
              <span style={{ color: "#008f89", fontWeight: 600 }}>{newLabel}</span>
            </div>
          </div>
        </div>
      ),
      okText: rt.confirmOkText,
      cancelText: rt.confirmCancelText,
      okButtonProps: {
        style: { background: "#008f89", borderColor: "#008f89" },
      },
      onOk: async () => {
        setSubmitting(true);
        const payload = {
          OldUserId: Number(oldUserId),
          NewUserId: Number(newUserId),
          SubconOf: Number(subconOfId),
          WorkType: workType || null,
        };
        try {
          const res: any = await replaceTaskAssignmentApi.replaceTaskAssignment(
            payload,
            updateMode
          );
          const apiMsg =
            res?.Message ||
            res?.message ||
            (Array.isArray(res) && res[0]?.Message) ||
            rt.updateSuccessDefault;

          message.success(`[${updateMode}] ${apiMsg}`);
          setLastResult({
            success: true,
            timestamp: dayjs().format("DD/MM/YYYY HH:mm:ss"),
            message: apiMsg,
            payload: { ...payload, UpdateMode: updateMode },
            rawResponse: res,
          });
        } catch (err: any) {
          const errMsg = err?.message || rt.updateErrorDefault;
          message.error(`[${updateMode}] ${errMsg}`);
          setLastResult({
            success: false,
            timestamp: dayjs().format("DD/MM/YYYY HH:mm:ss"),
            message: errMsg,
            payload: { ...payload, UpdateMode: updateMode },
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const isSameUser = Boolean(oldUserId && newUserId && Number(oldUserId) === Number(newUserId));

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #dce5e6",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
      }}
    >
      {/* Header khung */}
      <div
        style={{
          background: "#f7fbfa",
          borderBottom: "1px solid #dce5e6",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#008f89", textTransform: "uppercase" }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>

      {/* Thân khung */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 1. HĐ CĐT / Dự án (SubconOf) */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            {t.replaceTaskAssignment.mainContractLabel} <span style={{ color: "#ff4d4f" }}>*</span>
          </div>
          <div
            onClick={() =>
              !submitting &&
              onRequestMainContractLov((contractId, displayLabel) => {
                setSubconOfId(contractId);
                setSubconOfDisplay(displayLabel);
              })
            }
            style={{
              height: 34,
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              padding: "0 11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: submitting ? "not-allowed" : "pointer",
              background: "#ffffff",
              fontSize: 13,
              color: subconOfDisplay ? "#1e293b" : "#94a3b8",
            }}
            title={subconOfDisplay}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: subconOfDisplay
                  ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  : "inherit",
              }}
            >
              {subconOfDisplay || t.replaceTaskAssignment.clickToSelectMainContract}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
              {subconOfId && !submitting && (
                <IconCircleX
                  size={15}
                  strokeWidth={1.8}
                  style={{ color: "#94a3b8", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubconOfId(null);
                    setSubconOfDisplay("");
                  }}
                />
              )}
              <IconSearch size={15} strokeWidth={1.8} style={{ color: "#008f89" }} />
            </span>
          </div>
        </div>

        {/* 2. Loại phiếu / Công việc (WorkType - tùy chọn) */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            {t.replaceTaskAssignment.workTypeLabel}
          </div>
          <Select
            allowClear
            showSearch
            disabled={submitting}
            value={workType ?? undefined}
            placeholder={t.replaceTaskAssignment.selectWorkTypePlaceholder}
            optionFilterProp="label"
            style={{ width: "100%" }}
            onChange={(val) => setWorkType(val ?? null)}
            options={WORK_TYPE_KEYS.map((key) => ({
              value: key,
              label: (t.replaceTaskAssignment.workTypes as Record<string, string>)[key] || key,
            }))}
          />
        </div>

        {/* 3. Người duyệt cũ */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            {t.replaceTaskAssignment.oldApproverLabel} <span style={{ color: "#ff4d4f" }}>*</span>
          </div>
          <UserSelectField
            value={oldUserId}
            selectedUserHint={oldUserObj}
            initialUsers={initialUsers}
            disabled={submitting}
            placeholder={t.replaceTaskAssignment.searchOldApproverPlaceholder}
            onChange={(id, obj) => {
              setOldUserId(id ?? null);
              setOldUserObj(obj ?? null);
            }}
          />
        </div>

        {/* 3. Người duyệt mới */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            {t.replaceTaskAssignment.newApproverLabel} <span style={{ color: "#ff4d4f" }}>*</span>
          </div>
          <UserSelectField
            value={newUserId}
            selectedUserHint={newUserObj}
            initialUsers={initialUsers}
            disabled={submitting}
            placeholder={t.replaceTaskAssignment.searchNewApproverPlaceholder}
            onChange={(id, obj) => {
              setNewUserId(id ?? null);
              setNewUserObj(obj ?? null);
            }}
          />
          {isSameUser && (
            <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
              {t.replaceTaskAssignment.sameUserError}
            </div>
          )}
        </div>

        {/* Nút tác vụ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 8,
            borderTop: "1px solid #eef2f6",
          }}
        >
          <Button
            icon={<IconRefresh size={15} strokeWidth={1.8} />}
            onClick={handleReset}
            disabled={submitting}
            style={{ borderColor: "#dce5e6", borderRadius: 6, height: 34 }}
          >
            {t.replaceTaskAssignment.refreshBtn}
          </Button>
          <Button
            type="primary"
            icon={<IconCheck size={16} strokeWidth={2} />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={isSameUser}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              borderRadius: 6,
              height: 34,
              fontWeight: 500,
              color: "#ffffff",
            }}
          >
            {t.replaceTaskAssignment.updateBtn}
          </Button>
        </div>

        {/* Kết quả thực thi gần nhất */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>
            {t.replaceTaskAssignment.latestResultTitle}
          </div>
          {lastResult ? (
            <div
              style={{
                border: `1px solid ${lastResult.success ? "#bbf7d0" : "#fecaca"}`,
                background: lastResult.success ? "#f0fdf4" : "#fef2f2",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 12.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: lastResult.success ? "#15803d" : "#b91c1c" }}>
                {lastResult.success ? (
                  <IconCircleCheck size={16} strokeWidth={2} />
                ) : (
                  <IconExclamationCircle size={16} strokeWidth={2} />
                )}
                <span>{lastResult.success ? t.replaceTaskAssignment.statusSuccess : t.replaceTaskAssignment.statusFailed}</span>
                <span style={{ marginLeft: "auto", fontWeight: 400, fontSize: 11.5, color: "#64748b" }}>
                  {lastResult.timestamp}
                </span>
              </div>
              <div style={{ marginTop: 6, color: "#1e293b" }}>
                <strong>{t.replaceTaskAssignment.responseLabel}</strong> {lastResult.message}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11.5,
                  color: "#475569",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                SubconOf: {lastResult.payload.SubconOf} | WorkType: {lastResult.payload.WorkType ?? "null"} | OldUserId: {lastResult.payload.OldUserId} → NewUserId:{" "}
                {lastResult.payload.NewUserId}
              </div>
            </div>
          ) : (
            <div
              style={{
                border: "1px dashed #dce5e6",
                background: "#fafcfc",
                borderRadius: 6,
                padding: "12px",
                textAlign: "center",
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.replaceTaskAssignment.noExecutionYet}
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
