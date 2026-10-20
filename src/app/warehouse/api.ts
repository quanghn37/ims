import { getFeatureData, postFeatureData } from "@/lib/feature-api";

export const warehouseApi = {
  getInventoryTransactions: <T = any>(params: Record<string, any>) =>
    getFeatureData<T>("api/get-inventory-transaction", params),

  getInventorySubmissions: <T = any>(params: Record<string, any>) =>
    getFeatureData<T>("api/get-inventory-submission", params),

  getInventorySubmissionStatus: <T = any>(params: Record<string, any>) =>
    getFeatureData<T>("api/get-inventorysubmission-status", params),

  updateSubmissionReview: <T = any>(params: Record<string, any>, mode?: string) =>
    postFeatureData<T>("api/update-submission-review", params, mode),

  getProcessingStatuses: <T = any>(
    params: Record<string, any>,
    options?: { skipCache?: boolean; ttlMs?: number }
  ) =>
    getFeatureData<T>("api/get-processing-status-list", params, {
      ttlMs: 10 * 60 * 1000,
      ...options,
    }),

  upsertInventorySubmission: <T = any>(
    params: {
      WSId?: string;
      TransactionId: number | string;
      WorkType?: string;
      StartProcessNow?: "Yes" | "No" | string;
      MaterialId: number | string;
      SubmissionName: string;
      Orgcode: string;
      OrgName: string;
      Qnty: number;
      Remarks?: string;
      [key: string]: any;
    },
    mode = "Create_InventorySubmission"
  ) =>
    postFeatureData<T>(
      "api/upsert-inventory-submission",
      {
        WSId: "",
        WorkType: "Inventory_request",
        StartProcessNow: "No",
        ...params,
      },
      mode
    ),

  updateInventorySubmission: <T = any>(params: {
    SubmissionId: number | string;
    Qnty: number;
    Remarks?: string;
    Orgcode?: string;
    OrgCode?: string;
    OrgName?: string;
    StartProcessNow?: "Yes" | "No" | string;
    [key: string]: any;
  }) =>
    postFeatureData<T>(
      "api/upsert-inventory-submission",
      {
        StartProcessNow: "No",
        ...params,
      },
      "Update_InventorySubmission"
    ),

  deleteInventoryRequestSubmission: <T = any>(submissionId: number | string) =>
    postFeatureData<T>(
      "api/upsert-inventory-submission",
      {
        SubmissionId: !isNaN(Number(submissionId)) ? Number(submissionId) : submissionId,
      },
      "Delete_InventorySubmission"
    ),

  upsertInventoryReceiptSubmission: <T = any>(params: Record<string, any>, mode?: string) =>
    postFeatureData<T>("api/upsert-inventory-submission", params, mode),

  updateInventoryReceiptSubmission: <T = any>(params: {
    SubmissionId: number | string;
    Qnty: number;
    UnitPrice: number;
    TaxRate?: number;
    Remarks?: string;
    StartProcessNow?: "Yes" | "No" | string;
    [key: string]: any;
  }) =>
    postFeatureData<T>(
      "api/upsert-inventory-submission",
      {
        StartProcessNow: "No",
        ...params,
      },
      "Update_InventorySubmission"
    ),

  deleteInventorySubmission: <T = any>(submissionId: number | string) =>
    postFeatureData<T>(
      "api/upsert-inventory-submission",
      { SubmissionId: !isNaN(Number(submissionId)) ? Number(submissionId) : submissionId },
      "Delete_InventorySubmission"
    ),

  deleteInventoryTransaction: <T = any>(transactionId: number | string) =>
    postFeatureData<T>("api/delete-inventory-transaction", {
      TransactionId: !isNaN(Number(transactionId)) ? Number(transactionId) : transactionId,
    }),

  updateInventoryTransactionInfo: <T = any>(params: {
    TransactionId: number | string;
    DocDate?: string;
    Description?: string;
    [key: string]: any;
  }) => postFeatureData<T>("api/update-inventorytransaction-info", params),

  upsertInventoryRequest: <T = any>(
    params: {
      WSId?: string;
      SubType?: string;
      SubconOf: number | string;
      WarehouseId: number | string;
      ReceiptFrom?: string;
      ClientId: string | number;
      DocDate: string;
      Description: string;
      [key: string]: any;
    },
    mode = "Create_request"
  ) =>
    postFeatureData<T>(
      "api/upsert-inventory-request",
      {
        WSId: "",
        SubType: "Project",
        ReceiptFrom: "",
        ...params,
      },
      mode
    ),

  getInventoryPoReconcile: <T = any>(params: {
    ContractId: number | string;
    TransactionId: number | string;
    [key: string]: any;
  }) =>
    getFeatureData<T>("api/get-inventory-po", {
      UpdateMode: "Reconcile_PurchaseOrder",
      ...params,
    }),

  createInventorySubmissionFromPo: <T = any>(params: {
    TransactionId: number | string;
    StartProcessNow: "Yes" | "No" | string;
    ApplyDefinedAssignment?: "Yes" | "No" | string;
    Items: Array<{
      MaterialId: number | string;
      SourceSubmissionId: number | string;
      SubmissionName: string;
      Qnty: number;
      UnitPrice: number;
      TaxRate: number;
      Remarks?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }) =>
    postFeatureData<T>(
      "api/upsert-inventory-submission",
      {
        ApplyDefinedAssignment: "Yes",
        ...params,
      },
      "Create_InventorySubmission"
    ),

  getPendingInventoryPo: <T = any>(params: {
    WSId?: string;
    WarehouseId?: number | string | null;
    ContractId?: number | string | null;
    SearchKey?: string;
    PageNum?: number;
    PageSize?: number;
    [key: string]: any;
  }) =>
    getFeatureData<T>("api/get-pendinginventory-po", {
      WSId: "",
      WarehouseId: null,
      ContractId: null,
      SearchKey: "",
      PageNum: 1,
      PageSize: 20,
      ...params,
    }),

  getPendingForRequest: <T = any>(params: {
    WarehouseId?: number | string | null;
    TransactionId?: number | string | null;
    Keyword?: string;
    PageNum?: number;
    PageSize?: number;
    WSId?: string;
    [key: string]: any;
  }) =>
    getFeatureData<T>("api/get-pending-forrequest", {
      WSId: "",
      WarehouseId: null,
      TransactionId: null,
      Keyword: "",
      PageNum: 1,
      PageSize: 50,
      ...params,
    }),

  getApprovedBudgetList: <T = any>(
    params: {
      ContractId: number | string;
      WSId?: string;
      PageNum?: number;
      PageSize?: number;
      [key: string]: any;
    },
    options?: { skipCache?: boolean; ttlMs?: number }
  ) =>
    getFeatureData<T>(
      "api/get-approvedbudget-list",
      {
        WSId: "",
        PageNum: 1,
        PageSize: 50,
        ...params,
      },
      { ttlMs: 5 * 60 * 1000, ...options }
    ),

  createInventoryReceiptFromPoItems: <T = any>(params: {
    ContractId: number | string;
    StartProcessNow?: "Yes" | "No" | string;
    WSId?: string;
    Items: Array<{
      MaterialId: number | string;
      SourceSubmissionId: number | string;
      SubmissionName: string;
      Qnty: number;
      Remarks?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }) =>
    postFeatureData<T>(
      "api/create-inventory-receipt",
      {
        WSId: "",
        StartProcessNow: "No",
        ...params,
      },
      "create_from_selected_po_items"
    ),

  getInventoryBalance: <T = any>(params?: {
    WarehouseId?: number | string | null;
    MaterialId?: number | string | null;
    Keyword?: string;
    OnlyAvailable?: number;
    PageNum?: number;
    PageSize?: number;
    [key: string]: any;
  }) =>
    getFeatureData<T>("api/get-inventory-balance", {
      WSId: "",
      WarehouseId: null,
      MaterialId: null,
      Keyword: "",
      OnlyAvailable: 1,
      PageNum: 1,
      PageSize: 50,
      ...params,
    }),

  getInventoryPeriodReport: <T = any>(params?: {
    Period?: string;
    WarehouseId?: number | string | null;
    MaterialId?: number | string | null;
    Keyword?: string;
    OnlyHasMovement?: number;
    PageNum?: number;
    PageSize?: number;
    [key: string]: any;
  }) =>
    getFeatureData<T>("api/get-inventory-periodreport", {
      WSId: "",
      Period: "2026-10",
      WarehouseId: null,
      MaterialId: null,
      Keyword: "",
      OnlyHasMovement: 1,
      PageNum: 1,
      PageSize: 50,
      ...params,
    }),

  getInventoryStockCardReport: <T = any>(params: {
    WarehouseId: number | string;
    MaterialId: number | string;
    FromDate?: string;
    ToDate?: string;
    PageNum?: number;
    PageSize?: number;
    [key: string]: any;
  }) =>
    getFeatureData<T>("api/get-inventory-stockcardreport", {
      WSId: "",
      FromDate: "2026-10-01",
      ToDate: "2026-10-31",
      PageNum: 1,
      PageSize: 50,
      ...params,
    }),

  getMainContracts: <T = any>(
    params?: {
      Keyword?: string;
      PageNum?: number;
      PageSize?: number;
      [key: string]: any;
    },
    options?: { skipCache?: boolean; ttlMs?: number }
  ) =>
    getFeatureData<T>(
      "api/get-contract-list",
      {
        DisplayMode: "brief_contracts_by_user",
        QueryByAgent: "no",
        Keyword: "",
        ContractType: "main_contract",
        ContractFormat: "",
        PageNum: 1,
        PageSize: 20,
        ...params,
      },
      { ttlMs: 5 * 60 * 1000, ...options }
    ),

  getClients: <T = any>(
    params?: {
      Keyword?: string;
      Page?: number;
      PageSize?: number;
      InMain?: any;
      DisplayMode?: string;
      ContractId?: string | number;
      WSId?: string;
      [key: string]: any;
    },
    options?: { skipCache?: boolean; ttlMs?: number }
  ) =>
    getFeatureData<T>(
      "api/get-client-list",
      {
        Keyword: "",
        Page: 1,
        PageSize: 50,
        InMain: null,
        DisplayMode: "full_list",
        ContractId: "",
        WSId: "",
        ...params,
      },
      { ttlMs: 5 * 60 * 1000, ...options }
    ),

  getWarehouseList: <T = any>(
    params?: {
      WSId?: string;
      PageNum?: number;
      PageSize?: number;
      Keyword?: string;
      [key: string]: any;
    },
    options?: { skipCache?: boolean; ttlMs?: number }
  ) =>
    getFeatureData<T>(
      "api/get-warehouse-list",
      {
        WSId: "",
        PageNum: 1,
        PageSize: 50,
        Keyword: "",
        ...params,
      },
      { ttlMs: 10 * 60 * 1000, ...options }
    ),
};


