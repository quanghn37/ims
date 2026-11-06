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
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconDeviceFloppy,
  IconPlus,
  IconRefresh,
  IconCircleX,
  IconTrash,
  IconSend,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import dayjs from "dayjs";
import {
  MaterialRequisition,
  MaterialRequisitionItem,
  MOCK_WAREHOUSES,
} from "../../types";
import { warehouseApi } from "../../api";
import { extractApiList } from "@/lib/api-client";
import { useRequisitionLov } from "../_hooks/useRequisitionLov";
import RequisitionLovModals from "./RequisitionLovModals";
import RequisitionPendingDrawer from "./RequisitionPendingDrawer";
import RequisitionItemEditDrawer from "./RequisitionItemEditDrawer";
import InventoryWorkflowDrawer from "../../receipt/_components/InventoryWorkflowDrawer";
import ApprovalBadge, { renderApprovalBadge } from "@/components/common/ApprovalBadge";
import { isTransactionApprovedOrRejected } from "../../_components/UnconfirmTransactionButton";
import { useTranslation } from "@/locales/LanguageContext";
import ResizableTitle from "@/components/table/ResizableTitle";
import { usePersistedTableColumns } from "@/components/table/usePersistedTableColumns";
import ErpDetailCard from "@/components/common/ErpDetailCard";

const { Text } = Typography;

interface RequisitionEditTabProps {
  open: boolean;
  onClose: () => void;
  editingRequisition: MaterialRequisition | null;
  onSave: (data: MaterialRequisition, isNewlyCreated?: boolean) => void | Promise<void>;
  onDelete?: (record: MaterialRequisition) => void | Promise<void>;
  onUpdateEditingRequisition?: (record: MaterialRequisition) => void;
}

