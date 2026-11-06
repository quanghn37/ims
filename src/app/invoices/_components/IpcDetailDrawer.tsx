"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Table, Button, Space, Row, Col, Checkbox, message, Select, Input, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconX,
  IconSend,
  IconGitBranch,
  IconPaperclip,
  IconPrinter,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTranslation } from "@/locales/LanguageContext";
import { extractApiList } from "@/lib/api-client";
import { invoicesApi } from "../api";
import { IpcRecord, IpcDetailItem, IpcTaxItem } from "../types";
import IpcWorkflowDrawer from "./IpcWorkflowDrawer";
import ResizableTitle from "@/components/table/ResizableTitle";
import ErpAttachmentsModal, { AttachmentFile } from "@/components/common/ErpAttachmentsModal";

const STORAGE_KEY_IPC_DETAIL = "IPC_DETAIL_COL_WIDTHS";
const STORAGE_KEY_IPC_TAX = "IPC_TAX_COL_WIDTHS";

const defaultIpcTaxColWidths: Record<string, number> = {
  stt: 60,
  Invoice: 180,
  Amount: 180,
  TaxAmount: 180,
  TotalAmount: 200,
};

const defaultColWidths: Record<string, number> = {
  stt: 48,
  OrgCode: 85,
  OrgName: 95,
  WorkCat: 125,
  MaterialName: 220,
  Unit: 55,
  InvoiceQty: 85,
  UnitPrice: 105,
  Amount: 115,
  TaxRate: 65,
  TaxAmount: 115,
  TotalAmount: 120,
  Remarks: 150,
  InvoiceNo: 95,
  InvoiceDate: 95,
  ReceiptCode: 165,
  PoCode: 145,
  selection: 50,
};

function normalizeIpcDetailRow(row: any, index: number, lang = "vi"): IpcDetailItem {
  const isSection = !row.SubmissionId && !row.Type;

  let workName = row.WorkName || row.MaterialName || "";
  if (isSection) {
    const rawUpper = String(workName).trim().toUpperCase();
    if (lang === "vi") {
      if (rawUpper.includes("PERFORMED") || rawUpper.includes("HOÀN THÀNH")) {
        workName = "KHỐI LƯỢNG HOÀN THÀNH";
      } else if (rawUpper.includes("ADDED") || rawUpper.includes("TĂNG")) {
        workName = "ĐIỀU CHỈNH THANH TOÁN-TĂNG";
      } else if (rawUpper.includes("DEDUCTED") || rawUpper.includes("GIẢM")) {
        workName = "ĐIỀU CHỈNH THANH TOÁN-GIẢM";
      }
    } else {
      if (rawUpper.includes("PERFORMED") || rawUpper.includes("HOÀN THÀNH")) {
        workName = "PERFORMED WORKS";
      } else if (rawUpper.includes("ADDED") || rawUpper.includes("TĂNG")) {
        workName = "PAYMENT ADJUSTMENT-ADDED";
      } else if (rawUpper.includes("DEDUCTED") || rawUpper.includes("GIẢM")) {
        workName = "PAYMENT ADJUSTMENT-DEDUCTED";
      }
    }
  }

  let extractedReceiptCode = row.ReceiptNo || row.ReceiptCode || "";
  const match = String(row.WorkName || "").match(/\((?:Phiếu|Phi\?u|Phieu):\s*([^)]+)\)/i);
  if (!extractedReceiptCode && match) {
    extractedReceiptCode = match[1].trim();
  }

  const qnty = row.Qnty !== null && row.Qnty !== undefined ? Number(row.Qnty) : (row.InvoiceQty !== undefined ? Number(row.InvoiceQty) : null);
  const unitPrice = row.UnitPrice !== null && row.UnitPrice !== undefined ? Number(row.UnitPrice) : 0;
  const amount = row.Amount !== null && row.Amount !== undefined ? Number(row.Amount) : null;
  const taxAmount = row.P_TaxAmount !== null && row.P_TaxAmount !== undefined
    ? Number(row.P_TaxAmount)
    : (row.TaxAmount !== null && row.TaxAmount !== undefined ? Number(row.TaxAmount) : null);
  const total = row.P_TotalAmount !== null && row.P_TotalAmount !== undefined
    ? Number(row.P_TotalAmount)
    : (row.Total !== null && row.Total !== undefined
      ? Number(row.Total)
      : (row.TotalAmount !== undefined ? Number(row.TotalAmount) : null));

  const resolvedReceiptCode = row.ReceiptNo || row.ReceiptCode || extractedReceiptCode || "";
  const resolvedPoCode = row.PO || row.PoCode || row.POCode || "";

  return {
    ...row,
    id: row.SubmissionId ? `sub_${row.SubmissionId}_${index}` : (row.id || `sec_${index}`),
    isSectionHeader: isSection,
    OrgCode: row.WBS || row.OrgCode || "",
    OrgName: row.OrgName || "",
    WorkCat: row.WorkCat || "",
    MaterialCode: row.ItemCode || "",
    MaterialName: workName,
    WorkName: workName,
    Remarks: row.Remarks || "",
    Unit: row.Unit || "",
    InvoiceQty: qnty,
    UnitPrice: unitPrice,
    Amount: amount,
    TaxRate: row.TaxRate !== null && row.TaxRate !== undefined
      ? (typeof row.TaxRate === "number" ? (row.TaxRate > 0 && row.TaxRate < 1 ? `${Math.round(row.TaxRate * 100)}%` : `${row.TaxRate}%`) : String(row.TaxRate))
      : (taxAmount !== null && taxAmount > 0 ? `${taxAmount}` : "0%"),
    TaxAmount: taxAmount,
    TotalAmount: total,
    InvoiceNo: row.VATInvoice || row.InvoiceNo || "",
    InvoiceDate: row.PaymentDate || row.InvoiceDate || "",
    InvoiceSymbol: row.InvoiceSymbol || "",
    ReceiptCode: resolvedReceiptCode,
    ReceiptNo: resolvedReceiptCode,
    PoCode: resolvedPoCode,
    PO: resolvedPoCode,
  };
}

