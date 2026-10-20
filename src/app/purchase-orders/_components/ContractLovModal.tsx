"use client";

import React, { useMemo } from "react";
import { Button, Typography } from "antd";
import { FileTextOutlined, SettingOutlined } from "@ant-design/icons";
import BaseLovModal from "@/components/lov/BaseLovModal";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface ContractLovModalProps {
  open: boolean;
  onClose: () => void;
  contractList: any[];
  loadingContracts: boolean;
  contractSearchInput: string;
  setContractSearchInput: (v: string) => void;
  onSearchContracts: (keyword: string) => void;
  onSelectContract: (record: any) => void;
}

export default function ContractLovModal({
  open,
  onClose,
  contractList,
  loadingContracts,
  contractSearchInput,
  setContractSearchInput,
  onSearchContracts,
  onSelectContract,
}: ContractLovModalProps) {
  const { t, language } = useTranslation();

  const columns = useMemo(
    () => [
      {
        title: t.table.contractCode,
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 150,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || `#${r.ContractId}`}
          </span>
        ),
      },
      {
        title: t.table.description,
        dataIndex: "Description",
        key: "Description",
        render: (val: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || "---"}
          </span>
        ),
      },
      {
        title: t.table.vendorName,
        key: "Venname",
        width: 180,
        render: (_: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {r.Venname || r.ClientName || r.VendorName || r.CompanyName || (r.ClientID || r.ClientId ? `${t.table.vendorName} #${r.ClientID || r.ClientId}` : "---")}
          </span>
        ),
      },
      {
        title: language === "en" ? "Contract Date" : "Ngày HĐ",
        dataIndex: "ContractDate",
        key: "ContractDate",
        width: 140,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || r.Contractdate || r.StartDate || "---"}
          </span>
        ),
      },
      {
        title: language === "en" ? "Contract Value" : "Giá trị HĐ",
        dataIndex: "TotalAmount",
        key: "TotalAmount",
        width: 140,
        align: "right" as const,
        render: (val: any, r: any) => {
          const amt = Number(val ?? r.Amount ?? r.ContractedAmount ?? 0);
          return amt ? (
            <span style={{ color: "#262626", fontWeight: 400 }}>
              {amt.toLocaleString(language === "en" ? "en-US" : "vi-VN")}
            </span>
          ) : (
            <span style={{ color: "#262626", fontWeight: 400 }}>---</span>
          );
        },
      },
      {
        title: <SettingOutlined />,
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
              onSelectContract(record);
            }}
          >
            {t.lov.select}
          </Button>
        ),
      },
    ],
    [onSelectContract, t, language]
  );

  return (
    <BaseLovModal
      open={open}
      onClose={onClose}
      title={language === "en" ? "Contract Directory (LOV)" : "Danh sách Hợp đồng"}
      icon={<FileTextOutlined style={{ color: "#008f89", fontSize: 18 }} />}
      searchPlaceholder={language === "en" ? "Enter contract code, description, remarks..." : "Nhập mã hợp đồng, diễn giải, ghi chú..."}
      searchInput={contractSearchInput}
      setSearchInput={setContractSearchInput}
      onSearch={onSearchContracts}
      onSelectRow={onSelectContract}
      dataSource={contractList}
      loading={loadingContracts}
      columns={columns}
      rowKey={(r, index) => r.ContractId ?? r.Id ?? `contract_${index}`}
      width={900}
      primaryColor="#008f89"
    />
  );
}
