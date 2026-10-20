"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Typography,
  Space,
  Tag,
} from "antd";
import { AuditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import ResizableTitle from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";

const STORAGE_KEY_PRICE_COMPARE = "PRICE_COMPARE_COL_WIDTHS";
const { Text } = Typography;

interface PriceCompareDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedOrderId?: any;
  priceCompareItems: any[];
  loadingPriceCompare: boolean;
  selectedPriceCompareKeys: React.Key[];
  setSelectedPriceCompareKeys: (keys: React.Key[]) => void;
  priceCompareStartProcess: boolean;
  setPriceCompareStartProcess: (v: boolean) => void;
  submittingPriceCompare: boolean;
  onChangeQnty: (itemId: any, qnty: number) => void;
  onChangeOrgcode?: (itemId: any, orgCode: string, orgName: string) => void;
  onAddSelectedToOrder: () => void;
  existingItemIds?: Set<string>;
  budgetList?: any[];
  loadingBudgetList?: boolean;
}

export default function PriceCompareDrawer({
  open,
  onClose,
  selectedOrderId,
  priceCompareItems,
  loadingPriceCompare,
  selectedPriceCompareKeys,
  setSelectedPriceCompareKeys,
  priceCompareStartProcess,
  setPriceCompareStartProcess,
  submittingPriceCompare,
  onChangeQnty,
  onChangeOrgcode,
  onAddSelectedToOrder,
  existingItemIds,
  budgetList = [],
  loadingBudgetList = false,
}: PriceCompareDrawerProps) {
  const { t, language } = useTranslation();
  const budgetOptions = useMemo(() => {
    return (budgetList || []).map((b: any) => {
      const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
      const desc = (b.Description || b.ItemName || "").trim();
      const fullLabel = code && desc ? `${code} - ${desc}` : code || desc;
      return {
        value: code,
        label: (
          <div title={fullLabel} style={{ whiteSpace: "normal", wordBreak: "break-word", lineHeight: "1.3", padding: "2px 0" }}>
            <span style={{ fontWeight: 600, color: "#722ed1" }}>{code}</span>
            {desc && <span style={{ color: "#595959", marginLeft: 6 }}>- {desc}</span>}
          </div>
        ),
        searchKey: fullLabel.toLowerCase(),
      };
    });
  }, [budgetList]);

  const defaultColWidths: Record<string, number> = useMemo(
    () => ({
      ItemName: 280,
      UomCode: 80,
      Qnty: 100,
      UnitPrice: 120,
      Orgcode: 220,
      OrderQnty: 130,
      TotalAmount: 130,
    }),
    []
  );

  const [searchText, setSearchText] = useState("");

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRICE_COMPARE);
      if (saved) {
        return { ...defaultColWidths, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột đối chiếu bảng giá:", e);
    }
    return defaultColWidths;
  });

  useEffect(() => {
    if (!open) {
      setSearchText("");
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRICE_COMPARE);
      if (saved) {
        setColWidths((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột đối chiếu bảng giá:", e);
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return priceCompareItems || [];
    const term = searchText.trim().toLowerCase();
    return (priceCompareItems || []).filter((item: any) => {
      const name = String(item.ItemName || item.Description || "").toLowerCase();
      const code = String(item.ItemCode || item.MaterialId || item.ItemId || "").toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [priceCompareItems, searchText]);

  const handleResizeColumn = (colKey: string) => (_: any, { size }: { size: { width: number } }) => {
    setColWidths((prev) => {
      const updated = {
        ...prev,
        [colKey]: Math.max(size.width, 50),
      };
      try {
        localStorage.setItem(STORAGE_KEY_PRICE_COMPARE, JSON.stringify(updated));
      } catch (e) {
        console.error("Lỗi lưu kích thước cột đối chiếu bảng giá:", e);
      }
      return updated;
    });
  };

  const basePriceCompareColumns = useMemo(
    () => [
      {
        title: t.lov.colItemName,
        dataIndex: "ItemName",
        key: "ItemName",
        width: 280,
        fixed: "left" as const,
        render: (val: string, r: any) => {
          const rId = String(r.MaterialId ?? r.ItemId ?? r.ItemCode ?? "");
          const isAlreadyAdded = existingItemIds?.has(rId);
          const itemCode = r.ItemCode || (r.MaterialId ? `#${r.MaterialId}` : "");
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text strong style={{ color: "#123443" }}>
                  {val || r.Description || "---"}
                </Text>
                {isAlreadyAdded && (
                  <Tag color="orange" style={{ fontSize: 11, padding: "0 6px", lineHeight: "18px", margin: 0 }}>
                    {language === "en" ? "Already in Order" : "Đã có trong ĐH"}
                  </Tag>
                )}
              </div>
              {itemCode && (
                <Text type="secondary" style={{ fontSize: 12, color: "#718894" }}>
                  {itemCode}
                </Text>
              )}
            </div>
          );
        },
      },
      {
        title: t.lov.colUnit,
        dataIndex: "UomCode",
        key: "UomCode",
        width: 80,
        fixed: "left" as const,
        align: "center" as const,
        render: (val: string, r: any) => val || r.Unit || "---",
      },
      {
        title: language === "en" ? "Quantity" : "Số lượng",
        dataIndex: "Qnty",
        key: "Qnty",
        align: "right" as const,
        width: 100,
        render: (val: number) => Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN"),
      },
      {
        title: t.itemDrawer.unitPrice,
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        align: "right" as const,
        width: 120,
        render: (val: number) => Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN"),
      },
      {
        title: "Orgcode",
        dataIndex: "Orgcode",
        key: "Orgcode",
        width: 220,
        render: (_: any, record: any) => {
          const id = record.MaterialId ?? record.ItemId ?? record.ItemCode;
          return (
            <Select
              showSearch
              allowClear
              placeholder={language === "en" ? "Select Orgcode / WBS..." : "Chọn Orgcode / WBS..."}
              value={record.Orgcode || undefined}
              onChange={(val) => {
                const cleanVal = String(val || "").trim();
                const matched = budgetList?.find((b: any) => {
                  const code = (b.OrgCode || b.Orgcode || b.WBS || "").trim();
                  return code === cleanVal;
                });
                const orgName = matched ? (matched.Description || matched.ItemName || "").trim() : "";
                onChangeOrgcode?.(id, cleanVal, orgName);
              }}
              options={budgetOptions}
              filterOption={(input, option: any) =>
                String(option?.searchKey ?? "").includes(input.toLowerCase())
              }
              style={{ width: "100%" }}
              popupMatchSelectWidth={320}
              dropdownStyle={{ width: 320, maxWidth: 350, maxHeight: 300, overflowY: "auto" }}
            />
          );
        },
      },
      {
        title: language === "en" ? "Order Qty" : "SL đơn hàng",
        key: "OrderQnty",
        align: "right" as const,
        width: 130,
        render: (_: any, record: any) => {
          const id = record.MaterialId ?? record.ItemId ?? record.ItemCode;
          return (
            <InputNumber
              min={0}
              value={record.OrderQnty}
              onChange={(v) => onChangeQnty(id, Number(v || 0))}
              style={{ width: "100%" }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(val) => Number(val?.replace(/,/g, "") || 0) as any}
            />
          );
        },
      },
      {
        title: t.itemDrawer.totalPrice,
        key: "TotalAmount",
        align: "right" as const,
        width: 130,
        render: (_: any, record: any) => {
          const total = Number(record.UnitPrice || 0) * Number(record.OrderQnty || 0);
          return <Text strong>{total.toLocaleString(language === "en" ? "en-US" : "vi-VN")}</Text>;
        },
      },
    ],
    [budgetList, budgetOptions, existingItemIds, onChangeOrgcode, onChangeQnty, language, t]
  );

  const mergedColumns = useMemo(() => {
    return basePriceCompareColumns.map((col: any) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = colWidths[colKey] || col.width || 100;
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResizeColumn(colKey),
        }),
      };
    });
  }, [basePriceCompareColumns, colWidths]);

  const totalWidth = useMemo(() => {
    return mergedColumns.reduce((sum: number, col: any) => sum + (Number(col.width) || 100), 0) + 60;
  }, [mergedColumns]);

  return (
    <Modal
      title={
        <Space>
          <AuditOutlined style={{ color: "#722ed1" }} />
          <Text strong style={{ fontSize: 16, color: "#722ed1" }}>
            {language === "en"
              ? `Reconcile from Contract ${selectedOrderId ? `- Purchase Order #${selectedOrderId}` : ""}`
              : `Đối chiếu từ hợp đồng ${selectedOrderId ? `- Đơn hàng PO #${selectedOrderId}` : ""}`}
          </Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1180}
      centered
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space size="large">
            <Text type="secondary">
              {language === "en"
                ? `Selected ${selectedPriceCompareKeys.length} materials`
                : `Đã chọn ${selectedPriceCompareKeys.length} vật tư`}
            </Text>
            <Checkbox
              checked={priceCompareStartProcess}
              onChange={(e) => setPriceCompareStartProcess(e.target.checked)}
            >
              {language === "en" ? "Submit for Approval" : "Trình duyệt"}
            </Checkbox>
          </Space>
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={onClose}>{t.common.cancel}</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: "#722ed1", borderColor: "#722ed1" }}
              loading={submittingPriceCompare}
              onClick={onAddSelectedToOrder}
            >
              {language === "en" ? "Add to Order" : "Thêm vào đơn hàng"}
            </Button>
          </div>
        </div>
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Input
          placeholder={language === "en" ? "Search item name, code..." : "Tìm tên, mã vật tư..."}
          prefix={<SearchOutlined style={{ color: "#94A3B8", fontSize: 16 }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{
            width: 320,
            height: 36,
            borderRadius: 8,
            borderColor: "#dce5e6",
            fontSize: 14,
            color: "#123443",
          }}
        />
        {searchText.trim() && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {language === "en" ? "Found " : "Tìm thấy "}
            <Text strong style={{ color: "#722ed1" }}>{filteredItems.length}</Text> / {priceCompareItems.length} {language === "en" ? "materials" : "vật tư"}
          </Text>
        )}
      </div>
      <Table
        bordered
        components={{ header: { cell: ResizableTitle } }}
        dataSource={filteredItems}
        columns={mergedColumns}
        rowKey={(r, index) => String(r.MaterialId ?? r.ItemId ?? r.ItemCode ?? `pc_item_${index}`)}
        loading={loadingPriceCompare}
        pagination={false}
        size="small"
        scroll={{ x: totalWidth, y: 420 }}
        rowSelection={{
          fixed: true,
          selectedRowKeys: selectedPriceCompareKeys,
          onChange: (keys) => setSelectedPriceCompareKeys(keys),
          getCheckboxProps: (record) => {
            const rId = String(record.MaterialId ?? record.ItemId ?? record.ItemCode ?? "");
            const isAlreadyAdded = existingItemIds?.has(rId);
            return {
              disabled: isAlreadyAdded,
            };
          },
        }}
      />
    </Modal>
  );
}