function normalizeIpcAttachment(row: any, index: number): AttachmentFile {
  const cat = row.Category !== undefined && row.Category !== null ? Number(row.Category) : null;
  let folder: "project_docs" | "signing_docs" | "signed_docs" = "project_docs";
  if (cat === 1) {
    folder = "signing_docs";
  } else if (cat === 2) {
    folder = "signed_docs";
  } else {
    // Category = 0 hoặc null hoặc không trả thì đưa vào Tài liệu dự án
    folder = "project_docs";
  }

  const hasSign =
    folder === "signed_docs" ||
    cat === 2 ||
    row.HasSign === true ||
    row.HasSign === "Yes" ||
    String(row.SignStatus || "").toLowerCase().includes("signed") ||
    String(row.FileName || "").toLowerCase().includes("signed");

  let sizeStr: string | undefined = undefined;
  if (row.FileSize || row.Size || row.File_Size) {
    const rawSize = row.FileSize || row.Size || row.File_Size;
    const num = Number(rawSize);
    if (!isNaN(num) && num > 0) {
      sizeStr = num > 1024 * 1024 ? `${(num / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(num / 1024)} KB`;
    } else if (typeof rawSize === "string") {
      sizeStr = rawSize;
    }
  }

  let formattedDate = "";
  const rawDate = row.CreatedDate || row.UploadingDate || row.UploadedDate || row.UploadDate || row.Date;
  if (rawDate) {
    formattedDate = dayjs(rawDate).isValid() ? dayjs(rawDate).format("DD/MM/YYYY HH:mm") : String(rawDate);
  }

  return {
    id: String(row.FileId || row.Id || row.File_Id || row.id || `file_${index}_${Date.now()}`),
    fileName: row.FileName || row.File_Name || row.name || row.Name || row.OriginalFileName || "Attachment",
    fileUrl: row.FileUrl || row.FilePath || row.File_Path || row.Url || row.Link || "#",
    uploadedBy: row.UploadedBy || row.CreatedBy || row.UserUpload || row.CreatedUser || "---",
    uploadingDate: formattedDate,
    hasSign,
    folder,
    fileSize: sizeStr,
  };
}

interface IpcDetailDrawerProps {
  onClose: () => void;
  ipc: IpcRecord | null;
  onSubmitApproval?: (ipcId: string) => void;
  onRefresh?: () => void;
  contracts?: Array<any>;
}

