"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Row, Col, Button, Select, message } from "antd";
import dynamic from "next/dynamic";
import {
  IconCopyCheck,
  IconRefresh,
  IconSearch,
  IconCircleX,
} from "@tabler/icons-react";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";
import { ClientUserItem, ROLE_KEYS, TYPE_KEYS, WORK_TYPE_KEYS, isTypeApplicableWorkType, replaceTaskAssignmentApi } from "./api";
import UserSelectField from "./_components/UserSelectField";
import AssignmentReplaceCard, {
  SyncPayload,
} from "./_components/AssignmentReplaceCard";

const MainContractLovModal = dynamic(
  () => import("@/components/lov/MainContractLovModal"),
  { ssr: false }
);

export default function ReplaceTaskAssignmentPage() {
  const { t } = useTranslation();
  // Danh sách user khởi tạo dùng chung cho các dropdown
  const [initialUsers, setInitialUsers] = useState<ClientUserItem[]>([]);

  // State thanh điền nhanh dùng chung
  const [quickSubconOfId, setQuickSubconOfId] = useState<number | null>(null);
  const [quickSubconOfDisplay, setQuickSubconOfDisplay] = useState<string>("");
  const [quickWorkType, setQuickWorkType] = useState<string | null>(null);
  const [quickRole, setQuickRole] = useState<string | null>(null);
  const [quickType, setQuickType] = useState<string | null>(null);
  const [quickOldUserId, setQuickOldUserId] = useState<number | null>(null);
  const [quickOldUserObj, setQuickOldUserObj] = useState<ClientUserItem | null>(null);
  const [quickNewUserId, setQuickNewUserId] = useState<number | null>(null);
  const [quickNewUserObj, setQuickNewUserObj] = useState<ClientUserItem | null>(null);

  // Payload đồng bộ sang 2 khung độc lập
  const [syncData, setSyncData] = useState<SyncPayload | null>(null);

  // State cho MainContractLovModal dùng chung
  const [isMainContractLovOpen, setIsMainContractLovOpen] = useState(false);
  const [mainContractList, setMainContractList] = useState<any[]>([]);
  const [loadingMainContracts, setLoadingMainContracts] = useState(false);
  const [mainContractSearchInput, setMainContractSearchInput] = useState("");
  const [mainContractPagination, setMainContractPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Callback lưu đích đến khi chọn HĐ CĐT từ LOV
  const lovCallbackRef = useRef<
    ((contractId: number, displayLabel: string) => void) | null
  >(null);

  useEffect(() => {
    const loadInitialUsers = async () => {
      try {
        const res = await replaceTaskAssignmentApi.getUsers({
          Keyword: "@centralcons.vn",
        });
        const list = extractApiList<ClientUserItem>(res);
        setInitialUsers(list);
      } catch (err) {
        console.error("Lỗi tải danh sách user khởi tạo:", err);
      }
    };
    loadInitialUsers();
  }, []);

  const fetchMainContracts = useCallback(
    async (keyword = "", page = 1, pageSize = 20) => {
      setLoadingMainContracts(true);
      try {
        const data = await replaceTaskAssignmentApi.getMainContracts({
          DisplayMode: "brief_contracts_by_user",
          QueryByAgent: "no",
          Keyword: keyword,
          ContractType: "main_contract",
          ContractFormat: "",
          PageNum: page,
          PageSize: pageSize,
        });
        const list = extractApiList(data);
        setMainContractList(list);
        setMainContractPagination({
          current: page,
          pageSize,
          total: extractTotalRows(data, list.length),
        });
      } catch (err) {
        console.error("Lỗi tải danh sách HĐ CĐT:", err);
        message.error(t.replaceTaskAssignment.loadMainContractsError);
      } finally {
        setLoadingMainContracts(false);
      }
    },
    [t.replaceTaskAssignment.loadMainContractsError]
  );

  const openMainContractLov = useCallback(
    (callback: (contractId: number, displayLabel: string) => void) => {
      lovCallbackRef.current = callback;
      setMainContractSearchInput("");
      fetchMainContracts("", 1, mainContractPagination.pageSize);
      setIsMainContractLovOpen(true);
    },
    [fetchMainContracts, mainContractPagination.pageSize]
  );

  const handleSelectMainContract = (record: any) => {
    const contractId = Number(record.ContractId ?? record.MainContractId);
    const contractCode =
      record.ContractCode || record.MainContractCode || `#${contractId}`;
    const contractName =
      record.ContractName || record.MainContractName || record.Description || "";
    const displayStr = contractName
      ? `${contractCode} - ${contractName} (#${contractId})`
      : `${contractCode} (#${contractId})`;

    if (lovCallbackRef.current && contractId) {
      lovCallbackRef.current(contractId, displayStr);
    }
    setIsMainContractLovOpen(false);
  };

  const handleApplyToBoth = () => {
    if (!quickSubconOfId && !quickWorkType && !quickRole && !quickType && !quickOldUserId && !quickNewUserId) {
      message.warning(t.replaceTaskAssignment.applySelectAtLeastOne);
      return;
    }
    setSyncData((prev) => ({
      version: (prev?.version ?? 0) + 1,
      subconOfId: quickSubconOfId,
      subconOfDisplay: quickSubconOfDisplay,
      workType: quickWorkType,
      role: quickRole,
      type: isTypeApplicableWorkType(quickWorkType) ? quickType : null,
      oldUserId: quickOldUserId,
      oldUserObj: quickOldUserObj,
      newUserId: quickNewUserId,
      newUserObj: quickNewUserObj,
    }));
    message.success(t.replaceTaskAssignment.applySuccess);
  };

  const handleResetQuick = () => {
    setQuickSubconOfId(null);
    setQuickSubconOfDisplay("");
    setQuickWorkType(null);
    setQuickRole(null);
    setQuickType(null);
    setQuickOldUserId(null);
    setQuickOldUserObj(null);
    setQuickNewUserId(null);
    setQuickNewUserObj(null);
  };

  return (
    <ErpPageContainer>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          paddingBottom: 8,
        }}
      >
        {/* THANH ĐIỀN NHANH DÙNG CHUNG CHO CẢ 2 KHUNG */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #dce5e6",
            borderRadius: 8,
            padding: "10px 16px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                {t.replaceTaskAssignment.mainContractLabel}
              </div>
              <div
                onClick={() =>
                  openMainContractLov((contractId, displayLabel) => {
                    setQuickSubconOfId(contractId);
                    setQuickSubconOfDisplay(displayLabel);
                  })
                }
                style={{
                  height: 32,
                  border: "1px solid #d9d9d9",
                  borderRadius: 6,
                  padding: "0 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  background: "#ffffff",
                  fontSize: 12.5,
                  color: quickSubconOfDisplay ? "#1e293b" : "#94a3b8",
                }}
                title={quickSubconOfDisplay}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: quickSubconOfDisplay
                      ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                      : "inherit",
                  }}
                >
                  {quickSubconOfDisplay || t.replaceTaskAssignment.selectMainContractPlaceholder}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {quickSubconOfId && (
                    <IconCircleX
                      size={14}
                      strokeWidth={1.8}
                      style={{ color: "#94a3b8", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickSubconOfId(null);
                        setQuickSubconOfDisplay("");
                      }}
                    />
                  )}
                  <IconSearch size={14} strokeWidth={1.8} style={{ color: "#008f89" }} />
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 190 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                {t.replaceTaskAssignment.workTypeLabel}
              </div>
              <Select
                allowClear
                showSearch
                value={quickWorkType ?? undefined}
                placeholder={t.replaceTaskAssignment.selectWorkTypePlaceholder}
                optionFilterProp="label"
                style={{ width: "100%" }}
                onChange={(val) => {
                  const nextWorkType = val ?? null;
                  setQuickWorkType(nextWorkType);
                  if (!isTypeApplicableWorkType(nextWorkType)) {
                    setQuickType(null);
                  }
                }}
                options={WORK_TYPE_KEYS.map((key) => ({
                  value: key,
                  label: (t.replaceTaskAssignment.workTypes as Record<string, string>)[key] || key,
                }))}
              />
            </div>

            <div style={{ flex: 0.75, minWidth: 140 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                {t.replaceTaskAssignment.roleLabel}
              </div>
              <Select
                allowClear
                value={quickRole ?? undefined}
                placeholder={t.replaceTaskAssignment.selectRolePlaceholder}
                style={{ width: "100%" }}
                onChange={(val) => setQuickRole(val ?? null)}
                options={ROLE_KEYS.map((key) => ({
                  value: key,
                  label: (t.replaceTaskAssignment.roles as Record<string, string>)[key] || key,
                }))}
              />
            </div>

            <div style={{ flex: 0.7, minWidth: 130 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
                title={t.replaceTaskAssignment.typeOnlyForHint}
              >
                {t.replaceTaskAssignment.typeLabel}
              </div>
              <Select
                allowClear
                disabled={!isTypeApplicableWorkType(quickWorkType)}
                value={quickType ?? undefined}
                placeholder={
                  isTypeApplicableWorkType(quickWorkType)
                    ? t.replaceTaskAssignment.selectTypePlaceholder
                    : t.replaceTaskAssignment.typeOnlyForHint
                }
                style={{ width: "100%" }}
                onChange={(val) => setQuickType(val ?? null)}
                options={TYPE_KEYS.map((key) => ({
                  value: key,
                  label: (t.replaceTaskAssignment.types as Record<string, string>)[key] || key,
                }))}
              />
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                {t.replaceTaskAssignment.oldApproverLabel}
              </div>
              <UserSelectField
                value={quickOldUserId}
                selectedUserHint={quickOldUserObj}
                initialUsers={initialUsers}
                placeholder={t.replaceTaskAssignment.selectOldApproverPlaceholder}
                onChange={(id, obj) => {
                  setQuickOldUserId(id ?? null);
                  setQuickOldUserObj(obj ?? null);
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 4,
                }}
              >
                {t.replaceTaskAssignment.newApproverLabel}
              </div>
              <UserSelectField
                value={quickNewUserId}
                selectedUserHint={quickNewUserObj}
                initialUsers={initialUsers}
                placeholder={t.replaceTaskAssignment.selectNewApproverPlaceholder}
                onChange={(id, obj) => {
                  setQuickNewUserId(id ?? null);
                  setQuickNewUserObj(obj ?? null);
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
              <Button
                icon={<IconRefresh size={14} strokeWidth={1.8} />}
                onClick={handleResetQuick}
                style={{ borderColor: "#dce5e6", borderRadius: 6, height: 32 }}
              >
                {t.replaceTaskAssignment.clearBtn}
              </Button>
              <Button
                type="primary"
                icon={<IconCopyCheck size={15} strokeWidth={2} />}
                onClick={handleApplyToBoth}
                style={{
                  background: "#008f89",
                  borderColor: "#008f89",
                  borderRadius: 6,
                  height: 32,
                  fontWeight: 500,
                  color: "#ffffff",
                }}
              >
                {t.replaceTaskAssignment.applyBtn}
              </Button>
            </div>
          </div>
        </div>

        {/* 2 KHUNG ĐỘC LẬP */}
        <Row gutter={[16, 16]} style={{ flex: 1 }}>
          <Col xs={24} lg={12} style={{ display: "flex", flexDirection: "column" }}>
            <AssignmentReplaceCard
              title={t.replaceTaskAssignment.frame1Title}
              subtitle={t.replaceTaskAssignment.frame1Subtitle}
              updateMode="TaskTypicalAssignment"
              badgeColor="cyan"
              initialUsers={initialUsers}
              syncData={syncData}
              onRequestMainContractLov={openMainContractLov}
            />
          </Col>

          <Col xs={24} lg={12} style={{ display: "flex", flexDirection: "column" }}>
            <AssignmentReplaceCard
              title={t.replaceTaskAssignment.frame2Title}
              subtitle={t.replaceTaskAssignment.frame2Subtitle}
              updateMode="Task_Assignment"
              badgeColor="blue"
              initialUsers={initialUsers}
              syncData={syncData}
              onRequestMainContractLov={openMainContractLov}
            />
          </Col>
        </Row>
      </div>

      {/* MODAL CHỌN HỢP ĐỒNG CĐT / DỰ ÁN */}
      {isMainContractLovOpen && (
        <MainContractLovModal
          open={isMainContractLovOpen}
          onClose={() => setIsMainContractLovOpen(false)}
          mainContractList={mainContractList}
          loadingMainContracts={loadingMainContracts}
          mainContractSearchInput={mainContractSearchInput}
          setMainContractSearchInput={setMainContractSearchInput}
          onSearchMainContracts={(keyword) =>
            fetchMainContracts(keyword.trim(), 1, mainContractPagination.pageSize)
          }
          onSelectMainContract={handleSelectMainContract}
          pagination={mainContractPagination}
          onPageChange={(page, pageSize) =>
            fetchMainContracts(mainContractSearchInput.trim(), page, pageSize)
          }
        />
      )}
    </ErpPageContainer>
  );
}
