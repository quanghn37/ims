import { getFeatureData, postFeatureData, postFeatureForm } from "@/lib/feature-api";
import {
  BaseApiParams,
  GetClientListParams,
  GetContractListParams,
  GetSubmissionsParams,
  UpsertSubmissionParams,
  UpdateContractInfoParams,
  UpdateSubmissionReviewParams,
} from "@/types/api";

export const purchaseOrdersApi = {
  getItems: <T = any>(params: BaseApiParams) => getFeatureData<T>("api/get-item", params),
  getClients: <T = any>(params: GetClientListParams) => getFeatureData<T>("api/get-client-list", params),
  getPurchaseOrders: <T = any>(params: GetContractListParams) => getFeatureData<T>("api/get-purchaseorder-list", params),
  getContracts: <T = any>(params: GetContractListParams) => getFeatureData<T>("api/get-contract-list", params),
  getQuotations: <T = any>(params: any) => getFeatureData<T>("api/get-quotation-list", params),
  getSubmissions: <T = any>(params: GetSubmissionsParams) => getFeatureData<T>("api/get-purchaseordersubmission", params),
  getSubmissionStatus: <T = any>(params: BaseApiParams) => getFeatureData<T>("api/get-purchaseordersubmission-status", params),
  getProcessingStatuses: <T = any>(params: BaseApiParams) => getFeatureData<T>("api/get-processing-status-list", params),
  updateContractInfo: <T = any>(params: UpdateContractInfoParams, mode?: string) => postFeatureData<T>("api/update-purchaseorder-info", params, mode),
  upsertSubmission: <T = any>(params: UpsertSubmissionParams, mode?: string) => postFeatureData<T>("api/upsert-purchaseordersubmission", params, mode),
  updateSubmissionReview: <T = any>(params: UpdateSubmissionReviewParams, mode?: string) => postFeatureData<T>("api/update-submission-review", params, mode),
  importSubmission: <T = any>(formData: FormData) => postFeatureForm<T>("api/upsert-purchaseordersubmission/import-excel-preview", formData),
  getApprovedBudgetList: <T = any>(params: BaseApiParams) =>
    getFeatureData<T>("api/get-approvedbudget-list", {
      WSId: "",
      PageNum: 1,
      PageSize: 1000,
      ...params,
    }),
  getWarehouseList: <T = any>(params: BaseApiParams) =>
    getFeatureData<T>("api/get-warehouse-list", {
      WSId: "",
      PageNum: 1,
      PageSize: 50,
      ...params,
    }),
};
