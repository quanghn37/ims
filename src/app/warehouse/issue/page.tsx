"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Card,
  Popconfirm,
  Tabs,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import {
  IconUpload,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconList,
  IconPencil,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import dayjs from "dayjs";
import { StockOutIssue, MOCK_WAREHOUSES } from "../types";
import StockOutEditTab from "./_components/StockOutEditTab";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

const INITIAL_STOCK_OUT_DATA: StockOutIssue[] = [
  {
    id: "iss_1",
    issueCode: "PXK-2026-09/001",
    issueDate: "2026-09-23",
    issueType: "CONSTRUCTION",
    projectName: "Dự án Khu đô thị Vinhomes Grand Park - Phân khu 2",
    workPackage: "Tòa S10.03 - Thi công sàn tầng 3",
    contractorName: "Đội bê tông cốt thép - Đội trưởng Tuấn",
    warehouseId: "WH02",
    warehouseName: "Kho Dự án Vinhomes Grand Park",
    requisitionNo: "MR-2026-09/101",
    receiver: "Kỹ sư giám sát Nguyễn Văn Thắng",
    issuer: "Nguyễn Văn Thao (Thủ kho)",
    description: "Xuất 3 tấn thép D16 và 80 cây ống nhựa D90 phục vụ đổ bê tông sàn",
    status: "COMPLETED",
    totalQty: 3080,
    totalAmount: 58700000,
    createdBy: "tienph01",
    createdDate: "2026-09-23 08:30",
    items: [
      {
        id: "oit_1",
        itemCode: "VT-THEP-D16",
        itemName: "Thép vằn D16 CB400-V Hòa Phát",
        unit: "Kg",
        stockQty: 18500,
        orderQty: 3000,
        actualQty: 3000,
        unitPrice: 15700,
        totalPrice: 47100000,
        binLocation: "Bãi thép số 2",
        note: "Xuất sàn tầng 3",
      },
      {
        id: "oit_2",
        itemCode: "VT-ONG-UPVC90",
        itemName: "Ống nhựa uPVC D90 C2 Bình Minh",
        unit: "Cây",
        stockQty: 600,
        orderQty: 80,
        actualQty: 80,
        unitPrice: 145000,
        totalPrice: 11600000,
        binLocation: "Giá ống tầng 1",
        note: "Trục đứng D90",
      },
    ],
  },
  {
    id: "iss_2",
    issueCode: "PXK-2026-09/002",
    issueDate: "2026-09-22",
    issueType: "TRANSFER",
    projectName: "Dự án Sân bay Quốc tế Long Thành",
    workPackage: "Gói thầu 5.10 - Nhà ga hành khách",
    contractorName: "Ban điều hành dự án Long Thành",
    warehouseId: "WH01",
    warehouseName: "Kho Tổng Central - TP.HCM",
    requisitionNo: "TRANSFER-LT-09/02",
    receiver: "Hoàng Đức Thịnh (Thủ kho Long Thành)",
    issuer: "Lê Văn Hùng (Thủ kho chính)",
    description: "Điều chuyển 500 bao xi măng Hà Tiên PCB40 hỗ trợ công trường Long Thành",
    status: "COMPLETED",
    totalQty: 500,
    totalAmount: 44000000,
    createdBy: "tienph01",
    createdDate: "2026-09-22 10:15",
    items: [
      {
        id: "oit_3",
        itemCode: "VT-XM-PC40",
        itemName: "Xi măng Hà Tiên PCB40 đóng bao 50kg",
        unit: "Bao",
        stockQty: 1200,
        orderQty: 500,
        actualQty: 500,
        unitPrice: 88000,
        totalPrice: 44000000,
        binLocation: "Kho A",
        note: "Xe 51C-881.23",
      },
    ],
  },
  {
    id: "iss_3",
    issueCode: "PXK-2026-09/003",
    issueDate: "2026-09-23",
    issueType: "CONSTRUCTION",
    projectName: "Khu Đô Thị Starlake Tây Hồ Tây - Hà Nội",
    workPackage: "Hạng mục M&E Điện nhẹ tòa tháp đôi",
    contractorName: "Nhà thầu cơ điện REE M&E",
    warehouseId: "WH05",
    warehouseName: "Kho Miền Bắc - KĐT Starlake Tây Hồ",
    requisitionNo: "MR-SL-26.09/44",
    receiver: "Kỹ sư Phạm Quốc Việt",
    issuer: "Trần Anh Khoa (Thủ kho)",
    description: "Xuất aptomat khối MCCB 3P 50A và cáp điện lắp đặt tủ phân phối tầng hầm",
    status: "PENDING",
    totalQty: 220,
    totalAmount: 49800000,
    createdBy: "quanghn",
    createdDate: "2026-09-23 13:45",
    items: [
      {
        id: "oit_4",
        itemCode: "VT-MCB-3P50A",
        itemName: "Aptomat khối MCCB 3P 50A 25kA Schneider",
        unit: "Cái",
        stockQty: 45,
        orderQty: 20,
        actualQty: 20,
        unitPrice: 890000,
        totalPrice: 17800000,
        binLocation: "Tủ thiết bị M&E",
        note: "Nguyên tem bảo hành",
      },
      {
        id: "oit_5",
        itemCode: "VT-CAP-CXV4X16",
        itemName: "Cáp điện lực hạ thế Cadivi CXV 4x16 mm2",
        unit: "Mét",
        stockQty: 850,
        orderQty: 200,
        actualQty: 200,
        unitPrice: 160000,
        totalPrice: 32000000,
        binLocation: "Kệ cáp",
        note: "Cắt đoạn 50m",
      },
    ],
  },
  {
    id: "iss_4",
    issueCode: "PXK-2026-09/004",
    issueDate: "2026-09-23",
    issueType: "CONSTRUCTION",
    projectName: "Dự án Khu đô thị Vinhomes Grand Park",
    workPackage: "Hoàn thiện mặt ngoài Shophouse",
    contractorName: "Đội sơn bả - Minh Phát",
    warehouseId: "WH02",
    warehouseName: "Kho Dự án Vinhomes Grand Park",
    requisitionNo: "MR-SON-09/11",
    receiver: "Đội trưởng Nguyễn Minh",
    issuer: "Nguyễn Văn Thao (Thủ kho)",
    description: "Xuất sơn lót chống kiềm ngoài trời Dulux sơn mặt ngoài Shophouse D2",
    status: "DRAFT",
    totalQty: 15,
    totalAmount: 27750000,
    createdBy: "quanghn",
    createdDate: "2026-09-23 14:20",
    items: [
      {
        id: "oit_6",
        itemCode: "VT-SON-DULUX-WT",
        itemName: "Sơn lót chống kiềm ngoài trời Dulux Weathershield 18L",
        unit: "Thùng",
        stockQty: 80,
        orderQty: 15,
        actualQty: 15,
        unitPrice: 1850000,
        totalPrice: 27750000,
        binLocation: "Khu vực hóa chất",
        note: "Đợt 1",
      },
    ],
  },
];

export default function StockOutPage() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<StockOutIssue[]>(INITIAL_STOCK_OUT_DATA);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Tab state: "list" vs "edit"
  const [activeTabKey, setActiveTabKey] = useState<string>("list");
  const [isEditTabOpen, setIsEditTabOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<StockOutIssue | null>(null);

  const handleOpenCreate = () => {
    setEditingIssue(null);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleOpenEdit = (record: StockOutIssue) => {
    setEditingIssue(record);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleCloseEditTab = () => {
    setIsEditTabOpen(false);
    setEditingIssue(null);
    setActiveTabKey("list");
  };

  const handleDelete = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
    message.success("Đã xóa phiếu xuất kho thành công!");
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
    issues.forEach((i) => {
      if (i.warehouseId && i.warehouseName) {
        map.set(i.warehouseId, i.warehouseName);
      }
    });
    MOCK_WAREHOUSES.forEach((w) => {
      if (!map.has(w.id)) {
        map.set(w.id, w.name);
      }
    });
    return [
      { value: "ALL", label: t.issue.allWarehouse },
      ...Array.from(map.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ];
  }, [issues, t]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const matchKeyword =
        !searchKeyword.trim() ||
        i.issueCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
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
        render: (_, __, index) => index + 1,
      },
      {
        title: t.table.warehouse,
        dataIndex: "warehouseName",
        key: "warehouseName",
        width: 230,
        render: (val, r) => val || (r.warehouseId ? `Kho #${r.warehouseId}` : "---"),
      },
      {
        title: t.issue.projectReceiver,
        dataIndex: "projectName",
        key: "projectName",
        width: 260,
        render: (val, r) => (
          <div>
            <div style={{ color: "#123443", fontWeight: 500, fontSize: 13 }}>{val}</div>
            {r.workPackage && (
              <div style={{ fontSize: 12, color: "#718894" }}>
                Gói thầu: {r.workPackage}
              </div>
            )}
          </div>
        ),
      },
      {
        title: t.issue.mrCode,
        dataIndex: "requisitionNo",
        key: "requisitionNo",
        width: 140,
        render: (val) => val || "---",
      },
      {
        title: t.issue.type,
        dataIndex: "issueType",
        key: "issueType",
        width: 120,
        render: (val) => {
          const typeStr = renderType(val);
          return (
            <span style={{ color: "#334155", fontWeight: 500, fontSize: 13 }}>
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
        render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "---"),
      },
      {
        title: t.table.qty,
        dataIndex: "totalQty",
        key: "totalQty",
        width: 100,
        align: "right",
        render: (val) => (
          <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.amount,
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: 140,
        align: "right",
        render: (val) => (
          <span style={{ fontWeight: 600, color: "#123443", fontSize: 13 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.description,
        dataIndex: "description",
        key: "description",
        width: 250,
        ellipsis: true,
        render: (val) => val || "---",
      },
      {
        title: t.common.actions,
        key: "action",
        width: 90,
        align: "center",
        fixed: "right",
        cannotHide: true,
        render: (_, record) => (
          <Space size={6}>
            <ActionIconButton
              action="edit"
              size="small"
              onClick={() => handleOpenEdit(record)}
            />
            <Popconfirm
              title={t.common.deleteConfirmTitle}
              description={t.common.deleteConfirmDesc}
              okText={t.common.delete}
              cancelText={t.common.cancel}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <ActionIconButton
                action="delete"
                size="small"
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_issue_receipts",
    columns: baseColumns,
    actionColumnKey: "action",
    defaultScrollX: 1350,
  });

  const tabItems = [
    {
      key: "list",
      label: (
        <Space size={6}>
          <IconList size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span>{t.issue.tabList}</span>
        </Space>
      ),
      closable: false,
      children: (
        <div style={{ padding: 24 }}>
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
                <IconUpload size={18} strokeWidth={1.8} style={{ color: "#008f89" }} /> {t.issue.listTitle}
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
                {filteredIssues.length} {t.table.receiptsCount}
              </Tag>
            </div>

            <Space size={8} wrap>
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
                style={{ width: 230, height: 36, borderRadius: 8 }}
                prefix={<IconSearch size={16} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
              />

              <Button
                icon={<IconSearch size={16} strokeWidth={1.8} />}
                onClick={() => {}}
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
                }}
                style={{ height: 36, borderRadius: 8, borderColor: "#dce5e6" }}
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
                  fontWeight: 500,
                  boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                }}
                onClick={handleOpenCreate}
              >
                {t.common.createIssue}
              </Button>
            </Space>
          </div>

          {/* Main Table */}
          <Card
            bodyStyle={{ padding: 0 }}
            bordered={false}
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              borderRadius: 8,
              border: "1px solid #dce5e6",
              overflow: "hidden",
            }}
          >
            <Table
              className="stockin-main-table"
              components={{ header: { cell: ResizableTitle } }}
              rowKey="id"
              size="middle"
              columns={tableColumns}
              dataSource={filteredIssues}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total) => `${t.table.total} ${total} ${t.table.receiptsCount}`,
              }}
              scroll={{ x: scrollX }}
            />
          </Card>
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
                  {editingIssue
                    ? `${editingIssue.issueCode || t.issue.code}`
                    : t.common.createIssue}
                </span>
              </Space>
            ),
            closable: true,
            children: (
              <div style={{ background: "#fff", minHeight: "calc(100vh - 110px)" }}>
                <StockOutEditTab
                  open={isEditTabOpen}
                  onClose={handleCloseEditTab}
                  editingIssue={editingIssue}
                  onSave={handleSaveIssue}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ padding: 0, width: "100%", minHeight: "calc(100vh - 100px)", background: "#FFFFFF", borderRadius: 16, border: "1px solid #dce5e6", overflow: "hidden", boxShadow: "0 1px 3px rgba(18, 52, 67, 0.04)" }}>
      {/* Scoped CSS for stockout table and tabs */}
      <style jsx global>{`
        .stockin-main-table .ant-table-thead > tr > th {
          background: #f7fbfa !important;
          color: #123443 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
        }
        .stockin-main-table .ant-table-tbody > tr > td {
          color: #123443 !important;
          font-size: 13px !important;
          line-height: 18px !important;
          border-color: #dce5e6 !important;
          padding: 10px 12px !important;
          height: 46px !important;
        }
        .stockin-main-table .ant-table-tbody > tr:hover > td {
          background-color: #eef8f6 !important;
        }
        .stockin-main-table .ant-table-container {
          border: 1px solid #dce5e6 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .stockin-main-table .ant-pagination .ant-pagination-item-active {
          border-color: #008f89 !important;
          background-color: #008f89 !important;
        }
        .stockin-main-table .ant-pagination .ant-pagination-item-active a {
          color: #FFFFFF !important;
        }
        .stockout-page-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
          background: #f7fbfa !important;
          border-bottom: 1px solid #dce5e6 !important;
          padding: 6px 16px 0 16px !important;
        }
        .stockout-page-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #008f89 !important;
          font-weight: 600 !important;
        }
        .stockout-page-tabs .ant-tabs-ink-bar {
          background: #008f89 !important;
        }
      `}</style>

      <Tabs
        className="stockout-page-tabs"
        type="editable-card"
        hideAdd
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        onEdit={(targetKey, action) => {
          if (action === "remove" && targetKey === "edit") {
            handleCloseEditTab();
          }
        }}
        items={tabItems}
        tabBarStyle={{
          margin: 0,
          background: "#f7fbfa",
          padding: "6px 16px 0 16px",
          borderBottom: "1px solid #dce5e6",
        }}
      />
    </div>
  );
}
