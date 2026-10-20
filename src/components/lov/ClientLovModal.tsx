"use client";

import React, { useMemo } from "react";
import { Button, Typography } from "antd";
import { IconBuildingStore } from "@tabler/icons-react";
import BaseLovModal from "@/components/lov/BaseLovModal";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

export interface ClientLovModalProps {
  open: boolean;
  onClose: () => void;
  clientList: any[];
  loadingClients: boolean;
  clientSearchInput: string;
  setClientSearchInput: (v: string) => void;
  onSearchClients: (keyword: string) => void;
  onSelectClient: (record: any) => void;
}

export default function ClientLovModal({
  open,
  onClose,
  clientList,
  loadingClients,
  clientSearchInput,
  setClientSearchInput,
  onSearchClients,
  onSelectClient,
}: ClientLovModalProps) {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      {
        title: t.lov.colVendorName,
        dataIndex: "CompanyName",
        key: "CompanyName",
        render: (val: any, r: any) => (
          <div>
            <span style={{ color: "#262626", fontWeight: 400 }}>
              {val || r.CompanyName || r.Venname || "---"}
            </span>
            {r.ShortName && (
              <div style={{ fontSize: 11, color: "#8c8c8c" }}>{r.ShortName}</div>
            )}
          </div>
        ),
      },
      {
        title: t.lov.colTaxId,
        dataIndex: "TaxID",
        key: "TaxID",
        width: 125,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || r.TaxID || r.TaxCode || r.VATNo || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colPhone,
        dataIndex: "PhoneMain",
        key: "PhoneMain",
        width: 120,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || r.PhoneMain || r.Phone || r.PhoneDirect || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colEmail,
        dataIndex: "EmailMain",
        key: "EmailMain",
        width: 190,
        ellipsis: true,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || r.EmailMain || r.Email || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colAddress,
        key: "Address",
        width: 150,
        ellipsis: true,
        render: (_: any, r: any) => {
          const fullAddress =
            [r.Street, r.City, r.StateProvince].filter(Boolean).join(", ") ||
            r.Address ||
            "";
          return (
            <span style={{ color: "#262626", fontWeight: 400 }}>
              {fullAddress || "---"}
            </span>
          );
        },
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
            style={{ background: "#7C3AED", borderColor: "#7C3AED", borderRadius: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectClient(record);
            }}
          >
            {t.lov.select}
          </Button>
        ),
      },
    ],
    [onSelectClient, t]
  );

  return (
    <BaseLovModal
      open={open}
      onClose={onClose}
      title={t.lov.vendorTitle}
      icon={<IconBuildingStore size={20} strokeWidth={1.8} style={{ color: "#7C3AED" }} />}
      searchPlaceholder={t.lov.vendorSearchPlaceholder}
      searchInput={clientSearchInput}
      setSearchInput={setClientSearchInput}
      onSearch={onSearchClients}
      onSelectRow={onSelectClient}
      dataSource={clientList}
      loading={loadingClients}
      columns={columns}
      rowKey={(r, index) => r.ClientId ?? r.CompanyId ?? r.Id ?? `client_${index}`}
      width={880}
      primaryColor="#7C3AED"
    />
  );
}
