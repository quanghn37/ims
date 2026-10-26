"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  Table,
  Divider,
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
  IconDeviceFloppy,
  IconRefresh,
  IconScale,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import dayjs from "dayjs";
import {
  StockInReceipt,
  StockItemDetail,
  MOCK_WAREHOUSES,
} from "../../types";
import { warehouseApi } from "../../api";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import ErpDetailCard from "@/components/common/ErpDetailCard";
import { renderApprovalBadge } from "@/components/common/ApprovalBadge";
import StockInReconcileModal from "./StockInReconcileModal";
import StockInItemEditDrawer from "./StockInItemEditDrawer";
import { extractApiList } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface StockInEditTabProps {
  open: boolean;
  onClose: () => void;
  editingReceipt: StockInReceipt | null;
  onSave: (data: StockInReceipt) => void | Promise<void>;
  onFetchWorkflow?: (item: StockItemDetail) => void;
  items: StockItemDetail[];
  setItems: React.Dispatch<React.SetStateAction<StockItemDetail[]>>;
  loadingItems: boolean;
  onRefreshItems?: () => void;
}

export default function StockInEditTab({
  open,
  onClose,
  editingReceipt,
  onSave,
  onFetchWorkflow,
  items,
  setItems,
  loadingItems,
  onRefreshItems,
}: StockInEditTabProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = Boolean(editingReceipt);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Modal Đối chiếu đơn hàng PO ---
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  // --- Drawer Chỉnh sửa dòng vật tư nhập kho ---
  const [editingItem, setEditingItem] = useState<StockItemDetail | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Kiểm tra nếu phiếu nhập đã có danh mục chi tiết vật tư (details)
  const hasDetails = Boolean(
    (items && items.length > 0) ||
    (editingReceipt?.items && editingReceipt.items.length > 0) ||
    (isEditing && loadingItems)
  );

  // Nếu phiếu nhập đã có chi tiết thì xám thông tin header
  const isHeaderDisabled = Boolean(
    (items && items.length > 0) ||
    (editingReceipt?.items && editingReceipt.items.length > 0)
  );

  const warehouseOptions = useMemo(() => {
    const list = MOCK_WAREHOUSES.map((w) => ({
      value: w.id,
      label: `${w.code} - ${w.name}`,
    }));
    if (
      editingReceipt?.WarehouseId &&
      !list.some((o) => String(o.value) === String(editingReceipt.WarehouseId))
    ) {
      list.unshift({
        value: editingReceipt.WarehouseId as any,
        label: editingReceipt.WarehouseName || `Kho #${editingReceipt.WarehouseId}`,
      });
    }
    return list;
  }, [editingReceipt]);

  useEffect(() => {
    if (open) {
      if (editingReceipt) {
        const rDate = editingReceipt.receiptDate || editingReceipt.DocDate;
        form.setFieldsValue({
          receiptCode: editingReceipt.receiptCode || editingReceipt.DocCode,
          receiptDate: rDate ? dayjs(rDate) : dayjs(),
          receiptType:
            editingReceipt.receiptType ||
            (editingReceipt.SubType === "Purchase" ? "PO" : editingReceipt.SubType || "PO"),
          poCode: editingReceipt.poCode || editingReceipt.ReferenceNo,
          vendorName:
            editingReceipt.VenName ||
            editingReceipt.venname ||
            editingReceipt.vendorName,
          contractCode: editingReceipt.ContractCode || editingReceipt.contractCode,
          warehouseId: editingReceipt.warehouseId || editingReceipt.WarehouseId,
          invoiceNo: editingReceipt.invoiceNo,
          deliverer: editingReceipt.deliverer,
          receiver: editingReceipt.receiver,
          description: editingReceipt.description || editingReceipt.Description,
          status: editingReceipt.StatusName || editingReceipt.StatusCode || editingReceipt.status || "Chưa nhập kho",
        });
      } else {
        form.resetFields();
        const autoCode = `PNK-${dayjs().format("YYYY-MM")}/${String(Math.floor(Math.random() * 900) + 100)}`;
        form.setFieldsValue({
          receiptCode: autoCode,
          receiptDate: dayjs(),
          receiptType: "PO",
          warehouseId: "WH01",
          status: "Chưa nhập kho",
          receiver: "r@gmail.com",
        });
      }
    }
  }, [open, editingReceipt, form]);

  const handleOpenEditItem = (record: StockItemDetail) => {
    setEditingItem(record);
    if (!budgetList || budgetList.length === 0) {
      fetchApprovedBudgetList();
    }
    setIsItemModalOpen(true);
  };

  const handleOptimisticUpdateItem = (itemId: string, updatedFields: Partial<StockItemDetail>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, ...updatedFields } : it))
    );
  };

  const handleDeleteItem = async (record: StockItemDetail) => {
    const rawSubId =
      record.SubmissionId !== undefined && record.SubmissionId !== null
        ? record.SubmissionId
        : record.LocalId !== undefined && record.LocalId !== null
        ? record.LocalId
        : !isNaN(Number(record.id))
        ? Number(record.id)
        : null;

    if (rawSubId) {
      const subId = !isNaN(Number(rawSubId)) ? Number(rawSubId) : rawSubId;
      setDeletingId(record.id);
      try {
        await warehouseApi.deleteInventorySubmission(subId);
        message.success("Xóa dòng vật tư thành công!");
        setItems((prev) => prev.filter((i) => i.id !== record.id));
        if (onRefreshItems) {
          onRefreshItems();
        }
      } catch (err: any) {
        console.error("Lỗi xóa dòng vật tư:", err);
        message.error(err?.message || "Xóa dòng vật tư không thành công");
      } finally {
        setDeletingId(null);
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== record.id));
      message.success("Đã xóa dòng vật tư!");
    }
  };

  const totalQty = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.Qnty ?? i.actualQty) || 0), 0),
    [items]
  );
  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.Amount ?? i.totalPrice) || 0), 0),
    [items]
  );
  const totalTaxAmount = useMemo(
    () =>
      items.reduce((sum, i) => {
        const rawAmount = Number(i.Amount ?? i.totalPrice ?? (Number(i.UnitPrice || 0) * Number(i.Qnty || 0)));
        const taxRate = i.TaxRate !== undefined && i.TaxRate !== null ? Number(i.TaxRate) : 0.1;
        const taxVal =
          i.TaxAmount !== undefined && i.TaxAmount !== null
            ? Number(i.TaxAmount)
            : rawAmount * taxRate;
        return sum + taxVal;
      }, 0),
    [items]
  );

  const handleSubmit = async (values: any) => {
    if (!isEditing && items.length === 0) {
      message.error("Vui lòng thêm ít nhất một mặt hàng nhập kho!");
      return;
    }
    const selectedWh = MOCK_WAREHOUSES.find((w) => w.id === values.warehouseId);
    const receiptData: StockInReceipt = {
      id: editingReceipt?.id || `receipt_${Date.now()}`,
      receiptCode: values.receiptCode || editingReceipt?.receiptCode || editingReceipt?.DocCode,
      receiptDate: values.receiptDate
        ? values.receiptDate.format("YYYY-MM-DD")
        : (editingReceipt?.receiptDate || editingReceipt?.DocDate || dayjs().format("YYYY-MM-DD")),
      receiptType: values.receiptType || editingReceipt?.receiptType || "PO",
      poCode: values.poCode || editingReceipt?.poCode || editingReceipt?.ReferenceNo,
      vendorName: values.vendorName || editingReceipt?.VenName || editingReceipt?.vendorName || "Công Ty TNHH Thép Hòa Phát Hưng Yên",
      contractCode: values.contractCode || editingReceipt?.ContractCode || editingReceipt?.contractCode,
      warehouseId: values.warehouseId || editingReceipt?.warehouseId || editingReceipt?.WarehouseId || "WH01",
      warehouseName:
        selectedWh?.name || editingReceipt?.WarehouseName || "Kho Tổng Central - TP.HCM",
      invoiceNo: editingReceipt?.invoiceNo,
      deliverer: editingReceipt?.deliverer || "",
      receiver: editingReceipt?.receiver || "r@gmail.com",
      description: values.description || editingReceipt?.description || editingReceipt?.Description || "",
      status: values.status || editingReceipt?.StatusName || editingReceipt?.StatusCode || editingReceipt?.status || "Chưa nhập kho",
      totalQty,
      totalAmount,
      items,
      createdBy: editingReceipt?.createdBy || "r@gmail.com",
      createdDate: editingReceipt?.createdDate || dayjs().format("YYYY-MM-DD HH:mm"),
    };
    try {
      setSubmitting(true);
      await onSave(receiptData);
    } catch (err) {
      console.error("Lỗi khi lưu phiếu nhập kho:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Danh sách Orgcode (Approved Budget) lấy theo SubconOf của get-inventory-transaction
  // Không gọi tự động khi vào chi tiết phiếu nhập; chỉ gọi khi chọn button Đối chiếu Đơn hàng
  const [budgetList, setBudgetList] = useState<any[]>([]);
  const [loadingBudgetList, setLoadingBudgetList] = useState(false);

  useEffect(() => {
    if (!open) {
      setBudgetList([]);
    }
  }, [open, editingReceipt]);

  const fetchApprovedBudgetList = useCallback(async (overrideSubconOf?: number | string) => {
    const subconOf =
      overrideSubconOf ??
      editingReceipt?.SubconOf ??
      (editingReceipt as any)?.subconof ??
      (editingReceipt as any)?.SubConOf ??
      items.find((i) => i.SubconOf)?.SubconOf;

    if (!subconOf) {
      return [];
    }

    setLoadingBudgetList(true);
    try {
      const res = await warehouseApi.getApprovedBudgetList({
        ContractId: !isNaN(Number(subconOf)) ? Number(subconOf) : subconOf,
        PageNum: 1,
        PageSize: 1000,
      });
      const list = extractApiList<any>(res);
      setBudgetList(list);
      return list;
    } catch (err) {
      console.warn("Lỗi tải approved budget list trong StockInEditTab:", err);
      return [];
    } finally {
      setLoadingBudgetList(false);
    }
  }, [editingReceipt, items]);

  // Cấu hình các cột chi tiết vật tư nhập kho format chuẩn giống Đơn hàng
  const baseColumns: (ColumnType<StockItemDetail> & { cannotHide?: boolean })[] = useMemo(
    () => [
      {
        title: t("table.stt"),
        key: "stt",
        width: 42,
        align: "center",
        cannotHide: true,
        render: (_, __, index) => index + 1,
      },
      {
        title: "OrgCode",
        dataIndex: "Orgcode",
        key: "OrgCode",
        width: 100,
        render: (val: any, record: any) => {
          const raw = String(
            val || record.Orgcode || record.OrgCode || record.WBS || record.Wbs || ""
          ).trim();
          let orgCode = "";
          if (raw.includes(" - ")) {
            orgCode = raw.split(" - ")[0].trim();
          } else {
            orgCode = raw;
          }
          if (!orgCode) return <span style={{ color: "#94A3B8", fontSize: 12.5 }}>---</span>;
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "#1e293b",
                fontSize: 12.5,
              }}
            >
              {orgCode}
            </span>
          );
        },
      },
      {
        title: "OrgName",
        dataIndex: "OrgName",
        key: "OrgName",
        width: 160,
        render: (val: any, record: any) => {
          const raw = String(
            record.Orgcode || record.OrgCode || record.WBS || record.Wbs || ""
          ).trim();
          let orgName = val || record.OrgName || record.Orgname || record.BudgetDescription || "";
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

          if (!orgName && orgCode && budgetList && budgetList.length > 0) {
            const matched = budgetList.find((b: any) => {
              const code = String(b.OrgCode || b.Orgcode || b.WBS || "").trim();
              return code.toLowerCase() === orgCode.toLowerCase();
            });
            if (matched) {
              orgName = (matched.Description || matched.ItemName || matched.OrgName || matched.Orgname || "").trim();
            }
          }

          if (!orgName) return <span style={{ color: "#94A3B8", fontSize: 12.5 }}>---</span>;

          return (
            <span style={{ color: "#123443", fontSize: 12.5 }} title={orgName}>
              {orgName}
            </span>
          );
        },
      },
      {
        title: t("table.itemCode") || "Item Code",
        dataIndex: "SystemCode",
        key: "SystemCode",
        width: 120,
        render: (val: any, record: any) => {
          const sCode = val || record.SystemCode || record.itemCode || "";
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: sCode ? "#1e293b" : "#94A3B8",
                fontSize: 12.5,
              }}
            >
              {sCode || "---"}
            </span>
          );
        },
      },
      {
        title: t("table.itemName") || "Item Name",
        dataIndex: "Description",
        key: "Description",
        width: 220,
        render: (val: any, record: any) => {
          const desc = val || record.Description || record.itemName || "";
          return (
            <span style={{ color: "#123443", fontSize: 12.5 }} title={desc}>
              {desc || "---"}
            </span>
          );
        },
      },
      {
        title: t("table.unit"),
        dataIndex: "Unit",
        key: "Unit",
        width: 55,
        align: "center",
        render: (val, record) => <Text style={{ color: "#262626", fontSize: 12 }}>{val || record.unit || "---"}</Text>,
      },
      {
        title: t("table.qty"),
        dataIndex: "Qnty",
        key: "Qnty",
        width: 75,
        align: "right",
        render: (val, r) => {
          const q = val !== undefined ? val : r.actualQty;
          return (
            <Text style={{ color: "#262626", fontSize: 12 }}>
              {Number(q || 0).toLocaleString("vi-VN")}
            </Text>
          );
        },
      },
      {
        title: t("table.unitPrice"),
        dataIndex: "UnitPrice",
        key: "UnitPrice",
        width: 95,
        align: "right",
        render: (val, r) => {
          const p = val !== undefined ? val : r.unitPrice;
          return (
            <Text style={{ color: "#262626", fontSize: 12 }}>
              {Number(p || 0).toLocaleString("vi-VN")}
            </Text>
          );
        },
      },
      {
        title: t("table.amount"),
        dataIndex: "Amount",
        key: "Amount",
        width: 105,
        align: "right",
        render: (val, r) => {
          const a =
            val !== undefined
              ? val
              : r.totalPrice !== undefined
              ? r.totalPrice
              : Number(r.Qnty ?? r.actualQty ?? 0) * Number(r.UnitPrice ?? r.unitPrice ?? 0);
          return (
            <Text style={{ color: "#262626", fontSize: 12 }}>
              {Number(a || 0).toLocaleString("vi-VN")}
            </Text>
          );
        },
      },
      {
        title: t("table.vat"),
        dataIndex: "TaxAmount",
        key: "TaxAmount",
        width: 85,
        align: "right",
        render: (val, r) => {
          const rawAmount = Number(r.Amount ?? r.totalPrice ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
          const taxRate = r.TaxRate !== undefined && r.TaxRate !== null ? Number(r.TaxRate) : 0.1;
          const taxVal =
            val !== undefined && val !== null && val !== ""
              ? Number(val)
              : rawAmount * taxRate;
          return <Text style={{ color: "#262626", fontSize: 12 }}>{taxVal.toLocaleString("vi-VN")}</Text>;
        },
      },
      {
        title: t("table.totalVat"),
        key: "totalWithVat",
        width: 110,
        align: "right",
        render: (_, r) => {
          const rawAmount = Number(r.Amount ?? r.totalPrice ?? (Number(r.UnitPrice || 0) * Number(r.Qnty || 0)));
          const taxRate = r.TaxRate !== undefined && r.TaxRate !== null ? Number(r.TaxRate) : 0.1;
          const taxVal =
            r.TaxAmount !== undefined && r.TaxAmount !== null
              ? Number(r.TaxAmount)
              : rawAmount * taxRate;
          const totalWithVat = rawAmount + taxVal;
          return (
            <Text style={{ color: "#262626", fontSize: 12 }}>
              {totalWithVat.toLocaleString("vi-VN")}
            </Text>
          );
        },
      },
      {
        title: t("table.status"),
        dataIndex: "StatusCode",
        key: "StatusCode",
        width: 90,
        align: "center",
        render: (val, record) => {
          const subId = record.SubmissionId ?? record.LocalId;
          return (
            <Tooltip title={subId ? `Nhấp để xem quy trình duyệt (Mã #${subId})` : "Chưa có quy trình duyệt"}>
              <span
                onClick={() => {
                  if (subId && onFetchWorkflow) {
                    onFetchWorkflow(record);
                  }
                }}
                style={{
                  cursor: subId ? "pointer" : "default",
                  display: "inline-block",
                }}
              >
                {renderApprovalBadge(val, record, language)}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: "",
        key: "action",
        width: 70,
        align: "center",
        cannotHide: true,
        render: (_, record) => {
          return (
            <Space size={6}>
              <ActionIconButton
                action="edit"
                size="small"
                onClick={() => handleOpenEditItem(record)}
              />
              <Popconfirm
                title="Xóa dòng vật tư này khỏi phiếu nhập?"
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true, loading: deletingId === record.id }}
                onConfirm={() => handleDeleteItem(record)}
              >
                <ActionIconButton
                  action="delete"
                  size="small"
                  loading={deletingId === record.id}
                />
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [onFetchWorkflow, deletingId, t, budgetList]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_import_detail_items_v4",
    columns: baseColumns,
    actionColumnKey: "action",
    defaultScrollX: 950,
  });

  const resolvedContractId = useMemo(() => {
    return (
      editingReceipt?.ReferenceId ??
      editingReceipt?.referenceId ??
      editingReceipt?.ContractId ??
      editingReceipt?.contractCode ??
      items.find((i) => i.ContractId)?.ContractId ??
      ""
    );
  }, [editingReceipt, items]);

  const resolvedTransactionId = useMemo(() => {
    return (
      editingReceipt?.TransactionId ??
      editingReceipt?.Id ??
      (!isNaN(Number(editingReceipt?.id)) ? Number(editingReceipt?.id) : "")
    );
  }, [editingReceipt]);

  if (!open) return null;

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
      {/* HEADER SECTION I: TIÊU ĐỀ + NÚT ĐÓNG & CẬP NHẬT */}
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
            {t.section.generalInfoReceipt}
          </Text>
        </div>

        <Space size={8}>
          <Button onClick={onClose} style={{ height: 32, borderRadius: 6, borderColor: "#dce5e6", fontSize: 13 }}>
            {t.common.close}
          </Button>
          {!hasDetails && (
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
              {isEditing ? t.receipt.updateReceipt : t.receipt.saveReceipt}
            </Button>
          )}
        </Space>
      </div>

      {/* FORM SECTION I: THỐNG NHẤT GIỐNG ĐƠN HÀNG (COMPACT) */}
      <div style={{ width: "100%", marginBottom: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="erp-general-info-card">
            {/* Hàng 1: 4 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Loại nhập kho */}
              <Col span={6} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.receiptType} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="receiptType"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn loại nhập kho!" }]}
                >
                  <Select
                    variant="borderless"
                    disabled={isHeaderDisabled}
                    style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                    options={[
                      { value: "PO", label: t.receipt.typePO },
                      { value: "Purchase", label: t.receipt.typePurchase },
                      { value: "TRANSFER", label: t.receipt.typeTransfer },
                      { value: "RETURN", label: t.receipt.typeReturn },
                      { value: "OTHER", label: t.receipt.typeOther },
                    ]}
                  />
                </Form.Item>
              </Col>

              {/* Cột 2: Đơn hàng PO */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.poCode}
                </span>
                <Form.Item name="poCode" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    placeholder="Mã đơn hàng PO..."
                    disabled={isHeaderDisabled}
                    style={{
                      padding: 0,
                      fontWeight: 400,
                      fontSize: 12.5,
                      lineHeight: "18px",
                      color: "#1e293b",
                      fontFamily: "monospace",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Hợp đồng */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.contractCode} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item name="contractCode" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    readOnly
                    placeholder="Mã số Hợp đồng..."
                    disabled
                    style={{
                      padding: 0,
                      fontWeight: 400,
                      fontSize: 12.5,
                      lineHeight: "18px",
                      color: "#1e293b",
                      fontFamily: "monospace",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Nhà Cung Cấp */}
              <Col span={9} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.vendorName}
                </span>
                <Form.Item name="vendorName" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    readOnly
                    placeholder="Tên đơn vị giao hàng / Nhà cung cấp..."
                    disabled
                    style={{
                      padding: 0,
                      fontWeight: 400,
                      fontSize: 12.5,
                      lineHeight: "18px",
                      color: "#1e293b",
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="erp-info-divider" />

            {/* Hàng 2: 5 Cột */}
            <Row gutter={[0, 0]} align="middle">
              {/* Cột 1: Số phiếu nhập */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.receiptCode}
                </span>
                <Form.Item name="receiptCode" style={{ margin: 0 }}>
                  <Input
                    variant="borderless"
                    disabled
                    placeholder={isEditing ? "" : "(Tự sinh khi lưu)"}
                    style={{
                      padding: 0,
                      fontWeight: 400,
                      fontSize: 12.5,
                      lineHeight: "18px",
                      color: "#1e293b",
                      fontFamily: "monospace",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 2: Ngày nhập kho */}
              <Col span={4} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.receiptDate} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="receiptDate"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn Ngày nhập!" }]}
                >
                  <DatePicker
                    variant="borderless"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    disabled={isHeaderDisabled}
                    style={{
                      padding: 0,
                      width: "100%",
                      fontWeight: 400,
                      fontSize: 12.5,
                      color: "#1e293b",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 3: Diễn giải */}
              <Col span={7} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.description} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="description"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng nhập diễn giải!" }]}
                >
                  <Input
                    variant="borderless"
                    placeholder="vd: Phiếu nhập kho từ đơn hàng PO..."
                    disabled={isHeaderDisabled}
                    style={{
                      padding: 0,
                      fontWeight: 400,
                      fontSize: 12.5,
                      lineHeight: "18px",
                      color: "#1e293b",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Cột 4: Kho nhận hàng */}
              <Col span={5} className="erp-info-cell">
                <span className="erp-info-label">
                  {t.table.warehouse} <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="warehouseId"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn Kho nhận hàng!" }]}
                >
                  <Select
                    variant="borderless"
                    style={{
                      padding: 0,
                      width: "100%",
                      fontWeight: 400,
                      fontSize: 12.5,
                      color: "#1e293b",
                    }}
                    disabled={isHeaderDisabled}
                    options={warehouseOptions}
                  />
                </Form.Item>
              </Col>

              {/* Cột 5: Trạng thái phiếu */}
              <Col span={4} className="erp-info-cell" style={{ borderRight: "none" }}>
                <span className="erp-info-label">
                  {t.table.status}
                </span>
                <div style={{ display: "flex", alignItems: "center", height: 24, paddingLeft: 11 }}>
                  {(() => {
                    const rawSt = String(editingReceipt?.StatusName || editingReceipt?.StatusCode || editingReceipt?.status || "").toUpperCase();
                    const isCompleted = rawSt.includes("COMPLETED") || rawSt.includes("ĐÃ NHẬP KHO");
                    const isPending = rawSt.includes("PENDING") || rawSt.includes("CHỜ DUYỆT");
                    return (
                      <Tag
                        color={isCompleted ? "success" : isPending ? "warning" : "default"}
                        style={{
                          margin: 0,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: "18px",
                          padding: "0 6px",
                        }}
                      >
                        {isCompleted
                          ? t.status.completed
                          : isPending
                          ? t.status.pending
                          : (t.status.draft || "Chưa nhập kho")}
                      </Tag>
                    );
                  })()}
                </div>
              </Col>
            </Row>
          </div>
        </Form>
      </div>

      {/* SECTION II: DANH MỤC VẬT TƯ / THIẾT BỊ NHẬP KHO */}
      <div>
        {/* Scoped CSS for stockin items table */}
        <style jsx global>{`
          .stockin-reconcile-table .ant-table-thead > tr > th {
            background: #f7fbfa !important;
            color: #123443 !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            border-color: #dce5e6 !important;
          }
        `}</style>

        <ErpDetailCard
          title={t.section.materialInfo}
          actions={
            <Space size={8}>
              <Button
                icon={<IconRefresh size={16} strokeWidth={1.8} />}
                onClick={onRefreshItems}
                style={{ height: 32, borderRadius: 6, borderColor: "#dce5e6", fontSize: 13 }}
              >
                {t.common.refresh}
              </Button>
              <Button
                icon={<IconScale size={16} strokeWidth={1.8} />}
                style={{
                  color: "#008f89",
                  borderColor: "#b2ded9",
                  background: "#eef8f6",
                  height: 32,
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 13,
                }}
                onClick={() => {
                  fetchApprovedBudgetList();
                  setIsReconcileModalOpen(true);
                }}
              >
                {t.receipt.reconcilePO}
              </Button>
            </Space>
          }
        >
          <Table
            className="erp-detail-table"
            components={{ header: { cell: ResizableTitle } }}
            rowKey="id"
            size="middle"
            columns={tableColumns}
            dataSource={items}
            loading={loadingItems}
            pagination={false}
            scroll={{ x: scrollX }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: "bold" }}>
                  {tableColumns.map((col, idx) => {
                    const key = String(col.key ?? (col as any).dataIndex ?? idx);
                    if (key === "Description") {
                      return (
                        <Table.Summary.Cell key={key} index={idx} align="right">
                          <Text strong style={{ color: "#008f89" }}>{t.table.total}</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "Qnty") {
                      return (
                        <Table.Summary.Cell key={key} index={idx} align="right">
                          <Text strong style={{ color: "#123443" }}>{totalQty.toLocaleString("vi-VN")}</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "Amount") {
                      return (
                        <Table.Summary.Cell key={key} index={idx} align="right">
                          <Text strong style={{ color: "#123443" }}>{totalAmount.toLocaleString("vi-VN")}</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "TaxAmount") {
                      return (
                        <Table.Summary.Cell key={key} index={idx} align="right">
                          <Text strong style={{ color: "#123443" }}>{totalTaxAmount.toLocaleString("vi-VN")}</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    if (key === "totalWithVat") {
                      return (
                        <Table.Summary.Cell key={key} index={idx} align="right">
                          <Text strong style={{ color: "#008f89", fontSize: 14 }}>
                            {(totalAmount + totalTaxAmount).toLocaleString("vi-VN")}
                          </Text>
                        </Table.Summary.Cell>
                      );
                    }
                    return <Table.Summary.Cell key={key} index={idx} />;
                  })}
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </ErpDetailCard>
      </div>

      {/* MODAL ĐỐI CHIẾU ĐƠN HÀNG PO */}
      <StockInReconcileModal
        open={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        contractId={resolvedContractId}
        budgetList={budgetList}
        loadingBudgetList={loadingBudgetList}
        transactionId={resolvedTransactionId}
        poCode={editingReceipt?.poCode || editingReceipt?.ReferenceNo}
        onSuccess={onRefreshItems}
      />

      {/* DRAWER CHỈNH SỬA CHI TIẾT MẶT HÀNG NHẬP KHO */}
      <StockInItemEditDrawer
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        editingItem={editingItem}
        editingReceipt={editingReceipt}
        budgetList={budgetList}
        loadingBudgetList={loadingBudgetList}
        onSuccess={onRefreshItems}
        onOptimisticUpdate={handleOptimisticUpdateItem}
      />
    </div>
  );
}
