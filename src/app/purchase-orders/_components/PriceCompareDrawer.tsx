"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
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

const STORAGE_KEY_PRICE_COMPARE = "PRICE_COMPARE_COL_WIDTHS_V2";
const { Text } = Typography;

interface PriceCompareDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedOrderId?: any;
  priceCompareItems: any[];
  loadingPriceCompare: boolean;
  selectedPriceCompareKeys: React.Key[];
  setSelectedPriceCompareKeys: (keys: React.Key[]) => void;
  priceCompareStartProcess?: boolean;
  setPriceCompareStartProcess?: (v: boolean) => void;
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
  submittingPriceCompare,
  onChangeQnty,
  onChangeOrgcode,
  onAddSelectedToOrder,
  existingItemIds,
  budgetList = [],
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
            <span style={{ fontWeight: 600, color: "#008f89" }}>{code}</span>
            {desc && <span style={{ color: "#595959", marginLeft: 6 }}>- {desc}</span>}
          </div>
        ),
        searchKey: fullLabel.toLowerCase(),
      };
    });
  }, [budgetList]);

  const defaultColWidths: Record<string, number> = useMemo(
    () => ({
      ItemName: 380,
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
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

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
      const contractCode = String(item.ContractCode || "").toLowerCase();
      return name.includes(term) || code.includes(term) || contractCode.includes(term);
    });
  }, [priceCompareItems, searchText]);

  const groupedData = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const item of filteredItems) {
      const code = String(item.ContractCode || "").trim() || (language === "en" ? "Other" : "Khác");
      if (!groups.has(code)) groups.set(code, []);
      groups.get(code)!.push(item);
    }
    return Array.from(groups.entries()).map(([contractCode, children]) => ({
      _rowKey: `group_${contractCode}`,
      _isGroup: true,
      ContractCode: contractCode,
      children,
    }));
  }, [filteredItems, language]);

  useEffect(() => {
    setExpandedRowKeys(groupedData.map((g) => g._rowKey));
  }, [groupedData]);

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
        title: language === "en" ? "Contract / Material Name" : "Hợp đồng / Tên vật tư",
        dataIndex: "ItemName",
        key: "ItemName",
        width: 380,
        render: (val: string, r: any) => {
          if (r._isGroup) {
            return (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  verticalAlign: "middle",
                }}
              >
                <strong style={{ color: "#008f89", fontSize: 13, fontFamily: "monospace", flexShrink: 0 }}>
                  {r.ContractCode}
                </strong>
              </span>
            );
          }
          const rId = String(r.MaterialId ?? r.ItemId ?? r.ItemCode ?? "");
          const isAlreadyAdded = existingItemIds?.has(rId);
          const itemCode = r.ItemCode || (r.MaterialId ? `#${r.MaterialId}` : "");
          return (
            <div style={{ lineHeight: "16px", margin: 0, padding: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 500, color: "#123443", fontSize: 12 }}>
                  {val || r.Description || "---"}
                </span>
                {isAlreadyAdded && (
                  <Tag color="orange" style={{ fontSize: 11, padding: "0 6px", lineHeight: "18px", margin: 0 }}>
                    {language === "en" ? "Already in Order" : "Đã có trong ĐH"}
                  </Tag>
                )}
              </div>
              {itemCode && (
                <div style={{ fontSize: 11, color: "#718894", fontFamily: "monospace", marginTop: 1 }}>
                  ({itemCode})
                </div>
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
        align: "center" as const,
        render: (val: string, r: any) => (r._isGroup ? null : val || r.Unit || "---"),
      },
      {
        title: language === "en" ? "Quantity" : "Số lượng",
        dataIndex: "Qnty",
        key: "Qnty",
        align: "right" as const,
        width: 100,
        render: (val: number, r: any) =>
          r._isGroup ? null : Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN"),
      },
      {
        title: t.itemDrawer.unitPrice,
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        align: "right" as const,
        width: 120,
        render: (val: number, r: any) =>
          r._isGroup ? null : Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN"),
      },
      {
        title: (
          <span>
            Orgcode <span style={{ color: "#ef4444" }}>*</span>
          </span>
        ),
        dataIndex: "Orgcode",
        key: "Orgcode",
        width: 220,
        render: (_: any, record: any) => {
          if (record._isGroup) return null;
          const id = record._rowKey ?? record.ContractSubmissionId ?? record.SourceId ?? record.MaterialId ?? record.ItemId;
          const isSelected = selectedPriceCompareKeys.some((k) => String(k) === String(id));
          const hasError = isSelected && !record.Orgcode;
          return (
            <Select
              status={hasError ? "error" : undefined}
              showSearch
              allowClear
              placeholder={language === "en" ? "Select Orgcode / WBS... *" : "Chọn Orgcode / WBS... *"}
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
          if (record._isGroup) return null;
          const id = record._rowKey ?? record.ContractSubmissionId ?? record.SourceId ?? record.MaterialId ?? record.ItemId;
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
          if (record._isGroup) return null;
          const total = Number(record.UnitPrice || 0) * Number(record.OrderQnty || 0);
          return <Text strong>{total.toLocaleString(language === "en" ? "en-US" : "vi-VN")}</Text>;
        },
      },
    ],
    [budgetList, budgetOptions, existingItemIds, onChangeOrgcode, onChangeQnty, language, t, selectedPriceCompareKeys]
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
          <AuditOutlined style={{ color: "#008f89" }} />
          <Text strong style={{ fontSize: 16, color: "#008f89" }}>
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
          </Space>
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={onClose}>{t.common.cancel}</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: "#008f89", borderColor: "#008f89" }}
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
          gap: 12,
        }}
      >
        <Space size={12}>
          <Input
            placeholder={language === "en" ? "Search contract code, item name, code..." : "Tìm số HĐ, tên, mã vật tư..."}
            prefix={<SearchOutlined style={{ color: "#94A3B8", fontSize: 16 }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{
              width: 340,
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
              <Text strong style={{ color: "#008f89" }}>{filteredItems.length}</Text> / {priceCompareItems.length} {language === "en" ? "materials" : "vật tư"}
            </Text>
          )}
        </Space>

        {groupedData.length > 0 && (
          <Button
            size="small"
            onClick={() => {
              if (expandedRowKeys.length >= groupedData.length) {
                setExpandedRowKeys([]);
              } else {
                setExpandedRowKeys(groupedData.map((g) => g._rowKey));
              }
            }}
            style={{ borderColor: "#dce5e6", borderRadius: 6, height: 32, color: "#334155" }}
          >
            {expandedRowKeys.length >= groupedData.length
              ? (language === "en" ? "Collapse All" : "Thu gọn tất cả")
              : (language === "en" ? "Expand All" : "Mở rộng tất cả")}
          </Button>
        )}
      </div>
      <style>{`
        .price-compare-tree-table .ant-table-cell-with-append {
          display: flex !important;
          align-items: center !important;
        }
        .price-compare-tree-table .ant-table-row-level-0 td {
          background: #FAF5FF !important;
          font-weight: 600 !important;
          padding: 5px 8px !important;
          white-space: nowrap !important;
        }
        .price-compare-tree-table .ant-table-row-level-0:hover td {
          background: #F3E8FF !important;
        }
        .price-compare-tree-table .ant-table-row-indent,
        .price-compare-tree-table .ant-table-row-expand-icon-spaced {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
      <Table
        className="price-compare-tree-table erp-detail-table"
        tableLayout="fixed"
        bordered
        components={{ header: { cell: ResizableTitle } }}
        dataSource={groupedData}
        columns={mergedColumns}
        rowKey={(r: any) => String(r._rowKey ?? r.ContractSubmissionId ?? r.SourceId ?? r.MaterialId ?? r.ItemId)}
        loading={loadingPriceCompare}
        pagination={false}
        size="small"
        scroll={{ x: totalWidth, y: 420 }}
        expandable={{
          indentSize: 0,
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
          expandRowByClick: false,
          expandIcon: ({ expanded, onExpand, record }: any) => {
            if (!record._isGroup) return null;
            return (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => onExpand(record, e)}
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  minWidth: 18,
                  borderRadius: 4,
                  backgroundColor: expanded ? "#dce5e6" : "#f7fbfa",
                  border: `1px solid ${expanded ? "#008f89" : "#CBD5E1"}`,
                  color: expanded ? "#008f89" : "#718894",
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginRight: 8,
                  userSelect: "none",
                  flexShrink: 0,
                  verticalAlign: "middle",
                }}
              >
                {expanded ? "−" : "+"}
              </span>
            );
          },
        }}
        rowSelection={{
          checkStrictly: false,
          selectedRowKeys: selectedPriceCompareKeys,
          onChange: (keys) =>
            setSelectedPriceCompareKeys(
              keys.filter((k) => !String(k).startsWith("group_"))
            ),
          getCheckboxProps: (record: any) => {
            if (record._isGroup) {
              const children = record.children || [];
              const allChildrenDisabled =
                children.length > 0 &&
                children.every((c: any) => {
                  const rId = String(c.MaterialId ?? c.ItemId ?? c.ItemCode ?? "");
                  return existingItemIds?.has(rId);
                });
              return { disabled: allChildrenDisabled };
            }
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
