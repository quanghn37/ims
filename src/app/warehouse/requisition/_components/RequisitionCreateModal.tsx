"use client";

import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Row,
  Col,
  InputNumber,
  Card,
  Popconfirm,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";
import {
  MaterialRequisition,
  MaterialRequisitionItem,
  MOCK_WAREHOUSES,
  MOCK_MATERIALS_CATALOG,
} from "../../types";

export interface RequisitionCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (newReq: MaterialRequisition) => void;
}

export default function RequisitionCreateModal({
  open,
  onClose,
  onSave,
}: RequisitionCreateModalProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const [items, setItems] = useState<MaterialRequisitionItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      const code = `MR-${dayjs().format("YYYY-MM")}/${String(Math.floor(Math.random() * 900) + 100)}`;
      form.setFieldsValue({
        requisitionCode: code,
        requisitionDate: dayjs(),
        expectedDate: dayjs().add(2, "day"),
        priority: "NORMAL",
        warehouseId: "WH01",
        projectName: "Dự án Vinhomes Grand Park",
        workPackage: "Tòa S10.03",
        contractorName: "Đội thi công số 1",
        requesterName: "Kỹ sư giám sát",
        description: "",
      });
      setItems([
        {
          id: `req_it_${Date.now()}_1`,
          itemCode: MOCK_MATERIALS_CATALOG[0].itemCode,
          itemName: MOCK_MATERIALS_CATALOG[0].itemName,
          unit: MOCK_MATERIALS_CATALOG[0].unit,
          availableQty: MOCK_MATERIALS_CATALOG[0].stockQty,
          requestedQty: 100,
          workLocation: "Tầng 3",
          note: "",
        },
      ]);
    }
  }, [open, form]);

  const handleAddItem = () => {
    const mat = MOCK_MATERIALS_CATALOG[items.length % MOCK_MATERIALS_CATALOG.length];
    const newItem: MaterialRequisitionItem = {
      id: `req_it_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      itemCode: mat.itemCode,
      itemName: mat.itemName,
      unit: mat.unit,
      availableQty: mat.stockQty,
      requestedQty: 50,
      workLocation: language === "en" ? "Site" : "Công trường",
      note: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof MaterialRequisitionItem, val: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i))
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning(language === "en" ? "Please add at least one requested item!" : "Vui lòng thêm ít nhất một mặt hàng yêu cầu!");
        return;
      }
      setSubmitting(true);

      const targetWh = MOCK_WAREHOUSES.find((w) => w.id === values.warehouseId);
      const totalRequestedQty = items.reduce((sum, i) => sum + Number(i.requestedQty || 0), 0);

      const newRequisition: MaterialRequisition = {
        id: `req_${Date.now()}`,
        requisitionCode: values.requisitionCode,
        requisitionDate: values.requisitionDate.format("YYYY-MM-DD"),
        expectedDate: values.expectedDate.format("YYYY-MM-DD"),
        priority: values.priority,
        projectName: values.projectName || "",
        workPackage: values.workPackage || "",
        contractorName: values.contractorName || "",
        requesterName: values.requesterName || "",
        warehouseId: values.warehouseId,
        warehouseName: targetWh?.name || (language === "en" ? "Default Warehouse" : "Kho mặc định"),
        status: "PENDING",
        description: values.description || "",
        totalRequestedQty,
        totalApprovedQty: 0,
        itemCount: items.length,
        items,
        createdBy: "Admin",
        createdDate: dayjs().format("YYYY-MM-DD HH:mm"),
      };

      onSave(newRequisition);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<MaterialRequisitionItem> = [
    {
      title: "STT",
      key: "stt",
      width: 50,
      align: "center",
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: language === "en" ? "Item Code" : "Mã VT",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 130,
      render: (val: string) => (
        <span style={{ fontWeight: 600, color: "#008f89", fontFamily: "monospace" }}>{val}</span>
      ),
    },
    {
      title: t.lov.colItemName,
      dataIndex: "itemName",
      key: "itemName",
      width: 250,
      render: (val: string, record) => (
        <Select
          style={{ width: "100%" }}
          value={val}
          onChange={(newVal) => {
            const selected = MOCK_MATERIALS_CATALOG.find((m) => m.itemName === newVal);
            if (selected) {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === record.id
                    ? {
                        ...i,
                        itemCode: selected.itemCode,
                        itemName: selected.itemName,
                        unit: selected.unit,
                        availableQty: selected.stockQty,
                      }
                    : i
                )
              );
            }
          }}
          options={MOCK_MATERIALS_CATALOG.map((m) => ({
            value: m.itemName,
            label: `${m.itemCode} - ${m.itemName}`,
          }))}
        />
      ),
    },
    {
      title: t.lov.colUnit,
      dataIndex: "unit",
      key: "unit",
      width: 70,
      align: "center",
      render: (val: string) => val || (language === "en" ? "Pcs" : "Cái"),
    },
    {
      title: language === "en" ? "Available Stock" : "Tồn khả dụng",
      dataIndex: "availableQty",
      key: "availableQty",
      width: 100,
      align: "right",
      render: (val: number) => (
        <span style={{ color: "#10B981" }}>{Number(val || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")}</span>
      ),
    },
    {
      title: language === "en" ? "Req Qty" : "SL Yêu cầu",
      dataIndex: "requestedQty",
      key: "requestedQty",
      width: 110,
      align: "right",
      render: (val: number, record) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(v) => handleItemChange(record.id, "requestedQty", v || 0)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: language === "en" ? "Work Area / Location" : "Vị trí thi công",
      dataIndex: "workLocation",
      key: "workLocation",
      width: 130,
      render: (val: string, record) => (
        <Input
          value={val}
          onChange={(e) => handleItemChange(record.id, "workLocation", e.target.value)}
          placeholder={language === "en" ? "e.g. Floor 3" : "vd: Tầng 3"}
        />
      ),
    },
    {
      title: t.common.actions,
      key: "action",
      width: 60,
      align: "center",
      render: (_: any, record) => (
        <Popconfirm
          title={language === "en" ? "Delete this item?" : "Xóa dòng này?"}
          onConfirm={() => handleRemoveItem(record.id)}
          okText={t.common.delete}
          cancelText={t.common.cancel}
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={
        <span style={{ fontWeight: 600, color: "#008f89", fontSize: 16 }}>
          {language === "en" ? "Create Material Requisition" : "Lập Phiếu Yêu Cầu Xuất Vật Tư (Material Requisition)"}
        </span>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={language === "en" ? "Submit Requisition" : "Lập & Gửi duyệt"}
      cancelText={t.common.cancel}
      okButtonProps={{
        style: { background: "#008f89", borderColor: "#008f89", borderRadius: 6 },
      }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Card size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="requisitionCode" label={language === "en" ? "Requisition Code" : "Mã yêu cầu"} rules={[{ required: true }]}>
                <Input placeholder={language === "en" ? "Requisition code..." : "Mã phiếu..."} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="requisitionDate" label={language === "en" ? "Created Date" : "Ngày lập"} rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="expectedDate" label={language === "en" ? "Required Date" : "Ngày cần vật tư"} rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="priority" label={language === "en" ? "Priority" : "Mức ưu tiên"} rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "NORMAL", label: language === "en" ? "Normal" : "Bình thường" },
                    { value: "HIGH", label: language === "en" ? "High Priority" : "Ưu tiên cao" },
                    { value: "URGENT", label: language === "en" ? "Urgent" : "Khẩn cấp" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="warehouseId" label={language === "en" ? "Issuing Warehouse" : "Kho cấp vật tư"} rules={[{ required: true }]}>
                <Select
                  options={MOCK_WAREHOUSES.map((w) => ({
                    value: w.id,
                    label: w.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="projectName" label={language === "en" ? "Project / Site" : "Dự án / Công trình"} rules={[{ required: true }]}>
                <Input placeholder={language === "en" ? "Project name..." : "Tên dự án..."} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="workPackage" label={language === "en" ? "Package / Section" : "Gói thầu / Hạng mục"}>
                <Input placeholder={language === "en" ? "e.g. Tower S10.03..." : "vd: Tòa S10.03..."} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="contractorName" label={language === "en" ? "Contractor / Team" : "Đơn vị / Đội thi công"}>
                <Input placeholder={language === "en" ? "Receiving team..." : "Tên đội nhận..."} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="requesterName" label={language === "en" ? "Requester" : "Kỹ sư lập phiếu"} rules={[{ required: true }]}>
                <Input placeholder={language === "en" ? "Full name..." : "Họ tên kỹ sư..."} />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item name="description" label={language === "en" ? "Description / Purpose" : "Diễn giải / Mục đích sử dụng"}>
                <Input placeholder={language === "en" ? "Describe material usage purpose..." : "Mô tả mục đích sử dụng vật tư..."} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          size="small"
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>
                {language === "en"
                  ? `Material Items (${items.length} items)`
                  : `Chi tiết danh mục vật tư cần xuất (${items.length} mặt hàng)`}
              </span>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{ color: "#008f89", borderColor: "#b2ded9" }}
              >
                {language === "en" ? "Add Item" : "Thêm vật tư"}
              </Button>
            </div>
          }
          style={{ borderRadius: 8 }}
        >
          <Table
            size="small"
            bordered
            rowKey="id"
            columns={columns}
            dataSource={items}
            pagination={false}
          />
        </Card>
      </Form>
    </Modal>
  );
}
