"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  Table,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  Tag,
  Popconfirm,
  message,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { IconDeviceFloppy } from "@tabler/icons-react";
import dayjs from "dayjs";
import {
  StockOutIssue,
  StockItemDetail,
  MOCK_WAREHOUSES,
} from "../../types";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import ErpDetailCard from "@/components/common/ErpDetailCard";
import StockOutItemModal from "./StockOutItemModal";
import { useTranslation } from "@/locales/LanguageContext";
import InventoryWorkflowDrawer from "../../receipt/_components/InventoryWorkflowDrawer";
import { renderApprovalBadge } from "@/components/common/ApprovalBadge";

const { Text } = Typography;

interface StockOutEditTabProps {
  open: boolean;
  onClose: () => void;
  editingIssue: StockOutIssue | null;
  onSave: (data: StockOutIssue) => void | Promise<void>;
}

export default function StockOutEditTab({
  open,
  onClose,
  editingIssue,
  onSave,
}: StockOutEditTabProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = Boolean(editingIssue);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách vật tư chi tiết của phiếu xuất
  const [items, setItems] = useState<StockItemDetail[]>([]);

  // State Modal thêm/sửa dòng vật tư
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItemDetail | null>(null);

  // State Drawer xem quy trình duyệt
  const [selectedWorkflowItem, setSelectedWorkflowItem] = useState<StockItemDetail | null>(null);

  // Khởi tạo form khi mở phiếu
  useEffect(() => {
    if (editingIssue) {
      form.setFieldsValue({
        issueCode: editingIssue.issueCode,
        issueDate: editingIssue.issueDate ? dayjs(editingIssue.issueDate) : dayjs(),
        issueType: editingIssue.issueType || "CONSTRUCTION",
        projectName: editingIssue.projectName || "",
        workPackage: editingIssue.workPackage || "",
        contractorName: editingIssue.contractorName || "",
        warehouseId: editingIssue.warehouseId || MOCK_WAREHOUSES[0].id,
        requisitionNo: editingIssue.requisitionNo || "",
        receiver: editingIssue.receiver || "",
        issuer: editingIssue.issuer || "Nguyễn Văn Thao (Thủ kho)",
        description: editingIssue.description || "",
        status: editingIssue.status || "DRAFT",
      });
      setItems(editingIssue.items ? [...editingIssue.items] : []);
    } else {
      const now = dayjs();
      form.setFieldsValue({
        issueCode: `PXK-${now.format("YYYY-MM")}/${String(Math.floor(Math.random() * 900) + 100)}`,
        issueDate: now,
        issueType: "CONSTRUCTION",
        projectName: "",
        workPackage: "",
        contractorName: "",
        warehouseId: MOCK_WAREHOUSES[0].id,
        requisitionNo: "",
        receiver: "",
        issuer: "Nguyễn Văn Thao (Thủ kho)",
        description: "",
        status: "DRAFT",
      });
      setItems([]);
    }
  }, [editingIssue, form]);

  // Danh sách kho xuất
  const warehouseOptions = useMemo(() => {
    return MOCK_WAREHOUSES.map((w) => ({
      value: w.id,
      label: `${w.code} - ${w.name}`,
    }));
  }, []);

  // Tổng hợp số lượng & thành tiền
  const totalQty = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.actualQty) || 0), 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
  }, [items]);

  // Thêm hoặc sửa 1 dòng vật tư
  const handleOpenItemModal = (item?: StockItemDetail) => {
    setEditingItem(item || null);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (item: StockItemDetail) => {
    if (editingItem) {
      setItems((prev) => prev.map((it) => (it.id === editingItem.id ? item : it)));
      message.success("Đã cập nhật dòng vật tư!");
    } else {
      setItems((prev) => [...prev, item]);
      message.success("Đã thêm vật tư xuất kho!");
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    message.success("Đã xóa dòng vật tư!");
  };

  // Submit toàn bộ phiếu xuất
  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      message.error("Phiếu xuất phải có ít nhất 1 dòng vật tư!");
      return;
    }

    setSubmitting(true);
    try {
      const selectedWh = MOCK_WAREHOUSES.find((w) => w.id === values.warehouseId);
      const payload: StockOutIssue = {
        id: editingIssue?.id || `iss_${Date.now()}`,
        issueCode: values.issueCode,
        issueDate: values.issueDate ? values.issueDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        issueType: values.issueType,
        projectName: values.projectName || "",
        workPackage: values.workPackage || "",
        contractorName: values.contractorName || "",
        warehouseId: values.warehouseId,
        warehouseName: selectedWh ? selectedWh.name : (editingIssue?.warehouseName || ""),
        requisitionNo: values.requisitionNo || "",
        receiver: values.receiver || "",
        issuer: values.issuer || "Nguyễn Văn Thao (Thủ kho)",
        description: values.description || "",
        status: values.status || (editingIssue?.status || "DRAFT"),
        totalQty,
        totalAmount,
        items,
        createdBy: editingIssue?.createdBy || "quanghn",
        createdDate: editingIssue?.createdDate || dayjs().format("YYYY-MM-DD HH:mm"),
      };

      await onSave(payload);
    } catch (e: any) {
      console.error("Lỗi lưu phiếu xuất kho:", e);
      message.error(e?.message || "Lưu phiếu xuất kho thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình cột bảng chi tiết vật tư
  const baseItemColumns: (ColumnType<StockItemDetail> & { cannotHide?: boolean })[] = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 42,
        align: "center",
        cannotHide: true,
        render: (_, __, index) => (
          <span style={{ color: "#718894", fontSize: 12 }}>{index + 1}</span>
        ),
      },
      {
        title: "OrgCode",
        dataIndex: "orgCode",
        key: "orgCode",
        width: 100,
        render: (val, r) => {
          const code = val || r.Orgcode || r.orgCode || "";
          if (!code) return <span style={{ color: "#94A3B8", fontSize: 12.5 }}>---</span>;
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "#1e293b",
                fontSize: 12.5,
              }}
            >
              {code}
            </span>
          );
        },
      },
      {
        title: "OrgName",
        dataIndex: "orgName",
        key: "orgName",
        width: 160,
        render: (val, r) => {
          const name = val || r.OrgName || r.orgName || "";
          if (!name) return <span style={{ color: "#94A3B8", fontSize: 12.5 }}>---</span>;
          return (
            <span style={{ color: "#123443", fontSize: 12.5 }} title={name}>
              {name}
            </span>
          );
        },
      },
      {
        title: t.table.itemCode,
        dataIndex: "itemCode",
        key: "itemCode",
        width: 105,
        render: (val) => (
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 12.5,
              color: val ? "#1e293b" : "#94A3B8",
            }}
          >
            {val || "---"}
          </span>
        ),
      },
      {
        title: t.table.itemName,
        dataIndex: "itemName",
        key: "itemName",
        width: 220,
        render: (val) => (
          <span style={{ fontWeight: 500, color: "#123443", fontSize: 12 }}>{val}</span>
        ),
      },
      {
        title: t.table.unit,
        dataIndex: "unit",
        key: "unit",
        width: 55,
        align: "center",
        render: (val) => (
          <span style={{ color: "#475569", fontSize: 12 }}>{val}</span>
        ),
      },
      {
        title: t.table.stockQty,
        dataIndex: "stockQty",
        key: "stockQty",
        width: 75,
        align: "right",
        render: (val) => (
          <span style={{ color: "#718894", fontSize: 12 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.reqQty,
        dataIndex: "orderQty",
        key: "orderQty",
        width: 80,
        align: "right",
        render: (val) => (
          <span style={{ color: "#334155", fontSize: 12 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.actualQty,
        dataIndex: "actualQty",
        key: "actualQty",
        width: 85,
        align: "right",
        render: (val) => (
          <span style={{ fontWeight: 600, color: "#123443", fontSize: 12 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.unitPrice,
        dataIndex: "unitPrice",
        key: "unitPrice",
        width: 95,
        align: "right",
        render: (val) => (
          <span style={{ color: "#334155", fontSize: 12 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.amount,
        dataIndex: "totalPrice",
        key: "totalPrice",
        width: 105,
        align: "right",
        render: (val) => (
          <span style={{ color: "#123443", fontSize: 12, fontWeight: 500 }}>
            {Number(val || 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: "Vị trí kho",
        dataIndex: "binLocation",
        key: "binLocation",
        width: 95,
        render: (val) => (
          <span style={{ color: "#475569", fontSize: 12 }}>{val || "---"}</span>
        ),
      },
      {
        title: t.table.remarks,
        dataIndex: "note",
        key: "note",
        width: 130,
        ellipsis: true,
        render: (val) => (
          <span style={{ color: "#718894", fontSize: 12 }}>{val || "---"}</span>
        ),
      },
      {
        title: t.table.status,
        dataIndex: "StatusCode",
        key: "StatusCode",
        width: 95,
        align: "center",
        render: (val, record) => {
          const subId = record.SubmissionId ?? record.LocalId;
          const statusVal = val || record.status || "---";
          return (
            <Tooltip title={subId ? `Nhấp để xem quy trình duyệt (Mã #${subId})` : "Chưa có quy trình duyệt"}>
              <span
                onClick={() => {
                  if (subId) setSelectedWorkflowItem(record);
                }}
                style={{
                  cursor: subId ? "pointer" : "default",
                  display: "inline-block",
                }}
              >
                {renderApprovalBadge(statusVal, record, language)}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: t.common.actions,
        key: "action",
        width: 70,
        align: "center",
        fixed: "right",
        cannotHide: true,
        render: (_, record) => (
          <Space size={6}>
            <Tooltip title={t.common.edit}>
              <Button
                type="default"
                size="small"
                icon={<EditOutlined style={{ color: "#008f89" }} />}
                style={{ borderColor: "#b2ded9", borderRadius: 6 }}
                onClick={() => handleOpenItemModal(record)}
              />
            </Tooltip>
            <Popconfirm
              title={t.common.deleteConfirmTitle}
              description={t.common.deleteConfirmDesc}
              okText={t.common.delete}
              cancelText={t.common.cancel}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteItem(record.id)}
            >
              <Tooltip title={t.common.delete}>
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined style={{ color: "#EF4444" }} />}
                  style={{ borderColor: "#FECACA", borderRadius: 6 }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_issue_edit_items_v2",
    columns: baseItemColumns,
    actionColumnKey: "action",
    defaultScrollX: 950,
  });

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "16px 24px",
        minHeight: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* 1. HEADER SECTION I: TIÊU ĐỀ + NÚT ĐÓNG & CẬP NHẬT */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
          paddingBottom: 6,
          borderBottom: "1px solid #dce5e6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text strong style={{ fontSize: 13, color: "#008f89", fontWeight: 700, textTransform: "uppercase" }}>
            {t.section.generalInfoIssue}
          </Text>
        </div>

        <Space size={8}>
          <Button
            onClick={onClose}
            style={{ height: 32, borderRadius: 6, borderColor: "#dce5e6", fontSize: 13 }}
          >
            {t.common.close}
          </Button>
          <Button
            type="primary"
            icon={<IconDeviceFloppy size={16} strokeWidth={2} />}
            loading={submitting}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 32,
              borderRadius: 6,
              fontWeight: 500,
              fontSize: 13,
              boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
            }}
            onClick={() => form.submit()}
          >
            {isEditing ? t.common.update : t.common.save}
          </Button>
        </Space>
      </div>

      {/* 2. FORM SECTION I: THÔNG TIN CHUNG PHIẾU XUẤT (COMPACT) */}
      <div style={{ width: "100%", marginBottom: 12 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="erp-general-info-card">
            {/* Hàng 1: 4 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Loại xuất kho */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  Loại xuất kho <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="issueType"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn loại xuất kho!" }]}
                >
                  <Select
                    variant="borderless"
                    options={[
                      { value: "CONSTRUCTION", label: "Xuất thi công công trình" },
                      { value: "TRANSFER", label: "Điều chuyển nội bộ kho" },
                      { value: "RETURN_VENDOR", label: "Xuất trả nhà cung cấp" },
                      { value: "DISPOSAL", label: "Xuất thanh lý / hủy bỏ" },
                    ]}
                  />
                </Form.Item>
              </Col>

              {/* Cột 2: Mã yêu cầu MR */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  Mã YC Vật tư (MR)
                </span>
                <Form.Item name="requisitionNo" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Mã số yêu cầu..."
                    style={{ fontFamily: "monospace" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Dự án / Đơn vị nhận */}
              <Col span={7} className="erp-info-cell">
                <span className="erp-info-label">
                  Dự án / Đơn vị nhận <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="projectName"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng nhập tên dự án / đơn vị nhận!" }]}
                >
                  <Input
                    variant="borderless"
                    placeholder="Tên công trình / dự án..."
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Gói thầu / Hạng mục */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  Gói thầu / Hạng mục
                </span>
                <Form.Item name="workPackage" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Gói thầu thi công..."
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="erp-info-divider" />

            {/* Hàng 2: 6 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Kho xuất */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  Kho lưu trữ xuất <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="warehouseId"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn kho xuất!" }]}
                >
                  <Select
                    variant="borderless"
                    options={warehouseOptions}
                  />
                </Form.Item>
              </Col>

              {/* Cột 2: Ngày xuất */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  Ngày xuất kho <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="issueDate"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn ngày xuất!" }]}
                >
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Mã phiếu xuất */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  Mã phiếu xuất <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="issueCode"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng nhập mã phiếu!" }]}
                >
                  <Input
                    variant="borderless"
                    placeholder="Mã phiếu..."
                    style={{ fontFamily: "monospace" }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Người nhận */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  Người nhận hàng
                </span>
                <Form.Item name="receiver" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Họ tên người nhận..."
                  />
                </Form.Item>
              </Col>

              {/* Cột 5: Diễn giải */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  Diễn giải xuất kho
                </span>
                <Form.Item name="description" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Ghi chú nội dung xuất..."
                  />
                </Form.Item>
              </Col>

              {/* Cột 6: Trạng thái phiếu */}
              <Col span={3} className="erp-info-cell" style={{ borderRight: "none" }}>
                <span className="erp-info-label">{t.table.status}</span>
                <div style={{ display: "flex", alignItems: "center", height: 24, paddingLeft: 11 }}>
                  <Tag
                    color={
                      editingIssue?.status === "COMPLETED"
                        ? "success"
                        : editingIssue?.status === "PENDING"
                        ? "warning"
                        : "default"
                    }
                    style={{
                      margin: 0,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: "18px",
                      padding: "0 6px",
                    }}
                  >
                    {editingIssue?.status === "COMPLETED"
                      ? t.status.completed
                      : editingIssue?.status === "PENDING"
                      ? t.status.pending
                      : t.status.draft}
                  </Tag>
                </div>
              </Col>
            </Row>
          </div>
        </Form>
      </div>

      {/* 3. SECTION II: DANH MỤC VẬT TƯ XUẤT KHO */}
      <ErpDetailCard
        title={t.section.detailListIssue}
          actions={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenItemModal()}
              style={{
                background: "#008f89",
                borderColor: "#008f89",
                borderRadius: 6,
                fontWeight: 500,
                height: 32,
                fontSize: 13,
                boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
              }}
            >
              {t.common.addNew}
            </Button>
          }
        >
          <Table
            className="erp-detail-table"
            components={{ header: { cell: ResizableTitle } }}
            rowKey="id"
            size="middle"
            columns={tableColumns}
            dataSource={items}
            pagination={false}
            scroll={{ x: scrollX }}
            summary={() => {
              return (
                <Table.Summary fixed="bottom">
                  <Table.Summary.Row style={{ background: "#f7fbfa", fontWeight: 600 }}>
                    {tableColumns.map((col: any, idx: number) => {
                      const key = String(col.key || col.dataIndex || idx);
                      if (key === "orderQty") {
                        return (
                          <Table.Summary.Cell key={key} index={idx} align="right">
                            <span style={{ color: "#123443" }}>{t.table.total}</span>
                          </Table.Summary.Cell>
                        );
                      }
                      if (key === "actualQty") {
                        return (
                          <Table.Summary.Cell key={key} index={idx} align="right">
                            <span style={{ color: "#008f89", fontSize: 14 }}>
                              {totalQty.toLocaleString("vi-VN")}
                            </span>
                          </Table.Summary.Cell>
                        );
                      }
                      if (key === "unitPrice") {
                        return (
                          <Table.Summary.Cell key={key} index={idx} align="right">
                            <span>---</span>
                          </Table.Summary.Cell>
                        );
                      }
                      if (key === "totalPrice") {
                        return (
                          <Table.Summary.Cell key={key} index={idx} align="right">
                            <span style={{ color: "#123443", fontSize: 14 }}>
                              {totalAmount.toLocaleString("vi-VN")}
                            </span>
                          </Table.Summary.Cell>
                        );
                      }
                      return <Table.Summary.Cell key={key} index={idx} />;
                    })}
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </ErpDetailCard>

      {/* 4. MODAL THÊM / SỬA VẬT TƯ */}
      <StockOutItemModal
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSaveItem}
      />

      {/* 5. DRAWER QUY TRÌNH PHÊ DUYỆT */}
      <InventoryWorkflowDrawer
        open={Boolean(selectedWorkflowItem)}
        onClose={() => setSelectedWorkflowItem(null)}
        itemDetail={selectedWorkflowItem}
        displayMode="Issue"
      />
    </div>
  );
}
