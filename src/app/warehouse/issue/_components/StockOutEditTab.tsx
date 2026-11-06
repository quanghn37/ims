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
  Popconfirm,
  message,
} from "antd";
import type { ColumnType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { IconDeviceFloppy, IconTrash, IconSend, IconRefresh } from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import dayjs from "dayjs";
import {
  StockOutIssue,
  StockItemDetail,
} from "../../types";
import { warehouseApi } from "../../api";
import { extractApiList } from "@/lib/api-client";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import ErpDetailCard from "@/components/common/ErpDetailCard";
import StockOutItemModal from "./StockOutItemModal";
import { useTranslation } from "@/locales/LanguageContext";
import InventoryWorkflowDrawer from "../../receipt/_components/InventoryWorkflowDrawer";
import ApprovalBadge, { renderApprovalBadge } from "@/components/common/ApprovalBadge";
import UnconfirmTransactionButton, { isTransactionApprovedOrRejected } from "../../_components/UnconfirmTransactionButton";

const { Text } = Typography;

interface StockOutEditTabProps {
  open: boolean;
  onClose: () => void;
  editingIssue: StockOutIssue | null;
  onSave: (data: StockOutIssue) => void | Promise<void>;
  onDelete?: (data: StockOutIssue) => void | Promise<void>;
  onUpdateEditingIssue?: (issue: StockOutIssue) => void;
}

export default function StockOutEditTab({
  onClose,
  editingIssue,
  onSave,
  onDelete,
  onUpdateEditingIssue,
}: StockOutEditTabProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = Boolean(editingIssue);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách vật tư chi tiết của phiếu xuất
  const [items, setItems] = useState<StockItemDetail[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // State Modal thêm/sửa dòng vật tư
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItemDetail | null>(null);

  // State Drawer xem quy trình duyệt
  const [selectedWorkflowItem, setSelectedWorkflowItem] = useState<StockItemDetail | null>(null);

  // Lấy TransactionId từ editingIssue
  const getEditingTransId = (): number | string | undefined => {
    if (!editingIssue) return undefined;
    const directTransId =
      (editingIssue as any).TransactionId ??
      (editingIssue as any).transactionId ??
      (editingIssue as any).Id;
    if (directTransId) return directTransId;
    if (editingIssue.id && !isNaN(Number(editingIssue.id))) {
      return Number(editingIssue.id);
    }
    return undefined;
  };

  // Tải chi tiết vật tư từ API get-inventory-submission (DisplayMode: "Issue")
  const fetchSubmissions = async (transactionId: number | string): Promise<StockItemDetail[]> => {
    setLoadingItems(true);
    try {
      const res = await warehouseApi.getInventorySubmissions({
        DisplayMode: "Issue",
        TransactionId: Number(transactionId),
        WSId: "",
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList<any>(res);
      if (list && list.length > 0) {
        const mapped: StockItemDetail[] = list.map((item: any, idx: number) => {
          const qnty = Number(item.Qnty ?? item.actualQty ?? 0);
          const unitPrice = Number(item.UnitPrice ?? item.unitPrice ?? 0);
          const amount = Number(item.Amount ?? item.totalPrice ?? qnty * unitPrice);
          const onHandQty = Number(item.OnHandQty ?? item.stockQty ?? 0);
          const availableQty = Number(item.AvailableQty ?? item.availableQty ?? onHandQty);
          const approvedQty =
            item.ApprovedQnty !== undefined && item.ApprovedQnty !== null
              ? Number(item.ApprovedQnty)
              : item.ApprovedQty !== undefined && item.ApprovedQty !== null
              ? Number(item.ApprovedQty)
              : null;
          const subId = item.SubmissionId ?? item.submissionId;
          const localId = item.LocalId ?? item.localId;
          const orgCode = item.Orgcode || item.OrgCode || item.orgCode || "";
          const orgName = item.OrgName || item.Orgname || item.orgName || "";
          const sysCode = item.SystemCode || item.itemCode || "";
          const desc = item.Description || item.itemName || "";
          const unit = item.Unit || item.unit || "";
          const remarks = item.Remarks || item.remarks || item.note || "";
          const statusCode = item.StatusCode || item.status || "Not-Started";

          return {
            ...item,
            id: String(subId || localId || `sub_${idx + 1}`),
            LocalId: localId,
            SubmissionId: subId,
            ContractId: item.ContractId ?? null,
            SystemCode: sysCode,
            itemCode: sysCode,
            Description: desc,
            itemName: desc,
            Orgcode: orgCode,
            orgCode: orgCode,
            OrgName: orgName,
            orgName: orgName,
            Remarks: remarks,
            note: remarks,
            Unit: unit,
            unit: unit,
            UnitPrice: unitPrice,
            unitPrice: unitPrice,
            Qnty: qnty,
            actualQty: qnty,
            Amount: amount,
            totalPrice: amount,
            ApprovedQnty: approvedQty,
            approvedQty: approvedQty,
            OnHandQty: onHandQty,
            stockQty: onHandQty,
            AvailableQty: availableQty,
            availableQty: availableQty,
            TaxRate: Number(item.TaxRate ?? 0),
            TaxAmount: Number(item.TaxAmount ?? 0),
            ItemDate: item.ItemDate ?? null,
            StageMode: item.StageMode ?? null,
            CreatedBy: item.CreatedBy,
            ApprovalStatus: item.ApprovalStatus,
            ApprovalStatusName: item.ApprovalStatusName || item.StatusName || "",
            ApprovedOn: item.ApprovedOn ?? null,
            ApprovalStart: item.ApprovalStart ?? null,
            TaskId: item.TaskId,
            ApprovalUserId: item.ApprovalUserId,
            ApprovalAssignmentId: item.ApprovalAssignmentId,
            StatusCode: statusCode,
            status: statusCode,
          };
        });
        setItems(mapped);
        return mapped;
      } else {
        setItems([]);
        return [];
      }
    } catch (err: any) {
      console.warn("Lỗi tải chi tiết submission phiếu xuất kho:", err);
      return [];
    } finally {
      setLoadingItems(false);
    }
  };

  // Danh sách kho xuất thực tế từ API
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    warehouseApi
      .getWarehouseList({ PageNum: 1, PageSize: 100 })
      .then((res) => {
        const list = extractApiList<any>(res);
        if (list && list.length > 0) {
          setWarehouses(list);
        }
      })
      .catch((err) => {
        console.warn("Lỗi khi tải danh sách kho:", err);
      });
  }, []);

  // Danh sách kho xuất options
  const warehouseOptions = useMemo(() => {
    const opts: { value: any; label: string }[] = [];
    if (warehouses && warehouses.length > 0) {
      warehouses.forEach((w: any) => {
        const id = w.WarehouseId ?? w.id;
        const name = w.WarehouseName ?? w.name ?? `Kho #${id}`;
        opts.push({
          value: id,
          label: name,
        });
      });
    }

    // Nếu editingIssue có WarehouseId mà chưa có trong danh sách thì bổ sung lên đầu
    const currentId = (editingIssue as any)?.WarehouseId ?? editingIssue?.warehouseId;
    if (
      currentId !== undefined &&
      currentId !== null &&
      !opts.some((o) => String(o.value) === String(currentId))
    ) {
      const currentName =
        (editingIssue as any)?.WarehouseName ||
        editingIssue?.warehouseName ||
        `Kho #${currentId}`;
      opts.unshift({
        value: !isNaN(Number(currentId)) ? Number(currentId) : currentId,
        label: currentName,
      });
    }
    return opts;
  }, [warehouses, editingIssue]);

  // Khởi tạo form khi mở phiếu
  useEffect(() => {
    if (editingIssue) {
      const rawWhId = (editingIssue as any)?.WarehouseId ?? editingIssue.warehouseId;
      const initialWhId =
        rawWhId !== undefined && rawWhId !== null
          ? !isNaN(Number(rawWhId))
            ? Number(rawWhId)
            : rawWhId
          : undefined;

      form.setFieldsValue({
        issueCode: editingIssue.issueCode || (editingIssue as any).DocCode || "",
        issueDate: editingIssue.issueDate ? dayjs(editingIssue.issueDate) : dayjs(),
        issueType: editingIssue.issueType || (editingIssue as any).SubType || "CONSTRUCTION",
        projectName: editingIssue.projectName || (editingIssue as any).MainCode || "",
        workPackage: editingIssue.workPackage || "",
        contractorName: editingIssue.contractorName || (editingIssue as any).ReceiverName || "",
        warehouseId: initialWhId,
        requisitionNo: editingIssue.requisitionNo || (editingIssue as any).ReferenceNo || "",
        receiver: editingIssue.receiver || (editingIssue as any).Receiver || "",
        issuer: editingIssue.issuer || (editingIssue as any).CreatedBy || "Nguyễn Văn Thao (Thủ kho)",
        description: editingIssue.description || (editingIssue as any).Description || "",
        status: editingIssue.status || "DRAFT",
      });

      const transId = getEditingTransId();
      if (transId) {
        fetchSubmissions(transId);
      } else {
        setItems(editingIssue.items ? [...editingIssue.items] : []);
      }
    } else {
      const now = dayjs();
      form.setFieldsValue({
        issueCode: `PXK-${now.format("YYYY-MM")}/${String(Math.floor(Math.random() * 900) + 100)}`,
        issueDate: now,
        issueType: "CONSTRUCTION",
        projectName: "",
        workPackage: "",
        contractorName: "",
        warehouseId: warehouses.length > 0 ? (warehouses[0].WarehouseId ?? warehouses[0].id) : undefined,
        requisitionNo: "",
        receiver: "",
        issuer: "Nguyễn Văn Thao (Thủ kho)",
        description: "",
        status: "DRAFT",
      });
      setItems([]);
    }
  }, [editingIssue, form, warehouses]);

  // Tổng hợp số lượng & thành tiền
  const totalQty = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.actualQty) || 0), 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
  }, [items]);

  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Xác định trạng thái "Đang lập" dựa vào Status = 0 để hiển thị nút Trình duyệt
  const isApprovalStatusZero = useMemo(() => {
    if (!editingIssue) return false;

    const rawStatus =
      editingIssue.Status !== undefined && editingIssue.Status !== null && editingIssue.Status !== ""
        ? editingIssue.Status
        : editingIssue.StatusCode !== undefined && editingIssue.StatusCode !== null && editingIssue.StatusCode !== ""
        ? editingIssue.StatusCode
        : editingIssue.ApprovalStatus !== undefined && editingIssue.ApprovalStatus !== null && editingIssue.ApprovalStatus !== ""
        ? editingIssue.ApprovalStatus
        : editingIssue.status;

    if (rawStatus !== undefined && rawStatus !== null && !isNaN(Number(rawStatus))) {
      return Number(rawStatus) === 0;
    }

    const str = String(
      editingIssue.StatusName ||
      editingIssue.ApprovalStatusName ||
      ""
    ).trim().toLowerCase();

    return str === "draft" || str === "đang lập" || str === "dang lap";
  }, [editingIssue]);

  const handleSubmitApproval = async () => {
    const rawId =
      editingIssue?.TransactionId ??
      (editingIssue as any)?.Id ??
      (!isNaN(Number(editingIssue?.id)) ? Number(editingIssue?.id) : undefined);

    if (!rawId) {
      message.error("Không tìm thấy TransactionId để trình duyệt phiếu xuất.");
      return;
    }

    if (!items || items.length === 0) {
      message.warning("Phiếu xuất kho chưa có chi tiết vật tư để trình duyệt.");
      return;
    }

    try {
      setSubmittingApproval(true);
      const res: any = await warehouseApi.submitInventoryApproval({
        TransactionId: Number(rawId),
      });

      if (res?.Success === false) {
        message.error(res?.Message || "Trình duyệt phiếu xuất kho thất bại!");
        return;
      }

      message.success(
        res?.Message || "Trình duyệt phiếu xuất kho thành công! Trạng thái chuyển sang Chờ duyệt."
      );

      const approvalStatus = res?.Data?.ApprovalStatus ?? 2;
      const approvalStatusName = res?.Data?.ApprovalStatusName ?? "Chờ duyệt";
      const status = res?.Data?.Status ?? editingIssue?.status ?? 0;
      const statusName = res?.Data?.StatusName ?? editingIssue?.StatusName ?? "Chờ duyệt";

      const updatedIssue: StockOutIssue = {
        ...editingIssue!,
        ApprovalStatus: approvalStatus,
        ApprovalStatusName: approvalStatusName,
        Status: status,
        StatusName: statusName,
        StatusCode: String(status),
        status: "PENDING",
      };

      if (onUpdateEditingIssue) {
        onUpdateEditingIssue(updatedIssue);
      }

      fetchSubmissions(Number(rawId));
    } catch (err: any) {
      console.error("Lỗi trình duyệt phiếu xuất kho:", err);
      message.error(err?.message || "Trình duyệt phiếu xuất kho thất bại!");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const [unconfirming, setUnconfirming] = useState(false);

  const handleUnconfirm = async () => {
    const rawId =
      editingIssue?.TransactionId ??
      (editingIssue as any)?.Id ??
      (!isNaN(Number(editingIssue?.id)) ? Number(editingIssue?.id) : undefined);

    if (!rawId) {
      message.error("Không tìm thấy TransactionId để gỡ xác nhận phiếu xuất.");
      return;
    }

    try {
      setUnconfirming(true);
      const res: any = await warehouseApi.unconfirmInventoryApproval({
        TransactionId: Number(rawId),
      });

      if (res?.Success === false || String(res?.Success).toLowerCase() === "false") {
        message.error(res?.Message || "Gỡ xác nhận phiếu xuất kho thất bại!");
        return;
      }

      message.success(
        res?.Message || "Đã gỡ xác nhận phiếu xuất kho! Trạng thái chuyển về Đang lập."
      );

      const updatedIssue: StockOutIssue = {
        ...editingIssue!,
        ApprovalStatus: 0,
        ApprovalStatusName: "Đang lập",
        Status: 0,
        StatusName: "Đang lập",
        StatusCode: "0",
        status: "DRAFT",
      };

      if (onUpdateEditingIssue) {
        onUpdateEditingIssue(updatedIssue);
      }

      fetchSubmissions(Number(rawId));
    } catch (err: any) {
      console.error("Lỗi gỡ xác nhận phiếu xuất kho:", err);
      message.error(err?.message || "Gỡ xác nhận phiếu xuất kho thất bại!");
    } finally {
      setUnconfirming(false);
    }
  };

  // Làm mới danh mục vật tư từ API
  const handleRefreshItems = () => {
    const transId = getEditingTransId();
    if (transId) {
      fetchSubmissions(transId).then((res) => {
        if (res && res.length > 0) {
          message.success("Đã làm mới danh mục vật tư xuất kho!");
        } else {
          message.info("Chưa có chi tiết vật tư!");
        }
      });
    } else if (editingIssue?.items) {
      setItems(editingIssue.items);
      message.success("Đã làm mới danh mục vật tư!");
    }
  };

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

  const handleDeleteItem = async (itemId: string, record?: StockItemDetail) => {
    const subId = record?.SubmissionId ?? record?.LocalId;
    if (subId) {
      try {
        await warehouseApi.deleteInventorySubmission(subId);
        message.success("Đã xóa dòng vật tư thành công!");
        const transId = getEditingTransId();
        if (transId) {
          fetchSubmissions(transId);
          return;
        }
      } catch (err: any) {
        message.error(err?.message || "Xóa dòng vật tư thất bại!");
        return;
      }
    }
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
      const selectedWh = warehouses.find(
        (w) => String(w.WarehouseId ?? w.id) === String(values.warehouseId)
      );
      const warehouseName = selectedWh
        ? selectedWh.WarehouseName ?? selectedWh.name
        : editingIssue?.warehouseName || (editingIssue as any)?.WarehouseName || "";

      const payload: StockOutIssue = {
        id: editingIssue?.id || `iss_${Date.now()}`,
        issueCode: values.issueCode,
        issueDate: values.issueDate ? values.issueDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        issueType: values.issueType,
        projectName: values.projectName || "",
        workPackage: values.workPackage || "",
        contractorName: values.contractorName || "",
        warehouseId: values.warehouseId,
        warehouseName,
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
          <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>{index + 1}</span>
        ),
      },
      {
        title: "OrgCode",
        dataIndex: "orgCode",
        key: "orgCode",
        width: 100,
        render: (val, r) => {
          const code = val || r.Orgcode || r.orgCode || "";
          if (!code) return <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 400 }}>---</span>;
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "#334155",
                fontSize: 13,
                fontWeight: 400,
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
          if (!name) return <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 400 }}>---</span>;
          return (
            <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }} title={name}>
              {name}
            </span>
          );
        },
      },
      {
        title: t.table.itemCode,
        dataIndex: "SystemCode",
        key: "itemCode",
        width: 115,
        render: (val, r) => {
          const code = val || r.SystemCode || r.itemCode || "";
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                fontWeight: 400,
                color: code ? "#334155" : "#94A3B8",
              }}
            >
              {code || "---"}
            </span>
          );
        },
      },
      {
        title: t.table.itemName,
        dataIndex: "Description",
        key: "itemName",
        width: 220,
        render: (val, r) => {
          const desc = val || r.Description || r.itemName || "";
          return (
            <span style={{ fontWeight: 400, color: "#334155", fontSize: 13 }} title={desc}>
              {desc || "---"}
            </span>
          );
        },
      },
      {
        title: t.table.unit,
        dataIndex: "Unit",
        key: "unit",
        width: 55,
        align: "center",
        render: (val, r) => (
          <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>
            {val || r.Unit || r.unit || "---"}
          </span>
        ),
      },
      {
        title: t.table.stockQty,
        dataIndex: "OnHandQty",
        key: "stockQty",
        width: 75,
        align: "right",
        render: (val, r) => (
          <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>
            {Number(val ?? r.OnHandQty ?? r.stockQty ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: language === "en" ? "Available" : "Khả dụng",
        dataIndex: "AvailableQty",
        key: "availableQty",
        width: 80,
        align: "right",
        render: (val, r) => (
          <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>
            {Number(val ?? r.AvailableQty ?? r.availableQty ?? r.OnHandQty ?? r.stockQty ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.actualQty,
        dataIndex: "Qnty",
        key: "actualQty",
        width: 85,
        align: "right",
        render: (val, r) => (
          <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>
            {Number(val ?? r.Qnty ?? r.actualQty ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.appQty,
        dataIndex: "ApprovedQnty",
        key: "approvedQty",
        width: 80,
        align: "right",
        render: (val, r) => {
          const raw = val !== undefined && val !== null ? val : r.ApprovedQnty ?? r.approvedQty;
          if (raw === null || raw === undefined || raw === "") {
            return <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 400 }}>---</span>;
          }
          return (
            <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>
              {Number(raw).toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        title: t.table.unitPrice,
        dataIndex: "UnitPrice",
        key: "unitPrice",
        width: 95,
        align: "right",
        render: (val, r) => (
          <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>
            {Number(val ?? r.UnitPrice ?? r.unitPrice ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.amount,
        dataIndex: "Amount",
        key: "totalPrice",
        width: 105,
        align: "right",
        render: (val, r) => (
          <span style={{ color: "#334155", fontSize: 13, fontWeight: 400 }}>
            {Number(val ?? r.Amount ?? r.totalPrice ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.remarks,
        dataIndex: "Remarks",
        key: "note",
        width: 130,
        ellipsis: true,
        render: (val, r) => {
          const text = val || r.Remarks || r.note || "";
          return (
            <span style={{ color: text ? "#334155" : "#94A3B8", fontSize: 13, fontWeight: 400 }} title={text}>
              {text || "---"}
            </span>
          );
        },
      },
      {
        title: t.table.status,
        dataIndex: "StatusCode",
        key: "StatusCode",
        width: 110,
        align: "left",
        render: (val, record) => {
          const subId = record.SubmissionId ?? record.LocalId;
          const statusVal = val || record.StatusCode || record.status || "---";
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
        title: "",
        key: "action",
        width: 70,
        align: "center",
        fixed: "right",
        cannotHide: true,
        render: (_, record) => {
          if (!isApprovalStatusZero) {
            return (
              <ActionIconButton
                action="view"
                size="small"
                onClick={() => handleOpenItemModal({ ...record, Editable: 0 })}
              />
            );
          }

          return (
            <Space size={6}>
              <ActionIconButton
                action="edit"
                size="small"
                onClick={() => handleOpenItemModal(record)}
              />
              <Popconfirm
                title={t.common.deleteConfirmTitle}
                description={t.common.deleteConfirmDesc}
                okText={t.common.delete}
                cancelText={t.common.cancel}
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDeleteItem(record.id, record)}
              >
                <ActionIconButton action="delete" size="small" />
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [t, language, isApprovalStatusZero]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_issue_edit_items_v4",
    columns: baseItemColumns,
    actionColumnKey: "action",
    defaultScrollX: 1050,
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
          {/* Nút Trình duyệt: chỉ hiển thị khi có phiếu và Status = 0 (Đang lập) */}
          {isEditing && isApprovalStatusZero && (
            <Popconfirm
              title="Xác nhận trình duyệt phiếu xuất kho này?"
              description="Sau khi trình duyệt, phiếu xuất sẽ chuyển sang trạng thái Chờ duyệt."
              onConfirm={handleSubmitApproval}
              okText="Trình duyệt"
              cancelText={t.common.cancel || "Hủy"}
              okButtonProps={{ loading: submittingApproval }}
            >
              <Button
                type="primary"
                icon={<IconSend size={16} strokeWidth={2} />}
                loading={submittingApproval}
                style={{
                  background: "#008f89",
                  borderColor: "#008f89",
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 13,
                  boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Trình duyệt
              </Button>
            </Popconfirm>
          )}

          {/* Nút Gỡ xác nhận: dùng chung cho Nhập/Xuất, chỉ hiển thị khi trạng thái Đã duyệt */}
          {isEditing && (
            <UnconfirmTransactionButton
              record={editingIssue}
              loading={unconfirming}
              onConfirm={handleUnconfirm}
              transactionType="issue"
            />
          )}

          {isEditing && onDelete && editingIssue && !isTransactionApprovedOrRejected(editingIssue) && (
            <Popconfirm
              title={t.common.deleteConfirmTitle || "Xác nhận xóa phiếu này?"}
              description={t.common.deleteConfirmDesc || "Hành động này sẽ xóa phiếu xuất kho và không thể hoàn tác."}
              onConfirm={() => onDelete(editingIssue)}
              okText={t.common.delete || "Xóa"}
              cancelText={t.common.cancel || "Hủy"}
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<IconTrash size={15} strokeWidth={1.8} />}
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 6,
                  background: "#FEE2E2",
                  borderColor: "#FECACA",
                  color: "#DC2626",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.common.delete || "Xóa"}
              </Button>
            </Popconfirm>
          )}
          <Button
            onClick={onClose}
            style={{ height: 32, borderRadius: 6, borderColor: "#dce5e6", fontSize: 13 }}
          >
            {t.common.close}
          </Button>
          {!isTransactionApprovedOrRejected(editingIssue) && (
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
          )}
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
                  Kho xuất <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
                <Form.Item
                  name="warehouseId"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: "Vui lòng chọn kho xuất!" }]}
                >
                  <Select
                    variant="borderless"
                    options={warehouseOptions}
                    placeholder="Chọn kho xuất..."
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
                <div style={{ display: "flex", alignItems: "center", height: 24, paddingLeft: 8 }}>
                  <ApprovalBadge
                    val={editingIssue?.Status ?? editingIssue?.StatusCode ?? 0}
                    record={editingIssue}
                    customLabel={
                      editingIssue?.StatusName ||
                      editingIssue?.ApprovalStatusName ||
                      ((editingIssue?.Status ?? 0) === 0 ? "Đang lập" : undefined)
                    }
                  />
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
          <Space size={8}>
            <Button
              icon={<IconRefresh size={16} strokeWidth={1.8} />}
              onClick={handleRefreshItems}
              loading={loadingItems}
              style={{
                height: 32,
                borderRadius: 6,
                borderColor: "#dce5e6",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {t.common.refresh || "Làm mới"}
            </Button>
            {(!isEditing || isApprovalStatusZero) && (
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
            )}
          </Space>
        }
      >
        <Table
          className="erp-detail-table"
          tableLayout="fixed"
          components={{ header: { cell: ResizableTitle } }}
          rowKey="id"
          size="middle"
          columns={tableColumns}
          dataSource={items}
          loading={loadingItems}
          pagination={false}
          scroll={{ x: scrollX }}
            summary={() => {
              const totalAppQty = items.reduce(
                (acc, it) => acc + (Number(it.ApprovedQnty ?? it.approvedQty) || 0),
                0
              );
              const actualQtyIndex = tableColumns.findIndex(
                (col: any) => (col.key || col.dataIndex) === "actualQty"
              );
              const colSpanBefore = actualQtyIndex > 0 ? actualQtyIndex : 1;
              const remainingColumns = tableColumns.slice(colSpanBefore);

              return (
                <Table.Summary fixed="bottom">
                  <Table.Summary.Row style={{ background: "#f7fbfa", fontWeight: 600 }}>
                    <Table.Summary.Cell index={0} colSpan={colSpanBefore} align="center">
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#123443",
                          fontSize: 13,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {t.table.total ? t.table.total.replace(/:$/, "") : "TỔNG CỘNG"}
                      </span>
                    </Table.Summary.Cell>
                    {remainingColumns.map((col: any, idx: number) => {
                      const index = colSpanBefore + idx;
                      const key = String(col.key || col.dataIndex || index);
                      const fixedProps = col.fixed ? { fixed: col.fixed } : {};
                      if (key === "actualQty") {
                        return (
                          <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                            <span style={{ color: "#008f89", fontSize: 13, fontWeight: 600 }}>
                              {totalQty.toLocaleString("vi-VN")}
                            </span>
                          </Table.Summary.Cell>
                        );
                      }
                      if (key === "approvedQty") {
                        return (
                          <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                            <span style={{ color: totalAppQty > 0 ? "#008f89" : "#94A3B8", fontSize: 13, fontWeight: totalAppQty > 0 ? 600 : 400 }}>
                              {totalAppQty > 0 ? totalAppQty.toLocaleString("vi-VN") : "---"}
                            </span>
                          </Table.Summary.Cell>
                        );
                      }
                      if (key === "unitPrice") {
                        return (
                          <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                            <span style={{ color: "#94A3B8", fontWeight: 400 }}>---</span>
                          </Table.Summary.Cell>
                        );
                      }
                      if (key === "totalPrice") {
                        return (
                          <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                            <span style={{ color: "#123443", fontSize: 13, fontWeight: 600 }}>
                              {totalAmount.toLocaleString("vi-VN")}
                            </span>
                          </Table.Summary.Cell>
                        );
                      }
                      return <Table.Summary.Cell key={key} index={index} {...fixedProps} />;
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
        onWorkflowUpdated={() => {
          const transId = getEditingTransId();
          if (transId) fetchSubmissions(transId);
        }}
      />
    </div>
  );
}
