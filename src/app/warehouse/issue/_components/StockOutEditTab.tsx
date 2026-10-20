"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Table,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  Tag,
  Popconfirm,
  message,
  Modal,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  EditOutlined,
  ReloadOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  StockOutIssue,
  StockItemDetail,
  MOCK_WAREHOUSES,
} from "../../types";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import StockOutItemModal from "./StockOutItemModal";
import { useTranslation } from "@/locales/LanguageContext";

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
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = Boolean(editingIssue);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách vật tư chi tiết của phiếu xuất
  const [items, setItems] = useState<StockItemDetail[]>([]);

  // State Modal thêm/sửa dòng vật tư
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItemDetail | null>(null);

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
          <span style={{ color: "#64748B", fontSize: 12 }}>{index + 1}</span>
        ),
      },
      {
        title: t.table.itemCode,
        dataIndex: "itemCode",
        key: "itemCode",
        width: 105,
        render: (val) => (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 600,
              color: "#7C3AED",
            }}
          >
            {val}
          </span>
        ),
      },
      {
        title: t.table.itemName,
        dataIndex: "itemName",
        key: "itemName",
        width: 220,
        render: (val) => (
          <span style={{ fontWeight: 500, color: "#0F172A", fontSize: 12 }}>{val}</span>
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
          <span style={{ color: "#64748B", fontSize: 12 }}>
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
          <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 12 }}>
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
          <span style={{ color: "#0F172A", fontSize: 12, fontWeight: 500 }}>
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
          <span style={{ color: "#64748B", fontSize: 12 }}>{val || "---"}</span>
        ),
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
                icon={<EditOutlined style={{ color: "#7C3AED" }} />}
                style={{ borderColor: "#DDD6FE", borderRadius: 6 }}
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
    <div style={{ padding: 24 }}>
      {/* 1. TOP ACTION BAR */}
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
              color: "#7C3AED",
              fontWeight: 700,
              lineHeight: "28px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ExportOutlined style={{ color: "#7C3AED" }} />
            {isEditing
              ? `${editingIssue?.issueCode || t.issue.code}`
              : t.common.createIssue}
          </Text>
          {isEditing && (
            <Tag
              style={{
                background: "#EDE9FE",
                color: "#7C3AED",
                borderRadius: 12,
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                lineHeight: "16px",
                padding: "2px 8px",
                margin: 0,
              }}
            >
              {editingIssue?.status === "COMPLETED"
                ? t.status.completed
                : editingIssue?.status === "PENDING"
                ? t.status.pending
                : t.status.draft}
            </Tag>
          )}
        </div>

        <Space size={8}>
          <Button
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ height: 32, borderRadius: 6, borderColor: "#E2E8F0", fontSize: 13 }}
          >
            {t.common.close}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            style={{
              background: "#7C3AED",
              borderColor: "#7C3AED",
              height: 32,
              borderRadius: 6,
              fontWeight: 500,
              fontSize: 13,
              boxShadow: "0 2px 4px rgba(124, 58, 237, 0.2)",
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
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 6,
              padding: "8px 12px",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Hàng 1: 4 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Loại xuất kho */}
              <Col span={6} style={{ paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Loại xuất kho <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="issueType"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn loại xuất kho!" }]}
                >
                  <Select
                    variant="borderless"
                    style={{
                      padding: 0,
                      width: "100%",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#0F172A",
                    }}
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
              <Col span={5} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Mã YC Vật tư (MR)
                </div>
                <Form.Item name="requisitionNo" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Mã số yêu cầu..."
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "18px",
                      color: "#0F172A",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Dự án / Đơn vị nhận */}
              <Col span={7} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Dự án / Đơn vị nhận <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="projectName"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng nhập tên dự án / đơn vị nhận!" }]}
                >
                  <Input
                    variant="borderless"
                    placeholder="Tên công trình / dự án..."
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "18px",
                      color: "#0F172A",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Gói thầu / Hạng mục */}
              <Col span={6} style={{ paddingLeft: 10 }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Gói thầu / Hạng mục
                </div>
                <Form.Item name="workPackage" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Gói thầu thi công..."
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "18px",
                      color: "#0F172A",
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Đường phân cách giữa 2 hàng */}
            <div style={{ height: 1, background: "#E2E8F0", margin: "6px 0" }} />

            {/* Hàng 2: 5 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Kho xuất */}
              <Col span={6} style={{ paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Kho lưu trữ xuất <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="warehouseId"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn kho xuất!" }]}
                >
                  <Select
                    variant="borderless"
                    style={{
                      padding: 0,
                      width: "100%",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#0F172A",
                    }}
                    options={warehouseOptions}
                  />
                </Form.Item>
              </Col>

              {/* Cột 2: Ngày xuất */}
              <Col span={4} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Ngày xuất kho <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="issueDate"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn ngày xuất!" }]}
                >
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    style={{
                      padding: 0,
                      width: "100%",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#0F172A",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Mã phiếu xuất */}
              <Col span={4} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Mã phiếu xuất <span style={{ color: "#ff4d4f" }}>*</span>
                </div>
                <Form.Item
                  name="issueCode"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng nhập mã phiếu!" }]}
                >
                  <Input
                    variant="borderless"
                    placeholder="Mã phiếu..."
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "18px",
                      color: "#0F172A",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Người nhận */}
              <Col span={4} style={{ paddingLeft: 10, paddingRight: 10, borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Người nhận hàng
                </div>
                <Form.Item name="receiver" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Họ tên người nhận..."
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "18px",
                      color: "#0F172A",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 5: Diễn giải */}
              <Col span={6} style={{ paddingLeft: 10 }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2, fontWeight: 500, lineHeight: "14px" }}>
                  Diễn giải xuất kho
                </div>
                <Form.Item name="description" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Ghi chú nội dung xuất..."
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: "18px",
                      color: "#0F172A",
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </div>

      {/* 3. SECTION II: DANH MỤC VẬT TƯ XUẤT KHO */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 13, color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>
              {t.section.detailListIssue}
            </Text>
            <Tag
              style={{
                background: "#EDE9FE",
                color: "#7C3AED",
                borderRadius: 12,
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                padding: "1px 8px",
                margin: 0,
              }}
            >
              {items.length} {t.table.itemsCount}
            </Tag>
          </div>

          <Space size={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenItemModal()}
              style={{
                background: "#7C3AED",
                borderColor: "#7C3AED",
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              {t.common.addNew}
            </Button>
          </Space>
        </div>

        {/* Bảng chi tiết vật tư */}
        <Table
          className="stockin-main-table"
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
                <Table.Summary.Row style={{ background: "#F8FAFC", fontWeight: 600 }}>
                  <Table.Summary.Cell index={0} colSpan={6} align="right">
                    <span style={{ color: "#0F172A" }}>{t.table.total}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <span style={{ color: "#7C3AED", fontSize: 14 }}>
                      {totalQty.toLocaleString("vi-VN")}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    <span>---</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="right">
                    <span style={{ color: "#0F172A", fontSize: 14 }}>
                      {totalAmount.toLocaleString("vi-VN")}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} colSpan={3} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </div>

      {/* 4. MODAL THÊM / SỬA VẬT TƯ */}
      <StockOutItemModal
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSaveItem}
      />
    </div>
  );
}
