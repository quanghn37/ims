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
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import {
  MaterialRequisition,
  MOCK_WAREHOUSES,
} from "../types";
import { warehouseApi } from "../api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import ApprovalBadge from "@/components/common/ApprovalBadge";
import RequisitionEditTab from "./_components/RequisitionEditTab";
import { useTranslation } from "@/locales/LanguageContext";
import { ErpPageContainer, ErpDetailContainer } from "@/components/layout/ErpPageContainer";

export default function MaterialRequisitionPage() {
  const { t, language } = useTranslation();
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("ALL");
  const [warehouseList, setWarehouseList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [isEditTabOpen, setIsEditTabOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState<MaterialRequisition | null>(null);

  // ---------------------------------------------------------------------------
  // Load data from API: api/get-inventory-transaction?DisplayMode=Request
  // ---------------------------------------------------------------------------
  const fetchRequisitions = useCallback(
    async (page = 1, pageSize = 20, keyword = "") => {
      setLoading(true);
      try {
        const data = await warehouseApi.getInventoryTransactions({
          DisplayMode: "Request",
          WSId: "",
          Keyword: keyword,
          PageNum: page,
          PageSize: pageSize,
        });

        const list = extractApiList<any>(data);
        const totalRows = extractTotalRows(data);

        const mapped: MaterialRequisition[] = list.map((r: any, index: number) => {
          const transactionId = r.TransactionId ?? r.Id;
          const id = String(transactionId ?? r.DocCode ?? `req_${page}_${index}`);
          const docCode = r.DocCode || r.requisitionCode || `MR-${dayjs().format("YYYY-MM")}/${index + 1}`;
          const docDate = r.DocDate || r.requisitionDate || dayjs().format("YYYY-MM-DD");
          const warehouseId = r.WarehouseId !== undefined && r.WarehouseId !== null ? String(r.WarehouseId) : "";
          const warehouseName = r.WarehouseName || (warehouseId ? `Kho #${warehouseId}` : "---");
          const projectCode = r.ProjectCode || r.contractCode || "";
          const projectName = r.ProjectName || r.projectName || projectCode || "---";
          const receiverName = r.ReceiverName || r.ClientName || r.contractorName || r.targetName || "---";
          const description = r.Description || r.description || "";
          const totalItems = Number(r.TotalItems ?? r.itemCount ?? 0);
          const totalRequestedQty = Number(r.TotalRequestedQty ?? r.TotalQty ?? r.Qnty ?? 0);
          const totalApprovedQty = Number(r.TotalApprovedQty ?? 0);

          // Chuẩn hóa Status & StatusName theo API (Status = 0 là Đang lập)
          const rawStatus = r.Status !== undefined && r.Status !== null ? r.Status : r.StatusCode;
          const statusNum = rawStatus !== undefined && rawStatus !== null && !isNaN(Number(rawStatus)) ? Number(rawStatus) : 0;
          const statusName = r.StatusName || r.ApprovalStatusName || (statusNum === 0 ? "Đang lập" : String(rawStatus ?? ""));
          const priority = r.Priority || r.priority || "NORMAL";

          return {
            id,
            requisitionCode: docCode,
            requisitionDate: docDate,
            expectedDate: r.ExpectedDate || r.expectedDate || docDate,
            priority,
            projectName,
            workPackage: r.WorkPackage || r.workPackage || "",
            contractorName: receiverName,
            requesterName: r.RequesterName || r.CreatedBy || "r@gmail.com",
            requesterPhone: r.RequesterPhone || "",
            warehouseId,
            warehouseName,
            status: statusNum === 0 ? "DRAFT" : (statusNum === 1 ? "APPROVED" : (statusNum === 2 ? "PENDING" : String(statusNum))),
            Status: statusNum,
            StatusCode: String(statusNum),
            StatusName: statusName,
            ApprovalStatus: r.ApprovalStatus !== undefined && r.ApprovalStatus !== null ? r.ApprovalStatus : statusNum,
            ApprovalStatusName: statusName,
            description,
            totalRequestedQty,
            totalApprovedQty,
            itemCount: totalItems,
            totalEstimatedAmount: Number(r.TotalAmount ?? 0),
            items: r.items || [],
            createdBy: r.CreatedBy || "r@gmail.com",
            createdDate: r.CreatedDate || docDate,

            // Raw API fields
            TransactionId: transactionId,
            SubType: r.SubType || "Project",
            DocCode: docCode,
            DocDate: docDate,
            Description: description,
            WarehouseId: r.WarehouseId,
            WarehouseName: warehouseName,
            SubconOf: r.SubconOf,
            ProjectCode: projectCode,
            ProjectName: projectName,
            ClientId: r.ClientId,
            ReceiverName: receiverName,
            ReferenceId: r.ReferenceId,
            TotalItems: totalItems,
            contractCode: projectCode,
            targetName: receiverName,
            clientId: r.ClientId,
            mainContractId: r.SubconOf,
          };
        });

        setRequisitions(mapped);
        setPagination({
          current: page,
          pageSize,
          total: totalRows || mapped.length,
        });
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách phiếu yêu cầu xuất:", err);
        message.error(err?.message || "Không thể tải danh sách phiếu yêu cầu xuất");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRequisitions(1, pagination.pageSize, "");
  }, [fetchRequisitions]);

  // Tải danh sách kho thực tế từ API
  useEffect(() => {
    warehouseApi
      .getWarehouseList()
      .then((res) => {
        const list = extractApiList<any>(res);
        if (list && list.length > 0) {
          setWarehouseList(list);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải danh sách kho từ API:", err);
      });
  }, []);

  const warehouseOptions = useMemo(() => {
    const list = [{ value: "ALL", label: t.requisition.allWarehouse }];
    if (warehouseList && warehouseList.length > 0) {
      warehouseList.forEach((w: any) => {
        const id = String(w.WarehouseId ?? w.Id ?? w.id);
        const name = w.WarehouseName || w.Name || w.name || `Kho #${id}`;
        list.push({ value: id, label: name });
      });
    } else {
      MOCK_WAREHOUSES.forEach((w) => {
        list.push({ value: w.id, label: w.name });
      });
    }
    return list;
  }, [warehouseList, t]);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      const matchWarehouse =
        selectedWarehouseFilter === "ALL" ||
        String(r.warehouseId) === String(selectedWarehouseFilter) ||
        String((r as any).WarehouseId) === String(selectedWarehouseFilter);

      const matchStatus =
        selectedStatusFilter === "ALL" || r.status === selectedStatusFilter;

      const matchPriority =
        selectedPriorityFilter === "ALL" || r.priority === selectedPriorityFilter;

      return matchWarehouse && matchStatus && matchPriority;
    });
  }, [requisitions, selectedWarehouseFilter, selectedStatusFilter, selectedPriorityFilter]);

  // Handlers
  const handleDelete = async (id: string) => {
    const target = requisitions.find((r) => r.id === id);
    const transId = (target as any)?.TransactionId ?? (target as any)?.Id ?? (!isNaN(Number(id)) ? Number(id) : null);
    if (transId) {
      try {
        await warehouseApi.deleteInventoryTransaction(Number(transId));
        message.success("Đã xóa phiếu yêu cầu xuất vật tư!");
        fetchRequisitions(pagination.current, pagination.pageSize, searchKeyword);
        return;
      } catch (err: any) {
        console.error("Lỗi xóa phiếu yêu cầu:", err);
        message.error(err?.message || "Không thể xóa phiếu yêu cầu");
      }
    }
    setRequisitions((prev) => prev.filter((r) => r.id !== id));
    message.success("Đã xóa phiếu yêu cầu xuất vật tư!");
  };

  const handleOpenCreate = () => {
    setEditingRequisition(null);
    setIsEditTabOpen(true);
  };

  const handleOpenEdit = (record: MaterialRequisition) => {
    setEditingRequisition(record);
    setIsEditTabOpen(true);
  };

  const handleCloseEditTab = () => {
    setIsEditTabOpen(false);
    setEditingRequisition(null);
  };

  const handleSaveRequisition = (savedData: MaterialRequisition, isNewlyCreated?: boolean) => {
    if (isNewlyCreated) {
      setEditingRequisition(savedData);
      setRequisitions((prev) => [savedData, ...prev]);
    } else {
      message.success(`Đã lưu phiếu yêu cầu ${savedData.requisitionCode} thành công!`);
      handleCloseEditTab();
      fetchRequisitions(pagination.current, pagination.pageSize, searchKeyword);
    }
  };

  // Table Columns
  const baseColumns: (ColumnType<MaterialRequisition> & { cannotHide?: boolean })[] = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 50,
        align: "center",
        cannotHide: true,
        render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: t.requisition.code,
        dataIndex: "requisitionCode",
        key: "requisitionCode",
        width: 175,
        render: (val, record: any) => (
          <a
            onClick={() => handleOpenEdit(record)}
            style={{ color: "#008f89", fontWeight: 600, cursor: "pointer" }}
          >
            {val || record.DocCode}
          </a>
        ),
      },
      {
        title: t.requisition.date,
        dataIndex: "requisitionDate",
        key: "requisitionDate",
        width: 120,
        align: "center",
        render: (val, r: any) => {
          const createDate = val || r.DocDate;
          return (
            <span style={{ color: "#123443" }}>
              {createDate ? dayjs(createDate).format("DD/MM/YYYY") : "---"}
            </span>
          );
        },
      },
      {
        title: t.requisition.expectedWarehouse,
        dataIndex: "warehouseName",
        key: "warehouseName",
        width: 220,
        render: (val, r: any) => (
          <span style={{ color: "#334155" }}>
            {val || r.WarehouseName || (r.warehouseId ? `Kho #${r.warehouseId}` : "---")}
          </span>
        ),
      },
      {
        title: t.requisition?.projectName || (language === "en" ? "Project" : "Dự án"),
        dataIndex: "projectName",
        key: "projectName",
        width: 180,
        render: (val, r: any) => (
          <span style={{ color: "#123443", fontSize: 13, fontWeight: 400 }}>
            {val || r.ProjectName || r.projectName || "---"}
          </span>
        ),
      },
      {
        title: t.requisition?.clientContract || (language === "en" ? "Client Contract" : "HĐ Chủ đầu tư"),
        dataIndex: "contractCode",
        key: "contractCode",
        width: 160,
        render: (val, r: any) => {
          const code = val || r.ProjectCode || r.contractCode || r.workPackage || "";
          return (
            <span style={{ fontFamily: "ui-monospace, monospace", color: "#1e293b", fontSize: 12.5, fontWeight: 400 }}>
              {code || "---"}
            </span>
          );
        },
      },
      {
        title: t.requisition?.receiver || (language === "en" ? "Receiver" : "Đơn vị nhận"),
        dataIndex: "contractorName",
        key: "contractorName",
        width: 220,
        render: (val, r: any) => (
          <span style={{ color: "#123443", fontSize: 13, fontWeight: 400 }}>
            {val || r.contractorName || r.ReceiverName || r.targetName || "---"}
          </span>
        ),
      },
      {
        title: t.requisition?.requester || (language === "en" ? "Requester" : "Người yêu cầu"),
        dataIndex: "requesterName",
        key: "requesterName",
        width: 150,
        render: (val, r: any) => {
          const req = val || r.requesterName || r.CreatedBy || "";
          return (
            <span style={{ color: "#123443", fontSize: 13, fontWeight: 400 }}>
              {req || "---"}
            </span>
          );
        },
      },
      {
        title: t.requisition.purpose,
        dataIndex: "description",
        key: "description",
        width: 250,
        ellipsis: true,
        render: (val, r: any) => val || r.Description || "---",
      },
      {
        title: t.table.status || (language === "en" ? "Status" : "Trạng thái"),
        dataIndex: "StatusName",
        key: "StatusName",
        width: 140,
        align: "left",
        render: (_val, record: any) => {
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
    [pagination.current, pagination.pageSize, t, language]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_material_requisitions_v3",
    columns: baseColumns,
    defaultScrollX: 1300,
  });

  if (isEditTabOpen) {
    return (
      <ErpDetailContainer>
        <RequisitionEditTab
          open={isEditTabOpen}
          onClose={handleCloseEditTab}
          editingRequisition={editingRequisition}
          onSave={handleSaveRequisition}
          onUpdateEditingRequisition={(updated) => {
            setEditingRequisition(updated);
            setRequisitions((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          }}
          onDelete={async (req: any) => {
            await handleDelete(req.id);
            handleCloseEditTab();
          }}
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
            style={{ width: 180, height: 36 }}
            options={warehouseOptions}
          />

          <Select
            value={selectedStatusFilter}
            onChange={setSelectedStatusFilter}
            style={{ width: 140, height: 36 }}
            options={[
              { value: "ALL", label: t.common.allStatus },
              { value: "PENDING", label: t.status.pending },
              { value: "APPROVED", label: t.status.approved },
              { value: "PARTIAL_ISSUED", label: t.status.partialIssued },
              { value: "COMPLETED", label: t.status.completed },
              { value: "REJECTED", label: t.status.rejected },
              { value: "DRAFT", label: t.status.draft },
            ]}
          />

          <Select
            value={selectedPriorityFilter}
            onChange={setSelectedPriorityFilter}
            style={{ width: 130, height: 36 }}
            options={[
              { value: "ALL", label: t.requisition.allPriority },
              { value: "URGENT", label: t.status.urgent },
              { value: "HIGH", label: t.status.high },
              { value: "NORMAL", label: t.status.normal },
            ]}
          />

          <Input
            placeholder={t.requisition.searchPlaceholder}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={() => fetchRequisitions(1, pagination.pageSize, searchKeyword)}
            style={{ width: 220, height: 36, borderRadius: 8, fontSize: 13.5 }}
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
              setSelectedPriorityFilter("ALL");
              fetchRequisitions(1, pagination.pageSize, "");
            }}
            style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", color: "#334155", fontSize: 13.5, fontWeight: 500 }}
          >
            {t.common.refresh}
          </Button>

          <Button
            icon={<IconFileSpreadsheet size={16} strokeWidth={1.8} style={{ color: "#16A34A" }} />}
            onClick={() => message.info("Đang xuất danh sách yêu cầu ra file Excel...")}
            style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6", color: "#334155", fontSize: 13.5, fontWeight: 500 }}
          >
            {t.common.exportExcel}
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
            {t.common.createRequisition}
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        className="requisition-main-table"
        tableLayout="fixed"
        components={{ header: { cell: ResizableTitle } }}
        rowKey="id"
        size="small"
        columns={tableColumns}
        dataSource={filteredRequisitions}
        loading={loading}
        scroll={{ x: scrollX, y: "calc(100vh - 215px)" }}
        onRow={(record) => ({
          onDoubleClick: () => handleOpenEdit(record),
        })}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100", "200"],
          showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} ${t.requisition.reqCount || "yêu cầu"}`,
          onChange: (page, pageSize) => {
            fetchRequisitions(page, pageSize, searchKeyword);
          },
        }}
      />
    </ErpPageContainer>
  );
}
