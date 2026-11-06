"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  message,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  IconPlus,
  IconSearch,
  IconRefresh,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { StockOutIssue, MOCK_WAREHOUSES } from "../types";
import StockOutEditTab from "./_components/StockOutEditTab";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import { useTranslation } from "@/locales/LanguageContext";
import { ErpPageContainer, ErpDetailContainer } from "@/components/layout/ErpPageContainer";
import { warehouseApi } from "../api";
import { extractApiList } from "@/lib/api-client";
import ApprovalBadge from "@/components/common/ApprovalBadge";

export default function StockOutPage() {
  const { t, language } = useTranslation();
  const [issues, setIssues] = useState<StockOutIssue[]>([]);
  const [warehouseList, setWarehouseList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  const [isEditTabOpen, setIsEditTabOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<StockOutIssue | null>(null);

  const fetchIssues = useCallback(async (keyword = "") => {
    setLoading(true);
    try {
      const data = await warehouseApi.getInventoryTransactions({
        DisplayMode: "Issue",
        WSId: "",
        Keyword: keyword,
        PageNum: 1,
        PageSize: 50,
      });
      const list = extractApiList<any>(data);
      if (list && list.length > 0) {
        const mapped: StockOutIssue[] = list.map((r: any, index: number) => {
          const transactionId = r.TransactionId ?? r.Id;
          const id = String(transactionId ?? r.DocCode ?? `iss_${index}`);
          const docCode = r.DocCode || r.issueCode || "";
          const docDate = r.DocDate || r.issueDate || "";
          const warehouseId = r.WarehouseId !== undefined && r.WarehouseId !== null ? String(r.WarehouseId) : "";
          const warehouseName = r.WarehouseName || (warehouseId ? `Kho #${warehouseId}` : "---");
          const mainCode = r.MainCode || r.mainCode || r.ContractCode || "";
          const projectName = r.ProjectName || r.projectName || r.ContractCode || mainCode || "---";

          // Chuẩn hóa Status & StatusName theo API (Status = 0 là Đang lập)
          const rawStatus = r.Status !== undefined && r.Status !== null ? r.Status : r.StatusCode;
          const statusNum = rawStatus !== undefined && rawStatus !== null && !isNaN(Number(rawStatus)) ? Number(rawStatus) : 0;
          const statusName = r.StatusName || r.ApprovalStatusName || (statusNum === 0 ? "Đang lập" : String(rawStatus ?? ""));

          return {
            ...r,
            id,
            issueCode: docCode,
            issueDate: docDate,
            issueType: r.SubType || r.issueType || "CONSTRUCTION",
            projectName,
            workPackage: r.WorkPackage || r.workPackage || "",
            contractorName: r.ReceiverName || r.ClientName || r.contractorName || "",
            warehouseId,
            warehouseName,
            requisitionNo: r.ReferenceNo || r.requisitionNo || "",
            receiver: r.Receiver || r.receiver || "",
            issuer: r.CreatedBy || r.issuer || "",
            description: r.Description || r.description || "",
            // Chuẩn hóa Status & StatusName theo API (Status = 0 là Đang lập)
            status: statusNum === 0 ? "DRAFT" : (statusNum === 1 ? "COMPLETED" : (statusNum === 2 ? "PENDING" : String(statusNum))),
            Status: statusNum,
            StatusCode: String(statusNum),
            StatusName: statusName,
            ApprovalStatus: r.ApprovalStatus !== undefined && r.ApprovalStatus !== null ? r.ApprovalStatus : statusNum,
            ApprovalStatusName: statusName,
            totalQty: Number(r.TotalQty ?? r.Qnty ?? 0),
            totalAmount: Number(r.TotalAmount ?? r.Amount ?? 0),
            items: r.items || [],
            createdBy: r.CreatedBy || "",
            createdDate: r.CreatedDate || docDate,
            TransactionId: transactionId,
            DocCode: docCode,
            DocDate: docDate,
            MainCode: mainCode,
            mainContractId: r.SubconOf ?? r.subconOf,
            SubconOf: r.SubconOf ?? r.subconOf,
          };
        });
        setIssues(mapped);
      }
    } catch (e) {
      console.error("Lỗi tải danh sách xuất kho:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    warehouseApi
      .getWarehouseList()
      .then((res) => {
        const list = extractApiList<any>(res);
        if (list && list.length > 0) {
          setWarehouseList(list);
        }
      })
      .catch(() => {});
  }, [fetchIssues]);

  const handleOpenCreate = () => {
    setEditingIssue(null);
    setIsEditTabOpen(true);
  };

  const handleOpenEdit = (record: StockOutIssue) => {
    setEditingIssue(record);
    setIsEditTabOpen(true);
  };

  const handleCloseEditTab = () => {
    setIsEditTabOpen(false);
    setEditingIssue(null);
  };

  const handleDelete = (issueOrId: StockOutIssue | string) => {
    const id = typeof issueOrId === "object" ? issueOrId.id : issueOrId;
    setIssues((prev) => prev.filter((i) => i.id !== id));
    message.success("Đã xóa phiếu xuất kho thành công!");
    handleCloseEditTab();
  };

  const handleSaveIssue = (saved: StockOutIssue) => {
    if (editingIssue) {
      setIssues((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      message.success("Cập nhật phiếu xuất kho thành công!");
    } else {
      setIssues((prev) => [saved, ...prev]);
      message.success("Tạo mới phiếu xuất kho thành công!");
    }
    handleCloseEditTab();
  };

  const warehouseOptions = useMemo(() => {
    const map = new Map<string, string>();
    warehouseList.forEach((w: any) => {
      const id = String(w.WarehouseId ?? w.Id ?? w.id ?? "");
      const name = w.WarehouseName || w.Name || w.name || "";
      if (id && name) {
        map.set(id, name);
      }
    });
    issues.forEach((i) => {
      if (i.warehouseId && i.warehouseName) {
        map.set(String(i.warehouseId), i.warehouseName);
      }
    });
    if (map.size === 0) {
      MOCK_WAREHOUSES.forEach((w) => {
        map.set(w.id, w.name);
      });
    }
    return [
      { value: "ALL", label: t.issue.allWarehouse },
      ...Array.from(map.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ];
  }, [warehouseList, issues, t]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const matchKeyword =
        !searchKeyword.trim() ||
        i.issueCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (i.MainCode && i.MainCode.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        i.projectName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (i.requisitionNo && i.requisitionNo.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        i.description.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchWarehouse =
        selectedWarehouseFilter === "ALL" || i.warehouseId === selectedWarehouseFilter;

      const matchStatus =
        selectedStatusFilter === "ALL" || i.status === selectedStatusFilter;

      return matchKeyword && matchWarehouse && matchStatus;
    });
  }, [issues, searchKeyword, selectedWarehouseFilter, selectedStatusFilter]);

  const renderType = (type: string) => {
    switch (type) {
      case "CONSTRUCTION":
        return t.issue.typeConstruction;
      case "TRANSFER":
        return t.issue.typeTransfer;
      case "RETURN_VENDOR":
        return t.issue.typeReturnVendor;
      case "DISPOSAL":
        return t.issue.typeDisposal;
      default:
        return type || t.issue.typeOther;
    }
  };

  const baseColumns: (ColumnType<StockOutIssue> & { cannotHide?: boolean })[] = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 55,
        align: "center",
        cannotHide: true,
        render: (_, __, index) => (
          <span style={{ color: "#334155", fontWeight: 400, fontSize: 13 }}>
            {index + 1}
          </span>
        ),
      },
      {
        title: t.table.warehouse,
        dataIndex: "warehouseName",
        key: "warehouseName",
        width: 240,
        render: (val, r) => (
          <span style={{ color: "#334155", fontWeight: 400, fontSize: 13 }}>
            {val || (r.warehouseId ? `Kho #${r.warehouseId}` : "---")}
          </span>
        ),
      },
      {
        title: t.issue.projectReceiver || (language === "en" ? "Client Contract" : "Hợp đồng CĐT"),
        dataIndex: "MainCode",
        key: "MainCode",
        width: 200,
        render: (val, r: any) => {
          const displayVal = val || r.MainCode || r.mainCode || r.ContractCode || "---";
          return (
            <span style={{ color: "#334155", fontWeight: 400, fontSize: 13 }}>
              {displayVal}
            </span>
          );
        },
      },
      {
        title: t.issue.mrCode,
        dataIndex: "requisitionNo",
        key: "requisitionNo",
        width: 150,
        render: (val) => (
          <span style={{ color: "#334155", fontWeight: 400, fontSize: 13 }}>
            {val || "---"}
          </span>
        ),
      },
      {
        title: t.issue.type,
        dataIndex: "issueType",
        key: "issueType",
        width: 130,
        render: (val) => {
          const typeStr = renderType(val);
          return (
            <span style={{ color: "#334155", fontWeight: 400, fontSize: 13 }}>
              {typeStr}
            </span>
          );
        },
      },
      {
        title: t.issue.code,
        dataIndex: "issueCode",
        key: "issueCode",
        width: 170,
        render: (val, record) => (
          <a
            onClick={() => handleOpenEdit(record)}
            style={{ color: "#008f89", fontWeight: 600, cursor: "pointer" }}
          >
            {val || "---"}
          </a>
        ),
      },
      {
        title: t.issue.date,
        dataIndex: "issueDate",
        key: "issueDate",
        width: 110,
        align: "center",
        render: (val) => (
          <span style={{ color: "#334155", fontWeight: 400, fontSize: 13 }}>
            {val ? dayjs(val).format("DD/MM/YYYY") : "---"}
          </span>
        ),
      },
      {
        title: t.table.description,
        dataIndex: "description",
        key: "description",
        width: 250,
        ellipsis: true,
        render: (val) => (
          <span style={{ color: "#334155", fontWeight: 400, fontSize: 13 }}>
            {val || "---"}
          </span>
        ),
      },
      {
        title: t.table.status || (language === "en" ? "Status" : "Trạng thái"),
        dataIndex: "StatusName",
        key: "StatusName",
        width: 140,
        align: "left" as const,
        render: (_val: any, record: any) => {
          const displayLabel = record?.StatusName || record?.ApprovalStatusName;
          const statusVal = record?.Status ?? record?.StatusCode ?? 0;
          return (
            <ApprovalBadge
              val={statusVal}
              record={record}
              customLabel={displayLabel}
            />
          );
        },
      },
      {
        key: "_spacer",
        title: "",
        width: undefined,
        cannotHide: true,
        render: () => null,
      },
    ],
    [t, language]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_issue_receipts_v3",
    columns: baseColumns,
    defaultScrollX: 1200,
  });

  if (isEditTabOpen) {
    return (
      <ErpDetailContainer>
        <StockOutEditTab
          open={isEditTabOpen}
          onClose={handleCloseEditTab}
          editingIssue={editingIssue}
          onSave={handleSaveIssue}
          onDelete={handleDelete}
          onUpdateEditingIssue={setEditingIssue}
        />
      </ErpDetailContainer>
    );
  }

  return (
    <ErpPageContainer>
      {/* Toolbar Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
          <Select
            value={selectedWarehouseFilter}
            onChange={setSelectedWarehouseFilter}
            style={{ width: 220, height: 36 }}
            options={warehouseOptions}
          />

          <Select
            value={selectedStatusFilter}
            onChange={setSelectedStatusFilter}
            style={{ width: 150, height: 36 }}
            options={[
              { value: "ALL", label: t.common.allStatus },
              { value: "DRAFT", label: t.status.draft },
              { value: "PENDING", label: t.status.pending },
              { value: "COMPLETED", label: t.status.completed },
            ]}
          />

          <Input
            placeholder={t.issue.searchPlaceholder}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 240, height: 36, borderRadius: 8, fontSize: 13.5 }}
            prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
          />
        </div>

        <Space size={10} style={{ flexShrink: 0 }}>
          <Button
            icon={<IconRefresh size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={() => {
              setSearchKeyword("");
              setSelectedWarehouseFilter("ALL");
              setSelectedStatusFilter("ALL");
              fetchIssues("");
            }}
            style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", color: "#334155", fontSize: 13.5, fontWeight: 500 }}
          >
            {t.common.refresh}
          </Button>

          <Button
            type="primary"
            icon={<IconPlus size={16} strokeWidth={2} />}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 36,
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 500,
              color: "#FFFFFF",
              boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
            }}
            onClick={handleOpenCreate}
          >
            {t.common.createIssue}
          </Button>
        </Space>
      </div>

      {/* Main Table */}
      <Table
        loading={loading}
        className="stockin-main-table"
        tableLayout="fixed"
        components={{ header: { cell: ResizableTitle } }}
        rowKey="id"
        size="small"
        columns={tableColumns}
        dataSource={filteredIssues}
        onRow={(record) => ({
          onDoubleClick: () => handleOpenEdit(record),
        })}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100", "200"],
          showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.table.receiptsCount}`,
        }}
        scroll={{ x: scrollX, y: "calc(100vh - 215px)" }}
      />
    </ErpPageContainer>
  );
}
