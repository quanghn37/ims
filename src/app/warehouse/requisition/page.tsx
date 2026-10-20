"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Tabs,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import {
  IconFileText,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconFileSpreadsheet,
  IconList,
  IconPencil,
  IconClockHour4,
  IconCheck,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import dayjs from "dayjs";
import {
  MaterialRequisition,
  MOCK_WAREHOUSES,
} from "../types";
import { warehouseApi } from "../api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import RequisitionDetailDrawer from "./_components/RequisitionDetailDrawer";
import RequisitionCreateModal from "./_components/RequisitionCreateModal";
import RequisitionEditTab from "./_components/RequisitionEditTab";
import { useTranslation } from "@/locales/LanguageContext";

const { Text, Title } = Typography;

export default function MaterialRequisitionPage() {
  const { t } = useTranslation();
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

  // Drawer / Modal states
  const [selectedRequisition, setSelectedRequisition] = useState<MaterialRequisition | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Tab states
  const [activeTabKey, setActiveTabKey] = useState<string>("list");
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
          const status = r.StatusCode || r.Status || r.status || "PENDING";
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
            status,
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
      .getWarehouseList({ PageNum: 1, PageSize: 50, Keyword: "" })
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
  const handleOpenDetail = (record: MaterialRequisition) => {
    handleOpenEdit(record);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
    setSelectedRequisition(null);
  };

  const handleApprove = (id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedItems = r.items.map((it) => ({
            ...it,
            approvedQty: it.requestedQty,
          }));
          const totalApprovedQty = updatedItems.reduce((acc, cur) => acc + (cur.approvedQty || 0), 0);
          return {
            ...r,
            status: "APPROVED",
            approverName: "CHT. Mai Quốc Tuấn",
            approvedDate: dayjs().format("YYYY-MM-DD HH:mm"),
            totalApprovedQty,
            items: updatedItems,
          };
        }
        return r;
      })
    );
    // Also update current drawer state if open
    setSelectedRequisition((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: "APPROVED",
            approverName: "CHT. Mai Quốc Tuấn",
            approvedDate: dayjs().format("YYYY-MM-DD HH:mm"),
          }
        : prev
    );
  };

  const handleReject = (id: string, reason: string) => {
    setRequisitions((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: "REJECTED",
            approverName: "BCH Công Trường",
            approvedDate: dayjs().format("YYYY-MM-DD HH:mm"),
            rejectReason: reason,
          };
        }
        return r;
      })
    );
    setSelectedRequisition((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: "REJECTED",
            approverName: "BCH Công Trường",
            approvedDate: dayjs().format("YYYY-MM-DD HH:mm"),
            rejectReason: reason,
          }
        : prev
    );
    message.error(`Đã từ chối phiếu yêu cầu!`);
  };

  const handleSubmitForApproval = (id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "PENDING" } : r))
    );
    setSelectedRequisition((prev) =>
      prev && prev.id === id ? { ...prev, status: "PENDING" } : prev
    );
  };

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

  const handleSaveCreate = (newReq: MaterialRequisition) => {
    fetchRequisitions(1, pagination.pageSize, "");
    message.success(`Đã thêm phiếu yêu cầu ${newReq.requisitionCode} thành công!`);
  };

  const handleOpenCreate = () => {
    setEditingRequisition(null);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleOpenEdit = (record: MaterialRequisition) => {
    setEditingRequisition(record);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleCloseEditTab = () => {
    setIsEditTabOpen(false);
    setEditingRequisition(null);
    setActiveTabKey("list");
  };

  const handleSaveRequisition = (savedData: MaterialRequisition, isNewlyCreated?: boolean) => {
    fetchRequisitions(pagination.current, pagination.pageSize, searchKeyword);
    if (isNewlyCreated) {
      setEditingRequisition(savedData);
    } else {
      message.success(`Đã lưu phiếu yêu cầu ${savedData.requisitionCode} thành công!`);
      handleCloseEditTab();
    }
  };

  // Status & Priority Renderers
  const renderStatusTag = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Tag color="warning" icon={<IconClockHour4 size={14} style={{ verticalAlign: "middle" }} />}>{t.status.pending}</Tag>;
      case "APPROVED":
        return <Tag color="processing" icon={<IconCheck size={14} style={{ verticalAlign: "middle" }} />}>{t.status.approved}</Tag>;
      case "PARTIAL_ISSUED":
        return <Tag color="cyan" icon={<IconUpload size={14} style={{ verticalAlign: "middle" }} />}>{t.status.partialIssued}</Tag>;
      case "COMPLETED":
        return <Tag color="success" icon={<IconCheck size={14} style={{ verticalAlign: "middle" }} />}>{t.status.completed}</Tag>;
      case "REJECTED":
        return <Tag color="error" icon={<IconX size={14} style={{ verticalAlign: "middle" }} />}>{t.status.rejected}</Tag>;
      case "DRAFT":
      default:
        return <Tag color="default">{t.status.draft}</Tag>;
    }
  };

  const renderPriorityTag = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Tag color="#EF4444" style={{ fontWeight: 600 }}>{t.status.urgent}</Tag>;
      case "HIGH":
        return <Tag color="#F59E0B" style={{ fontWeight: 600 }}>{t.status.high}</Tag>;
      case "NORMAL":
      default:
        return <Tag color="#3B82F6">{t.status.normal}</Tag>;
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
            <Text style={{ color: "#123443", fontWeight: 500 }}>
              {createDate ? dayjs(createDate).format("DD/MM/YYYY") : "---"}
            </Text>
          );
        },
      },
      {
        title: t.requisition.expectedWarehouse,
        dataIndex: "warehouseName",
        key: "warehouseName",
        width: 220,
        render: (val, r: any) => (
          <span style={{ fontWeight: 500, color: "#334155" }}>
            {val || r.WarehouseName || (r.warehouseId ? `Kho #${r.warehouseId}` : "---")}
          </span>
        ),
      },
      {
        title: t.requisition.projectClient,
        dataIndex: "projectName",
        key: "projectName",
        width: 250,
        render: (val, r: any) => {
          const pName = val || r.ProjectName || r.projectName || "---";
          const pCode = r.ProjectCode || r.contractCode || r.workPackage || "";
          return (
            <div>
              <div style={{ color: "#123443", fontWeight: 500, fontSize: 13 }}>{pName}</div>
              {pCode && (
                <div style={{ fontSize: 12, color: "#718894" }}>
                  {pCode}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: t.requisition.receiverRequester,
        key: "contractorAndRequester",
        width: 220,
        render: (_, r: any) => {
          const receiver = r.contractorName || r.ReceiverName || r.targetName || "---";
          const requester = r.requesterName || r.CreatedBy || "r@gmail.com";
          return (
            <div>
              <div style={{ color: "#123443", fontWeight: 500, fontSize: 13 }}>
                {receiver}
              </div>
              <div style={{ fontSize: 12, color: "#718894" }}>
                {requester}
              </div>
            </div>
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
        title: "",
        key: "action",
        width: 70,
        align: "center",
        fixed: "right",
        cannotHide: true,
        render: (_, record) => (
          <Popconfirm
            title={t.common.deleteConfirmTitle}
            description={t.common.deleteConfirmDesc}
            okText={t.common.delete}
            cancelText={t.common.cancel}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <ActionIconButton action="delete" size="small" />
          </Popconfirm>
        ),
      },
    ],
    [pagination.current, pagination.pageSize, t]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_material_requisitions_v2",
    columns: baseColumns,
    actionColumnKey: "action",
    defaultScrollX: 1100,
  });

  return (
    <div style={{ padding: 0, width: "100%", minHeight: "calc(100vh - 100px)", background: "#FFFFFF", borderRadius: 16, border: "1px solid #dce5e6", overflow: "hidden", boxShadow: "0 1px 3px rgba(18, 52, 67, 0.04)" }}>
      <Tabs
        className="requisition-page-tabs"
        type="editable-card"
        hideAdd
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        onEdit={(targetKey, action) => {
          if (action === "remove" && targetKey === "edit") {
            handleCloseEditTab();
          }
        }}
        tabBarStyle={{
          margin: 0,
          background: "#f7fbfa",
          padding: "6px 16px 0 16px",
          borderBottom: "1px solid #dce5e6",
        }}
        items={[
          {
            key: "list",
            label: (
              <Space size={6}>
                <IconList size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
                <span>{t.requisition.tabList}</span>
              </Space>
            ),
            closable: false,
            children: (
              <div style={{ padding: 24 }}>
                {/* Scoped CSS for requisition main table and tabs */}
                <style jsx global>{`
                  .requisition-main-table .ant-table-thead > tr > th {
                    background: #f7fbfa !important;
                    color: #123443 !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    line-height: 18px !important;
                    border-color: #dce5e6 !important;
                    padding: 10px 12px !important;
                  }
                  .requisition-main-table .ant-table-tbody > tr > td {
                    color: #123443 !important;
                    font-size: 13px !important;
                    line-height: 18px !important;
                    border-color: #dce5e6 !important;
                    padding: 10px 12px !important;
                    height: 46px !important;
                  }
                  .requisition-main-table .ant-table-tbody > tr:hover > td {
                    background-color: #eef8f6 !important;
                  }
                  .requisition-main-table .ant-table-container {
                    border: 1px solid #dce5e6 !important;
                    border-radius: 8px !important;
                    overflow: hidden;
                  }
                  .requisition-main-table .ant-pagination .ant-pagination-item-active {
                    border-color: #008f89 !important;
                    background-color: #008f89 !important;
                  }
                  .requisition-main-table .ant-pagination .ant-pagination-item-active a {
                    color: #FFFFFF !important;
                  }
                  .requisition-page-tabs .ant-tabs-nav {
                    margin-bottom: 0 !important;
                    background: #f7fbfa !important;
                    border-bottom: 1px solid #dce5e6 !important;
                    padding: 6px 16px 0 16px !important;
                  }
                  .requisition-page-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #008f89 !important;
                    font-weight: 600 !important;
                  }
                  .requisition-page-tabs .ant-tabs-ink-bar {
                    background: #008f89 !important;
                  }
                `}</style>

                {/* Header bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Text
                      strong
                      style={{
                        fontSize: 18,
                        color: "#008f89",
                        fontWeight: 700,
                        lineHeight: "28px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <IconFileText size={18} strokeWidth={1.8} style={{ color: "#008f89" }} /> {t.requisition.listTitle}
                    </Text>
                    <Tag
                      style={{
                        background: "#dce5e6",
                        color: "#008f89",
                        borderRadius: 12,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 500,
                        lineHeight: "16px",
                        padding: "2px 8px",
                        margin: 0,
                      }}
                    >
                      {pagination.total || filteredRequisitions.length} {t.requisition.reqCount}
                    </Tag>
                  </div>

                  <Space size={8} wrap>
                    <Select
                      value={selectedWarehouseFilter}
                      onChange={setSelectedWarehouseFilter}
                      style={{ width: 200, height: 36 }}
                      options={warehouseOptions}
                    />

                    <Select
                      value={selectedStatusFilter}
                      onChange={setSelectedStatusFilter}
                      style={{ width: 155, height: 36 }}
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
                      style={{ width: 140, height: 36 }}
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
                      style={{ width: 230, height: 36, borderRadius: 8 }}
                      prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
                    />

                    <Button
                      icon={<IconSearch size={16} strokeWidth={1.8} />}
                      onClick={() => fetchRequisitions(1, pagination.pageSize, searchKeyword)}
                      style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
                    >
                      {t.common.search}
                    </Button>

                    <Button
                      icon={<IconRefresh size={16} strokeWidth={1.8} />}
                      onClick={() => {
                        setSearchKeyword("");
                        setSelectedWarehouseFilter("ALL");
                        setSelectedStatusFilter("ALL");
                        setSelectedPriorityFilter("ALL");
                        fetchRequisitions(1, pagination.pageSize, "");
                      }}
                      style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
                    >
                      {t.common.refresh}
                    </Button>

                    <Button
                      icon={<IconFileSpreadsheet size={16} strokeWidth={1.8} />}
                      onClick={() => message.info("Đang xuất danh sách yêu cầu ra file Excel...")}
                      style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
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
                        fontWeight: 500,
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
                  components={{ header: { cell: ResizableTitle } }}
                  rowKey="id"
                  size="small"
                  columns={tableColumns}
                  dataSource={filteredRequisitions}
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total) => `${t.table.total} ${total} ${t.requisition.reqCount}`,
                    onChange: (page, pageSize) => {
                      fetchRequisitions(page, pageSize, searchKeyword);
                    },
                  }}
                  scroll={{ x: scrollX }}
                />
              </div>
            ),
          },
          ...(isEditTabOpen
            ? [
                {
                  key: "edit",
                  label: (
                    <Space size={6}>
                      <IconPencil size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
                      <span>
                        {editingRequisition
                          ? `${editingRequisition.requisitionCode}`
                          : t.common.createRequisition}
                      </span>
                    </Space>
                  ),
                  closable: true,
                  children: (
                    <div style={{ background: "#fff", minHeight: "calc(100vh - 110px)" }}>
                      <RequisitionEditTab
                        open={isEditTabOpen}
                        onClose={handleCloseEditTab}
                        editingRequisition={editingRequisition}
                        onSave={handleSaveRequisition}
                      />
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />

      {/* Detail Drawer */}
      <RequisitionDetailDrawer
        open={isDetailDrawerOpen}
        onClose={handleCloseDetail}
        requisition={selectedRequisition}
        onApprove={handleApprove}
        onReject={handleReject}
        onSubmitForApproval={handleSubmitForApproval}
      />

      {/* Create Modal */}
      <RequisitionCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveCreate}
      />
    </div>
  );
}
