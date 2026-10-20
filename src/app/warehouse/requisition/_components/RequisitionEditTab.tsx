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
  Tag,
  Popconfirm,
  message,
  Modal,
  Divider,
  Tooltip,
  Drawer,
  Checkbox,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconSettings,
  IconDeviceFloppy,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconCircleX,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import dayjs from "dayjs";
import {
  MaterialRequisition,
  MaterialRequisitionItem,
  MOCK_WAREHOUSES,
  MOCK_MATERIALS_CATALOG,
} from "../../types";
import { warehouseApi } from "../../api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useRequisitionLov } from "../_hooks/useRequisitionLov";
import RequisitionLovModals from "./RequisitionLovModals";
import RequisitionPendingDrawer from "./RequisitionPendingDrawer";
import RequisitionItemEditDrawer from "./RequisitionItemEditDrawer";
import InventoryWorkflowDrawer from "../../receipt/_components/InventoryWorkflowDrawer";
import { renderApprovalBadge } from "@/components/common/ApprovalBadge";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface RequisitionEditTabProps {
  open: boolean;
  onClose: () => void;
  editingRequisition: MaterialRequisition | null;
  onSave: (data: MaterialRequisition, isNewlyCreated?: boolean) => void | Promise<void>;
}

export default function RequisitionEditTab({
  open,
  onClose,
  editingRequisition,
  onSave,
}: RequisitionEditTabProps) {
  const { t } = useTranslation();
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
      const initialTargetName =
        (editingRequisition as any).targetName ||
        editingRequisition.contractorName ||
        "";
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
        clientId: (editingRequisition as any).clientId ?? (editingRequisition as any).ClientId ?? undefined,
        warehouseId: editingRequisition.warehouseId || undefined,
        warehouseName: initialWhName,
        requisitionDate: editingRequisition.requisitionDate
          ? dayjs(editingRequisition.requisitionDate)
          : dayjs(),
        requisitionCode: editingRequisition.requisitionCode || "",
        description: editingRequisition.description || "",
      });
      lov.setSelectedMainContractDisplay(initialContractCode);
      lov.setSelectedClientDisplay(initialTargetName);
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
        targetName: "",
        clientId: undefined,
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

        const res = await warehouseApi.upsertInventoryRequest(
          {
            WSId: "",
            SubType: subType,
            SubconOf: subconOf,
            WarehouseId: warehouseId,
            ReceiptFrom: "",
            ClientId: String(values.clientId ?? ""),
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
          "---";

        form.setFieldsValue({ requisitionCode: docCode });

        const savedData: MaterialRequisition = {
          id: String(transId || `req_${Date.now()}`),
          requisitionCode: docCode,
          requisitionDate: created.DocDate || docDate,
          expectedDate: created.DocDate || docDate,
          priority: "NORMAL",
          projectName: projName,
          workPackage: "",
          contractorName: receiverName,
          requesterName: String(created.CreatedBy || "r@gmail.com"),
          warehouseId: String(created.WarehouseId ?? warehouseId),
          warehouseName: whName,
          status: "PENDING",
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
          ClientId: created.ClientId ?? values.clientId,
          ReceiverName: receiverName,
          contractCode: projCode,
          targetName: receiverName,
          clientId: created.ClientId ?? values.clientId,
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
      message.warning("Vui lòng bấm 'Lưu Yêu Cầu' để tạo thông tin chung phiếu trước khi thêm vật tư!");
      return;
    }

    const rawWhId =
      form.getFieldValue("warehouseId") ??
      editingRequisition?.warehouseId ??
      (editingRequisition as any)?.WarehouseId;

    if (!rawWhId) {
      message.warning("Vui lòng chọn Kho xuất trước khi thêm vật tư!");
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
        message.success(res?.Message || "Đã xóa mặt hàng khỏi yêu cầu!");
      } else {
        setItems((prev) => prev.filter((it) => it.id !== record.id));
        message.success("Đã xóa mặt hàng khỏi yêu cầu!");
      }
    } catch (err: any) {
      console.error("Lỗi khi xóa vật tư yêu cầu:", err);
      message.error(err?.message || "Xóa mặt hàng thất bại!");
    }
  };

  // Cập nhật số lượng yêu cầu trực tiếp trong bảng
  const handleQuantityChange = (itemId: string, val: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, requestedQty: val } : it))
    );
  };

  // Định nghĩa cột cho bảng vật tư chi tiết
  const columns: ColumnsType<MaterialRequisitionItem> = useMemo(
    () => [
      {
        title: t.table.stt,
        key: "stt",
        width: 42,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: t.table.orgCode,
        dataIndex: "orgCode",
        key: "orgCode",
        width: 140,
        render: (val: any, r: any) => {
          const code = val || r.Orgcode || r.orgCode || "---";
          const orgName = r.OrgName || r.orgName || "";
          return (
            <div>
              <div
                style={{
                  fontWeight: 500,
                  color: "#1E293B",
                  fontSize: 12,
                  lineHeight: "17px",
                  wordBreak: "break-word",
                }}
                title={orgName}
              >
                {orgName || code}
              </div>
              {orgName && code && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#7C3AED",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    marginTop: 2,
                  }}
                >
                  {code}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: t.table.itemName,
        dataIndex: "itemName",
        key: "itemName",
        width: 240,
        render: (name: string, r: any) => {
          const code = r.SystemCode || r.itemCode || r.ItemCode || "";
          const desc = name || r.Description || r.ItemName || "---";
          return (
            <div>
              <div style={{ fontWeight: 500, color: "#1E293B", fontSize: 12, lineHeight: "17px" }}>
                {desc}
              </div>
              {code && (
                <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace", lineHeight: "15px" }}>
                  {code}
                </div>
              )}
            </div>
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
          <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 12 }}>
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
            <span style={{ fontWeight: 600, color: "#059669", fontSize: 12 }}>
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
        width: 95,
        align: "center",
        render: (val: any, record: any) => {
          const subId = record.SubmissionId ?? record.LocalId;
          const statusText = val || record.status || "---";
          return (
            <Tooltip title={subId ? `Nhấp để xem quy trình duyệt (Mã #${subId})` : "Chưa có quy trình duyệt"}>
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
                {renderApprovalBadge(statusText, record)}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: <IconSettings size={16} strokeWidth={1.8} style={{ color: "#7C3AED" }} />,
        key: "action",
        width: 70,
        align: "center",
        render: (_: any, record: MaterialRequisitionItem) => (
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
        ),
      },
    ],
    [approvedBudgetList, t]
  );

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

  return (
    <div style={{ padding: "10px 18px", minHeight: "calc(100vh - 110px)", background: "#fff" }}>
      {/* Scoped CSS cho bảng chi tiết */}
      <style jsx global>{`
        .requisition-detail-table .ant-table-thead > tr > th {
          background: #F8FAFC !important;
          color: #0F172A !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 8px 10px !important;
        }
        .requisition-detail-table .ant-table-tbody > tr > td {
          color: #0F172A !important;
          font-size: 12px !important;
          line-height: 18px !important;
          border-color: #E2E8F0 !important;
          padding: 6px 10px !important;
        }
        .requisition-detail-table .ant-table-tbody > tr:hover > td {
          background-color: #F5F3FF !important;
        }
        .requisition-detail-table .ant-table-container {
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
      `}</style>

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
          <Text strong style={{ fontSize: 13, color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>
            {t.section.generalInfoRequisition}
          </Text>

          <Space size={8}>
            <Button
              onClick={onClose}
              style={{ height: 32, borderRadius: 6, borderColor: "#E2E8F0", fontSize: 13 }}
            >
              {t.common.close}
            </Button>
            <Button
              type="primary"
              icon={<IconDeviceFloppy size={16} strokeWidth={2} />}
              htmlType="submit"
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
            >
              {editingRequisition ? t.common.update : t.common.save}
            </Button>
          </Space>
        </div>

        {/* Khung Thông Tin Chung (Compact - Chuẩn đồng bộ dự án ~80px) */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 6,
            padding: "5px 12px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
            marginBottom: 8,
          }}
        >
          {/* Hàng 1: 4 Cột */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: Hợp đồng CĐT (Map API get-contract-list) */}
            <Col span={7} style={{ paddingRight: 8, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Hợp đồng CĐT <span style={{ color: "#ff4d4f" }}>*</span>
              </div>
              <Form.Item
                name="contractCode"
                style={{ display: "none" }}
                rules={[{ required: true, message: "Vui lòng chọn Hợp đồng CĐT!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="mainContractId" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <div
                onClick={lov.handleOpenMainContractLov}
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: "22px",
                  height: 22,
                  color: lov.selectedMainContractDisplay ? "#0F172A" : "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  userSelect: "none",
                }}
                title={lov.selectedMainContractDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lov.selectedMainContractDisplay || "Chọn HĐ CĐT..."}
                </span>
                <Space size={2} style={{ flexShrink: 0, marginLeft: 4 }}>
                  {lov.selectedMainContractDisplay && (
                    <IconCircleX
                      size={14}
                      strokeWidth={1.8}
                      style={{ color: "#94A3B8", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        lov.handleClearMainContract();
                      }}
                    />
                  )}
                  <IconSearch size={14} strokeWidth={1.8} style={{ color: "#7C3AED" }} />
                </Space>
              </div>
            </Col>

            {/* Cột 2: Loại xuất */}
            <Col span={5} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Loại xuất <span style={{ color: "#ff4d4f" }}>*</span>
              </div>
              <Form.Item
                name="issueType"
                style={{ margin: 0 }}
                rules={[{ required: true, message: "Vui lòng chọn loại xuất!" }]}
              >
                <Select
                  size="small"
                  variant="borderless"
                  style={{ padding: 0, width: "100%", fontWeight: 600, fontSize: 12, color: "#0F172A", height: 22 }}
                  options={[
                    { value: "Project", label: "Xuất thi công" },
                    { value: "SUB_CONTRACTOR", label: "Xuất cho NTP" },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Cột 3: Tên đối tượng (Map API get-client-list) */}
            <Col span={6} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Tên đối tượng <span style={{ color: "#ff4d4f" }}>*</span>
              </div>
              <Form.Item
                name="targetName"
                style={{ display: "none" }}
                rules={[{ required: true, message: "Vui lòng chọn đối tượng nhận!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="clientId" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <div
                onClick={lov.handleOpenClientLov}
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: "22px",
                  height: 22,
                  color: lov.selectedClientDisplay ? "#0F172A" : "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  userSelect: "none",
                }}
                title={lov.selectedClientDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lov.selectedClientDisplay || "Chọn đối tượng..."}
                </span>
                <Space size={2} style={{ flexShrink: 0, marginLeft: 4 }}>
                  {lov.selectedClientDisplay && (
                    <IconCircleX
                      size={14}
                      strokeWidth={1.8}
                      style={{ color: "#94A3B8", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        lov.handleClearClient();
                      }}
                    />
                  )}
                  <IconSearch size={14} strokeWidth={1.8} style={{ color: "#7C3AED" }} />
                </Space>
              </div>
            </Col>

            {/* Cột 4: Kho xuất (Map API get-warehouse-list) */}
            <Col span={6} style={{ paddingLeft: 8 }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Kho xuất <span style={{ color: "#ff4d4f" }}>*</span>
              </div>
              <Form.Item
                name="warehouseId"
                style={{ display: "none" }}
                rules={[{ required: true, message: "Vui lòng chọn kho xuất!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="warehouseName" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <div
                onClick={lov.handleOpenWarehouseLov}
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: "22px",
                  height: 22,
                  color: lov.selectedWarehouseDisplay ? "#0F172A" : "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  userSelect: "none",
                }}
                title={lov.selectedWarehouseDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lov.selectedWarehouseDisplay || "Chọn kho xuất..."}
                </span>
                <Space size={2} style={{ flexShrink: 0, marginLeft: 4 }}>
                  {lov.selectedWarehouseDisplay && (
                    <IconCircleX
                      size={14}
                      strokeWidth={1.8}
                      style={{ color: "#94A3B8", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        lov.handleClearWarehouse();
                      }}
                    />
                  )}
                  <IconSearch size={14} strokeWidth={1.8} style={{ color: "#7C3AED" }} />
                </Space>
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: "3px 0", borderColor: "#E2E8F0" }} />

          {/* Hàng 2: 4 Cột (Ngày yêu cầu, Số yêu cầu, Nội dung yêu cầu, Trạng thái phiếu) */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: Ngày yêu cầu */}
            <Col span={5} style={{ paddingRight: 8, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Ngày yêu cầu <span style={{ color: "#ff4d4f" }}>*</span>
              </div>
              <Form.Item
                name="requisitionDate"
                style={{ margin: 0 }}
                rules={[{ required: true, message: "Vui lòng chọn ngày yêu cầu!" }]}
              >
                <DatePicker
                  size="small"
                  variant="borderless"
                  format="DD/MM/YYYY"
                  style={{ padding: 0, width: "100%", fontWeight: 500, fontSize: 12, color: "#0F172A", height: 22 }}
                />
              </Form.Item>
            </Col>

            {/* Cột 2: Số yêu cầu (Tự sinh) */}
            <Col span={5} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Số yêu cầu (Tự sinh)
              </div>
              <Form.Item name="requisitionCode" style={{ margin: 0 }}>
                <Input
                  size="small"
                  variant="borderless"
                  readOnly
                  placeholder="(Tự sinh khi lưu)"
                  style={{
                    padding: 0,
                    fontWeight: 600,
                    fontSize: 12,
                    color: "#0F172A",
                    height: 22,
                    fontFamily: "monospace",
                  }}
                />
              </Form.Item>
            </Col>

            {/* Cột 3: Nội dung yêu cầu */}
            <Col span={10} style={{ paddingLeft: 8, paddingRight: 8, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Nội dung yêu cầu <span style={{ color: "#ff4d4f" }}>*</span>
              </div>
              <Form.Item
                name="description"
                style={{ margin: 0 }}
                rules={[{ required: true, message: "Vui lòng nhập nội dung yêu cầu!" }]}
              >
                <Input
                  size="small"
                  variant="borderless"
                  placeholder="vd: Cấp gấp thép và phụ kiện đổ bê tông dầm sàn tầng 12..."
                  style={{ padding: 0, fontWeight: 500, fontSize: 12, color: "#0F172A", height: 22 }}
                />
              </Form.Item>
            </Col>

            {/* Cột 4: Trạng thái phiếu */}
            <Col span={4} style={{ paddingLeft: 8 }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1, fontWeight: 500, lineHeight: "14px" }}>
                Trạng thái phiếu
              </div>
              <div style={{ height: 22, display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color:
                      editingRequisition?.status === "APPROVED"
                        ? "#059669"
                        : editingRequisition?.status === "REJECTED"
                        ? "#DC2626"
                        : editingRequisition?.status === "COMPLETED"
                        ? "#2563EB"
                        : "#D97706",
                  }}
                >
                  {editingRequisition?.status || "PENDING"}
                </span>
              </div>
            </Col>
          </Row>
        </div>

        {/* Section II: THÔNG TIN CHI TIẾT */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Text strong style={{ fontSize: 13, color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>
              {t.section.detailList}
            </Text>
            <Tag
              style={{
                background: "#EDE9FE",
                color: "#7C3AED",
                borderRadius: 12,
                border: "none",
                fontSize: 11,
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
              icon={<IconRefresh size={15} strokeWidth={1.8} />}
              loading={loadingItems}
              onClick={() => {
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
              }}
              style={{
                height: 32,
                borderRadius: 6,
                borderColor: "#E2E8F0",
                fontSize: 13,
              }}
            >
              {t.common.refresh}
            </Button>
            <Button
              type="primary"
              icon={<IconPlus size={16} strokeWidth={2} />}
              onClick={handleOpenAddItem}
              style={{
                background: "#7C3AED",
                borderColor: "#7C3AED",
                height: 32,
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 13,
                boxShadow: "0 2px 4px rgba(124, 58, 237, 0.2)",
              }}
            >
              {t.common.addNew}
            </Button>
          </Space>
        </div>



        {/* Bảng Chi Tiết Vật Tư */}
        <Table
          className="requisition-detail-table"
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={items}
          loading={loadingItems}
          pagination={false}
          scroll={{ x: 950 }}
          summary={() => {
            const totalReq = items.reduce((sum, it) => sum + Number(it.requestedQty || 0), 0);
            const totalApp = items.reduce((sum, it) => sum + Number(it.approvedQty || 0), 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: "#F5F3FF", fontWeight: "bold" }}>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <Text strong style={{ color: "#7C3AED", fontSize: 12 }}>
                      {t.table.total}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong style={{ color: "#0F172A", fontSize: 12 }}>
                      {totalReq.toLocaleString("vi-VN")}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong style={{ color: totalApp > 0 ? "#059669" : "#94A3B8", fontSize: 12 }}>
                      {totalApp > 0 ? totalApp.toLocaleString("vi-VN") : "---"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4} />
                  <Table.Summary.Cell index={5} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
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
