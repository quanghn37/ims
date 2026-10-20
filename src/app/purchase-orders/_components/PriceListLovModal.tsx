"use client";

import React, { useMemo } from "react";
import { Button } from "antd";
import { ProfileOutlined, SettingOutlined } from "@ant-design/icons";
import BaseLovModal from "@/components/lov/BaseLovModal";
import { useTranslation } from "@/locales/LanguageContext";

interface PriceListLovModalProps {
  open: boolean;
  onClose: () => void;
  priceList: any[];
  loadingPriceList: boolean;
  priceListSearchInput: string;
  setPriceListSearchInput: (v: string) => void;
  onSearchPriceList: (keyword: string) => void;
  onSelectPriceList: (record: any) => void;
}

export default function PriceListLovModal({
  open,
  onClose,
  priceList,
  loadingPriceList,
  priceListSearchInput,
  setPriceListSearchInput,
  onSearchPriceList,
  onSelectPriceList,
}: PriceListLovModalProps) {
  const { t, language } = useTranslation();

  const columns = useMemo(() => {
    const hasDatesOrAmounts = priceList.some(
      (r) => r.ContractDate || r.Contractdate || r.StartDate || r.TotalAmount || r.Amount
    );

    const baseCols: any[] = [
      {
        title: t.table.priceList,
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: 180,
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 500 }}>
            {val || `#${r.ContractId}`}
          </span>
        ),
      },
      {
        title: language === "en" ? "Price List Name" : "Tên bảng giá",
        dataIndex: "ContractName",
        key: "ContractName",
        render: (val: any, r: any) => (
          <span style={{ color: "#262626", fontWeight: 400 }}>
            {val || r.Description || "---"}
          </span>
        ),
      },
    ];

    if (hasDatesOrAmounts) {
      baseCols.push(
        {
          title: t.table.effectiveDate,
          dataIndex: "ContractDate",
          key: "ContractDate",
          width: 130,
          render: (val: any, r: any) => (
            <span style={{ color: "#262626", fontWeight: 400 }}>
              {val || r.Contractdate || r.StartDate || "---"}
            </span>
          ),
        },
        {
          title: t.common.total,
          dataIndex: "TotalAmount",
          key: "TotalAmount",
          width: 130,
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
        }
      );
    }

    baseCols.push({
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
            onSelectPriceList(record);
          }}
        >
          {t.lov.select}
        </Button>
      ),
    });

    return baseCols;
  }, [priceList, onSelectPriceList, t, language]);

  return (
    <BaseLovModal
      open={open}
      onClose={onClose}
      title={language === "en" ? "Price List Directory (LOV)" : "Danh sách bảng giá"}
      icon={<ProfileOutlined style={{ color: "#008f89", fontSize: 18 }} />}
      searchPlaceholder={t.lov.priceListSearchPlaceholder}
      searchInput={priceListSearchInput}
      setSearchInput={setPriceListSearchInput}
      onSearch={onSearchPriceList}
      onSelectRow={onSelectPriceList}
      dataSource={priceList}
      loading={loadingPriceList}
      columns={columns}
      rowKey={(r, index) => r.ContractId ?? r.Id ?? `pricelist_${index}`}
      width={900}
      primaryColor="#008f89"
    />
  );
}
