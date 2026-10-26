"use client";

import React, { useMemo } from "react";
import { Button } from "antd";
import { IconFileText } from "@tabler/icons-react";
import BaseLovModal from "@/components/lov/BaseLovModal";
import { useTranslation } from "@/locales/LanguageContext";

export interface MainContractLovModalProps {
  open: boolean;
  onClose: () => void;
  mainContractList: any[];
  loadingMainContracts: boolean;
  mainContractSearchInput: string;
  setMainContractSearchInput: (v: string) => void;
  onSearchMainContracts: (keyword: string) => void;
  onSelectMainContract: (record: any) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPageChange?: (page: number, pageSize: number) => void;
}

export default function MainContractLovModal({
  open,
  onClose,
  mainContractList,
  loadingMainContracts,
  mainContractSearchInput,
  setMainContractSearchInput,
  onSearchMainContracts,
  onSelectMainContract,
  pagination,
  onPageChange,
}: MainContractLovModalProps) {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      {
        title: t.lov.colContractCode,
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 200,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 500 }}>
            {val || r.ContractCode || r.Contractcode || r.Code || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colContractName,
        dataIndex: "ContractName",
        key: "ContractName",
        render: (val: any, r: any) => (
          <div>
            <span style={{ color: "#262626", fontWeight: 400 }}>
              {val || r.ContractName || r.Name || "---"}
            </span>
            {r.ProjectName && (
              <div style={{ fontSize: 11, color: "#8c8c8c" }}>{r.ProjectName}</div>
            )}
          </div>
        ),
      },
      {
        title: t.lov.colContractor,
        dataIndex: "Contractor",
        key: "Contractor",
        width: 260,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || r.Contractor || r.CustomerName || r.ClientName || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colAction,
        key: "action",
        width: 80,
        align: "center" as const,
        render: (_: any, record: any) => (
          <Button
            type="primary"
            size="small"
            style={{ background: "#008f89", borderColor: "#008f89", borderRadius: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMainContract(record);
            }}
          >
            {t.lov.select}
          </Button>
        ),
      },
    ],
    [onSelectMainContract, t]
  );

  return (
    <BaseLovModal
      open={open}
      onClose={onClose}
      title={t.lov.mainContractTitle}
      icon={<IconFileText size={20} strokeWidth={1.8} style={{ color: "#008f89" }} />}
      searchPlaceholder={t.lov.mainContractSearchPlaceholder}
      searchInput={mainContractSearchInput}
      setSearchInput={setMainContractSearchInput}
      onSearch={onSearchMainContracts}
      onSelectRow={onSelectMainContract}
      dataSource={mainContractList}
      loading={loadingMainContracts}
      columns={columns}
      rowKey={(r, index) => r.MainContractId ?? r.ContractId ?? r.Id ?? `main_contract_${index}`}
      width={900}
      primaryColor="#008f89"
      pagination={
        pagination && pagination.total > pagination.pageSize
          ? {
              ...pagination,
              onChange: (page: number, pageSize: number) => {
                onPageChange?.(page, pageSize);
              },
            }
          : false
      }
    />
  );
}
