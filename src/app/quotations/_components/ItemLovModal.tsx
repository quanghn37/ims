"use client";

import React, { useMemo, useEffect } from "react";
import { Button } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import BaseLovModal from "@/components/lov/BaseLovModal";
import { useTranslation } from "@/locales/LanguageContext";

interface ItemLovModalProps {
  open: boolean;
  onClose: () => void;
  itemList: any[];
  loadingItems: boolean;
  itemSearchInput: string;
  setItemSearchInput: (v: string) => void;
  onSearchItems: (keyword: string) => void;
  onSelectItem: (record: any) => void;
  zIndex?: number;
}

export default function ItemLovModal({
  open,
  onClose,
  itemList,
  loadingItems,
  itemSearchInput,
  setItemSearchInput,
  onSearchItems,
  onSelectItem,
  zIndex = 1300,
}: ItemLovModalProps) {
  const { t } = useTranslation();

  // Luôn luôn gọi API lấy danh sách vật tư khi mở popup
  useEffect(() => {
    if (open) {
      setItemSearchInput("");
      onSearchItems("");
    }
  }, [open]);

  const columns = useMemo(
    () => [
      {
        title: t.lov.colItemName,
        key: "ItemName",
        render: (_: any, r: any) => {
          const name = r.ItemName || r.Description || "---";
          const code = r.ItemCode || r.SystemCode || r.Code || (r.MaterialId ? String(r.MaterialId) : "");
          return (
            <div>
              <div style={{ color: "#123443", fontWeight: 600, fontSize: 13, wordBreak: "break-word" }}>
                {name}
              </div>
              {code && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#718894",
                    marginTop: 2,
                    fontFamily: "monospace",
                    wordBreak: "break-word",
                  }}
                >
                  {code}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: t.lov.colUnit,
        dataIndex: "Unit",
        key: "Unit",
        width: 90,
        align: "center" as const,
        render: (val: any) => <span style={{ color: "#123443", fontSize: 13 }}>{val || "Cái"}</span>,
      },
      {
        title: t.lov.colAction,
        key: "action",
        width: 90,
        align: "center" as const,
        render: (_: any, record: any) => (
          <Button
            type="primary"
            size="small"
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
            }}
            onClick={() => onSelectItem(record)}
          >
            {t.lov.select}
          </Button>
        ),
      },
    ],
    [onSelectItem, t]
  );

  return (
    <BaseLovModal
      open={open}
      onClose={onClose}
      title={t.lov.itemTitle}
      icon={<AppstoreOutlined style={{ color: "#008f89", fontSize: 18 }} />}
      searchPlaceholder={t.lov.itemSearchPlaceholder}
      searchInput={itemSearchInput}
      setSearchInput={setItemSearchInput}
      onSearch={onSearchItems}
      onSelectRow={onSelectItem}
      dataSource={itemList}
      loading={loadingItems}
      columns={columns}
      width={780}
      primaryColor="#008f89"
      zIndex={zIndex}
      rowKey={(r, idx) => r.MaterialId ?? r.ItemId ?? r.Id ?? `mat_${idx}`}
    />
  );
}