export default function RequisitionEditTab({
  open,
  onClose,
  editingRequisition,
  onSave,
  onDelete,
  onUpdateEditingRequisition,
}: RequisitionEditTabProps) {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Danh sách vật tư chi tiết
  const [items, setItems] = useState<MaterialRequisitionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // State Drawer Thêm vật tư từ kho (RequisitionPendingDrawer)
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

  // State Drawer sửa vật tư (RequisitionItemEditDrawer)
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialRequisitionItem | null>(null);

  // State Drawer quy trình duyệt (Workflow)
  const [selectedWorkflowItem, setSelectedWorkflowItem] = useState<any>(null);



  // State danh sách Orgcode (Approved Budget: api/get-approvedbudget-list)
  const [approvedBudgetList, setApprovedBudgetList] = useState<any[]>([]);
  const [loadingApprovedBudget, setLoadingApprovedBudget] = useState(false);

  const fetchApprovedBudgets = async (contractId: number | string | null | undefined): Promise<any[]> => {
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
  };

  const orgCodeOptions: Array<{ value: string; label: string; title?: string }> = useMemo(() => {
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

  // Hook quản lý toàn bộ các Popup LOV (Hợp đồng CĐT, Đối tác, Kho xuất)
  const lov = useRequisitionLov(form, () => setApprovedBudgetList([]));

  // Lấy TransactionId từ phiếu hiện tại (hỗ trợ cả number, string "38", hoặc "req_38")
  const getEditingTransId = (): number | null => {
    const raw =
      (editingRequisition as any)?.TransactionId ??
      (editingRequisition as any)?.transactionId ??
      (editingRequisition as any)?.Id ??
      editingRequisition?.id;
    if (raw !== null && raw !== undefined) {
      if (!isNaN(Number(raw))) return Number(raw);
      if (typeof raw === "string") {
        const m = raw.match(/\d+/);
        if (m) return Number(m[0]);
      }
    }
    return null;
  };

  // Mapper chuẩn hóa dữ liệu từ API get-inventory-submission sang MaterialRequisitionItem
  const mapSubmissionItem = (it: any, idx: number): MaterialRequisitionItem => {
    const subId = it.SubmissionId ?? it.submissionId;
    const localId = it.LocalId ?? it.localId;
    const matId = it.MaterialId ?? localId;
    const sysCode = it.SystemCode || it.itemCode || it.ItemCode || "";
    const desc = it.Description || it.itemName || it.ItemName || "";
    const unit = it.Unit || it.unit || it.UomCode || "";
    const qnty = Number(it.Qnty ?? it.requestedQty ?? 0);
    const appQty =
      it.ApprovedQty !== null && it.ApprovedQty !== undefined
        ? Number(it.ApprovedQty)
        : it.approvedQty
        ? Number(it.approvedQty)
        : null;
    const orgCode = it.Orgcode || it.orgCode || "---";
    const orgName = it.OrgName || it.orgName || "";
    const statusCode = it.StatusCode || it.statusCode || "";
    const approvalStatus = it.ApprovalStatus ?? it.approvalStatus;

    return {
      id: String(subId || localId || `item_${idx + 1}`),
      SubmissionId: subId,
      submissionId: subId,
      LocalId: localId,
      localId: localId,
      MaterialId: matId,
      itemCode: sysCode,
      ItemCode: sysCode,
      SystemCode: sysCode,
      itemName: desc,
      ItemName: desc,
      Description: desc,
      unit: unit,
      Unit: unit,
      requestedQty: qnty,
      Qnty: qnty,
      approvedQty: appQty,
      ApprovedQty: appQty,
      orgCode: orgCode,
      Orgcode: orgCode,
      orgName: orgName,
      OrgName: orgName,
      Remarks: it.Remarks || it.remarks || it.note || "",
      remarks: it.Remarks || it.remarks || it.note || "",
      note: it.Remarks || it.remarks || it.note || "",
      status: it.status || statusCode || "PENDING",
      StatusCode: statusCode,
      ApprovalStatus: approvalStatus,
      unitPrice: Number(it.UnitPrice ?? it.unitPrice ?? 0),
      UnitPrice: Number(it.UnitPrice ?? it.unitPrice ?? 0),
      amount: Number(it.Amount ?? it.amount ?? 0),
      Amount: Number(it.Amount ?? it.amount ?? 0),
      taxRate: Number(it.TaxRate ?? 0),
      taxAmount: Number(it.TaxAmount ?? 0),
      availableQty: Number(it.AvailableQty ?? 0),
      editable: it.Editable !== undefined ? it.Editable : 1,
      Editable: it.Editable !== undefined ? it.Editable : 1,
    } as any;
  };

  // Tải danh sách chi tiết submission từ API get-inventory-submission
  const fetchSubmissions = async (transactionId: number | string): Promise<MaterialRequisitionItem[]> => {
    setLoadingItems(true);
    try {
      const res = await warehouseApi.getInventorySubmissions({
        DisplayMode: "Request",
        TransactionId: Number(transactionId),
        WSId: "",
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList<any>(res);
      if (list && list.length > 0) {
        const mapped = list.map(mapSubmissionItem);
        setItems(mapped);
        return mapped;
      } else {
        setItems([]);
        return [];
      }
    } catch (err) {
      console.warn("Lỗi khi tải chi tiết submission cho phiếu yêu cầu:", err);
      return [];
    } finally {
      setLoadingItems(false);
    }
  };

  // Khởi tạo form khi mở tab
  useEffect(() => {
    if (editingRequisition) {
      const initialContractCode =
        (editingRequisition as any).contractCode ||
        editingRequisition.projectName ||
        "";
      const rawTarget =
        (editingRequisition as any).targetName ||
        editingRequisition.contractorName ||
        "";
      const initialTargetName = rawTarget && rawTarget !== "---" ? rawTarget : null;
      const initialClientId =
        (editingRequisition as any).clientId ??
        (editingRequisition as any).ClientId ??
        null;
      const initialWhName =
        editingRequisition.warehouseName ||
        (editingRequisition.warehouseId ? `Kho #${editingRequisition.warehouseId}` : "");

      form.setFieldsValue({
        contractCode: initialContractCode,
        mainContractId: (editingRequisition as any).mainContractId ?? (editingRequisition as any).SubconOf ?? undefined,
        issueType:
          (editingRequisition as any).SubType === "Project" ||
          (editingRequisition as any).issueType === "CONSTRUCTION" ||
          !(editingRequisition as any).issueType
            ? "Project"
            : (editingRequisition as any).issueType,
        targetName: initialTargetName,
        clientId: initialClientId,
        warehouseId: editingRequisition.warehouseId || undefined,
        warehouseName: initialWhName,
        requisitionDate: editingRequisition.requisitionDate
          ? dayjs(editingRequisition.requisitionDate)
          : dayjs(),
        requisitionCode: editingRequisition.requisitionCode || "",
        description: editingRequisition.description || "",
      });
      lov.setSelectedMainContractDisplay(initialContractCode);
      lov.setSelectedClientDisplay(initialTargetName || "");
      lov.setSelectedWarehouseDisplay(initialWhName);

      // Map danh sách items có sẵn
      const initialItems = (editingRequisition.items || []).map((it, idx) => ({
        ...it,
        id: it.id || `item_${idx + 1}`,
        orgCode: (it as any).orgCode || (it as any).Orgcode || `HM0${(idx % 3) + 1}-MONG`,
        status: (it as any).status || editingRequisition.status || "PENDING",
      }));
      setItems(initialItems);

      // Nếu phiếu đã có TransactionId trên hệ thống, tải chi tiết submission thực tế
      const transId = getEditingTransId();
      if (transId) {
        fetchSubmissions(transId);
      }

      // Không tự động gọi API get-approvedbudget-list khi vào chi tiết phiếu (chỉ gọi khi bấm "Thêm vật tư")
      setApprovedBudgetList([]);
    } else {
      const now = dayjs();
      form.setFieldsValue({
        contractCode: "",
        mainContractId: undefined,
        issueType: "Project",
        targetName: null,
        clientId: null,
        warehouseId: undefined,
        warehouseName: "",
        requisitionDate: now,
        requisitionCode: "",
        description: "",
      });
      lov.setSelectedMainContractDisplay("");
      lov.setSelectedClientDisplay("");
      lov.setSelectedWarehouseDisplay("");
      setItems([]);
      setApprovedBudgetList([]);
    }
  }, [editingRequisition, form, open]);

  // Submit thông tin chung phiếu yêu cầu xuất
  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const now = dayjs();
      const docDate = values.requisitionDate
        ? values.requisitionDate.format("YYYY-MM-DD")
        : now.format("YYYY-MM-DD");

      // 1. Trường hợp TẠO MỚI phiếu yêu cầu xuất: Gọi POST api/upsert-inventory-request (UpdateMode: Create_request)
      if (!editingRequisition) {
        const subType =
          values.issueType === "CONSTRUCTION" || !values.issueType
            ? "Project"
            : values.issueType;

        const subconOf = !isNaN(Number(values.mainContractId))
          ? Number(values.mainContractId)
          : values.mainContractId;

        const warehouseId = !isNaN(Number(values.warehouseId))
          ? Number(values.warehouseId)
          : values.warehouseId;

        const resolvedClientId =
          values.clientId !== undefined &&
          values.clientId !== null &&
          String(values.clientId).trim() !== ""
            ? values.clientId
            : null;

        const res = await warehouseApi.upsertInventoryRequest(
          {
            WSId: "",
            SubType: subType,
            SubconOf: subconOf,
            WarehouseId: warehouseId,
            ReceiptFrom: "",
            ClientId: resolvedClientId,
            DocDate: docDate,
            Description: (values.description || "").trim(),
          },
          "Create_request"
        );

        const created = res?.Data || (Array.isArray(res) ? res[0]?.Data || res[0] : res) || {};
        const transId = created.TransactionId ?? created.Id;
        const docCode =
          created.DocCode ||
          values.requisitionCode ||
          `MR-${now.format("YYYY-MM")}/001`;
        const whName =
          created.WarehouseName ||
          lov.selectedWarehouseDisplay ||
          values.warehouseName ||
          `Kho #${warehouseId}`;
        const projCode = created.ProjectCode || values.contractCode || "";
        const projName =
          created.ProjectName ||
          lov.selectedMainContractDisplay ||
          projCode ||
          "---";
        const receiverName =
          created.ReceiverName ||
          lov.selectedClientDisplay ||
          values.targetName ||
          null;

        form.setFieldsValue({ requisitionCode: docCode });

        const savedStatus = created.Status ?? 0;
        const savedStatusName = created.StatusName || created.ApprovalStatusName || "Đang lập";

        const savedData: MaterialRequisition = {
          id: String(transId || `req_${Date.now()}`),
          requisitionCode: docCode,
          requisitionDate: created.DocDate || docDate,
          expectedDate: created.DocDate || docDate,
          priority: "NORMAL",
          projectName: projName,
          workPackage: "",
          contractorName: receiverName || "---",
          requesterName: String(created.CreatedBy || "r@gmail.com"),
          warehouseId: String(created.WarehouseId ?? warehouseId),
          warehouseName: whName,
          status: "DRAFT",
          Status: savedStatus,
          StatusCode: String(savedStatus),
          StatusName: savedStatusName,
          ApprovalStatus: savedStatus,
          ApprovalStatusName: savedStatusName,
          description: created.Description || values.description || "",
          totalRequestedQty: 0,
          totalApprovedQty: 0,
          itemCount: 0,
          items: [],
          createdBy: String(created.CreatedBy || "r@gmail.com"),
          createdDate: created.CreatedDate || now.format("YYYY-MM-DD HH:mm"),

          // Raw API fields
          TransactionId: transId,
          SubType: created.SubType || subType,
          DocCode: docCode,
          DocDate: created.DocDate || docDate,
          Description: created.Description || values.description || "",
          WarehouseId: created.WarehouseId ?? warehouseId,
          WarehouseName: whName,
          SubconOf: created.SubconOf ?? subconOf,
          ProjectCode: projCode,
          ProjectName: projName,
          ClientId: created.ClientId ?? resolvedClientId,
          ReceiverName: receiverName,
          contractCode: projCode,
          targetName: receiverName,
          clientId: created.ClientId ?? resolvedClientId,
          mainContractId: created.SubconOf ?? subconOf,
        } as any;

        message.success(
          res?.Message || "Tạo thông tin chung phiếu yêu cầu cấp phát vật tư thành công."
        );
        await onSave(savedData, true);
        return;
      }

      // 2. Trường hợp CẬP NHẬT phiếu yêu cầu đã có
      const selectedWh =
        (lov.warehouseList as any[]).find(
          (w) => String(w.WarehouseId ?? w.id ?? w.Id) === String(values.warehouseId)
        ) || MOCK_WAREHOUSES.find((w) => w.id === values.warehouseId);

      const code =
        values.requisitionCode ||
        editingRequisition?.requisitionCode ||
        `MR-${now.format("YYYY-MM")}/${String(Math.floor(Math.random() * 900) + 100)}`;

      const totalReq = items.reduce((sum, it) => sum + Number(it.requestedQty || 0), 0);
      const totalApp = items.reduce((sum, it) => sum + Number(it.approvedQty || 0), 0);

      const transId =
        (editingRequisition as any)?.TransactionId ??
        (editingRequisition as any)?.Id ??
        (!isNaN(Number(editingRequisition?.id)) ? Number(editingRequisition?.id) : null);

      if (transId) {
        await warehouseApi.updateInventoryTransactionInfo({
          TransactionId: Number(transId),
          DocDate: docDate,
          Description: (values.description || "").trim(),
        });
      }

      const savedData: MaterialRequisition = {
        ...editingRequisition,
        id: editingRequisition.id,
        requisitionCode: code,
        requisitionDate: docDate,
        expectedDate:
          editingRequisition?.expectedDate ||
          now.add(1, "day").format("YYYY-MM-DD"),
        priority: editingRequisition?.priority || "NORMAL",
        projectName:
          lov.selectedMainContractDisplay ||
          values.contractCode ||
          editingRequisition.projectName,
        contractorName:
          lov.selectedClientDisplay ||
          values.targetName ||
          editingRequisition.contractorName,
        requesterName: editingRequisition?.requesterName || "KS. Nguyễn Văn Thắng",
        warehouseId: values.warehouseId || editingRequisition?.warehouseId || "",
        warehouseName:
          lov.selectedWarehouseDisplay ||
          (selectedWh as any)?.WarehouseName ||
          (selectedWh as any)?.name ||
          editingRequisition.warehouseName,
        status: editingRequisition?.status || "PENDING",
        description: values.description || "",
        totalRequestedQty: totalReq,
        totalApprovedQty: totalApp,
        itemCount: items.length,
        items,
        ...(values.contractCode ? { contractCode: values.contractCode } : {}),
        ...(values.mainContractId ? { mainContractId: values.mainContractId } : {}),
        ...(values.issueType ? { issueType: values.issueType } : {}),
        ...(values.targetName ? { targetName: values.targetName } : {}),
        ...(values.clientId ? { clientId: values.clientId } : {}),
      };

      await onSave(savedData, false);
    } catch (err: any) {
      console.error("Lỗi khi lưu phiếu yêu cầu:", err);
      message.error(err?.message || "Lưu phiếu yêu cầu thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Mở drawer thêm vật tư từ kho (RequisitionPendingDrawer)
  const handleOpenAddItem = () => {
    const transId =
      (editingRequisition as any)?.TransactionId ??
      (editingRequisition as any)?.Id ??
      (!isNaN(Number(editingRequisition?.id)) ? Number(editingRequisition?.id) : null);

    if (!editingRequisition || !transId) {
      message.warning(t.requisition.pleaseSaveFirst);
      return;
    }

    const rawWhId =
      form.getFieldValue("warehouseId") ??
      editingRequisition?.warehouseId ??
      (editingRequisition as any)?.WarehouseId;

    if (!rawWhId) {
      message.warning(t.requisition.pleaseSelectWhFirst);
      lov.handleOpenWarehouseLov();
      return;
    }

    setIsPendingModalOpen(true);
  };

  // Xác nhận thêm các vật tư đã chọn từ RequisitionPendingDrawer
  const handleConfirmAddPendingItems = (newItems: MaterialRequisitionItem[]) => {
    const transId = getEditingTransId();
    if (transId) {
      fetchSubmissions(transId);
    } else {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  // Mở Drawer sửa vật tư (RequisitionItemEditDrawer)
  const handleOpenEditItem = (item: MaterialRequisitionItem) => {
    setEditingItem(item);
    const contractId =
      (editingRequisition as any)?.SubconOf ??
      (editingRequisition as any)?.subconOf ??
      form.getFieldValue("mainContractId") ??
      (editingRequisition as any)?.mainContractId ??
      (editingRequisition as any)?.ContractId;
    if (contractId && (!approvedBudgetList || approvedBudgetList.length === 0)) {
      fetchApprovedBudgets(contractId);
    }
    setIsItemDrawerOpen(true);
  };

  // Lưu thay đổi từ Drawer sửa vật tư
  const handleSaveItemDrawer = (updatedItem: MaterialRequisitionItem) => {
    setItems((prev) =>
      prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
    );
  };

  // Xóa một dòng vật tư (Map API: POST /api/upsert-inventory-submission, UpdateMode: "Delete_InventorySubmission")
  const handleDeleteItem = async (record: MaterialRequisitionItem) => {
    const subId =
      (record as any).SubmissionId ??
      (record as any).LocalId ??
      (!isNaN(Number(record.id)) ? Number(record.id) : null);

    try {
      if (subId) {
        const res = await warehouseApi.deleteInventorySubmission(Number(subId));
        setItems((prev) =>
          prev.filter(
            (it) =>
              it.id !== record.id &&
              String((it as any).SubmissionId ?? "") !== String(subId)
          )
        );
        message.success(res?.Message || t.requisition.deleteItemSuccess);
      } else {
        setItems((prev) => prev.filter((it) => it.id !== record.id));
        message.success(t.requisition.deleteItemSuccess);
      }
    } catch (err: any) {
      console.error("Lỗi khi xóa vật tư yêu cầu:", err);
      message.error(err?.message || t.requisition.deleteItemFailed);
    }
  };

  // --- Xử lý Trình duyệt phiếu yêu cầu xuất ---
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const isEditing = Boolean(editingRequisition);

  // Xác định trạng thái "Đang lập" dựa vào Status = 0 để hiển thị nút Trình duyệt / Thêm mới / Chỉnh sửa
  const isApprovalStatusZero = useMemo(() => {
    const rawStatus =
      editingRequisition?.Status ??
      (editingRequisition as any)?.StatusCode ??
      (editingRequisition as any)?.status ??
      editingRequisition?.ApprovalStatus;

    if (rawStatus !== undefined && rawStatus !== null && !isNaN(Number(rawStatus))) {
      return Number(rawStatus) === 0;
    }

    const name = String(
      editingRequisition?.StatusName ||
      editingRequisition?.ApprovalStatusName ||
      ""
    ).toLowerCase().trim();

    return name.includes("đang lập") || name.includes("draft");
  }, [editingRequisition]);

  // Định nghĩa cột cho bảng vật tư chi tiết
  const columns: ColumnsType<MaterialRequisitionItem> = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 45,
        align: "center",
        cannotHide: true,
        render: (_, __, index) => index + 1,
      },
      {
        title: "OrgCode",
        dataIndex: "orgCode",
        key: "orgCode",
        width: 100,
        render: (val: any, r: any) => {
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
        render: (val: any, r: any) => {
          const orgName = val || r.OrgName || r.orgName || "";
          if (!orgName) return <span style={{ color: "#94A3B8", fontSize: 12.5 }}>---</span>;
          return (
            <span style={{ color: "#123443", fontSize: 12.5 }} title={orgName}>
              {orgName}
            </span>
          );
        },
      },
      {
        title: t.table.itemCode || "Item Code",
        dataIndex: "itemCode",
        key: "itemCode",
        width: 120,
        render: (_: any, r: any) => {
          const code = r.SystemCode || r.itemCode || r.ItemCode || "";
          return (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: code ? "#1e293b" : "#94A3B8",
                fontSize: 12.5,
              }}
            >
              {code || "---"}
            </span>
          );
        },
      },
      {
        title: t.table.itemName || "Item Name",
        dataIndex: "itemName",
        key: "itemName",
        width: 240,
        render: (name: string, r: any) => {
          const desc = name || r.Description || r.ItemName || "---";
          return (
            <span style={{ color: "#123443", fontSize: 12.5 }} title={desc}>
              {desc}
            </span>
          );
        },
      },
      {
        title: t.table.unit,
        dataIndex: "unit",
        key: "unit",
        width: 55,
        align: "center",
        render: (val: any, r: any) => (
          <span style={{ fontSize: 12 }}>{val || r.Unit || r.UomCode || "---"}</span>
        ),
      },
      {
        title: t.table.reqQty,
        dataIndex: "requestedQty",
        key: "requestedQty",
        width: 85,
        align: "right",
        render: (val: any, r: any) => (
          <span style={{ color: "#123443", fontSize: 12 }}>
            {Number(val ?? r.Qnty ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        title: t.table.appQty,
        dataIndex: "approvedQty",
        key: "approvedQty",
        width: 85,
        align: "right",
        render: (val: any, r: any) => {
          const num = Number(val ?? r.ApprovedQty ?? 0);
          return num > 0 ? (
            <span style={{ color: "#059669", fontSize: 12 }}>
              {num.toLocaleString("vi-VN")}
            </span>
          ) : (
            <span style={{ color: "#94A3B8", fontSize: 12 }}>---</span>
          );
        },
      },
      {
        title: t.table.remarks,
        dataIndex: "Remarks",
        key: "Remarks",
        width: 140,
        ellipsis: true,
        render: (val: any, r: any) => {
          const text = val || r.Remarks || r.remarks || r.note || "";
          return text ? (
            <Tooltip title={text}>
              <span style={{ color: "#334155", fontSize: 12 }}>{text}</span>
            </Tooltip>
          ) : (
            <span style={{ color: "#94A3B8", fontSize: 12 }}>---</span>
          );
        },
      },
      {
        title: t.table.status,
        dataIndex: "StatusCode",
        key: "StatusCode",
        width: 110,
        align: "left",
        render: (val: any, record: any) => {
          const subId = record.SubmissionId ?? record.LocalId;
          const statusText = val || record.status || "---";
          return (
            <Tooltip
              title={
                subId
                  ? (t.requisition.clickToViewWorkflow || "Nhấp để xem quy trình duyệt (Mã #{id})").replace("{id}", String(subId))
                  : t.requisition.noWorkflowYet || "Chưa có quy trình duyệt"
              }
            >
              <span
                onClick={() => {
                  if (subId) {
                    setSelectedWorkflowItem(record);
                  }
                }}
                style={{
                  cursor: subId ? "pointer" : "default",
                  display: "inline-block",
                }}
              >
                {renderApprovalBadge(statusText, record, language)}
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
        fixed: "right" as const,
        cannotHide: true,
        render: (_: any, record: MaterialRequisitionItem) => {
          if (isEditing && !isApprovalStatusZero) {
            return (
              <ActionIconButton
                action="view"
                size="small"
                onClick={() => handleOpenEditItem({ ...record, Editable: 0 } as any)}
              />
            );
          }

          return (
            <Space size={6}>
              <ActionIconButton
                action="edit"
                size="small"
                onClick={() => handleOpenEditItem(record)}
              />
              <Popconfirm
                title={t.common.deleteConfirmTitle}
                description={t.common.deleteConfirmDesc}
                onConfirm={() => handleDeleteItem(record)}
                okText={t.common.delete}
                cancelText={t.common.cancel}
                okButtonProps={{ danger: true }}
              >
                <ActionIconButton
                  action="delete"
                  size="small"
                />
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [approvedBudgetList, t, isEditing, isApprovalStatusZero]
  );

  const { tableColumns, scrollX } = usePersistedTableColumns({
    tableKey: "warehouse_requisition_detail_items_v2",
    columns: columns as any,
    actionColumnKey: "action",
    defaultScrollX: 1150,
  });

  const handleRefreshItems = () => {
    const transId = getEditingTransId();
    if (transId) {
      fetchSubmissions(transId).then((res) => {
        if (res && res.length > 0) {
          message.success("Đã làm mới danh mục vật tư!");
        } else {
          message.info("Không có vật tư nào trong phiếu yêu cầu này!");
        }
      });
    } else if (editingRequisition?.items) {
      setItems(editingRequisition.items);
      message.success("Đã làm mới danh mục vật tư!");
    } else {
      message.info("Danh mục vật tư trống!");
    }
  };

  const handleSubmitApproval = async () => {
    const rawId =
      getEditingTransId() ??
      (editingRequisition as any)?.TransactionId ??
      (editingRequisition as any)?.transactionId ??
      (editingRequisition as any)?.Id ??
      (!isNaN(Number(editingRequisition?.id)) ? Number(editingRequisition?.id) : undefined);

    if (!rawId) {
      message.error("Không tìm thấy mã phiếu để trình duyệt.");
      return;
    }

    if (!items || items.length === 0) {
      message.warning("Phiếu yêu cầu chưa có chi tiết vật tư để trình duyệt.");
      return;
    }

    try {
      setSubmittingApproval(true);
      const res: any = await warehouseApi.submitInventoryApproval({
        TransactionId: Number(rawId),
      });

      if (res?.Success === false) {
        message.error(res?.Message || "Trình duyệt phiếu yêu cầu thất bại!");
        return;
      }

      message.success(
        res?.Message || "Trình duyệt phiếu yêu cầu thành công! Trạng thái chuyển sang Chờ duyệt."
      );

      const approvalStatus = res?.Data?.ApprovalStatus ?? 2;
      const approvalStatusName = res?.Data?.ApprovalStatusName ?? "Chờ duyệt";
      const statusName = res?.Data?.StatusName ?? "Chờ duyệt";

      const updatedRequisition: MaterialRequisition = {
        ...editingRequisition!,
        Status: approvalStatus,
        StatusCode: String(approvalStatus),
        StatusName: statusName,
        ApprovalStatus: approvalStatus,
        ApprovalStatusName: approvalStatusName,
        status: "PENDING",
      };

      if (onUpdateEditingRequisition) {
        onUpdateEditingRequisition(updatedRequisition);
      }

      fetchSubmissions(Number(rawId));
    } catch (err: any) {
      console.error("Lỗi trình duyệt phiếu yêu cầu:", err);
      message.error(err?.message || "Trình duyệt phiếu yêu cầu thất bại!");
    } finally {
      setSubmittingApproval(false);
    }
  };

  return (
    <div style={{ padding: "10px 18px", minHeight: "calc(100vh - 110px)", background: "#fff" }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Top Action Bar (Compact) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: "1px solid #F1F5F9",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Text strong style={{ fontSize: 13, color: "#008f89", fontWeight: 700, textTransform: "uppercase" }}>
            {t.section.generalInfoRequisition}
          </Text>

          <Space size={8}>
            {/* Nút Trình duyệt: chỉ hiển thị khi có phiếu và trạng thái là Đang lập / Draft */}
            {isEditing && isApprovalStatusZero && (
              <Popconfirm
                title="Xác nhận trình duyệt phiếu yêu cầu xuất này?"
                description="Sau khi trình duyệt, phiếu yêu cầu sẽ chuyển sang trạng thái Chờ duyệt."
                onConfirm={handleSubmitApproval}
                okText="Trình duyệt"
                cancelText={t.common.cancel || "Hủy"}
                okButtonProps={{ loading: submittingApproval }}
              >
                <Button
                  type="primary"
                  icon={<IconSend size={15} strokeWidth={1.8} />}
                  loading={submittingApproval}
                  style={{
                    background: "#008f89",
                    borderColor: "#008f89",
                    height: 32,
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6,
                    color: "#FFFFFF",
                    boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Trình duyệt
                </Button>
              </Popconfirm>
            )}

            {editingRequisition && onDelete && !isTransactionApprovedOrRejected(editingRequisition) && (
              <Popconfirm
                title={t.common.deleteConfirmTitle || "Xác nhận xóa phiếu này?"}
                description={t.common.deleteConfirmDesc || "Hành động này sẽ xóa phiếu yêu cầu và không thể hoàn tác."}
                onConfirm={() => onDelete(editingRequisition)}
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
            {!isTransactionApprovedOrRejected(editingRequisition) && (
              <Button
                type="primary"
                icon={<IconDeviceFloppy size={16} strokeWidth={2} />}
                htmlType="submit"
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
              >
                {editingRequisition ? t.common.update : t.common.save}
              </Button>
            )}
          </Space>
        </div>

        {/* Khung Thông Tin Chung (Compact - Chuẩn đồng bộ dự án ~80px) */}
        <div className="erp-general-info-card" style={{ marginBottom: 8 }}>
          {/* Hàng 1: 4 Cột */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: Hợp đồng CĐT (Map API get-contract-list) */}
            <Col span={7} className="erp-info-cell">
              <span className="erp-info-label">
                {t.requisition.contractClient} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
              <Form.Item
                name="contractCode"
                style={{ display: "none" }}
                rules={[{ required: true, message: t.requisition.reqContract }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="mainContractId" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <div
                onClick={lov.handleOpenMainContractLov}
                className="erp-info-value"
                style={{
                  cursor: "pointer",
                  color: lov.selectedMainContractDisplay ? "#1e293b" : "#94A3B8",
                  justifyContent: "space-between",
                  userSelect: "none",
                }}
                title={lov.selectedMainContractDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lov.selectedMainContractDisplay || t.requisition.selectContractClient}
                </span>
                {lov.selectedMainContractDisplay && (
                  <IconCircleX
                    size={14}
                    strokeWidth={1.8}
                    style={{ color: "#94A3B8", cursor: "pointer", flexShrink: 0, marginLeft: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      lov.handleClearMainContract();
                    }}
                  />
                )}
              </div>
            </Col>

            {/* Cột 2: Loại xuất */}
            <Col span={5} className="erp-info-cell">
              <span className="erp-info-label">
                {t.requisition.issueType} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
              <Form.Item
                name="issueType"
                style={{ margin: 0 }}
                rules={[{ required: true, message: t.requisition.reqIssueType }]}
              >
                <Select
                  size="small"
                  variant="borderless"
                  options={[
                    { value: "Project", label: t.requisition.issueTypeProject },
                    { value: "SUB_CONTRACTOR", label: t.requisition.issueTypeSubcon },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Cột 3: Tên đối tượng (Map API get-client-list) */}
            <Col span={6} className="erp-info-cell">
              <span className="erp-info-label">
                {t.requisition.targetName}
              </span>
              <Form.Item
                name="targetName"
                style={{ display: "none" }}
              >
                <Input />
              </Form.Item>
              <Form.Item name="clientId" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <div
                onClick={lov.handleOpenClientLov}
                className="erp-info-value"
                style={{
                  cursor: "pointer",
                  color: lov.selectedClientDisplay ? "#1e293b" : "#94A3B8",
                  justifyContent: "space-between",
                  userSelect: "none",
                }}
                title={lov.selectedClientDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lov.selectedClientDisplay || t.requisition.selectTarget}
                </span>
                {lov.selectedClientDisplay && (
                  <IconCircleX
                    size={14}
                    strokeWidth={1.8}
                    style={{ color: "#94A3B8", cursor: "pointer", flexShrink: 0, marginLeft: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      lov.handleClearClient();
                    }}
                  />
                )}
              </div>
            </Col>

            {/* Cột 4: Kho xuất (Map API get-warehouse-list) */}
            <Col span={6} className="erp-info-cell">
              <span className="erp-info-label">
                {t.requisition.issueWarehouse} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
              <Form.Item
                name="warehouseId"
                style={{ display: "none" }}
                rules={[{ required: true, message: t.requisition.reqWarehouse }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="warehouseName" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <div
                onClick={lov.handleOpenWarehouseLov}
                className="erp-info-value"
                style={{
                  cursor: "pointer",
                  color: lov.selectedWarehouseDisplay ? "#1e293b" : "#94A3B8",
                  justifyContent: "space-between",
                  userSelect: "none",
                }}
                title={lov.selectedWarehouseDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lov.selectedWarehouseDisplay || t.requisition.selectIssueWarehouse}
                </span>
                {lov.selectedWarehouseDisplay && (
                  <IconCircleX
                    size={14}
                    strokeWidth={1.8}
                    style={{ color: "#94A3B8", cursor: "pointer", flexShrink: 0, marginLeft: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      lov.handleClearWarehouse();
                    }}
                  />
                )}
              </div>
            </Col>
          </Row>

          <div className="erp-info-divider" />

          {/* Hàng 2: 4 Cột (Ngày yêu cầu, Số yêu cầu, Nội dung yêu cầu, Trạng thái phiếu) */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: Ngày yêu cầu */}
            <Col span={5} className="erp-info-cell">
              <span className="erp-info-label">
                {t.requisition.requisitionDate} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
              <Form.Item
                name="requisitionDate"
                style={{ margin: 0 }}
                rules={[{ required: true, message: t.requisition.reqDate }]}
              >
                <DatePicker
                  size="small"
                  variant="borderless"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>

            {/* Cột 2: Số yêu cầu (Tự sinh) */}
            <Col span={5} className="erp-info-cell">
              <span className="erp-info-label">
                {t.requisition.requisitionCodeAuto}
              </span>
              <Form.Item name="requisitionCode" style={{ margin: 0 }}>
                <Input
                  size="small"
                  variant="borderless"
                  readOnly
                  placeholder={t.requisition.autoGenOnSave}
                  style={{
                    fontFamily: "monospace",
                  }}
                />
              </Form.Item>
            </Col>

            {/* Cột 3: Nội dung yêu cầu */}
            <Col span={10} className="erp-info-cell">
              <span className="erp-info-label">
                {t.requisition.contentDescription} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
              <Form.Item
                name="description"
                style={{ margin: 0 }}
                rules={[{ required: true, message: t.requisition.reqContent }]}
              >
                <Input
                  size="small"
                  variant="borderless"
                  placeholder={t.requisition.contentPlaceholder}
                />
              </Form.Item>
            </Col>

            {/* Cột 4: Trạng thái */}
            <Col span={4} className="erp-info-cell">
              <span className="erp-info-label">
                {t.table.status}
              </span>
              <div style={{ display: "flex", alignItems: "center", height: 24, paddingLeft: 8 }}>
                <ApprovalBadge
                  val={editingRequisition?.Status ?? editingRequisition?.StatusCode ?? 0}
                  record={editingRequisition}
                  customLabel={
                    editingRequisition?.StatusName ||
                    editingRequisition?.ApprovalStatusName ||
                    ((editingRequisition?.Status ?? 0) === 0 ? "Đang lập" : undefined)
                  }
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* VÙNG II: CHI TIẾT VẬT TƯ (BỌC TRONG ERP DETAIL CARD DÙNG CHUNG) */}
        <ErpDetailCard
          title={t.section.detailList}
          actions={
            <Space size={8}>
              <Button
                icon={<IconRefresh size={15} strokeWidth={1.8} />}
                loading={loadingItems}
                onClick={handleRefreshItems}
                style={{
                  height: 32,
                  borderRadius: 6,
                  borderColor: "#dce5e6",
                  fontSize: 13,
                }}
              >
                {t.common.refresh}
              </Button>
              {(!isEditing || isApprovalStatusZero) && (
                <Button
                  type="primary"
                  icon={<IconPlus size={16} strokeWidth={2} />}
                  onClick={handleOpenAddItem}
                  style={{
                    background: "#008f89",
                    borderColor: "#008f89",
                    height: 32,
                    borderRadius: 6,
                    fontWeight: 500,
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
              const totalReq = items.reduce((sum, it) => sum + Number(it.requestedQty || 0), 0);
              const totalApp = items.reduce((sum, it) => sum + Number(it.approvedQty || 0), 0);
              const reqQtyIndex = tableColumns.findIndex(
                (col: any) => (col.key || col.dataIndex) === "requestedQty"
              );
              const colSpanBeforeQty = reqQtyIndex > 0 ? reqQtyIndex : 1;
              const remainingColumns = tableColumns.slice(colSpanBeforeQty);

              return (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: "#eef8f6", fontWeight: "bold" }}>
                    {/* Gộp các cột trước SL Yêu cầu thành 1 ô hiển thị TỔNG CỘNG */}
                    <Table.Summary.Cell index={0} colSpan={colSpanBeforeQty} align="center">
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

                    {/* Các cột số liệu từ SL Yêu cầu trở đi */}
                    {remainingColumns.map((col: any, idx: number) => {
                      const index = colSpanBeforeQty + idx;
                      const key = String(col.key || col.dataIndex || index);
                      const fixedProps = col.fixed ? { fixed: col.fixed } : {};

                      if (key === "requestedQty") {
                        return (
                          <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                            <Text strong style={{ color: "#123443", fontSize: 13 }}>
                              {totalReq.toLocaleString("vi-VN")}
                            </Text>
                          </Table.Summary.Cell>
                        );
                      }
                      if (key === "approvedQty") {
                        return (
                          <Table.Summary.Cell key={key} index={index} align="right" {...fixedProps}>
                            <Text strong style={{ color: totalApp > 0 ? "#123443" : "#94A3B8", fontSize: 13 }}>
                              {totalApp > 0 ? totalApp.toLocaleString("vi-VN") : "---"}
                            </Text>
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
      </Form>

      {/* DRAWER THÊM VẬT TƯ TỒN KHO (Được tách thành Component RequisitionPendingDrawer riêng biệt) */}
      <RequisitionPendingDrawer
        open={isPendingModalOpen}
        onClose={() => setIsPendingModalOpen(false)}
        warehouseId={
          form.getFieldValue("warehouseId") ??
          editingRequisition?.warehouseId ??
          (editingRequisition as any)?.WarehouseId
        }
        warehouseName={lov.selectedWarehouseDisplay}
        transactionId={
          (editingRequisition as any)?.TransactionId ??
          (editingRequisition as any)?.Id ??
          (!isNaN(Number(editingRequisition?.id)) ? Number(editingRequisition?.id) : null)
        }
        subconOf={
          (editingRequisition as any)?.SubconOf ??
          (editingRequisition as any)?.subconOf ??
          form.getFieldValue("mainContractId") ??
          (editingRequisition as any)?.mainContractId ??
          (editingRequisition as any)?.ContractId
        }
        onConfirm={handleConfirmAddPendingItems}
      />

      {/* DRAWER CHỈNH SỬA CHI TIẾT MẶT HÀNG (Được tách thành Component RequisitionItemEditDrawer riêng biệt) */}
      <RequisitionItemEditDrawer
        open={isItemDrawerOpen}
        onClose={() => setIsItemDrawerOpen(false)}
        editingItem={editingItem}
        subconOf={
          (editingRequisition as any)?.SubconOf ??
          (editingRequisition as any)?.subconOf ??
          form.getFieldValue("mainContractId") ??
          (editingRequisition as any)?.mainContractId ??
          (editingRequisition as any)?.ContractId
        }
        contractId={
          (editingRequisition as any)?.SubconOf ??
          (editingRequisition as any)?.subconOf ??
          form.getFieldValue("mainContractId") ??
          (editingRequisition as any)?.mainContractId ??
          (editingRequisition as any)?.ContractId
        }
        orgCodeOptions={orgCodeOptions}
        loadingOrgCodes={loadingApprovedBudget}
        onSave={handleSaveItemDrawer}
      />

      {/* Drawer xem quy trình phê duyệt & duyệt từng phân công */}
      <InventoryWorkflowDrawer
        open={Boolean(selectedWorkflowItem)}
        onClose={() => setSelectedWorkflowItem(null)}
        itemDetail={selectedWorkflowItem}
        displayMode="Request"
        onWorkflowUpdated={() => {
          const transId = getEditingTransId();
          if (transId) {
            fetchSubmissions(transId);
          }
        }}
      />

      {/* LOV Modals (Hợp đồng CĐT, Đối tác, Kho xuất) */}
      <RequisitionLovModals lov={lov} />
    </div>
  );
}
