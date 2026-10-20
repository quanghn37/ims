"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Modal,
  Input,
  Table,
  Button,
  Space,
  InputNumber,
  message,
} from "antd";
import { IconScale, IconSearch } from "@tabler/icons-react";
import { contractsApi } from "../api";
import { extractApiList } from "@/lib/api-client";
import {
  TreeRowItem,
  PriceListItem,
  getCleanPriceListName,
  parseDateSafe,
} from "../types";
import { useTranslation } from "@/locales/LanguageContext";

interface ContractPriceListReconcileModalProps {
  open: boolean;
  onClose: () => void;
  effectiveClientId: any;
  effectiveSubconOf: any;
  effectiveContractId?: any;
  assignedSourceIds?: Set<any>;
  availablePriceLists: PriceListItem[];
  onConfirmReconcile: (
    selectedItems: TreeRowItem[],
    selectedPriceLists: PriceListItem[]
  ) => Promise<void>;
  submitting?: boolean;
}

export default function ContractPriceListReconcileModal({
  open,
  onClose,
  effectiveClientId,
  effectiveSubconOf,
  effectiveContractId,
  assignedSourceIds,
  availablePriceLists,
  onConfirmReconcile,
  submitting = false,
}: ContractPriceListReconcileModalProps) {
  const { t, language } = useTranslation();
  const [modalSearch, setModalSearch] = useState("");
  const [loadingTree, setLoadingTree] = useState(false);
  const [quotationMaterials, setQuotationMaterials] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [contractQuantities, setContractQuantities] = useState<Record<string, number>>({});

  const fetchQuotationMaterials = useCallback(async () => {
    if (!effectiveClientId || !effectiveSubconOf) return;
    setLoadingTree(true);
    try {
      const res = await contractsApi.getQuotations({
        DisplayMode: "quotation_for_contract",
        ClientId: !isNaN(Number(effectiveClientId)) ? Number(effectiveClientId) : effectiveClientId,
        SubconOf: !isNaN(Number(effectiveSubconOf)) ? Number(effectiveSubconOf) : effectiveSubconOf,
        ContractId: effectiveContractId && !isNaN(Number(effectiveContractId)) ? Number(effectiveContractId) : undefined,
        WSId: "",
        PageNum: 1,
        PageSize: 50,
      });
      const list = extractApiList(res);
      setQuotationMaterials(list);

      const allParentKeys = Array.from(
        new Set(list.map((it: any) => `pl_${it.ContractCode || it.ContractId || "PL"}`))
      );
      setExpandedRowKeys(allParentKeys);
    } catch (err) {
      console.error("Lỗi khi mở modal đối chiếu:", err);
      message.error(language === "en" ? "Unable to load price lists for reconciliation." : "Không thể tải danh sách bảng giá để đối chiếu.");
    } finally {
      setLoadingTree(false);
    }
  }, [effectiveClientId, effectiveSubconOf, effectiveContractId, language]);

  useEffect(() => {
    if (open) {
      setModalSearch("");
      setSelectedRowKeys([]);
      setContractQuantities({});
      fetchQuotationMaterials();
    }
  }, [open, fetchQuotationMaterials]);

  // Tạo cấu trúc dữ liệu Cây (Tree Data: Dòng Cha là Bảng giá, Dòng Con là Vật tư)
  const treeData = useMemo(() => {
    const groupMap = new Map<string, { code: string; name: string; items: any[] }>();

    quotationMaterials.forEach((item: any) => {
      // Bỏ qua các mặt hàng đã có trong hợp đồng hiện tại
      if (assignedSourceIds && assignedSourceIds.size > 0) {
        const subId = item.SubmissionId;
        if (assignedSourceIds.has(subId) || assignedSourceIds.has(String(subId)) || assignedSourceIds.has(Number(subId))) {
          return;
        }
      }

      const groupCode = item.ContractCode || (item.ContractId ? `#${item.ContractId}` : "PL");
      const groupName = item.ContractName || item.Description || "";
      if (!groupMap.has(groupCode)) {
        groupMap.set(groupCode, {
          code: groupCode,
          name: groupName,
          items: [],
        });
      }
      groupMap.get(groupCode)!.items.push(item);
    });

    return Array.from(groupMap.values())
      .filter((group) => group.items.length > 0)
      .map((group) => {
      const children: TreeRowItem[] = group.items.map((it: any, idx: number) => ({
        key: `item_${group.code}_${it.SubmissionId || it.MaterialId || idx}`,
        isParent: false,
        parentId: group.code,
        parentCode: group.code,
        parentName: group.name,
        id: it.SubmissionId || it.MaterialId || idx,
        code: it.MaterialId ? String(it.MaterialId) : (it.SystemCode || it.ItemCode || ""),
        name: it.ItemName || it.Description || "",
        MaterialId: it.MaterialId ?? it.ItemId,
        ItemId: it.MaterialId ?? it.ItemId,
        SubmissionId: it.SubmissionId,
        SourceId: it.SubmissionId,
        ItemName: it.ItemName || it.Description || "",
        ItemCode: it.SystemCode || it.ItemCode || (it.MaterialId ? String(it.MaterialId) : ""),
        Description: it.Description || it.ItemName || "",
        Unit: it.Unit || "kg",
        Qnty: Number(it.Qnty ?? 0),
        UnitPrice: Number(it.UnitPrice ?? 0),
        Amount: Number(it.Amount ?? (Number(it.UnitPrice ?? 0) * (Number(it.Qnty) > 0 ? Number(it.Qnty) : 1))),
        TaxRate: Number(it.TaxRate ?? 0.08),
        TaxAmount: it.TaxAmount ?? 0,
        signDate: it.ItemDate || "",
        EndDate: it.EndDate || "",
        Remarks: it.Remarks || "",
        rawItem: it,
      }));

      const parentRow: TreeRowItem = {
        key: `pl_${group.code}`,
        isParent: true,
        id: group.code,
        code: group.code,
        name: group.name,
        signDate: group.items[0]?.ItemDate || "",
        amount: children.reduce((sum, c) => sum + (c.Amount || 0), 0),
        itemCount: children.length,
        children: children.length > 0 ? children : undefined,
        rawItem: group,
      };
      return parentRow;
    });
  }, [quotationMaterials, assignedSourceIds]);

  // Lọc Cây theo từ khóa tìm kiếm
  const filteredTreeData = useMemo(() => {
    if (!modalSearch.trim()) return treeData;
    const q = modalSearch.toLowerCase().trim();

    return treeData
      .map((parent) => {
        const parentMatch =
          (parent.code && parent.code.toLowerCase().includes(q)) ||
          (parent.name && parent.name.toLowerCase().includes(q));

        if (parentMatch) {
          return parent;
        }

        const filteredChildren = parent.children?.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.code && c.code.toLowerCase().includes(q)) ||
            (c.Description && c.Description.toLowerCase().includes(q))
        );

        if (filteredChildren && filteredChildren.length > 0) {
          return {
            ...parent,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as TreeRowItem[];
  }, [treeData, modalSearch]);

  const handleSelectRow = (record: TreeRowItem, selected: boolean) => {
    const newSelected = new Set(selectedRowKeys);

    if (record.isParent) {
      if (selected) {
        newSelected.add(record.key);
        record.children?.forEach((child) => newSelected.add(child.key));
      } else {
        newSelected.delete(record.key);
        record.children?.forEach((child) => newSelected.delete(child.key));
      }
    } else {
      if (selected) {
        newSelected.add(record.key);
        const parent = treeData.find((p) => p.code === record.parentId);
        if (parent && parent.children) {
          const allChildrenSelected = parent.children.every((c) => newSelected.has(c.key));
          if (allChildrenSelected) newSelected.add(parent.key);
        }
      } else {
        newSelected.delete(record.key);
        if (record.parentId) {
          newSelected.delete(`pl_${record.parentId}`);
        }
      }
    }

    setSelectedRowKeys(Array.from(newSelected));
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allKeys: React.Key[] = [];
      filteredTreeData.forEach((parent) => {
        allKeys.push(parent.key);
        parent.children?.forEach((child) => allKeys.push(child.key));
      });
      setSelectedRowKeys(allKeys);
    } else {
      setSelectedRowKeys([]);
    }
  };

  const selectedChildItems = useMemo(() => {
    const list: TreeRowItem[] = [];
    treeData.forEach((parent) => {
      parent.children?.forEach((child) => {
        if (selectedRowKeys.includes(child.key)) {
          const customQnty = contractQuantities[String(child.key)];
          list.push({
            ...child,
            ContractQnty: customQnty !== undefined ? customQnty : (Number(child.Qnty) > 0 ? child.Qnty : 1),
          });
        }
      });
    });
    return list;
  }, [treeData, selectedRowKeys, contractQuantities]);

  const selectedParentPriceLists = useMemo(() => {
    const parentCodes = Array.from(new Set(selectedChildItems.map((c) => String(c.parentId))));
    return parentCodes.map((code) => {
      const matchPl = availablePriceLists.find((pl) => String(pl.id) === code || String(pl.code) === code);
      if (matchPl) return matchPl;
      const parentRow = treeData.find((p) => String(p.id) === code);
      return {
        id: code,
        code: code,
        name: parentRow?.name || "",
        raw: parentRow?.rawItem,
      } as PriceListItem;
    });
  }, [selectedChildItems, availablePriceLists, treeData]);

  const totalSelectedAmount = useMemo(() => {
    return selectedChildItems.reduce(
      (acc, it) => acc + Number(it.UnitPrice || 0) * Number(it.ContractQnty ?? (Number(it.Qnty) > 0 ? it.Qnty : 1)),
      0
    );
  }, [selectedChildItems]);

  const handleConfirm = async () => {
    if (selectedChildItems.length === 0) return;
    await onConfirmReconcile(selectedChildItems, selectedParentPriceLists);
    onClose();
  };

  const treeColumns = useMemo(
    () => [
      {
        title: language === "en" ? "Price List / Material Name" : "Bảng giá / Tên vật tư",
        key: "name",
        width: 460,
        render: (_: any, r: TreeRowItem) => {
          if (r.isParent) {
            const clean = getCleanPriceListName(r.code, r.name);
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
                  {r.code}
                </strong>
                {clean ? (
                  <span
                    style={{ color: "#334155", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}
                    title={clean}
                  >
                    - {clean}
                  </span>
                ) : null}
              </span>
            );
          }

          const sCode = r.ItemCode;
          return (
            <div style={{ lineHeight: "16px", margin: 0, padding: 0 }}>
              <div style={{ fontWeight: 500, color: "#123443", fontSize: 12 }}>
                {r.ItemName || (language === "en" ? "Material" : "Vật tư")}
              </div>
              {sCode && (
                <div style={{ fontSize: 11, color: "#718894", fontFamily: "monospace", marginTop: 1 }}>
                  ({sCode})
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
        width: 60,
        align: "center" as const,
        render: (val: string, r: TreeRowItem) => (r.isParent ? "" : val || (language === "en" ? "Pcs" : "Cái")),
      },
      {
        title: language === "en" ? "Quantity" : "Số lượng",
        dataIndex: "Qnty",
        key: "Qnty",
        width: 70,
        align: "right" as const,
        render: (val: number, r: TreeRowItem) =>
          r.isParent ? "" : (
            <span style={{ color: "#718894", fontSize: 12 }}>
              {val !== undefined && val !== null ? Number(val).toLocaleString(language === "en" ? "en-US" : "vi-VN") : 0}
            </span>
          ),
      },
      {
        title: language === "en" ? "Contract Qty" : "Số lượng HĐ",
        key: "ContractQnty",
        width: 95,
        align: "right" as const,
        render: (_: any, r: TreeRowItem) => {
          if (r.isParent) return null;
          const keyStr = String(r.key);
          const currentVal =
            contractQuantities[keyStr] !== undefined
              ? contractQuantities[keyStr]
              : Number(r.Qnty) > 0
              ? Number(r.Qnty)
              : 1;

          return (
            <InputNumber
              min={0}
              size="small"
              value={currentVal}
              onChange={(val) => {
                setContractQuantities((prev) => ({
                  ...prev,
                  [keyStr]: val !== null && val !== undefined ? Number(val) : 0,
                }));
              }}
              formatter={(val) => String(val || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(val) => Number(val ? val.replace(/\$\s?|(,*)/g, "") : 0) as any}
              style={{
                width: "100%",
                borderRadius: 4,
                fontSize: 12,
                height: 24,
                lineHeight: "22px",
                borderColor: "#CBD5E1",
              }}
            />
          );
        },
      },
      {
        title: language === "en" ? "Unit Price" : "Đơn giá",
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        width: 100,
        align: "right" as const,
        render: (val: number, r: TreeRowItem) =>
          r.isParent ? "" : (Number(val || 0)).toLocaleString(language === "en" ? "en-US" : "vi-VN"),
      },
      {
        title: "VAT",
        dataIndex: "TaxRate",
        key: "TaxRate",
        width: 60,
        align: "center" as const,
        render: (val: number, r: TreeRowItem) =>
          r.isParent ? "" : `${((Number(val) || 0) * 100).toFixed(0)}%`,
      },
      {
        title: language === "en" ? "Effective Date" : "Ngày hiệu lực",
        dataIndex: "signDate",
        key: "signDate",
        width: 95,
        align: "center" as const,
        render: (val: string) => {
          const d = parseDateSafe(val);
          return d ? d.format("DD/MM/YYYY") : val || "---";
        },
      },
      {
        title: language === "en" ? "Expiry Date" : "Ngày hết hạn",
        dataIndex: "EndDate",
        key: "EndDate",
        width: 100,
        align: "center" as const,
        render: (val: string, r: TreeRowItem) => {
          if (r.isParent) return "";
          if (!val || String(val).startsWith("1900")) return "---";
          const d = parseDateSafe(val);
          return d ? d.format("DD/MM/YYYY") : "---";
        },
      },
    ],
    [contractQuantities, language, t]
  );

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconScale size={18} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span style={{ fontWeight: 600, color: "#123443", fontSize: 15 }}>
            {language === "en" ? "Reconcile Price Lists (Select Materials)" : "Đối chiếu bảng giá (Chọn chi tiết vật tư)"}
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1180}
      style={{ top: 20 }}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "2px 0" }}>
          <div>
            <span style={{ fontSize: 12.5, color: "#718894" }}>
              {language === "en" ? "Selected: " : "Đã chọn: "}
              <strong style={{ color: "#008f89", fontSize: 13.5 }}>{selectedChildItems.length}</strong> {language === "en" ? "items" : "mặt hàng"}
              {selectedParentPriceLists.length > 0 && (
                <span style={{ marginLeft: 6 }}>
                  {language === "en"
                    ? `(from ${selectedParentPriceLists.length} price lists)`
                    : `(từ ${selectedParentPriceLists.length} bảng giá)`}
                </span>
              )}
              {totalSelectedAmount > 0 && (
                <span style={{ marginLeft: 10, color: "#123443", fontWeight: 600 }}>
                  | {language === "en" ? "Total: " : "Tổng tiền: "}{totalSelectedAmount.toLocaleString(language === "en" ? "en-US" : "vi-VN")} VND
                </span>
              )}
            </span>
          </div>

          <Space size={8}>
            <Button
              style={{ borderRadius: 6, height: 30, fontSize: 12.5, borderColor: "#dce5e6" }}
              onClick={onClose}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="primary"
              style={{
                background: "#008f89",
                borderColor: "#008f89",
                borderRadius: 6,
                height: 30,
                fontSize: 12.5,
                fontWeight: 500,
                boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
              }}
              loading={submitting}
              disabled={selectedChildItems.length === 0}
              onClick={handleConfirm}
            >
              {language === "en"
                ? `Confirm Reconcile (${selectedChildItems.length} items)`
                : `Xác nhận đối chiếu (${selectedChildItems.length} mặt hàng)`}
            </Button>
          </Space>
        </div>
      }
    >
      <div style={{ padding: "4px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "#718894" }}>
            {language === "en"
              ? "💡 Select detailed material items inside each Price List to import into contract"
              : "💡 Tích chọn các dòng vật tư chi tiết bên trong từng Bảng giá để nhập vào hợp đồng"}
          </div>
          <Input
            prefix={<IconSearch size={15} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
            placeholder={language === "en" ? "Search price list or material name..." : "Tìm kiếm bảng giá hoặc tên vật tư..."}
            value={modalSearch}
            onChange={(e) => setModalSearch(e.target.value)}
            allowClear
            style={{ width: 280, borderRadius: 6, height: 28, fontSize: 12 }}
          />
        </div>

        <style>{`
          .reconcile-tree-table .ant-table-thead > tr > th {
            background: #f7fbfa !important;
            font-weight: 600 !important;
            color: #475569 !important;
            font-size: 12px !important;
            padding: 6px 8px !important;
            line-height: 1.3 !important;
          }
          .reconcile-tree-table .ant-table-tbody > tr > td {
            font-size: 12.5px !important;
            padding: 5px 8px !important;
            line-height: 1.35 !important;
          }
          .reconcile-tree-table .ant-table-cell-with-append {
            display: flex !important;
            align-items: center !important;
          }
          .reconcile-tree-table .ant-table-row-level-0 td {
            background: #FAF5FF !important;
            font-weight: 600 !important;
            padding: 5px 8px !important;
          }
          .reconcile-tree-table .ant-table-row-level-0:hover td {
            background: #F3E8FF !important;
          }
          .reconcile-tree-table .ant-table-row-indent,
          .reconcile-tree-table .ant-table-row-expand-icon-spaced {
            display: none !important;
            width: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        `}</style>

        <Table
          className="reconcile-tree-table"
          size="small"
          bordered
          loading={loadingTree}
          dataSource={filteredTreeData}
          columns={treeColumns}
          rowKey="key"
          expandable={{
            indentSize: 0,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
            expandRowByClick: false,
            expandIcon: ({ expanded, onExpand, record }) => {
              if (!record.isParent) return null;
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
                  }}
                  title={
                    expanded
                      ? language === "en" ? "Collapse price list" : "Thu nhỏ bảng giá"
                      : language === "en" ? "Expand price list" : "Mở rộng bảng giá"
                  }
                >
                  {expanded ? "−" : "+"}
                </span>
              );
            },
          }}
          rowSelection={{
            selectedRowKeys,
            checkStrictly: false,
            onSelect: (record, selected) => handleSelectRow(record as TreeRowItem, selected),
            onSelectAll: (selected) => handleSelectAll(selected),
          }}
          pagination={{
            pageSize: 20,
            size: "small",
            style: { margin: "8px 0" },
            showTotal: (total) =>
              language === "en" ? `Total: ${total} available price lists` : `Tổng số: ${total} bảng giá khả dụng`,
          }}
          scroll={{ x: 1040, y: 480 }}
          locale={{
            emptyText:
              !effectiveClientId || !effectiveSubconOf
                ? language === "en"
                  ? "Please select Main Contract and Client to load price lists"
                  : "Vui lòng chọn HĐ CĐT và Đối tượng để tải bảng giá"
                : language === "en"
                ? "No available price lists"
                : "Không có bảng giá khả dụng nào",
          }}
        />
      </div>
    </Modal>
  );
}