export const IpcDetailDrawer: React.FC<IpcDetailDrawerProps> = ({
  onClose,
  ipc,
  onSubmitApproval,
  onRefresh,
  contracts,
}) => {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [ipcAttachments, setIpcAttachments] = useState<AttachmentFile[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailItems, setDetailItems] = useState<IpcDetailItem[]>([]);

  // Tab con trong mục II: Chi tiết vật tư ("materials") hoặc IPC TAX ("tax")
  const [activeDetailTab, setActiveDetailTab] = useState<"materials" | "tax">("materials");
  const [loadingTax, setLoadingTax] = useState(false);
  const [taxData, setTaxData] = useState<IpcTaxItem[]>([]);

  // Checkbox row selection trong bảng chi tiết
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Popup Apply Tax
  const [isApplyTaxOpen, setIsApplyTaxOpen] = useState(false);
  const [applyTaxRate, setApplyTaxRate] = useState<string>("10%");
  const [applyInvoiceNo, setApplyInvoiceNo] = useState<string>("");

  const selectableRows = useMemo(() => {
    return detailItems.filter((it) => !it.isSectionHeader);
  }, [detailItems]);

  const isAllSelected = useMemo(() => {
    return (
      selectableRows.length > 0 &&
      selectableRows.every((r) => selectedRowKeys.includes(r.id))
    );
  }, [selectableRows, selectedRowKeys]);

  const isIndeterminate = useMemo(() => {
    const selectedCount = selectableRows.filter((r) => selectedRowKeys.includes(r.id)).length;
    return selectedCount > 0 && selectedCount < selectableRows.length;
  }, [selectableRows, selectedRowKeys]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(selectableRows.map((r) => r.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleRowCheck = (id: React.Key, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys((prev) => [...prev, id]);
    } else {
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    }
  };

  const handleSaveApplyTax = () => {
    if (!applyTaxRate) {
      message.warning(language === "en" ? "Please select Tax Rate" : "Vui lòng chọn Tax Rate");
      return;
    }

    setDetailItems((prev) =>
      prev.map((row) => {
        if (!selectedRowKeys.includes(row.id)) return row;

        const amount = Number(row.Amount) || 0;
        let taxRatePercent = 0;
        if (applyTaxRate === "5%") taxRatePercent = 0.05;
        else if (applyTaxRate === "8%") taxRatePercent = 0.08;
        else if (applyTaxRate === "10%") taxRatePercent = 0.1;
        else if (applyTaxRate === "0%" || applyTaxRate === "KCT") taxRatePercent = 0;

        const taxAmount = Math.round(amount * taxRatePercent);
        const totalAmount = amount + taxAmount;

        return {
          ...row,
          TaxRate: applyTaxRate,
          TaxAmount: taxAmount,
          TotalAmount: totalAmount,
          InvoiceNo: applyInvoiceNo.trim() ? applyInvoiceNo.trim() : row.InvoiceNo,
        };
      })
    );

    message.success(
      language === "en"
        ? `Applied tax (${applyTaxRate}) to ${selectedRowKeys.length} items successfully`
        : `Đã áp dụng thuế (${applyTaxRate}) cho ${selectedRowKeys.length} dòng thành công`
    );
    setIsApplyTaxOpen(false);
    setSelectedRowKeys([]);
  };

  // Gọi API get-ipc-detail khi mở xem chi tiết hoặc khi chuyển đổi ngôn ngữ
  const fetchDetail = useCallback(async () => {
    if (!ipc) return;
    const paymentId = ipc.PaymentId || (!isNaN(Number(ipc.IpcId)) ? Number(ipc.IpcId) : undefined);
    if (!paymentId) {
      setDetailItems([]);
      return;
    }
    setLoadingDetail(true);
    try {
      const res: any = await invoicesApi.getIpcDetail(paymentId, language);
      const list = extractApiList(res);
      if (Array.isArray(list) && list.length > 0) {
        setDetailItems(list.map((it, idx) => normalizeIpcDetailRow(it, idx, language)));
      } else {
        setDetailItems([]);
      }
    } catch (err) {
      console.warn("Lỗi tải chi tiết IPC từ API get-ipc-detail:", err);
      setDetailItems([]);
    } finally {
      setLoadingDetail(false);
    }
  }, [ipc, language]);

  // Gọi API get-vat-invoice khi chọn tab IPC TAX
  const fetchIpcTax = useCallback(async () => {
    if (!ipc) return;
    const paymentId = ipc.PaymentId || (!isNaN(Number(ipc.IpcId)) ? Number(ipc.IpcId) : undefined);
    if (!paymentId) {
      setTaxData([]);
      return;
    }
    setLoadingTax(true);
    try {
      const res: any = await invoicesApi.getIpcVatInvoice(paymentId, language);
      const list = extractApiList(res);
      if (Array.isArray(list) && list.length > 0) {
        setTaxData(
          list.map((it: any, idx: number) => ({
            ...it,
            id: it.id || `tax_${idx}`,
            Invoice: it.Invoice || it.VATInvoice || it.InvoiceNo || null,
            Amount: it.Amount !== null && it.Amount !== undefined ? Number(it.Amount) : null,
            TaxAmount: it.TaxAmount !== null && it.TaxAmount !== undefined ? Number(it.TaxAmount) : null,
            TotalAmount: it.TotalAmount !== null && it.TotalAmount !== undefined ? Number(it.TotalAmount) : null,
          }))
        );
      } else {
        setTaxData([]);
      }
    } catch (err) {
      console.warn("Lỗi tải IPC Tax từ API get-vat-invoice:", err);
      setTaxData([]);
    } finally {
      setLoadingTax(false);
    }
  }, [ipc, language]);

  // Gọi API get-file-list để lấy danh sách tệp đính kèm theo IPC (PaymentId)
  const fetchAttachments = useCallback(async () => {
    if (!ipc) return;
    const paymentId = ipc.PaymentId || (!isNaN(Number(ipc.IpcId)) ? Number(ipc.IpcId) : undefined);
    if (!paymentId) {
      setIpcAttachments([]);
      return;
    }
    try {
      const res: any = await invoicesApi.getIpcFileList(paymentId, language);
      const list = extractApiList(res);
      if (Array.isArray(list) && list.length > 0) {
        setIpcAttachments(list.map((it, idx) => normalizeIpcAttachment(it, idx)));
      } else {
        setIpcAttachments([]);
      }
    } catch (err) {
      console.warn("Lỗi tải tệp đính kèm IPC từ API get-file-list:", err);
      setIpcAttachments([]);
    }
  }, [ipc, language]);

  useEffect(() => {
    fetchDetail();
    fetchAttachments();
  }, [fetchDetail, fetchAttachments]);

  // Resize & Ghi nhớ kích thước cột vào localStorage
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IPC_DETAIL);
      if (saved) return { ...defaultColWidths, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột chi tiết IPC:", e);
    }
    return defaultColWidths;
  });

  const handleResize = (colKey: string) => (_: any, { size }: { size: { width: number } }) => {
    setColWidths((prev) => {
      const updated = { ...prev, [colKey]: Math.max(size.width, 40) };
      try {
        localStorage.setItem(STORAGE_KEY_IPC_DETAIL, JSON.stringify(updated));
      } catch {
        // Best-effort: Lưu độ rộng cột vào localStorage
      }
      return updated;
    });
  };

  const handleOpenPrintNotice = () => {
    try {
      localStorage.setItem("PRINT_NOTICE_IPC_DATA", JSON.stringify(ipc));
    } catch (e) {
      console.error("Lỗi lưu dữ liệu in IPC vào localStorage:", e);
    }
    window.open(`/invoices/print/${ipc?.IpcId || ipc?.PaymentId || "IPC"}`, "_blank");
  };

  if (!ipc) return null;

  const formatVnd = (num?: number | null) => {
    if (num === undefined || num === null) return "---";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const isDraft = ipc.Status === 0 || ipc.StatusName === "Đang lập" || ipc.ApprovalStatus === "Chưa làm";

  const getStatusInfo = (status: any, statusName?: string, approvalStatus?: string) => {
    const raw = approvalStatus || statusName || "";
    const sStr = String(raw || status || "").toLowerCase();
    if (status === 1 || (sStr.includes("duyệt") && !sStr.includes("chờ"))) {
      return { color: "#10b981", label: language === "en" ? "Approved" : "Đã duyệt" };
    }
    if (status === 2 || sStr.includes("chờ") || sStr.includes("review")) {
      return { color: "#2563eb", label: language === "en" ? "In-Review" : "Chờ duyệt" };
    }
    if (sStr.includes("từ chối") || sStr.includes("reject")) {
      return { color: "#ef4444", label: language === "en" ? "Rejected" : "Từ chối" };
    }
    if (sStr.includes("chưa làm") || sStr.includes("not-started")) {
      return { color: "#f97316", label: language === "en" ? "Not-Started" : "Chưa làm" };
    }
    return { color: "#94a3b8", label: raw || (language === "en" ? "Drafting" : "Đang lập") };
  };

  const statusInfo = getStatusInfo(ipc.Status, ipc.StatusName, ipc.ApprovalStatus);

  const matchedContract = useMemo(() => {
    if (!ipc || !contracts) return null;
    return contracts.find(
      (c) =>
        (ipc.ContractId && String(c.ContractId) === String(ipc.ContractId)) ||
        (ipc.ContractCode && c.ContractCode === ipc.ContractCode)
    );
  }, [ipc, contracts]);

  const ownerContractCode = ipc.OwnerContractCode || matchedContract?.MainCode || matchedContract?.OwnerContractCode || "---";
  const paymentTerms = ipc.PaymentTerms || matchedContract?.PayTerms || matchedContract?.PaymentTerms || "---";

  // Tính tổng tiền các mặt hàng từ detailItems
  const totalSubAmount = useMemo(() => {
    return detailItems
      .filter((it) => !it.isSectionHeader)
      .reduce((sum, it) => sum + (Number(it.Amount) || 0), 0);
  }, [detailItems]);

  // 16 CỘT CHUẨN ERP
  const baseColumns: ColumnsType<IpcDetailItem> = [
    {
      title: t("invoices.table.stt"),
      key: "stt",
      width: defaultColWidths.stt,
      align: "center",
      render: (_: any, r: IpcDetailItem, index: number) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#64748b" }}>{index + 1}</span>;
      },
    },
    {
      title: t("invoices.table.orgCode"),
      dataIndex: "OrgCode",
      key: "OrgCode",
      width: defaultColWidths.OrgCode,
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443", fontFamily: "monospace" }}>{val || "---"}</span>;
      },
    },
    {
      title: t("invoices.table.orgName"),
      dataIndex: "OrgName",
      key: "OrgName",
      width: defaultColWidths.OrgName,
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443" }}>{val || ""}</span>;
      },
    },
    {
      title: "WorkCat",
      dataIndex: "WorkCat",
      key: "WorkCat",
      width: defaultColWidths.WorkCat,
      ellipsis: true,
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443" }} title={val}>{val || ""}</span>;
      },
    },
    {
      title: t("invoices.table.materialName"),
      dataIndex: "MaterialName",
      key: "MaterialName",
      width: defaultColWidths.MaterialName,
      ellipsis: true,
      render: (val: string, r: IpcDetailItem) => {
        const text = r.WorkName || val;
        if (r.isSectionHeader) {
          return (
            <span style={{ color: "#008f89", fontWeight: 700, fontSize: 13 }}>
              {text}
            </span>
          );
        }
        return <span style={{ color: "#123443" }} title={text}>{text}</span>;
      },
    },
    {
      title: t("invoices.table.unit"),
      dataIndex: "Unit",
      key: "Unit",
      width: defaultColWidths.Unit,
      align: "center",
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443" }}>{val}</span>;
      },
    },
    {
      title: t("invoices.table.qty"),
      dataIndex: "InvoiceQty",
      key: "InvoiceQty",
      width: defaultColWidths.InvoiceQty,
      align: "right",
      render: (val: number | null, r: IpcDetailItem) => {
        if (r.isSectionHeader || val === null || val === undefined) return null;
        return (
          <span style={{ color: "#123443" }}>{Number(val).toLocaleString("vi-VN")}</span>
        );
      },
    },
    {
      title: t("invoices.table.unitPrice"),
      dataIndex: "UnitPrice",
      key: "UnitPrice",
      width: defaultColWidths.UnitPrice,
      align: "right",
      render: (val: number | null, r: IpcDetailItem) => {
        if (r.isSectionHeader || !val) return null;
        return <span style={{ color: "#123443" }}>{formatVnd(val)}</span>;
      },
    },
    {
      title: t("invoices.table.amount"),
      dataIndex: "Amount",
      key: "Amount",
      width: defaultColWidths.Amount,
      align: "right",
      render: (val: number | null, r: IpcDetailItem) => {
        if (r.isSectionHeader || val === null || val === undefined) return null;
        return <span style={{ color: "#123443" }}>{formatVnd(val)}</span>;
      },
    },
    {
      title: t("invoices.table.tax"),
      dataIndex: "TaxRate",
      key: "TaxRate",
      width: defaultColWidths.TaxRate,
      align: "right",
      render: (val: any, r: IpcDetailItem) => {
        if (r.isSectionHeader || val === null || val === undefined) return null;
        let displayVal = "---";
        if (typeof val === "number") {
          displayVal = val > 0 && val < 1 ? `${Math.round(val * 100)}%` : `${val}%`;
        } else if (val) {
          displayVal = String(val).includes("%") ? String(val) : `${val}%`;
        }
        return <span style={{ color: "#123443" }}>{displayVal}</span>;
      },
    },
    {
      title: language === "en" ? "Tax Amount" : "Tiền thuế",
      dataIndex: "TaxAmount",
      key: "TaxAmount",
      width: defaultColWidths.TaxAmount,
      align: "right",
      render: (val: number | null, r: IpcDetailItem) => {
        if (r.isSectionHeader || val === null || val === undefined) return null;
        return <span style={{ color: "#123443" }}>{formatVnd(val)}</span>;
      },
    },
    {
      title: t("invoices.table.totalAmountColumn"),
      dataIndex: "TotalAmount",
      key: "TotalAmount",
      width: defaultColWidths.TotalAmount,
      align: "right",
      render: (val: number | null, r: IpcDetailItem) => {
        if (r.isSectionHeader || (val === null && r.Amount === null)) return null;
        return (
          <span style={{ color: "#123443" }}>{formatVnd(val ?? r.Amount)}</span>
        );
      },
    },
    {
      title: "Remarks",
      dataIndex: "Remarks",
      key: "Remarks",
      width: defaultColWidths.Remarks,
      ellipsis: true,
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443" }} title={val}>{val || ""}</span>;
      },
    },
    {
      title: t("invoices.table.invoiceNo"),
      dataIndex: "InvoiceNo",
      key: "InvoiceNo",
      width: defaultColWidths.InvoiceNo,
      align: "center",
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443" }}>{val || "---"}</span>;
      },
    },
    {
      title: t("invoices.table.invoiceDate"),
      dataIndex: "InvoiceDate",
      key: "InvoiceDate",
      width: defaultColWidths.InvoiceDate,
      align: "center",
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443" }}>{val ? (dayjs(val).isValid() ? dayjs(val).format("DD/MM/YYYY") : String(val).split("T")[0]) : "---"}</span>;
      },
    },
    {
      title: t("invoices.table.receiptCode"),
      dataIndex: "ReceiptCode",
      key: "ReceiptCode",
      width: defaultColWidths.ReceiptCode,
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443", fontFamily: "monospace" }}>{val || r.ReceiptNo || "---"}</span>;
      },
    },
    {
      title: t("invoices.table.poCode"),
      dataIndex: "PoCode",
      key: "PoCode",
      width: defaultColWidths.PoCode,
      render: (val: string, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return <span style={{ color: "#123443", fontFamily: "monospace" }}>{val || r.PO || "---"}</span>;
      },
    },
    // Ô Checkbox cố định bên phải (fixed right) để khi cuộn ngang không bị ẩn
    {
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: "selection",
      width: defaultColWidths.selection || 50,
      align: "center",
      fixed: "right",
      render: (_: any, r: IpcDetailItem) => {
        if (r.isSectionHeader) return null;
        return (
          <Checkbox
            checked={selectedRowKeys.includes(r.id)}
            onChange={(e) => handleRowCheck(r.id, e.target.checked)}
          />
        );
      },
    },
  ];

  // Hợp nhất độ rộng cột đã lưu & gắn sự kiện kéo resize
  const mergedColumns = useMemo(() => {
    return baseColumns.map((col: any) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = colWidths[colKey] || col.width || 100;
      if (col.key === "selection") {
        return {
          ...col,
          width: col.width || 50,
        };
      }
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(colKey),
        }),
      };
    });
  }, [baseColumns, colWidths]);

  const scrollX = useMemo(() => {
    return mergedColumns.reduce((sum, col: any) => sum + (Number(col.width) || 100), 0);
  }, [mergedColumns]);

  // CỘT CHO BẢNG IPC TAX
  const [taxColWidths, setTaxColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultIpcTaxColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IPC_TAX);
      if (saved) return { ...defaultIpcTaxColWidths, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột thuế IPC:", e);
    }
    return defaultIpcTaxColWidths;
  });

  const handleTaxResize = (colKey: string) => (_: any, { size }: { size: { width: number } }) => {
    setTaxColWidths((prev) => {
      const updated = { ...prev, [colKey]: Math.max(size.width, 40) };
      try {
        localStorage.setItem(STORAGE_KEY_IPC_TAX, JSON.stringify(updated));
      } catch {
        // Best-effort: Lưu độ rộng cột vào localStorage
      }
      return updated;
    });
  };

  const baseTaxColumns: ColumnsType<IpcTaxItem> = [
    {
      title: t("invoices.table.stt") || "STT",
      key: "stt",
      width: defaultIpcTaxColWidths.stt,
      align: "center",
      render: (_: any, __: any, index: number) => (
        <span style={{ color: "#64748b" }}>{index + 1}</span>
      ),
    },
    {
      title: language === "en" ? "Invoice" : "Hóa đơn",
      dataIndex: "Invoice",
      key: "Invoice",
      width: defaultIpcTaxColWidths.Invoice,
      render: (val: string | null) => (
        <span style={{ color: "#123443" }}>{val || "---"}</span>
      ),
    },
    {
      title: t("invoices.table.amount") || "Thành tiền",
      dataIndex: "Amount",
      key: "Amount",
      width: defaultIpcTaxColWidths.Amount,
      align: "right",
      render: (val: number | null) => (
        <span style={{ color: "#123443" }}>{val !== null && val !== undefined ? formatVnd(val) : "---"}</span>
      ),
    },
    {
      title: language === "en" ? "Tax Amount" : "Tiền thuế",
      dataIndex: "TaxAmount",
      key: "TaxAmount",
      width: defaultIpcTaxColWidths.TaxAmount,
      align: "right",
      render: (val: number | null) => (
        <span style={{ color: "#123443" }}>{val !== null && val !== undefined ? formatVnd(val) : "---"}</span>
      ),
    },
    {
      title: t("invoices.table.totalAmountColumn") || "Tổng tiền",
      dataIndex: "TotalAmount",
      key: "TotalAmount",
      width: defaultIpcTaxColWidths.TotalAmount,
      align: "right",
      render: (val: number | null) => (
        <span style={{ color: "#123443", fontWeight: 600 }}>{val !== null && val !== undefined ? formatVnd(val) : "---"}</span>
      ),
    },
  ];

  const mergedTaxColumns = useMemo(() => {
    return baseTaxColumns.map((col: any) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = taxColWidths[colKey] || col.width || 100;
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleTaxResize(colKey),
        }),
      };
    });
  }, [baseTaxColumns, taxColWidths]);

  const taxScrollX = useMemo(() => {
    return mergedTaxColumns.reduce((sum, col: any) => sum + (Number(col.width) || 100), 0);
  }, [mergedTaxColumns]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "#FFFFFF", padding: "16px 20px" }}>
      {/* SECTION I HEADER + ACTION BUTTONS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 8,
          borderBottom: "1px solid #dce5e6",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "#008f89", textTransform: "uppercase" }}>
          {t("invoices.drawer.secGeneral")}
        </div>

        <Space size={8}>
          <Button
            icon={<IconPrinter size={15} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={handleOpenPrintNotice}
            style={{
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
            }}
          >
            {language === "en" ? "Print" : "In"}
          </Button>

          <Button
            icon={<IconGitBranch size={15} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={() => setIsWorkflowOpen(true)}
            style={{
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
            }}
          >
            {t("invoices.drawer.workflowRaci")}
          </Button>

          <Button
            icon={<IconPaperclip size={15} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            onClick={() => setIsAttachmentModalOpen(true)}
            style={{
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {t("invoices.drawer.attachments")}
            {ipcAttachments.length > 0 && (
              <span
                style={{
                  background: "#dce5e6",
                  color: "#008f89",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 600,
                  marginLeft: 5,
                }}
              >
                {ipcAttachments.length}
              </span>
            )}
          </Button>

          {isDraft && onSubmitApproval && (
            <Button
              type="primary"
              icon={<IconSend size={15} strokeWidth={1.8} />}
              onClick={() => {
                onSubmitApproval(ipc.IpcId);
                onRefresh?.();
              }}
              style={{
                background: "#008f89",
                borderColor: "#008f89",
                height: 32,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                color: "#FFFFFF",
                boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
              }}
            >
              {t("invoices.drawer.submitApproval")}
            </Button>
          )}

          <Button
            icon={<IconX size={15} strokeWidth={1.8} style={{ color: "#718894" }} />}
            onClick={onClose}
            style={{
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
            }}
          >
            {t("invoices.drawer.close")}
          </Button>
        </Space>
      </div>

      {/* SECTION I: THẺ THÔNG TIN CHUNG (CHUẨN ERP-GENERAL-INFO-CARD) */}
      <div className="erp-general-info-card">
        {/* Hàng 1: 5 Cột */}
        <Row gutter={[0, 0]} align="middle">
          <Col span={5} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.ownerContract")}</span>
            <div className="erp-info-value mono" title={ownerContractCode}>
              {ownerContractCode}
            </div>
          </Col>
          <Col span={6} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.vendor")}</span>
            <div className="erp-info-value" title={ipc.VendorName || ipc.ContractName}>
              {ipc.VendorName || ipc.ContractName || "---"}
            </div>
          </Col>
          <Col span={4} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.vendorContract")}</span>
            <div className="erp-info-value mono" title={ipc.ContractCode}>
              {ipc.ContractCode || "---"}
            </div>
          </Col>
          <Col span={3} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.ipcCode")}</span>
            <div className="erp-info-value mono" style={{ color: "#008f89", fontWeight: 700 }}>
              {ipc.IpcId || ipc.POCode || (ipc.PaymentId ? `IPC-${ipc.PaymentId}` : "---")}
            </div>
          </Col>
          <Col span={6} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.desc")}</span>
            <div className="erp-info-value" title={ipc.Description || ipc.POName}>
              {ipc.Description || ipc.POName || "---"}
            </div>
          </Col>
        </Row>

        <div className="erp-info-divider" />

        {/* Hàng 2: 5 Cột */}
        <Row gutter={[0, 0]} align="middle">
          <Col span={5} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.paymentTerms")}</span>
            <div className="erp-info-value">
              {paymentTerms}
            </div>
          </Col>
          <Col span={6} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.paymentDate")}</span>
            <div className="erp-info-value">
              {ipc.PaymentDate
                ? (dayjs(ipc.PaymentDate).isValid() ? dayjs(ipc.PaymentDate).format("DD/MM/YYYY") : String(ipc.PaymentDate).split("T")[0])
                : (ipc.DocDate ? dayjs(ipc.DocDate).format("DD/MM/YYYY") : "---")}
            </div>
          </Col>
          <Col span={4} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.amount")}</span>
            <div className="erp-info-value" style={{ color: "#123443", fontWeight: 400 }}>
              {formatVnd(totalSubAmount || ipc.ProposedAmount || 0)}
            </div>
          </Col>
          <Col span={4} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.status")}</span>
            <div className="erp-info-value" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: statusInfo.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#123443" }}>{statusInfo.label}</span>
            </div>
          </Col>
          <Col span={5} className="erp-info-cell">
            <span className="erp-info-label">{t("invoices.drawer.format")}</span>
            <div className="erp-info-value" style={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                checked={Boolean(
                  ipc.IsEContract === true ||
                  (ipc as any).raw?.IsEContract === true ||
                  (ipc as any).raw?.IsEContract === 1 ||
                  (ipc as any).raw?.IsEContract === "Yes"
                )}
                disabled
                style={{ fontSize: 12.5, color: "#123443" }}
              >
                E-Contract
              </Checkbox>
            </div>
          </Col>
        </Row>
      </div>

      {/* SECTION II: THÔNG TIN CHI TIẾT & IPC TAX */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            paddingBottom: 6,
            borderBottom: "1px solid #dce5e6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Nút thu gọn dạng tròn [-] / [+] */}
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "1.5px solid #008f89",
                color: "#008f89",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1,
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {isExpanded ? "–" : "+"}
            </div>

            {/* TAB 1: II. THÔNG TIN CHI TIẾT */}
            <div
              onClick={() => setActiveDetailTab("materials")}
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                color: activeDetailTab === "materials" ? "#008f89" : "#64748b",
                borderBottom: activeDetailTab === "materials" ? "2.5px solid #008f89" : "2.5px solid transparent",
                paddingBottom: 4,
                userSelect: "none",
                transition: "all 0.2s ease",
              }}
            >
              {t("invoices.drawer.secMaterials") || "II. THÔNG TIN CHI TIẾT"}
            </div>

            {/* TAB 2: IPC TAX */}
            <div
              onClick={() => {
                setActiveDetailTab("tax");
                fetchIpcTax();
              }}
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                color: activeDetailTab === "tax" ? "#008f89" : "#64748b",
                borderBottom: activeDetailTab === "tax" ? "2.5px solid #008f89" : "2.5px solid transparent",
                paddingBottom: 4,
                userSelect: "none",
                transition: "all 0.2s ease",
              }}
            >
              IPC TAX
            </div>
          </div>

          {activeDetailTab === "materials" && selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              onClick={() => setIsApplyTaxOpen(true)}
              style={{
                backgroundColor: "#008f89",
                borderColor: "#008f89",
                borderRadius: 6,
                height: 30,
                fontSize: 12.5,
                fontWeight: 600,
                padding: "0 14px",
              }}
            >
              Apply Tax ({selectedRowKeys.length})
            </Button>
          )}
        </div>

        {isExpanded && (
          <div style={{ overflow: "hidden" }}>
            {activeDetailTab === "materials" && (
              <Table<IpcDetailItem>
                className="erp-detail-table"
                bordered
                loading={loadingDetail}
                components={{ header: { cell: ResizableTitle } }}
                columns={mergedColumns}
                dataSource={detailItems}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: scrollX }}
                onRow={(record) => ({
                  style: record.isSectionHeader ? { background: "#f1f8f7", fontWeight: 700 } : undefined,
                })}
                summary={(pageData) => {
                  const dataRows = pageData.filter((r) => !r.isSectionHeader);
                  const totalAmount = dataRows.reduce((sum, current) => sum + (Number(current.Amount) || 0), 0);
                  const totalTaxAmount = dataRows.reduce(
                    (sum, current) => sum + (Number(current.TaxAmount) || 0),
                    0
                  );
                  const totalWithVat = dataRows.reduce(
                    (sum, current) => sum + (Number(current.TotalAmount) || 0),
                    0
                  );
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ background: "#f8fafc", fontWeight: 600 }}>
                        <Table.Summary.Cell index={0} colSpan={8} align="left">
                          <span style={{ color: "#123443", fontWeight: 700 }}>
                            {t("invoices.table.totalSummary") || "Σ Tổng cộng"}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <span style={{ color: "#123443", fontWeight: 700 }}>{formatVnd(totalAmount)}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="center">
                          <span style={{ color: "#94a3b8" }}>-</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <span style={{ color: "#123443", fontWeight: 700 }}>{formatVnd(totalTaxAmount)}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          <span style={{ color: "#008f89", fontWeight: 700 }}>{formatVnd(totalWithVat)}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} colSpan={5} />
                        <Table.Summary.Cell index={6} align="center" />
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            )}

            {activeDetailTab === "tax" && (
              <Table<IpcTaxItem>
                className="erp-detail-table"
                bordered
                loading={loadingTax}
                components={{ header: { cell: ResizableTitle } }}
                columns={mergedTaxColumns}
                dataSource={taxData}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: taxScrollX }}
                summary={(pageData) => {
                  const totalAmount = pageData.reduce((sum, current) => sum + (Number(current.Amount) || 0), 0);
                  const totalTaxAmount = pageData.reduce((sum, current) => sum + (Number(current.TaxAmount) || 0), 0);
                  const totalWithVat = pageData.reduce((sum, current) => sum + (Number(current.TotalAmount) || 0), 0);
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ background: "#f8fafc", fontWeight: 600 }}>
                        <Table.Summary.Cell index={0} colSpan={2} align="left">
                          <span style={{ color: "#123443", fontWeight: 700 }}>
                            {t("invoices.table.totalSummary") || "Σ Tổng cộng"}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <span style={{ color: "#123443", fontWeight: 700 }}>{formatVnd(totalAmount)}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <span style={{ color: "#123443", fontWeight: 700 }}>{formatVnd(totalTaxAmount)}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <span style={{ color: "#008f89", fontWeight: 700 }}>{formatVnd(totalWithVat)}</span>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* POPUP QUY TRÌNH PHÊ DUYỆT RACI */}
      <IpcWorkflowDrawer
        open={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
        ipc={ipc}
      />

      {/* POPUP TỆP ĐÍNH KÈM CHUẨN ERP (2 MẢNG) */}
      <ErpAttachmentsModal
        open={isAttachmentModalOpen}
        onCancel={() => setIsAttachmentModalOpen(false)}
        attachments={ipcAttachments}
        onUploadAttachment={(options, folder) => {
          const { file, onSuccess } = options;
          const sizeStr = file.size
            ? file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.round(file.size / 1024)} KB`
            : "1.5 MB";
          const newAtt: AttachmentFile = {
            id: `att_${Date.now()}`,
            fileName: file.name,
            fileUrl: "#",
            uploadedBy: "r@gmail.com",
            uploadingDate: dayjs().format("DD/MM/YYYY HH:mm"),
            hasSign: folder === "signed_docs" || String(file.name).toLowerCase().includes("signed"),
            folder: folder || "project_docs",
            fileSize: sizeStr,
          };
          setIpcAttachments((prev) => [newAtt, ...prev]);
          onSuccess?.("ok");
          message.success(`Đã tải lên: ${file.name}`);
        }}
        onDeleteAttachment={(id) => {
          setIpcAttachments((prev) => prev.filter((it) => it.id !== id));
          message.success("Đã xóa tệp đính kèm");
        }}
        maxSizeMB={50}
      />

      {/* POPUP APPLY TAX */}
      <Modal
        title={
          <span style={{ fontSize: 15, fontWeight: 700, color: "#123443" }}>
            Apply Tax
          </span>
        }
        open={isApplyTaxOpen}
        onCancel={() => setIsApplyTaxOpen(false)}
        width={440}
        centered
        destroyOnClose
        footer={[
          <Button
            key="close"
            onClick={() => setIsApplyTaxOpen(false)}
            style={{ borderRadius: 6, height: 32, padding: "0 16px" }}
          >
            {language === "en" ? "Close" : "Đóng"}
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveApplyTax}
            style={{
              backgroundColor: "#008f89",
              borderColor: "#008f89",
              borderRadius: 6,
              height: 32,
              padding: "0 18px",
              fontWeight: 600,
            }}
          >
            {language === "en" ? "Save" : "Lưu"}
          </Button>,
        ]}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0 6px" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Tax Rate <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <Select
              value={applyTaxRate}
              onChange={(val) => setApplyTaxRate(val)}
              style={{ width: "100%", height: 36 }}
              options={[
                { label: "0%", value: "0%" },
                { label: "KCT", value: "KCT" },
                { label: "5%", value: "5%" },
                { label: "8%", value: "8%" },
                { label: "10%", value: "10%" },
              ]}
              placeholder="Chọn Tax Rate"
            />
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              InvoiceNo
            </div>
            <Input
              value={applyInvoiceNo}
              onChange={(e) => setApplyInvoiceNo(e.target.value)}
              placeholder="Nhập số hóa đơn..."
              style={{ height: 36, borderRadius: 6, fontSize: 13 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IpcDetailDrawer;
