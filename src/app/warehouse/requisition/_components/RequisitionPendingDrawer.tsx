"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Drawer,
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Checkbox,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  InboxOutlined,
  CloseOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { warehouseApi } from "../../api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { MaterialRequisitionItem } from "../../types";
import { useTranslation } from "@/locales/LanguageContext";

export interface RequisitionPendingDrawerProps {
  open: boolean;
  onClose: () => void;
  warehouseId?: number | string | null;
  warehouseName?: string;
  transactionId?: number | string | null;
  subconOf?: number | string | null;
  onConfirm: (newItems: MaterialRequisitionItem[]) => void;
}

export default function RequisitionPendingDrawer({
  open,
  onClose,
  warehouseId,
  warehouseName,
  transactionId,
  subconOf,
  onConfirm,
}: RequisitionPendingDrawerProps) {
  const { t, language } = useTranslation();
  // State danh sách vật tư tồn kho
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [selectedPendingKeys, setSelectedPendingKeys] = useState<React.Key[]>([]);
  const [pendingStartProcessNow, setPendingStartProcessNow] = useState<boolean>(true);
  const [pendingPagination, setPendingPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // State danh sách Orgcode (Approved Budget: api/get-approvedbudget-list)
  const [approvedBudgetList, setApprovedBudgetList] = useState<any[]>([]);
  const [loadingApprovedBudget, setLoadingApprovedBudget] = useState(false);

  // Tải danh mục Orgcode theo Hợp đồng / SubconOf
  const fetchApprovedBudgets = useCallback(
    async (contractId: number | string | null | undefined): Promise<any[]> => {
      if (!contractId) {
        setApprovedBudgetList([]);
        return [];
      }
      setLoadingApprovedBudget(true);
      try {
        const res = await warehouseApi.getApprovedBudgetList({
          ContractId: !isNaN(Number(contractId)) ? Number(contractId) : contractId,
          PageNum: 1,
          PageSize: 100,
        });
        const list = extractApiList<any>(res);
        setApprovedBudgetList(list);
        return list;
      } catch (err) {
        console.error("Lỗi khi tải danh sách Orgcode (Approved Budget):", err);
        return [];
      } finally {
        setLoadingApprovedBudget(false);
      }
    },
    []
  );

  // Options Orgcode cho dropdown
  const orgCodeOptions = useMemo(() => {
    if (approvedBudgetList && approvedBudgetList.length > 0) {
      return approvedBudgetList.map((item) => {
        const code = String(item.OrgCode || item.orgCode || item.ItemId || "");
        const desc = item.Description || item.description || "";
        return {
          value: code,
          label: desc ? `${code} - ${desc}` : code,
          title: desc ? `${code} - ${desc}` : code,
        };
      });
    }
    return [
      { value: "HM01-MONG", label: "HM01-MONG", title: "HM01-MONG" },
      { value: "HM02-THAN", label: "HM02-THAN", title: "HM02-THAN" },
      { value: "HM03-MAI", label: "HM03-MAI", title: "HM03-MAI" },
      { value: "HM04-HOANTHIEN", label: "HM04-HOANTHIEN", title: "HM04-HOANTHIEN" },
      { value: "WBS-ME-01", label: "WBS-ME-01", title: "WBS-ME-01" },
    ];
  }, [approvedBudgetList]);

  const [submittingConfirm, setSubmittingConfirm] = useState(false);

  // Fetch danh sách vật tư tồn kho từ API api/get-pending-forrequest
  const fetchPendingItems = useCallback(
    async (keyword = "", page = 1, pageSize = 50, defaultOrgCode = "HM01-MONG") => {
      if (!warehouseId) {
        message.warning("Vui lòng chọn Kho xuất trước khi thêm vật tư!");
        return;
      }

      setLoadingPending(true);
      try {
        const res = await warehouseApi.getPendingForRequest({
          WarehouseId: !isNaN(Number(warehouseId)) ? Number(warehouseId) : warehouseId,
          TransactionId: transactionId ? Number(transactionId) : null,
          Keyword: keyword,
          PageNum: page,
          PageSize: pageSize,
        });

        const list = extractApiList<any>(res);
        const total = extractTotalRows(res, list.length);

        const mapped = list.map((item: any, idx: number) => {
          const key = String(item.MaterialId ?? item.ItemCode ?? idx);
          const avail = Number(item.AvailableQty ?? 0);
          return {
            ...item,
            _key: key,
            MaterialId: item.MaterialId,
            ItemCode: item.ItemCode || "",
            ItemName: item.ItemName || "",
            UomCode: item.UomCode || item.Unit || "",
            OnHandQty: Number(item.OnHandQty ?? 0),
            ReservedQty: Number(item.ReservedQty ?? 0),
            AvailableQty: avail,
            AvgUnitCost: Number(item.AvgUnitCost ?? 0),
            suggestedQty: avail > 0 ? (avail >= 1 ? 1 : avail) : 1,
            orgCode: item.Orgcode || item.orgCode || defaultOrgCode,
            OrgName: item.OrgName || item.orgName || "",
          };
        });

        setPendingItems(mapped);
        setPendingPagination({
          current: page,
          pageSize,
          total,
        });
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách vật tư tồn kho:", err);
        message.error(err?.message || "Không thể tải danh sách vật tư từ kho!");
      } finally {
        setLoadingPending(false);
      }
    },
    [warehouseId, transactionId]
  );

  // Kích hoạt khi mở Drawer
  useEffect(() => {
    if (open) {
      setPendingKeyword("");
      setSelectedPendingKeys([]);
      setPendingStartProcessNow(true);

      // Tải Orgcode theo SubconOf nếu có
      if (subconOf) {
        fetchApprovedBudgets(subconOf).then((budgetList) => {
          if (budgetList && budgetList.length > 0) {
            const firstOrg = budgetList[0].OrgCode || budgetList[0].orgCode;
            const firstOrgName = budgetList[0].Description || budgetList[0].description || "";
            if (firstOrg) {
              setPendingItems((prev) =>
                prev.map((it) =>
                  !it.orgCode || it.orgCode === "HM01-MONG"
                    ? { ...it, orgCode: firstOrg, OrgName: it.OrgName || firstOrgName }
                    : it
                )
              );
            }
          }
        });
      }

      fetchPendingItems("", 1, 50);
    }
  }, [open, subconOf, fetchApprovedBudgets, fetchPendingItems]);

  // Thay đổi số lượng yêu cầu
  const handlePendingQtyChange = (key: string, val: number | null) => {
    setPendingItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, suggestedQty: val ?? 1 } : it))
    );
    if (val && val > 0) {
      setSelectedPendingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  // Thay đổi Orgcode của từng dòng
  const handlePendingOrgChange = (key: string, val: string) => {
    const matchedBudget = approvedBudgetList.find(
      (b) => String(b.OrgCode || b.orgCode || b.ItemId) === String(val)
    );
    const orgName =
      matchedBudget?.Description ||
      matchedBudget?.description ||
      matchedBudget?.OrgName ||
      matchedBudget?.orgName ||
      "";
    setPendingItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, orgCode: val, OrgName: orgName } : it))
    );
  };

  // Xác nhận thêm các vật tư đã chọn -> gọi POST api/upsert-inventory-submission
  const handleConfirm = async () => {
    const selected = pendingItems.filter((it) => selectedPendingKeys.includes(it._key));
    if (selected.length === 0) {
      message.warning(language === "en" ? "Please select at least 1 item to add to requisition!" : "Vui lòng tích chọn ít nhất 1 mặt hàng để thêm vào yêu cầu!");
      return;
    }

    if (!transactionId) {
      message.warning(language === "en" ? "Requisition does not exist (missing TransactionId)!" : "Không tìm thấy TransactionId của phiếu yêu cầu để thêm vật tư!");
      return;
    }

    const defaultFirstOrg =
      approvedBudgetList.length > 0
        ? approvedBudgetList[0].OrgCode || approvedBudgetList[0].orgCode || "HM01-MONG"
        : "HM01-MONG";

    setSubmittingConfirm(true);
    try {
      const createdItems: MaterialRequisitionItem[] = [];

      for (let idx = 0; idx < selected.length; idx++) {
        const p = selected[idx];
        const chosenOrg =
          p.orgCode && p.orgCode !== "HM01-MONG"
            ? p.orgCode
            : (p.Orgcode || approvedBudgetList[0]?.OrgCode || approvedBudgetList[0]?.orgCode || p.orgCode || defaultFirstOrg);

        const matchedBudget = approvedBudgetList.find(
          (b) => String(b.OrgCode || b.orgCode || b.ItemId) === String(chosenOrg)
        );
        const orgName =
          matchedBudget?.Description ||
          matchedBudget?.description ||
          matchedBudget?.OrgName ||
          matchedBudget?.orgName ||
          p.OrgName ||
          p.orgName ||
          "";

        const res = await warehouseApi.upsertInventorySubmission(
          {
            WSId: "",
            TransactionId: Number(transactionId),
            WorkType: "Inventory_request",
            StartProcessNow: pendingStartProcessNow ? "Yes" : "No",
            MaterialId: Number(p.MaterialId),
            SubmissionName: p.ItemName || p.SubmissionName || "",
            Orgcode: String(chosenOrg || ""),
            OrgName: String(orgName || ""),
            Qnty: Number(p.suggestedQty || 1),
            Remarks: p.Remarks || p.remarks || (language === "en" ? "Issue Batch 1" : "Cấp đợt 1"),
          },
          "Create_InventorySubmission"
        );

        const apiItem =
          res?.Data?.Items?.[0] ||
          (Array.isArray(res?.Data) ? res.Data[0] : res?.Data) ||
          {};
        const subId = apiItem.SubmissionId ?? apiItem.LocalId;

        createdItems.push({
          id: String(subId || `req_item_${p.MaterialId || Date.now()}_${idx}`),
          SubmissionId: subId,
          LocalId: subId,
          MaterialId: apiItem.MaterialId ?? p.MaterialId,
          itemCode: p.ItemCode,
          ItemCode: p.ItemCode,
          itemName: apiItem.SubmissionName || p.ItemName,
          ItemName: apiItem.SubmissionName || p.ItemName,
          unit: p.UomCode,
          UomCode: p.UomCode,
          availableQty: Number(p.AvailableQty || 0),
          requestedQty: Number(apiItem.Qnty ?? p.suggestedQty ?? 1),
          approvedQty: 0,
          orgCode: apiItem.Orgcode || chosenOrg,
          Orgcode: apiItem.Orgcode || chosenOrg,
          OrgName: apiItem.OrgName || orgName,
          status: pendingStartProcessNow ? "APPROVED" : "PENDING",
          startProcessNow: pendingStartProcessNow,
          StartProcessNow: pendingStartProcessNow ? "Yes" : "No",
          unitPrice: Number(apiItem.UnitPrice ?? p.AvgUnitCost ?? 0),
          avgUnitCost: Number(apiItem.UnitPrice ?? p.AvgUnitCost ?? 0),
        } as any);
      }

      onConfirm(createdItems);
      message.success(language === "en" ? `Added ${createdItems.length} items to requisition successfully!` : `Đã thêm ${createdItems.length} mặt hàng vào danh mục yêu cầu xuất!`);
      onClose();
      setSelectedPendingKeys([]);
    } catch (err: any) {
      console.error("Lỗi khi thêm vật tư vào yêu cầu:", err);
      message.error(err?.message || (language === "en" ? "Failed to add items to requisition!" : "Thêm vật tư vào yêu cầu thất bại!"));
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // Cấu hình cột hiển thị
  const pendingColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "STT",
        key: "stt",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (pendingPagination.current - 1) * pendingPagination.pageSize + index + 1,
      },
      {
        title: language === "en" ? "Item Code" : "Mã vật tư",
        dataIndex: "ItemCode",
        key: "ItemCode",
        width: 170,
        render: (val: string) => (
          <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
            {val || "---"}
          </span>
        ),
      },
      {
        title: t.lov.colItemName,
        dataIndex: "ItemName",
        key: "ItemName",
        width: 260,
        render: (val: string) => (
          <span style={{ fontWeight: 600, color: "#123443" }}>{val || "---"}</span>
        ),
      },
      {
        title: t.lov.colUnit,
        dataIndex: "UomCode",
        key: "UomCode",
        width: 70,
        align: "center",
        render: (val: string) => val || "---",
      },
      {
        title: language === "en" ? "On Hand" : "Tồn kho",
        dataIndex: "OnHandQty",
        key: "OnHandQty",
        width: 90,
        align: "right",
        render: (val: number) => (
          <span style={{ fontWeight: 500, color: "#123443" }}>
            {Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
          </span>
        ),
      },
      {
        title: language === "en" ? "Reserved" : "Đã giữ",
        dataIndex: "ReservedQty",
        key: "ReservedQty",
        width: 80,
        align: "right",
        render: (val: number) => (
          <span style={{ color: "#718894" }}>
            {Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
          </span>
        ),
      },
      {
        title: language === "en" ? "Available" : "Khả dụng",
        dataIndex: "AvailableQty",
        key: "AvailableQty",
        width: 95,
        align: "right",
        render: (val: number) => (
          <span style={{ fontWeight: 700, color: "#059669" }}>
            {Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
          </span>
        ),
      },
      {
        title: "Orgcode",
        dataIndex: "orgCode",
        key: "orgCode",
        width: 170,
        render: (val: string, record: any) => {
          const currentVal =
            val && val !== "HM01-MONG"
              ? val
              : (approvedBudgetList[0]?.OrgCode ?? val ?? "HM01-MONG");
          return (
            <Select
              size="small"
              value={currentVal}
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="label"
              loading={loadingApprovedBudget}
              onChange={(v) => handlePendingOrgChange(record._key, v)}
              options={orgCodeOptions}
              popupMatchSelectWidth={false}
              placeholder={language === "en" ? "Select Orgcode..." : "Chọn Orgcode..."}
            />
          );
        },
      },
      {
        title: language === "en" ? "Req Qty" : "SL yêu cầu",
        dataIndex: "suggestedQty",
        key: "suggestedQty",
        width: 110,
        align: "right",
        render: (val: number, record: any) => (
          <InputNumber
            size="small"
            min={0.01}
            max={record.AvailableQty > 0 ? record.AvailableQty : undefined}
            value={val}
            onChange={(v) => handlePendingQtyChange(record._key, v)}
            style={{ width: "100%", fontWeight: 600 }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => Number(v?.replace(/,/g, "") || 0) as any}
          />
        ),
      },
      Table.SELECTION_COLUMN,
    ],
    [
      pendingPagination.current,
      pendingPagination.pageSize,
      orgCodeOptions,
      loadingApprovedBudget,
      approvedBudgetList,
      language,
      t,
    ]
  );

  return (
    <Drawer
      placement="right"
      width="85%"
      open={open}
      onClose={onClose}
      destroyOnClose
      closable={true}
      closeIcon={<CloseOutlined style={{ fontSize: 16, color: "#718894" }} />}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <InboxOutlined style={{ color: "#008f89", fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#008f89" }}>
            {language === "en" ? "Add Materials from Warehouse" : "Thêm vật tư từ kho xuất"}
          </span>
          {warehouseName && (
            <Tag
              style={{
                background: "#dce5e6",
                color: "#008f89",
                border: "none",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
                padding: "2px 10px",
              }}
            >
              {warehouseName}
            </Tag>
          )}
        </div>
      }
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            padding: "4px 8px",
          }}
        >
          <Space size={18} align="center">
            <span style={{ fontSize: 13, color: "#718894" }}>
              {language === "en" ? "Selected " : "Đã chọn "}
              <strong style={{ color: "#008f89" }}>{selectedPendingKeys.length}</strong> {language === "en" ? "materials" : "vật tư"}
            </span>
            <Checkbox
              checked={pendingStartProcessNow}
              onChange={(e) => setPendingStartProcessNow(e.target.checked)}
              style={{ fontWeight: 500, color: "#334155" }}
            >
              {language === "en" ? "Submit for Approval" : "Trình duyệt"}
            </Checkbox>
          </Space>

          <Space size={8}>
            <Button
              onClick={onClose}
              style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={submittingConfirm}
              style={{
                background: "#008f89",
                borderColor: "#008f89",
                height: 36,
                borderRadius: 8,
                fontWeight: 500,
                boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
              }}
              onClick={handleConfirm}
              disabled={selectedPendingKeys.length === 0 || submittingConfirm}
            >
              {language === "en"
                ? `Add to Requisition (${selectedPendingKeys.length} materials)`
                : `Thêm vào yêu cầu (${selectedPendingKeys.length} vật tư)`}
            </Button>
          </Space>
        </div>
      }
    >
      {/* Thanh tìm kiếm & làm mới trong Drawer */}
      <div
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          background: "#f7fbfa",
          borderRadius: 8,
          border: "1px solid #dce5e6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 450 }}>
          <Input
            placeholder={language === "en" ? "Search by code or item name..." : "Tìm theo mã hoặc tên vật tư..."}
            prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
            value={pendingKeyword}
            allowClear
            onChange={(e) => setPendingKeyword(e.target.value)}
            onPressEnter={() =>
              fetchPendingItems(pendingKeyword.trim(), 1, pendingPagination.pageSize)
            }
            style={{ borderRadius: 6 }}
          />
          <Button
            type="primary"
            onClick={() =>
              fetchPendingItems(pendingKeyword.trim(), 1, pendingPagination.pageSize)
            }
            loading={loadingPending}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            {t.lov.search}
          </Button>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            fetchPendingItems(
              pendingKeyword.trim(),
              pendingPagination.current,
              pendingPagination.pageSize
            )
          }
          loading={loadingPending}
          style={{ borderRadius: 6, borderColor: "#dce5e6" }}
        >
          {t.common.refresh}
        </Button>
      </div>

      {/* Bảng danh sách vật tư chờ yêu cầu */}
      <Table
        rowKey="_key"
        size="small"
        loading={loadingPending}
        dataSource={pendingItems}
        columns={pendingColumns}
        bordered
        rowSelection={{
          selectedRowKeys: selectedPendingKeys,
          onChange: (keys) => setSelectedPendingKeys(keys),
        }}
        pagination={{
          current: pendingPagination.current,
          pageSize: pendingPagination.pageSize,
          total: pendingPagination.total,
          showTotal: (total) =>
            language === "en" ? `Total ${total} inventory materials` : `Tổng cộng ${total} vật tư tồn kho`,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100"],
          onChange: (page, pageSize) =>
            fetchPendingItems(pendingKeyword.trim(), page, pageSize),
        }}
        scroll={{ x: 1050, y: "calc(100vh - 250px)" }}
      />
    </Drawer>
  );
}
