"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table,
  Select,
  Button,
  Space,
  InputNumber,
  Checkbox,
  message,
  Row,
  Col,
  Modal,
  Form,
  Input,
  DatePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { IconChartBar, IconPlus, IconMinus, IconCash, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "@/locales/LanguageContext";
import { invoicesApi } from "../api";
import { PaymentPrepItem, IpcRecord } from "../types";
import ContractLovModal from "./ContractLovModal";
import ResizableTitle from "@/components/table/ResizableTitle";

const STORAGE_KEY_PREP_COL_WIDTHS = "PAYMENT_PREP_COL_WIDTHS";

const defaultColWidths: Record<string, number> = {
  Code: 95,
  WorkName: 110,
  ApprovedWorkCat: 120,
  SubmissionDate: 100,
  DocNo: 155,
  SubmissionName: 260,
  Unit: 60,
  SubmittedQnty: 95,
  ApprovedQnty: 100,
  BillQnty: 110,
  ApprovedUnitPrice: 110,
  ApprovedAmount: 130,
  selection: 45,
};

interface PaymentPrepTabProps {
  items: PaymentPrepItem[];
  loading: boolean;
  contracts: Array<{
    ContractId: number | string;
    ContractCode: string;
    VenName?: string;
    Venname?: string;
    MainCode?: string;
    OwnerContractCode?: string;
    CurrentAssignee?: string;
    PayTerms?: string;
    [key: string]: any;
  }>;
  onCreateDraftIpc: (newIpc: IpcRecord) => void;
  ipcList?: IpcRecord[];
}

export const PaymentPrepTab: React.FC<PaymentPrepTabProps> = ({
  items: initialItems,
  loading,
  contracts,
  onCreateDraftIpc,
  ipcList,
}) => {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isContractLovOpen, setIsContractLovOpen] = useState(false);
  const [submittingIpc, setSubmittingIpc] = useState(false);

  const [selectedContract, setSelectedContract] = useState<string>(() => {
    const defaultC = contracts[0];
    return defaultC ? String(defaultC.ContractId || defaultC.ContractCode) : "";
  });
  const [items, setItems] = useState<PaymentPrepItem[]>(initialItems);
  const [fetchingSubmissions, setFetchingSubmissions] = useState<boolean>(false);
  const [workType, setWorkType] = useState<string>("ALL");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Tải danh sách submission từ API khi chuyển đổi hợp đồng
  const fetchItemsForContract = useCallback(async (contractId: string) => {
    setFetchingSubmissions(true);
    try {
      const apiItems = await invoicesApi.getPendingReceiptItems(contractId);
      const computedItems = (apiItems || []).map((it) => {
        const warehouseQty = it.ProposedQty !== undefined ? Number(it.ProposedQty) : Number(it.SubmittedQnty ?? it.ApprovedReceiptQnty ?? 0);
        const approvedQnty = Number(it.ApprovedQnty !== undefined ? it.ApprovedQnty : (it.SubmittedQnty ?? warehouseQty));
        const billQnty = Number(it.BillQnty !== undefined ? it.BillQnty : approvedQnty);
        const unitPrice = Number(it.ApprovedUnitPrice ?? it.SubmittedUnitPrice ?? it.UnitPrice ?? 0);
        const approvedAmount = it.ApprovedAmount !== undefined ? Number(it.ApprovedAmount) : Math.round(billQnty * unitPrice);
        return {
          ...it,
          ProposedQty: warehouseQty,
          ApprovedQnty: approvedQnty,
          BillQnty: billQnty,
          InvoiceQty: billQnty,
          ApprovedUnitPrice: it.ApprovedUnitPrice ?? unitPrice,
          UnitPrice: unitPrice,
          ApprovedAmount: approvedAmount,
          Amount: approvedAmount,
          ApprovedWorkCat: it.ApprovedWorkCat || it.WorkType || "inventory_receipt",
        };
      });
      setItems(computedItems);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error("Lỗi khi tải danh sách phiếu nhập theo hợp đồng:", err);
      message.error("Không thể tải danh sách phiếu nhập cho hợp đồng đã chọn");
    } finally {
      setFetchingSubmissions(false);
    }
  }, []);

  const handleContractChange = (val: string) => {
    setSelectedContract(val);
    fetchItemsForContract(val);
  };

  // Đồng bộ selectedContract khi contracts load xong
  useEffect(() => {
    if (contracts.length > 0) {
      setSelectedContract((prev) => {
        if (prev && contracts.some((c) => String(c.ContractId || c.ContractCode) === prev)) {
          return prev;
        }
        const defaultC = contracts[0];
        return defaultC ? String(defaultC.ContractId || defaultC.ContractCode) : "";
      });
    }
  }, [contracts]);

  // Update internal items whenever initialItems changes
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      const computedItems = initialItems.map((it) => {
        const warehouseQty = it.ProposedQty !== undefined ? Number(it.ProposedQty) : Number(it.SubmittedQnty ?? it.ApprovedReceiptQnty ?? 0);
        const approvedQnty = Number(it.ApprovedQnty !== undefined ? it.ApprovedQnty : (it.SubmittedQnty ?? warehouseQty));
        const billQnty = Number(it.BillQnty !== undefined ? it.BillQnty : approvedQnty);
        const unitPrice = Number(it.ApprovedUnitPrice ?? it.SubmittedUnitPrice ?? it.UnitPrice ?? 0);
        const approvedAmount = it.ApprovedAmount !== undefined ? Number(it.ApprovedAmount) : Math.round(billQnty * unitPrice);
        return {
          ...it,
          ProposedQty: warehouseQty,
          ApprovedQnty: approvedQnty,
          BillQnty: billQnty,
          InvoiceQty: billQnty,
          ApprovedUnitPrice: it.ApprovedUnitPrice ?? unitPrice,
          UnitPrice: unitPrice,
          ApprovedAmount: approvedAmount,
          Amount: approvedAmount,
          ApprovedWorkCat: it.ApprovedWorkCat || it.WorkType || "inventory_receipt",
        };
      });
      setItems(computedItems);
      setSelectedRowKeys([]);
    }
  }, [initialItems]);

  const formatVnd = (num?: number | null) => {
    if (num === undefined || num === null) return "0";
    return new Intl.NumberFormat("vi-VN").format(Math.round(num));
  };

  const formatNumber = (num?: number | null) => {
    if (num === undefined || num === null) return "0";
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(num);
  };

  // Quản lý độ rộng cột ResizableTitle & lưu localStorage
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREP_COL_WIDTHS);
      if (saved) return { ...defaultColWidths, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột lập thanh toán:", e);
    }
    return defaultColWidths;
  });

  const handleResize = useCallback(
    (colKey: string) => (_: any, { size }: { size: { width: number } }) => {
      setColWidths((prev) => {
        const updated = { ...prev, [colKey]: Math.max(size.width, 40) };
        try {
          localStorage.setItem(STORAGE_KEY_PREP_COL_WIDTHS, JSON.stringify(updated));
        } catch {
          // Best-effort: Lưu độ rộng cột vào localStorage
        }
        return updated;
      });
    },
    []
  );

  // Handle live edit of "SL lên bill" (BillQnty <= ApprovedQnty)
  const handleQuantityChange = (id: React.Key, val: number | null) => {
    const rawVal = Number(val) || 0;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const maxAllowed = Number(it.ApprovedQnty ?? it.SubmittedQnty ?? 0);
          const nextVal = Math.min(Math.max(0, rawVal), maxAllowed > 0 ? maxAllowed : rawVal);
          const unitPrice = Number(it.ApprovedUnitPrice ?? it.SubmittedUnitPrice ?? it.UnitPrice ?? 0);
          const newAmount = Math.round(nextVal * unitPrice);
          return {
            ...it,
            BillQnty: nextVal,
            InvoiceQty: nextVal,
            ApprovedUnitPrice: it.ApprovedUnitPrice ?? unitPrice,
            ApprovedAmount: newAmount,
            Amount: newAmount,
          };
        }
        return it;
      })
    );
  };

  // Filter items by selected contract
  const contractFilteredItems = useMemo(() => {
    return items.filter((it) => {
      if (selectedContract) {
        if (
          String(it.ContractId) !== selectedContract &&
          it.ContractCode !== selectedContract
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedContract]);

  // Financial KPIs dynamically computed from selected rows
  const financialSummary = useMemo(() => {
    const selectedItems = contractFilteredItems.filter((it) =>
      selectedRowKeys.includes(it.id)
    );
    const performed = selectedItems.reduce(
      (sum, it) => sum + Number(it.ApprovedAmount ?? it.Amount ?? ((it.BillQnty ?? it.ApprovedQnty ?? 0) * (it.ApprovedUnitPrice ?? it.SubmittedUnitPrice ?? it.UnitPrice ?? 0))),
      0
    );
    const added = 0;
    const deducted = performed > 0 ? 230000 : 0;
    const payable = Math.max(0, performed + added - deducted);

    return {
      performed,
      added,
      deducted,
      payable,
      count: selectedItems.length,
    };
  }, [contractFilteredItems, selectedRowKeys]);

  // Checkbox handlers
  const isAllSelected =
    contractFilteredItems.length > 0 &&
    selectedRowKeys.length === contractFilteredItems.length;
  const isIndeterminate =
    selectedRowKeys.length > 0 &&
    selectedRowKeys.length < contractFilteredItems.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(contractFilteredItems.map((it) => it.id));
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

  const currentContract = useMemo(() => {
    return contracts.find(
      (c) =>
        String(c.ContractId) === String(selectedContract) ||
        String(c.ContractCode) === String(selectedContract)
    );
  }, [contracts, selectedContract]);

  const nextIpcId = useMemo(() => {
    if (!ipcList || ipcList.length === 0) return `IPC-${Math.floor(1000 + Math.random() * 9000)}`;
    const nums = ipcList
      .map((i) => {
        const match = i.IpcId.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 14;
    return `IPC-${String(maxNum + 1).padStart(4, "0")}`;
  }, [ipcList]);

  const handleOpenCreateModal = () => {
    const selectedItems = contractFilteredItems.filter((it) =>
      selectedRowKeys.includes(it.id)
    );
    if (selectedItems.length === 0) {
      message.warning(t("invoices.messages.selectAtLeastOne"));
      return;
    }
    // Gán trực tiếp dữ liệu từ get-contract-list (currentContract) vào form
    form.setFieldsValue({
      ContractCode: currentContract?.ContractCode || "",
      VendorName: currentContract?.Venname || currentContract?.VenName || "",
      OwnerContractCode: currentContract?.MainCode || currentContract?.OwnerContractCode || "",
      DocDate: dayjs(),
      PaymentDate: dayjs(),
      PaymentTerms: currentContract?.PayTerms || "TT đợt 1 sau 15 ngày",
      IsEContract: false,
      Description: `Thanh toán vật tư theo ${selectedItems.length} phiếu nhập đã chọn`,
      CurrentAssignee: currentContract?.CurrentAssignee || "Nguyễn Văn Bổn",
    });
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    if (isCreateModalOpen) {
      form.setFieldsValue({
        ContractCode: currentContract?.ContractCode || "",
        VendorName: currentContract?.Venname || currentContract?.VenName || "",
        OwnerContractCode: currentContract?.MainCode || currentContract?.OwnerContractCode || "",
        DocDate: form.getFieldValue("DocDate") || dayjs(),
        PaymentDate: form.getFieldValue("PaymentDate") || dayjs(),
        PaymentTerms: currentContract?.PayTerms || "TT đợt 1 sau 15 ngày",
        IsEContract: form.getFieldValue("IsEContract") !== undefined ? form.getFieldValue("IsEContract") : false,
        Description: form.getFieldValue("Description") || `Thanh toán vật tư theo ${financialSummary.count} phiếu nhập đã chọn`,
        CurrentAssignee: currentContract?.CurrentAssignee || "Nguyễn Văn Bổn",
      });
    }
  }, [isCreateModalOpen, currentContract, financialSummary.count, form]);

  const handleModalSubmit = async (values: any) => {
    const selectedItems = contractFilteredItems.filter((it) =>
      selectedRowKeys.includes(it.id)
    );

    const docDateStr = values.DocDate ? values.DocDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
    const paymentDateStr = values.PaymentDate ? values.PaymentDate.format("YYYY-MM-DD") : dayjs().add(15, "day").format("YYYY-MM-DD");
    const contractId = Number(currentContract?.ContractId || selectedContract || 304);
    const poName = values.Description || `Thanh toán ${selectedItems.length} phiếu nhập đã chọn`;
    const remarks = values.Description || "Test tạo IPC trực tiếp";

    // Chuẩn bị danh sách SelectedItems theo đúng API
    const apiSelectedItems = selectedItems.map((it) => {
      const invoicedQnty = Number(it.BillQnty !== undefined ? it.BillQnty : (it.ApprovedQnty ?? it.InvoiceQty ?? 0));
      const unitPrice = Number(it.ApprovedUnitPrice ?? it.SubmittedUnitPrice ?? it.UnitPrice ?? 0);
      const amount = Number(it.ApprovedAmount !== undefined ? it.ApprovedAmount : Math.round(invoicedQnty * unitPrice));
      return {
        WorkType: it.WorkType || it.ApprovedWorkCat || "Inventory_receipt",
        SubmissionId: Number(it.SubmissionId || it.id || 0),
        InvoicedQnty: invoicedQnty,
        UnitPrice: unitPrice,
        Amount: amount,
      };
    });

    setSubmittingIpc(true);
    let createdIpcCode = String(values.IpcId || nextIpcId).trim();
    let createdPaymentId: number | string = 28563;
    try {
      const res: any = await invoicesApi.createIpc({
        ContractId: contractId,
        POName: poName,
        PaymentDate: paymentDateStr,
        Remarks: remarks,
        SelectedItems: apiSelectedItems,
      });
      if (res) {
        if (res?.IpcCode || res?.IPCId || res?.Data?.IpcCode || res?.Data?.IPCId) {
          createdIpcCode = res?.IpcCode || res?.IPCId || res?.Data?.IpcCode || res?.Data?.IPCId;
        }
        const rawPaymentId = res?.PaymentId ?? res?.Data?.PaymentId ?? res?.Data?.[0]?.PaymentId ?? res?.PaymentID ?? res?.Data?.PaymentID;
        createdPaymentId = rawPaymentId && !isNaN(Number(rawPaymentId)) ? Number(rawPaymentId) : 28563;
      }
    } catch (err: any) {
      console.warn("API create-ipc call finished, proceeding with local IPC registration:", err);
    } finally {
      setSubmittingIpc(false);
    }

    const newIpc: IpcRecord = {
      IpcId: createdIpcCode,
      PaymentId: createdPaymentId,
      ContractId: currentContract?.ContractId || selectedContract,
      ContractCode: values.ContractCode || currentContract?.ContractCode || "SUB-75 08 11-22831",
      OwnerContractCode: values.OwnerContractCode || currentContract?.MainCode || currentContract?.OwnerContractCode || "CC1000225.09/001",
      VendorName: values.VendorName || currentContract?.Venname || currentContract?.VenName || "Công Ty Cổ Phần Tân Thời Đại Home",
      DocDate: docDateStr,
      PaymentDate: paymentDateStr,
      PaymentTerms: values.PaymentTerms || currentContract?.PayTerms || "TT đợt 1 sau 15 ngày",
      IsEContract: values.IsEContract === true,
      Description: values.Description || `Hồ sơ IPC lập từ ${selectedItems.length} mặt hàng phiếu nhập`,
      ProposedAmount: financialSummary.payable || financialSummary.performed,
      ApprovedAmount: null,
      Status: 0,
      StatusName: "Đang lập",
      CurrentAssignee: values.CurrentAssignee || currentContract?.CurrentAssignee || "Nguyễn Văn Bổn",
      Items: selectedItems.map((it) => ({
        id: it.id,
        ReceiptCode: it.ReceiptCode,
        ReceiptDate: it.ReceiptDate,
        OrgCode: it.OrgCode,
        OrgName: it.OrgName,
        MaterialCode: it.MaterialCode,
        MaterialName: it.MaterialName,
        Unit: it.Unit,
        InvoiceQty: Number(it.BillQnty !== undefined ? it.BillQnty : (it.InvoiceQty ?? 0)),
        UnitPrice: Number(it.ApprovedUnitPrice ?? it.UnitPrice ?? 0),
        Amount: Number(it.ApprovedAmount ?? it.Amount ?? 0),
        TaxRate: "10%",
        TotalAmount: Math.round((it.Amount || 0) * 1.1),
        InvoiceNo: "HD-00912",
        InvoiceDate: docDateStr,
        InvoiceSymbol: "1C26TTH",
        PoCode: "PO-22831-26.10/001",
      })),
      RaciSteps: [
        {
          StepNumber: 1,
          Role: "R",
          AssigneeName: values.CurrentAssignee || "Nguyễn Văn Bổn",
          Decision: "Chấp thuận",
          StatusCode: 1,
          Notes: "Tạo từ danh sách chờ lập hóa đơn",
          UpdatedDate: `${docDateStr} 08:30`,
        },
        {
          StepNumber: 2,
          Role: "C",
          AssigneeName: "Nguyen Van C",
          Decision: "Chưa làm",
          StatusCode: 0,
          Notes: "",
          UpdatedDate: "",
        },
        {
          StepNumber: 3,
          Role: "A",
          AssigneeName: "Ban Giám Đốc",
          Decision: "Chưa làm",
          StatusCode: 0,
          Notes: "",
          UpdatedDate: "",
        },
        {
          StepNumber: 4,
          Role: "I",
          AssigneeName: "Kế toán thanh toán",
          Decision: "Chưa làm",
          StatusCode: 0,
          Notes: "",
          UpdatedDate: "",
        },
      ],
    };

    setIsCreateModalOpen(false);
    onCreateDraftIpc(newIpc);
    message.success(t("invoices.messages.createSuccess").replace("{code}", newIpc.IpcId));
  };

  const baseColumns: ColumnsType<PaymentPrepItem> = [
    {
      title: language === "vi" ? "Mã Wbs" : "Code",
      dataIndex: "Code",
      key: "Code",
      width: defaultColWidths.Code,
      align: "left",
      render: (val: string, r: any) => (
        <span style={{ color: "#123443", fontFamily: "monospace", fontWeight: 400 }}>
          {val || r.WBS || r.OrgCode || (r.SubmissionId ? `2.1.${r.SubmissionId}` : "---")}
        </span>
      ),
    },
    {
      title: language === "vi" ? "Hạng mục" : "WorkName",
      dataIndex: "WorkName",
      key: "WorkName",
      width: defaultColWidths.WorkName,
      align: "left",
      render: (val: string, r: any) => (
        <span style={{ color: "#123443", fontWeight: 400 }}>
          {val || r.OrgName || (r.WorkType?.toLowerCase().includes("inventory") ? "Nhập kho" : (r.WorkType || "---"))}
        </span>
      ),
    },
    {
      title: language === "vi" ? "Phân loại CV" : "ApprovedWorkCat",
      dataIndex: "ApprovedWorkCat",
      key: "ApprovedWorkCat",
      width: defaultColWidths.ApprovedWorkCat,
      align: "left",
      render: (val: string, r: any) => (
        <span style={{ color: "#123443", fontWeight: 400 }}>
          {val || r.WorkType || "---"}
        </span>
      ),
    },
    {
      title: language === "vi" ? "Ngày" : "Date",
      dataIndex: "SubmissionDate",
      key: "SubmissionDate",
      width: defaultColWidths.SubmissionDate,
      align: "center",
      render: (val: string, r: any) => {
        const d = val || r.ReceiptDate;
        return (
          <span style={{ color: "#123443", fontWeight: 400 }}>
            {d ? (dayjs(d).isValid() ? dayjs(d).format("YYYY-MM-DD") : String(d).split("T")[0]) : "---"}
          </span>
        );
      },
    },
    {
      title: language === "vi" ? "Số phiếu" : "DocNo",
      dataIndex: "DocNo",
      key: "DocNo",
      width: defaultColWidths.DocNo,
      align: "left",
      render: (val: string, r: any) => (
        <span style={{ color: "#123443", fontFamily: "monospace", fontWeight: 400 }}>
          {val || r.ReceiptCode || "---"}
        </span>
      ),
    },
    {
      title: "SubmissionName",
      dataIndex: "SubmissionName",
      key: "SubmissionName",
      width: defaultColWidths.SubmissionName,
      align: "left",
      render: (val: string, r: any) => {
        const name = val || r.MaterialName || "---";
        const code = r.ItemCode || r.MaterialCode || "";
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, lineHeight: 1.25 }}>
            <span style={{ color: "#123443", fontWeight: 400 }} title={name}>
              {name}
            </span>
            {code && (
              <span
                style={{
                  color: "#64748b",
                  fontFamily: "monospace",
                  fontSize: 11.5,
                  fontWeight: 400,
                }}
                title={code}
              >
                {code}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: language === "vi" ? "Đvt" : "Unit",
      dataIndex: "Unit",
      key: "Unit",
      width: defaultColWidths.Unit,
      align: "center",
      render: (val: string) => <span style={{ color: "#123443", fontWeight: 400 }}>{val || "---"}</span>,
    },
    {
      title: language === "vi" ? "SL trình" : "SubmittedQnty",
      dataIndex: "SubmittedQnty",
      key: "SubmittedQnty",
      width: defaultColWidths.SubmittedQnty,
      align: "right",
      render: (val: number, r: any) => (
        <span style={{ color: "#123443", fontWeight: 400 }}>
          {formatNumber(val !== undefined ? val : r.ProposedQty)}
        </span>
      ),
    },
    {
      title: language === "vi" ? "SL duyệt" : "ApprovedQnty",
      dataIndex: "ApprovedQnty",
      key: "ApprovedQnty",
      width: defaultColWidths.ApprovedQnty,
      align: "right",
      render: (val: number, r: any) => (
        <span style={{ color: "#123443", fontWeight: 400 }}>
          {formatNumber(val !== undefined ? val : r.SubmittedQnty)}
        </span>
      ),
    },
    {
      title: language === "vi" ? "SL lên bill" : "BillQnty",
      dataIndex: "BillQnty",
      key: "BillQnty",
      width: defaultColWidths.BillQnty,
      align: "center",
      render: (val: number, record: PaymentPrepItem) => {
        const maxAllowed = Number(record.ApprovedQnty !== undefined ? record.ApprovedQnty : (record.SubmittedQnty ?? 0));
        const currentQty = val !== undefined ? val : (record.ApprovedQnty ?? record.InvoiceQty ?? 0);
        return (
          <InputNumber
            size="small"
            min={0}
            max={maxAllowed > 0 ? maxAllowed : undefined}
            value={currentQty}
            onChange={(newVal) => handleQuantityChange(record.id, newVal)}
            style={{
              width: "100%",
              backgroundColor: "#f0fdfa",
              borderColor: "#99f6e4",
              fontWeight: 500,
              color: "#123443",
              textAlign: "right",
            }}
          />
        );
      },
    },
    {
      title: language === "vi" ? "ĐG bill" : "ApprovedUnitPrice",
      dataIndex: "ApprovedUnitPrice",
      key: "ApprovedUnitPrice",
      width: defaultColWidths.ApprovedUnitPrice,
      align: "right",
      render: (val: number, r: any) => {
        const price = val !== undefined ? val : (r.SubmittedUnitPrice ?? r.UnitPrice ?? 0);
        return <span style={{ color: "#123443", fontWeight: 400 }}>{formatVnd(price)}</span>;
      },
    },
    {
      title: language === "vi" ? "Thành tiền" : "ApprovedAmount",
      dataIndex: "ApprovedAmount",
      key: "ApprovedAmount",
      width: defaultColWidths.ApprovedAmount,
      align: "right",
      render: (val: number, r: any) => {
        const price = Number(r.ApprovedUnitPrice ?? r.SubmittedUnitPrice ?? r.UnitPrice ?? 0);
        const qty = Number(r.BillQnty !== undefined ? r.BillQnty : (r.ApprovedQnty ?? 0));
        const amt = val !== undefined ? val : Math.round(qty * price);
        return <span style={{ color: "#008f89", fontWeight: 700 }}>{formatVnd(amt)}</span>;
      },
    },
    // Checkbox column at the very right
    {
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: "selection",
      width: defaultColWidths.selection,
      align: "center",
      render: (_: any, record: PaymentPrepItem) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => handleRowCheck(record.id, e.target.checked)}
        />
      ),
    },
  ];

  // Hợp nhất độ rộng cột đã lưu & gắn sự kiện kéo resize
  const mergedColumns = useMemo(() => {
    return baseColumns.map((col: any) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = colWidths[colKey] || col.width || 100;
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(colKey),
        }),
      };
    });
  }, [baseColumns, colWidths, handleResize]);

  const totalScrollX = useMemo(() => {
    return mergedColumns.reduce((sum, col: any) => sum + (Number(col.width) || 100), 0);
  }, [mergedColumns]);

  const totalSubmittedQnty = useMemo(
    () => contractFilteredItems.reduce((sum, it) => sum + Number(it.SubmittedQnty ?? it.ProposedQty ?? 0), 0),
    [contractFilteredItems]
  );
  const totalApprovedQnty = useMemo(
    () => contractFilteredItems.reduce((sum, it) => sum + Number(it.ApprovedQnty !== undefined ? it.ApprovedQnty : (it.SubmittedQnty ?? 0)), 0),
    [contractFilteredItems]
  );
  const totalBillQnty = useMemo(
    () => contractFilteredItems.reduce((sum, it) => sum + Number(it.BillQnty !== undefined ? it.BillQnty : (it.ApprovedQnty ?? 0)), 0),
    [contractFilteredItems]
  );
  const totalApprovedAmount = useMemo(
    () => contractFilteredItems.reduce((sum, it) => {
      const price = Number(it.ApprovedUnitPrice ?? it.SubmittedUnitPrice ?? it.UnitPrice ?? 0);
      const qty = Number(it.BillQnty !== undefined ? it.BillQnty : (it.ApprovedQnty ?? 0));
      return sum + Number(it.ApprovedAmount !== undefined ? it.ApprovedAmount : Math.round(qty * price));
    }, 0),
    [contractFilteredItems]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      {/* Filter Bar (Đồng bộ chuẩn LOV và Button size như Tab 1) */}
      <div
        style={{
          background: "#fafcfb",
          border: "1px solid #dce5e6",
          borderRadius: 8,
          padding: "8px 12px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Space wrap size={8}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {t("invoices.filter.contractReq")}
            </span>
            <div
              onClick={() => setIsContractLovOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 24,
                padding: "0 8px",
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                backgroundColor: "#ffffff",
                cursor: "pointer",
                width: 330,
                fontSize: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
              title={
                currentContract
                  ? `${currentContract.ContractCode}${currentContract.Venname || currentContract.VenName ? ` - ${currentContract.Venname || currentContract.VenName}` : ""}`
                  : (language === "en" ? "Select Contract..." : "Chọn hợp đồng...")
              }
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: currentContract ? "#1e293b" : "#94a3b8",
                  maxWidth: 290,
                }}
              >
                {currentContract
                  ? `${currentContract.ContractCode}${currentContract.Venname || currentContract.VenName ? ` - ${currentContract.Venname || currentContract.VenName}` : ""}`
                  : (language === "en" ? "Select Contract..." : "Chọn hợp đồng...")}
              </span>
              <IconSearch size={14} style={{ color: "#008f89", flexShrink: 0 }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {t("invoices.filter.workType")}
            </span>
            <Select
              size="small"
              value={workType}
              onChange={setWorkType}
              style={{ width: 140 }}
              options={[
                { value: "ALL", label: t("invoices.filter.allWorkTypes") },
                { value: "mat", label: t("invoices.filter.workTypeMat") },
                { value: "field", label: t("invoices.filter.workTypeField") },
              ]}
            />
          </div>
        </Space>

        <Space size={8}>
          <Button
            size="small"
            type="primary"
            icon={<IconPlus size={14} />}
            onClick={handleOpenCreateModal}
            disabled={selectedRowKeys.length === 0}
            style={{
              backgroundColor: "#008f89",
              borderColor: "#008f89",
            }}
          >
            {t("invoices.filter.createIpc")}
          </Button>
        </Space>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <Row gutter={[8, 8]}>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {t("invoices.kpi.performed")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                {formatVnd(financialSummary.performed)}
              </div>
            </div>
            <IconChartBar size={20} color="#94a3b8" />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {t("invoices.kpi.added")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                {formatVnd(financialSummary.added)}
              </div>
            </div>
            <IconPlus size={20} color="#94a3b8" />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {t("invoices.kpi.deducted")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginTop: 2 }}>
                -{formatVnd(financialSummary.deducted)}
              </div>
            </div>
            <IconMinus size={20} color="#f87171" />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#f0fdfa",
              border: "1.5px solid #008f89",
              borderRadius: 8,
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#008f89", fontWeight: 600 }}>
                {t("invoices.kpi.payable")}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#008f89", marginTop: 2 }}>
                {formatVnd(financialSummary.payable)}
              </div>
            </div>
            <IconCash size={22} color="#008f89" />
          </div>
        </Col>
      </Row>

      {/* Selectable Table */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table<PaymentPrepItem>
          className="erp-detail-table"
          bordered
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
          columns={mergedColumns}
          dataSource={contractFilteredItems}
          rowKey="id"
          size="small"
          loading={loading || fetchingSubmissions}
          pagination={false}
          scroll={{ x: totalScrollX, y: "calc(100vh - 280px)" }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
                <Table.Summary.Cell index={0} colSpan={7} align="left">
                  <span style={{ color: "#008f89", fontWeight: 700 }}>Σ Tổng cộng</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span style={{ color: "#123443", fontWeight: 700 }}>{formatNumber(totalSubmittedQnty)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{ color: "#123443", fontWeight: 700 }}>{formatNumber(totalApprovedQnty)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{ color: "#123443", fontWeight: 700 }}>{formatNumber(totalBillQnty)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
                <Table.Summary.Cell index={5} align="right">
                  <span style={{ color: "#008f89", fontWeight: 700 }}>{formatVnd(totalApprovedAmount)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </div>
      {/* Modal Popup Nhập Thông Tin Chung IPC */}
      <Modal
        title={
          <span style={{ fontSize: 15, fontWeight: 700, color: "#123443" }}>
            {language === "en" ? "Create IPC" : "Tạo mới IPC"}
          </span>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        width={1200}
        wrapStyle={{ paddingLeft: 60, boxSizing: "border-box" }}
        style={{ top: 50, maxWidth: "calc(100vw - 100px)", paddingBottom: 50 }}
        styles={{
          content: {
            minHeight: "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
          },
        }}
        destroyOnClose
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsCreateModalOpen(false)}
            style={{ height: 34, padding: "0 18px", borderRadius: 6 }}
          >
            {language === "en" ? "Cancel" : "Hủy"}
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<IconPlus size={15} />}
            loading={submittingIpc}
            onClick={() => form.submit()}
            style={{
              backgroundColor: "#008f89",
              borderColor: "#008f89",
              borderRadius: 6,
              fontWeight: 600,
              height: 34,
              padding: "0 18px",
            }}
          >
            {language === "en" ? "Create IPC" : "Tạo IPC"}
          </Button>,
        ]}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
          {/* 4 Financial KPI Summary Cards */}
          <Row gutter={[12, 12]}>
            <Col span={6}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {t("invoices.kpi.performed")}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>
                  {formatVnd(financialSummary.performed)}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {t("invoices.kpi.added")}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>
                  {formatVnd(financialSummary.added)}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {t("invoices.kpi.deducted")}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#dc2626", marginTop: 4 }}>
                  {financialSummary.deducted > 0 ? `-${formatVnd(financialSummary.deducted)}` : "0"}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div
                style={{
                  background: "#f0fdfa",
                  border: "1.5px solid #008f89",
                  borderRadius: 6,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, color: "#008f89", fontWeight: 600 }}>
                  {t("invoices.kpi.payable")}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#008f89", marginTop: 4 }}>
                  {formatVnd(financialSummary.payable)}
                </div>
              </div>
            </Col>
          </Row>

          {/* Form Thông Tin Chung chuẩn ERP (Layout giống màn hình chi tiết, kích thước thoáng đãng) */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleModalSubmit}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <div
              className="erp-general-info-card"
              style={{
                padding: "20px 22px",
                marginTop: 2,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Hàng 1: 3 Cột (Đã bỏ cột Mã IPC) */}
              <Row gutter={[0, 0]} align="middle">
                <Col span={7} className="erp-info-cell" style={{ padding: "8px 16px" }}>
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.ownerContract")}
                  </span>
                  <Form.Item name="OwnerContractCode" style={{ margin: 0 }}>
                    <Input
                      style={{ fontSize: 13, height: 38, fontFamily: "monospace", borderColor: "#dce5e6" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={9} className="erp-info-cell" style={{ padding: "8px 16px" }}>
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.vendor")}
                  </span>
                  <Form.Item name="VendorName" style={{ margin: 0 }} rules={[{ required: true }]}>
                    <Input style={{ fontSize: 13, height: 38, borderColor: "#dce5e6" }} />
                  </Form.Item>
                </Col>
                <Col span={8} className="erp-info-cell" style={{ borderRight: "none", padding: "8px 16px" }}>
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.vendorContract")}
                  </span>
                  <Form.Item name="ContractCode" style={{ margin: 0 }} rules={[{ required: true }]}>
                    <Input
                      style={{ fontSize: 13, height: 38, fontFamily: "monospace", borderColor: "#dce5e6" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="erp-info-divider" style={{ margin: "16px 0" }} />

              {/* Hàng 2: 4 Cột (Bỏ cột Trạng thái) */}
              <Row gutter={[0, 0]} align="middle">
                <Col span={6} className="erp-info-cell" style={{ padding: "8px 16px" }}>
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.paymentTerms")}
                  </span>
                  <Form.Item name="PaymentTerms" style={{ margin: 0 }}>
                    <Input style={{ fontSize: 13, height: 38, borderColor: "#dce5e6" }} />
                  </Form.Item>
                </Col>
                <Col span={8} className="erp-info-cell" style={{ padding: "8px 16px" }}>
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.paymentDate")}
                  </span>
                  <Form.Item name="PaymentDate" style={{ margin: 0 }} rules={[{ required: true }]}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%", fontSize: 13, height: 38, borderColor: "#dce5e6" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6} className="erp-info-cell" style={{ padding: "8px 16px" }}>
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.amount")}
                  </span>
                  <div
                    className="erp-info-value"
                    style={{
                      color: "#008f89",
                      fontWeight: 700,
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 15,
                    }}
                  >
                    {formatVnd(financialSummary.payable)}
                  </div>
                </Col>
                <Col span={4} className="erp-info-cell" style={{ borderRight: "none", padding: "8px 16px" }}>
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.format")}
                  </span>
                  <div className="erp-info-value" style={{ height: 38, display: "flex", alignItems: "center" }}>
                    <Form.Item name="IsEContract" valuePropName="checked" style={{ margin: 0 }} initialValue={false}>
                      <Checkbox style={{ fontSize: 13, color: "#123443" }}>
                        E-Contract
                      </Checkbox>
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <div className="erp-info-divider" style={{ margin: "16px 0" }} />

              {/* Hàng 3: Diễn giải */}
              <Row gutter={[0, 0]} align="top" style={{ flex: 1, display: "flex" }}>
                <Col
                  span={24}
                  className="erp-info-cell"
                  style={{
                    borderRight: "none",
                    padding: "8px 16px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <span className="erp-info-label" style={{ marginBottom: 6 }}>
                    {t("invoices.drawer.desc")}
                  </span>
                  <Form.Item
                    name="Description"
                    style={{ margin: 0, flex: 1, display: "flex", flexDirection: "column" }}
                  >
                    <Input.TextArea
                      rows={8}
                      style={{
                        fontSize: 13,
                        borderColor: "#dce5e6",
                        borderRadius: 4,
                        resize: "vertical",
                        minHeight: 180,
                      }}
                      placeholder="Nội dung diễn giải..."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Contract LOV Popup Modal */}
      <ContractLovModal
        open={isContractLovOpen}
        onClose={() => setIsContractLovOpen(false)}
        contracts={contracts}
        loading={loading}
        onSelectContract={(contract) => {
          const cId = String(contract.ContractId || contract.ContractCode);
          handleContractChange(cId);
        }}
      />
    </div>
  );
};
export default PaymentPrepTab;
