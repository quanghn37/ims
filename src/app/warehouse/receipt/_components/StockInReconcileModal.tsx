"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, Table, Button, Space, Typography, Tag, Checkbox, Input, InputNumber, message } from "antd";
import { ReloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { warehouseApi } from "../../api";
import { extractApiList } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface StockInReconcileModalProps {
  open: boolean;
  onClose: () => void;
  contractId?: string | number;
  budgetList?: any[];
  loadingBudgetList?: boolean;
  transactionId?: string | number;
  poCode?: string;
  onSuccess?: () => void;
}

export default function StockInReconcileModal({
  open,
  onClose,
  contractId,
  budgetList,
  loadingBudgetList,
  transactionId,
  poCode,
  onSuccess,
}: StockInReconcileModalProps) {
  const { t, language } = useTranslation();
  const [loadingReconcile, setLoadingReconcile] = useState(false);
  const [submittingReconcile, setSubmittingReconcile] = useState(false);
  const [startProcessNow, setStartProcessNow] = useState<boolean>(true);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [selectedPoRowKeys, setSelectedPoRowKeys] = useState<React.Key[]>([]);

  // Tải danh sách vật tư từ đơn hàng PO để đối chiếu
  const fetchPoReconcile = useCallback(async () => {
    if (!contractId) {
      message.warning(language === "en" ? "Stock-in receipt is missing ReferenceId to reconcile!" : "Phiếu nhập chưa có thông tin ReferenceId để đối chiếu!");
      return;
    }

    setLoadingReconcile(true);
    try {
      const res = await warehouseApi.getInventoryPoReconcile({
        ContractId: contractId,
        TransactionId: transactionId || "",
      });
      const list = extractApiList<any>(res);
      const mappedList = list.map((item: any, idx: number) => {
        const remaining = Number(
          item.Remaining_Qnty !== undefined && item.Remaining_Qnty !== null
            ? item.Remaining_Qnty
            : Number(item.PO_Qnty || 0) - Number(item.Total_Received_Qnty || 0)
        );
        const suggested = Number(
          item.Suggested_Qnty !== undefined && item.Suggested_Qnty !== null
            ? item.Suggested_Qnty
            : item["Suggested Qnty"] !== undefined && item["Suggested Qnty"] !== null
            ? item["Suggested Qnty"]
            : remaining
        );
        const key = String(
          item.SourceSubmissionId ??
            item.MaterialId ??
            item.ItemCode ??
            idx
        );
        return {
          ...item,
          _key: key,
          Remaining_Qnty: remaining,
          Suggested_Qnty: suggested,
          Remarks: item.Remarks || "",
        };
      });
      setPoItems(mappedList);
      const defaultKeys = mappedList.map((item: any) => item._key);
      setSelectedPoRowKeys(defaultKeys);
      setStartProcessNow(true);
      if (mappedList.length === 0) {
        message.info(language === "en" ? "No items found in this PO!" : "Không có dòng vật tư nào từ đơn hàng PO!");
      }
    } catch (err: any) {
      console.error("Lỗi đối chiếu đơn hàng:", err);
      message.error(err?.message || (language === "en" ? "Unable to load PO reconciliation data" : "Không thể tải dữ liệu đối chiếu đơn hàng"));
    } finally {
      setLoadingReconcile(false);
    }
  }, [contractId, transactionId, language]);

  useEffect(() => {
    if (open) {
      fetchPoReconcile();
    } else {
      setPoItems([]);
      setSelectedPoRowKeys([]);
    }
  }, [open, fetchPoReconcile]);

  // Cập nhật số lượng gợi ý nhập trên từng dòng popup
  const handleSuggestedQntyChange = (key: string, val: number | null) => {
    setPoItems((prev) =>
      prev.map((item) =>
        item._key === key ? { ...item, Suggested_Qnty: val ?? 0 } : item
      )
    );
  };

  // Cập nhật ghi chú trên từng dòng popup
  const handleRemarksChange = (key: string, val: string) => {
    setPoItems((prev) =>
      prev.map((item) =>
        item._key === key ? { ...item, Remarks: val } : item
      )
    );
  };

  // Xác nhận thêm các dòng đã chọn vào phiếu nhập bằng API Create_InventorySubmission
  const handleConfirmReconcile = async () => {
    const selectedItems = poItems.filter((item) => selectedPoRowKeys.includes(item._key));
    if (selectedItems.length === 0) {
      message.warning(language === "en" ? "Please select at least one material to import into stock-in receipt!" : "Vui lòng chọn ít nhất một dòng vật tư để đưa vào phiếu nhập!");
      return;
    }

    if (!transactionId) {
      message.error(language === "en" ? "Stock-in TransactionId not found!" : "Không tìm thấy TransactionId của phiếu nhập!");
      return;
    }

    const missingOrgItem = selectedItems.find(
      (i) => !(i.Orgcode || i.OrgCode || i.WBS || i.Wbs || "").trim()
    );
    if (missingOrgItem) {
      message.warning(
        language === "en"
          ? `Item "${missingOrgItem.ItemName || missingOrgItem.ItemCode}" is missing Orgcode. Orgcode is required, cannot be null!`
          : `Vật tư "${missingOrgItem.ItemName || missingOrgItem.ItemCode}" chưa có Orgcode. Orgcode là bắt buộc, không được để trống!`
      );
      return;
    }

    const payloadItems = selectedItems.map((poItem) => {
      const qnty = Number(
        poItem.Suggested_Qnty ??
          poItem.Remaining_Qnty ??
          poItem.PO_Qnty ??
          0
      );
      const unitPrice = Number(poItem.UnitPrice ?? poItem.unitPrice ?? 0);
      const taxRate = Number(poItem.TaxRate ?? 0.1);
      const subName = poItem.ItemName || poItem.itemName || poItem.Description || (language === "en" ? "Material" : "Vật tư");

      return {
        MaterialId: Number(poItem.MaterialId ?? 0),
        SourceSubmissionId: Number(poItem.SourceSubmissionId ?? 0),
        SubmissionName: subName,
        Qnty: qnty,
        UnitPrice: unitPrice,
        TaxRate: taxRate,
        Orgcode: poItem.Orgcode || poItem.OrgCode || poItem.WBS || poItem.Wbs || "",
        Orgname: poItem.Orgname || poItem.OrgName || poItem.BudgetDescription || "",
        OrgName: poItem.Orgname || poItem.OrgName || poItem.BudgetDescription || "",
        Remarks: poItem.Remarks || "",
      };
    });

    setSubmittingReconcile(true);
    try {
      await warehouseApi.createInventorySubmissionFromPo({
        TransactionId: Number(transactionId),
        StartProcessNow: startProcessNow ? "Yes" : "No",
        ApplyDefinedAssignment: "Yes",
        Items: payloadItems,
      });

      message.success(language === "en" ? `Imported ${payloadItems.length} materials into stock-in receipt successfully!` : `Đã đưa ${payloadItems.length} vật tư vào phiếu nhập thành công!`);
      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Lỗi khi thêm vật tư từ đơn hàng vào phiếu nhập:", err);
      message.error(err?.message || (language === "en" ? "Cannot add materials into stock-in receipt!" : "Không thể đưa vật tư vào phiếu nhập!"));
    } finally {
      setSubmittingReconcile(false);
    }
  };

  // Cột bảng vật tư trong Modal đối chiếu PO
  const poItemColumns = useMemo(
    () => [
      {
        title: "Orgcode",
        dataIndex: "Orgcode",
        key: "Orgcode",
        width: 180,
        render: (val: any, record: any) => {
          const raw = String(
            val || record.Orgcode || record.OrgCode || record.WBS || record.Wbs || ""
          ).trim();
          let orgName = record.OrgName || record.Orgname || record.BudgetDescription || "";
          let orgCode = "";

          if (raw.includes(" - ")) {
            const parts = raw.split(" - ");
            orgCode = parts[0].trim();
            if (!orgName) {
              orgName = parts.slice(1).join(" - ").trim();
            }
          } else {
            orgCode = raw;
          }

          if (!orgName && !orgCode) {
            return <span style={{ color: "#94A3B8", fontSize: 13 }}>---</span>;
          }

          if (!orgName) {
            return (
              <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
                {orgCode}
              </span>
            );
          }

          return (
            <div>
              <div style={{ fontWeight: 600, color: "#123443", fontSize: 13, lineHeight: "17px" }}>
                {orgName}
              </div>
              {orgCode && (
                <div style={{ fontSize: 11.5, color: "#718894", marginTop: 2 }}>
                  {orgCode.startsWith("(") ? orgCode : `(${orgCode})`}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: t.lov.colItemName,
        dataIndex: "ItemName",
        key: "ItemName",
        width: 260,
        render: (val: any, record: any) => {
          const name = val || record.itemName || record.Description || "---";
          const code = record.ItemCode || record.itemCode || record.SystemCode || "";
          return (
            <div>
              <div style={{ fontWeight: 500, color: "#123443" }}>{name}</div>
              {code && (
                <div style={{ fontSize: 12, color: "#718894" }}>
                  {code}
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
        width: 75,
        align: "center" as const,
        render: (val: any, r: any) => val || r.Unit || r.unit || "---",
      },
      {
        title: language === "en" ? "PO Qty" : "SL Đơn hàng",
        dataIndex: "PO_Qnty",
        key: "PO_Qnty",
        width: 115,
        align: "right" as const,
        render: (val: any, r: any) => {
          const q = val !== undefined ? val : (r.Qnty ?? r.OrderQty ?? 0);
          return (
            <Text style={{ color: "#262626" }}>
              {Number(q).toLocaleString(language === "en" ? "en-US" : "vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          );
        },
      },
      {
        title: language === "en" ? "Received Qty" : "SL nhập kho",
        dataIndex: "Total_Received_Qnty",
        key: "Total_Received_Qnty",
        width: 120,
        align: "right" as const,
        render: (val: any) =>
          Number(val ?? 0).toLocaleString(language === "en" ? "en-US" : "vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        title: language === "en" ? "Remaining Qty" : "SL còn lại",
        dataIndex: "Remaining_Qnty",
        key: "Remaining_Qnty",
        width: 110,
        align: "right" as const,
        render: (val: any, r: any) => {
          const rem =
            val !== undefined
              ? val
              : Number(r.PO_Qnty || 0) - Number(r.Total_Received_Qnty || 0);
          return (
            <Text strong style={{ color: rem > 0 ? "#fa8c16" : "#52c41a" }}>
              {Number(rem).toLocaleString(language === "en" ? "en-US" : "vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          );
        },
      },
      {
        title: language === "en" ? "Receipt Qty" : "SL nhập",
        dataIndex: "Suggested_Qnty",
        key: "Suggested_Qnty",
        width: 120,
        align: "right" as const,
        render: (_: any, record: any) => (
          <InputNumber
            min={0}
            value={record.Suggested_Qnty}
            onChange={(newVal) => handleSuggestedQntyChange(record._key, newVal)}
            style={{ width: "100%" }}
            precision={2}
            step={1}
            formatter={(value) => {
              if (value === undefined || value === null || value === "") return "";
              const parts = `${value}`.split(".");
              parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              return parts.join(".");
            }}
            parser={(value) => (value ? value.replace(/,/g, "") : "")}
          />
        ),
      },
      {
        title: t.itemDrawer.notes,
        dataIndex: "Remarks",
        key: "Remarks",
        width: 170,
        render: (_: any, record: any) => (
          <Input
            value={record.Remarks}
            placeholder={language === "en" ? "Receipt notes..." : "Ghi chú đợt nhập..."}
            onChange={(e) => handleRemarksChange(record._key, e.target.value)}
          />
        ),
      },
      {
        title: (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Checkbox
              checked={poItems.length > 0 && selectedPoRowKeys.length === poItems.length}
              indeterminate={selectedPoRowKeys.length > 0 && selectedPoRowKeys.length < poItems.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPoRowKeys(poItems.map((item: any) => item._key));
                } else {
                  setSelectedPoRowKeys([]);
                }
              }}
            />
          </div>
        ),
        key: "selection",
        width: 55,
        align: "center" as const,
        fixed: "right" as const,
        render: (_: any, record: any) => {
          const isChecked = selectedPoRowKeys.includes(record._key);
          return (
            <Checkbox
              checked={isChecked}
              onChange={(e) => {
                const checked = e.target.checked;
                setSelectedPoRowKeys((prev) =>
                  checked ? [...prev, record._key] : prev.filter((k) => k !== record._key)
                );
              }}
            />
          );
        },
      },
    ],
    [poItems, selectedPoRowKeys, language, t]
  );

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#008f89" }}>
            {language === "en" ? "Reconcile Purchase Order (PO)" : "Đối chiếu đơn hàng PO"}
          </span>
          {poCode && (
            <Tag
              style={{
                background: "#dce5e6",
                color: "#008f89",
                border: "none",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
                padding: "2px 8px",
              }}
            >
              {poCode}
            </Tag>
          )}
          <Tag style={{ fontSize: 12, borderRadius: 12, border: "1px solid #dce5e6" }}>
            ReferenceId: {contractId || "---"}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1180}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Space size={18} align="center">
            <span style={{ fontSize: 13, color: "#718894" }}>
              {language === "en" ? "Selected " : "Đã chọn "}
              <strong style={{ color: "#008f89" }}>{selectedPoRowKeys.length}</strong> {language === "en" ? "materials" : "vật tư"}
            </span>
            <Checkbox
              checked={startProcessNow}
              onChange={(e) => setStartProcessNow(e.target.checked)}
              style={{ fontWeight: 500 }}
            >
              {language === "en" ? "Submit for Approval" : "Trình duyệt"}
            </Checkbox>
          </Space>

          <Space size={8}>
            <Button
              onClick={onClose}
              style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
            >
              {t.common.close}
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{
                background: "#008f89",
                borderColor: "#008f89",
                height: 36,
                borderRadius: 8,
                fontWeight: 500,
                boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
              }}
              onClick={handleConfirmReconcile}
              disabled={selectedPoRowKeys.length === 0}
              loading={submittingReconcile}
            >
              {language === "en" ? `Select items (${selectedPoRowKeys.length})` : `Chọn vật tư (${selectedPoRowKeys.length} mặt hàng)`}
            </Button>
          </Space>
        </div>
      }
    >
      <div
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          background: "#eef8f6",
          borderRadius: 8,
          border: "1px solid #b2ded9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 13, color: "#008f89", fontWeight: 500 }}>
          {language === "en"
            ? "Select items from PO to reconcile and import into stock-in details:"
            : "Chọn các mặt hàng từ đơn hàng PO để đối chiếu và đưa vào bảng chi tiết phiếu nhập kho:"}
        </Text>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={fetchPoReconcile}
          loading={loadingReconcile}
          style={{ borderRadius: 6, borderColor: "#b2ded9", color: "#008f89" }}
        >
          {language === "en" ? "Reload PO" : "Tải lại PO"}
        </Button>
      </div>

      <Table
        className="stockin-reconcile-table"
        rowKey="_key"
        dataSource={poItems}
        columns={poItemColumns}
        size="small"
        bordered
        pagination={{
          pageSize: 8,
          showTotal: (total) => language === "en" ? `Total ${total} PO items` : `Tổng ${total} mặt hàng PO`
        }}
        scroll={{ x: 1200 }}
      />
    </Modal>
  );
}
