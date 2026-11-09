import dayjs from "dayjs";
import { contractsApi } from "@/app/contracts/api";
import { extractApiList, getStoredSession, API_BASE_URL } from "@/lib/api-client";
import { getFeatureData, postFeatureData } from "@/lib/feature-api";
import { IpcRecord, PaymentPrepItem } from "./types";

const STORAGE_KEY_IPC = "consims_ipc_list";

export const invoicesApi = {
  getContracts: async () => {
    try {
      const session = getStoredSession();
      const params = {
        Language: session?.Language || "en",
        LogIn: session?.LogIn || "",
        SessionId: session?.SessionId || "",
        DisplayMode: "mat_equip",
        Keyword: "",
        ClientId: session?.ClientId || "",
        WSId: (session as any)?.WSId || "",
        PageNum: 1,
        PageSize: 100,
      };

      const res = await contractsApi.getContracts(params, { skipCache: true });
      const list = extractApiList(res);
      if (list && list.length > 0) {
        return list.map((item: any) => ({
          ...item,
          ContractId: item.ContractId,
          ContractCode: item.ContractCode,
          VenName: item.Venname || item.VenName || "",
          Venname: item.Venname || item.VenName || "",
          MainCode: item.MainCode || item.OwnerContractCode || "CC1000225.09/001",
          OwnerContractCode: item.MainCode || item.OwnerContractCode || "CC1000225.09/001",
          Contractdate: item.Contractdate || item.ContractDate || item.StartDate || "",
          ContractDate: item.Contractdate || item.ContractDate || item.StartDate || "",
          Description: item.Description,
          ContractedAmount: item.ContractedAmount,
          StatusCode: item.StatusCode,
          StatusName: item.StatusName,
          CurrentAssignee: item.CurrentAssignee,
          PayTerms: item.PayTerms,
        }));
      }
    } catch (e) {
      console.warn("Lỗi khi tải danh sách hợp đồng:", e);
    }
    return [];
  },

  getIpcList: async (filterParams?: {
    ContractId?: string | number;
    ApprovalStatus?: string;
    FromDate?: string;
    ToDate?: string;
    Keyword?: string;
    PageSize?: number;
    CreatedBy?: string;
    Language?: string;
  }): Promise<IpcRecord[]> => {
    const session = getStoredSession();
    const activeLang =
      filterParams?.Language ||
      (typeof window !== "undefined" ? localStorage.getItem("consims_lang") : null) ||
      session?.Language ||
      "vi";

    const params = {
      WSId: (session as any)?.WSId || "",
      LogIn: session?.LogIn || "",
      SessionId: session?.SessionId || "",
      Language: activeLang,
      ApprovalStatus: filterParams?.ApprovalStatus || "All",
      ContractId: filterParams?.ContractId && filterParams.ContractId !== "ALL" ? String(filterParams.ContractId) : "",
      FromDate: filterParams?.FromDate || "",
      ToDate: filterParams?.ToDate || "",
      PageSize: filterParams?.PageSize || 1000,
      Keyword: filterParams?.Keyword || "",
      CreatedBy: filterParams?.CreatedBy || "All",
      DisplayMode: "po_list_by_web",
    };

    try {
      let res = await getFeatureData("api/get-ipc-list", params, { skipCache: true });
      let list = extractApiList(res);

      // Nếu proxy / axios chưa nhận được mảng, thử gọi trực tiếp qua fetch nội bộ
      if (!Array.isArray(list) || list.length === 0) {
        if (typeof window !== "undefined") {
          try {
            const queryStr = `params=${encodeURIComponent(JSON.stringify(params))}`;
            const fetchRes = await fetch(`${API_BASE_URL}/api/get-ipc-list?${queryStr}`);
            if (fetchRes.ok) {
              const json = await fetchRes.json();
              const directList = extractApiList(json);
              if (Array.isArray(directList) && directList.length > 0) {
                list = directList;
              }
            }
          } catch (e) {
            console.warn("Direct fetch error:", e);
          }
        }
      }

      if (Array.isArray(list) && list.length > 0) {
        const mappedList: IpcRecord[] = list.map((item: any) => {
          // Chuẩn hóa trạng thái duyệt
          const rawStatus = item.ApprovalStatus || "Chưa làm";
          const lowerStatus = String(rawStatus).toLowerCase();
          let statusCode: number | string = 0;
          let statusName = rawStatus;

          if (lowerStatus.includes("chờ") || lowerStatus.includes("review") || lowerStatus.includes("in-review")) {
            statusCode = 2;
            statusName = activeLang === "en" ? "In-Review" : "Chờ duyệt";
          } else if (lowerStatus.includes("đã duyệt") || lowerStatus.includes("approved")) {
            statusCode = 1;
            statusName = activeLang === "en" ? "Approved" : "Đã duyệt";
          } else if (lowerStatus.includes("từ chối") || lowerStatus.includes("rejected")) {
            statusCode = -1;
            statusName = activeLang === "en" ? "Rejected" : "Từ chối";
          } else {
            statusCode = 0;
            statusName = activeLang === "en" ? "Draft" : (rawStatus === "Chưa làm" ? "Chưa làm" : "Đang lập");
          }

          // Ngày lập / Ngày thanh toán
          let docDate = "";
          if (item.PaymentDate) {
            docDate = dayjs(item.PaymentDate).isValid()
              ? dayjs(item.PaymentDate).format("YYYY-MM-DD")
              : String(item.PaymentDate).split("T")[0];
          } else if (item.CreatedDate) {
            docDate = dayjs(item.CreatedDate).isValid()
              ? dayjs(item.CreatedDate).format("YYYY-MM-DD")
              : String(item.CreatedDate).split("T")[0];
          }

          // Mã IPC: POCode ("IPC 13" / "IPC-5078") hoặc IPC-PaymentId
          const ipcId = item.POCode || (item.PaymentId ? `IPC-${item.PaymentId}` : "IPC");

          // Tên đối tượng / Nhà cung cấp
          const vendorName = item.VendorName || item.VenName || item.ContractName || "---";

          // Diễn giải / Tên đợt thanh toán
          const description = item.POName || item.RemarksOnPOApproval || item.Description || "---";

          return {
            IpcId: ipcId,
            PaymentId: item.PaymentId,
            ContractId: item.ContractId,
            ContractCode: item.ContractCode || "---",
            OwnerContractCode: item.OwnerContractCode || item.MainCode || "",
            VendorName: vendorName,
            DocDate: docDate,
            PaymentDate: item.PaymentDate ? String(item.PaymentDate).split("T")[0] : docDate,
            PaymentTerms: item.PaymentTerms || item.PayTerms || "",
            IsEContract: item.IsEContract === true,
            Description: description,
            ProposedAmount: Number(item.ProposedAmount ?? item.TotalAmount ?? item.Amount ?? item.SubTotal ?? 0),
            ApprovedAmount: item.ApprovedAmount != null ? Number(item.ApprovedAmount) : null,
            Status: statusCode,
            StatusName: statusName,
            CurrentAssignee: item.CreatedBy || item.CurrentAssignee || "---",
            POCode: item.POCode,
            POName: item.POName,
            CreatedBy: item.CreatedBy,
            CreatedDate: item.CreatedDate,
            ContractName: item.ContractName,
            ApprovalStatus: item.ApprovalStatus,
            Type: item.Type,
            raw: item,
          };
        });

        // Chỉ ghép thêm IPC tạo mới tạm thời từ Tab 2 (nếu có trong phiên)
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_KEY_IPC);
          if (stored) {
            try {
              const localList: IpcRecord[] = JSON.parse(stored);
              const localOnly = localList.filter(
                (loc) =>
                  !mappedList.some(
                    (apiItem) =>
                      (loc.PaymentId && apiItem.PaymentId === loc.PaymentId) ||
                      (loc.IpcId && apiItem.IpcId === loc.IpcId)
                  )
              );
              if (localOnly.length > 0) {
                return [...localOnly, ...mappedList];
              }
            } catch {}
          }
        }

        return mappedList;
      }
    } catch (err) {
      console.error("Lỗi gọi API get-ipc-list:", err);
    }

    // Không fallback sang mock data: Trả về mảng rỗng nếu không có dữ liệu từ API
    return [];
  },

  getIpcById: async (ipcId: string): Promise<IpcRecord | null> => {
    const list = await invoicesApi.getIpcList();
    return list.find((it) => it.IpcId === ipcId || String(it.PaymentId) === ipcId) || null;
  },

  saveIpcList: (list: IpcRecord[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_IPC, JSON.stringify(list));
    }
  },

  getPendingReceiptItems: async (contractId?: number | string | null): Promise<PaymentPrepItem[]> => {
    if (!contractId) return [];
    const targetContractId = Number(contractId) || contractId;
    try {
      const session = getStoredSession();
      const params = {
        WSId: (session as any)?.WSId || "",
        LogIn: session?.LogIn || "",
        SessionId: session?.SessionId || "",
        ContractId: targetContractId,
        Language: "vi",
        DisplayMode: "get_submission_for_po_drafting",
        PageSize: 1000,
        Keyword: "",
        Stage: "implement",
        FromDate: "",
        ToDate: "",
        WorkGroup: "all",
      };

      let res: any;
      try {
        res = await getFeatureData("api/get-submission-for-po", params, { skipCache: true });
      } catch (err) {
        console.warn("Lỗi gọi API get-submission-for-po:", err);
      }

      const list = extractApiList(res);
      if (Array.isArray(list)) {
        return list.map((item: any, index: number) => {
          // SL nhập kho (Received Qty): Lấy từ SubmittedQnty hoặc ApprovedReceiptQnty hoặc ApprovedQnty
          const proposedQty = Number(item.SubmittedQnty ?? item.ApprovedReceiptQnty ?? item.ProposedQty ?? item.ApprovedQnty ?? 0);
          // SL đã lên bill (Billed Qty): Lấy từ InvoicedQnty hoặc BilledQty (mặc định 0 nếu chưa lên bill)
          const billedQty = Number(item.InvoicedQnty ?? item.BilledQty ?? 0);
          // Đơn giá: Lấy từ SubmittedUnitPrice hoặc ApprovedUnitPrice
          const unitPrice = Number(item.SubmittedUnitPrice ?? item.ApprovedUnitPrice ?? item.UnitPrice ?? 0);
          // SL hóa đơn (Billing Qty) = SL nhập kho - SL đã lên bill
          const invoiceQty = Math.max(0, Number((proposedQty - billedQty).toFixed(4)));
          // Thành tiền (Amount): Nếu trùng SL nhập kho thì ưu tiên SubmittedAmount từ backend, hoặc tính invoiceQty * unitPrice
          const amount = item.SubmittedAmount && invoiceQty === proposedQty ? Number(item.SubmittedAmount) : Math.round(invoiceQty * unitPrice);

          // Số phiếu nhập: Ưu tiên DocNo, nếu không có lấy Code hoặc ReceiptCode
          const receiptCode = (item.DocNo && String(item.DocNo).trim()) ? String(item.DocNo).trim() : (item.Code || item.ReceiptCode || "---");

          // Ngày lập / Ngày nhập
          let receiptDate = "---";
          if (item.SubmissionDate) {
            receiptDate = dayjs(item.SubmissionDate).isValid()
              ? dayjs(item.SubmissionDate).format("YYYY-MM-DD")
              : String(item.SubmissionDate).split("T")[0];
          }

          // OrgCode / WBS: ưu tiên WBS, nếu rỗng thì lấy OrgCode hoặc sinh theo 2.1.SubmissionId
          const orgCode = item.WBS || item.OrgCode || (item.SubmissionId ? `2.1.${item.SubmissionId}` : "---");

          // OrgName: ưu tiên WorkName, nếu rỗng thì lấy theo WorkType ("Nhập kho")
          const orgName = (item.WorkName && String(item.WorkName).trim())
            ? item.WorkName
            : (item.WorkType?.toLowerCase().includes("inventory") ? "Nhập kho" : (item.WorkType || "---"));

          // Mã vật tư: ItemCode hoặc MaterialCode
          const materialCode = item.ItemCode || item.MaterialCode || "---";

          // Tên vật tư: SubmissionName hoặc MaterialName
          const materialName = item.SubmissionName || item.MaterialName || "---";

          return {
            id: item.SubmissionId || item.TransactionId || `sub_${targetContractId}_${index}`,
            ContractId: targetContractId,
            ContractCode: item.ContractCode || item.Code || "",
            DocNo: item.DocNo || "",
            OrgCode: orgCode,
            OrgName: orgName,
            ReceiptDate: receiptDate,
            ReceiptCode: receiptCode,
            MaterialCode: materialCode,
            MaterialName: materialName,
            Unit: item.Unit || "---",
            ProposedQty: proposedQty,
            ApprovedQty: billedQty,
            UnitPrice: unitPrice,
            InvoiceQty: invoiceQty,
            Amount: amount,
            ReceiptStatus: "Đã duyệt",
            ReceiptStatusCode: 1,
            WorkType: item.WorkType || item.ApprovedWorkCat || "inventory_receipt",
            WBS: item.WBS,
            Code: item.Code || item.WBS || orgCode,
            SubmissionDate: item.SubmissionDate || receiptDate,
            ItemCode: item.ItemCode,
            WorkName: item.WorkName,
            SubmissionName: item.SubmissionName,
            TransactionId: item.TransactionId,
            MaterialId: item.MaterialId,
            InvoicedQnty: item.InvoicedQnty,
            ApprovedReceiptQnty: item.ApprovedReceiptQnty,
            SubmittedQnty: item.SubmittedQnty,
            SubmittedUnitPrice: item.SubmittedUnitPrice,
            SubmittedAmount: item.SubmittedAmount,
            ApprovedQnty: item.ApprovedQnty,
            ApprovedUnitPrice: item.ApprovedUnitPrice,
            ApprovedAmount: item.ApprovedAmount,
            RemarksOnApproval: item.RemarksOnApproval,
            ApprovedWorkCat: item.ApprovedWorkCat || item.WorkType || "inventory_receipt",
            BillQnty: Number(item.ApprovedQnty ?? item.SubmittedQnty ?? 0),
          };
        });
      }
      return [];
    } catch (e) {
      console.error("Lỗi khi tải danh sách phiếu nhập chờ thanh toán:", e);
      return [];
    }
  },

  createIpc: async (payload: {
    ContractId: number | string;
    POName?: string;
    PaymentDate?: string;
    Remarks?: string;
    SelectedItems: Array<{
      WorkType: string;
      SubmissionId: number | string;
      InvoicedQnty: number;
      UnitPrice: number;
      Amount: number;
    }>;
    [key: string]: any;
  }) => {
    const session = getStoredSession();
    const { ContractId, SelectedItems, ...rest } = payload;
    const params = {
      UpdateMode: "create_ipc_from_selected",
      ContractId: Number(ContractId) || ContractId,
      LogIn: session?.LogIn || "",
      SessionId: session?.SessionId || "",
      WSId: (session as any)?.WSId || "",
      Language: session?.Language || "vi",
      POName: payload.POName || "",
      PaymentDate: payload.PaymentDate || dayjs().format("YYYY-MM-DD"),
      Remarks: payload.Remarks || "",
      SelectedItems,
      ...rest,
    };

    return await postFeatureData("api/create-ipc", params, "create_ipc_from_selected");
  },

  getIpcDetail: async (paymentId: number | string, lang?: string) => {
    const session = getStoredSession();
    const activeLang =
      lang ||
      (typeof window !== "undefined" ? localStorage.getItem("consims_lang") : null) ||
      session?.Language ||
      "vi";
    const targetPaymentId = !isNaN(Number(paymentId)) ? Number(paymentId) : paymentId;
    const params = {
      WSId: (session as any)?.WSId || "",
      LogIn: session?.LogIn || "",
      SessionId: session?.SessionId || "",
      Language: activeLang,
      DisplayMode: "print_ipc_detail_round",
      PaymentId: targetPaymentId,
      DisplayTempoNum: "No",
      PageSize: 1000,
    };

    try {
      // 1. Gọi qua getFeatureData (qua API_BASE_URL)
      const res = await getFeatureData("api/get-ipc-detail", params, { skipCache: true });
      if (res && (Array.isArray(res.Data) || Array.isArray(res.data) || Array.isArray(res))) {
        return res;
      }

      // 2. Dự phòng gọi trực tiếp fetch nội bộ nếu axios chưa lấy được
      if (typeof window !== "undefined") {
        try {
          const queryStr = `params=${encodeURIComponent(JSON.stringify(params))}`;
          const fetchRes = await fetch(`${API_BASE_URL}/api/get-ipc-detail?${queryStr}`);
          if (fetchRes.ok) {
            const json = await fetchRes.json();
            if (json && (Array.isArray(json.Data) || Array.isArray(json.data) || Array.isArray(json))) {
              return json;
            }
          }
        } catch (fetchErr) {
          console.warn("Direct fetch get-ipc-detail error:", fetchErr);
        }
      }
      if (res) return res;
    } catch (err) {
      console.warn("Lỗi gọi API get-ipc-detail:", err);
    }

    // Không fallback sang dữ liệu mẫu: Trả về kết quả rỗng khi không có dữ liệu từ máy chủ
    return {
      Success: "true",
      Message: "No data",
      TotalRows: 0,
      Data: [],
    };
  },

  getIpcFileList: async (paymentId: string | number, lang?: string) => {
    const session = getStoredSession();
    const activeLang =
      lang ||
      (typeof window !== "undefined" ? localStorage.getItem("consims_lang") : null) ||
      session?.Language ||
      "en";
    const targetPaymentId = !isNaN(Number(paymentId)) ? Number(paymentId) : paymentId;
    const params = {
      WSId: (session as any)?.WSId || "",
      LogIn: session?.LogIn || "",
      SessionId: session?.SessionId || "",
      Language: activeLang,
      DisplayMode: "by_ipc",
      PageSize: 1000,
      Keyword: "",
      PaymentId: targetPaymentId,
    };

    try {
      // 1. Gọi qua getFeatureData (qua API_BASE_URL)
      const res = await getFeatureData("api/get-file-list", params, { skipCache: true });
      if (res && (Array.isArray(res.Data) || Array.isArray(res.data) || Array.isArray(res))) {
        return res;
      }

      // 2. Dự phòng gọi trực tiếp fetch nội bộ nếu axios chưa lấy được
      if (typeof window !== "undefined") {
        try {
          const queryStr = `params=${encodeURIComponent(JSON.stringify(params))}`;
          const fetchRes = await fetch(`${API_BASE_URL}/api/get-file-list?${queryStr}`);
          if (fetchRes.ok) {
            const json = await fetchRes.json();
            if (json && (Array.isArray(json.Data) || Array.isArray(json.data) || Array.isArray(json))) {
              return json;
            }
          }
        } catch (fetchErr) {
          console.warn("Direct fetch get-file-list error:", fetchErr);
        }
      }
      if (res) return res;
    } catch (err) {
      console.warn("Lỗi gọi API get-file-list:", err);
    }

    // Không fallback sang dữ liệu mẫu: Trả về kết quả rỗng khi không có dữ liệu từ máy chủ
    return {
      Success: "true",
      Message: "No data",
      TotalRows: 0,
      Data: [],
    };
  },

  getIpcVatInvoice: async (paymentId: string | number, lang?: string) => {
    const session = getStoredSession();
    const activeLang =
      lang ||
      (typeof window !== "undefined" ? localStorage.getItem("consims_lang") : null) ||
      session?.Language ||
      "en";
    const targetPaymentId = !isNaN(Number(paymentId)) ? Number(paymentId) : paymentId;
    const params = {
      WSId: (session as any)?.WSId || "",
      LogIn: session?.LogIn || "",
      SessionId: session?.SessionId || "",
      Language: activeLang,
      DisplayMode: "vat_list_from_sheet",
      PaymentId: targetPaymentId,
      PageSize: 1000,
    };

    try {
      // 1. Gọi qua getFeatureData (qua API_BASE_URL)
      const res = await getFeatureData("api/get-vat-invoice", params, { skipCache: true });
      if (res && (Array.isArray(res.Data) || Array.isArray(res.data) || Array.isArray(res))) {
        return res;
      }

      // 2. Dự phòng gọi trực tiếp fetch nội bộ nếu axios chưa lấy được
      if (typeof window !== "undefined") {
        try {
          const queryStr = `params=${encodeURIComponent(JSON.stringify(params))}`;
          const fetchRes = await fetch(`${API_BASE_URL}/api/get-vat-invoice?${queryStr}`);
          if (fetchRes.ok) {
            const json = await fetchRes.json();
            if (json && (Array.isArray(json.Data) || Array.isArray(json.data) || Array.isArray(json))) {
              return json;
            }
          }
        } catch (fetchErr) {
          console.warn("Direct fetch get-vat-invoice error:", fetchErr);
        }
      }
      if (res) return res;
    } catch (err) {
      console.warn("Lỗi gọi API get-vat-invoice:", err);
    }

    // Không fallback sang dữ liệu mẫu: Trả về kết quả rỗng khi không có dữ liệu từ máy chủ
    return {
      Success: "true",
      Message: "No data",
      TotalRows: 0,
      Data: [],
    };
  },
};
