import { getFeatureData, postFeatureData, postFeatureForm } from "@/lib/feature-api";
import {
  BaseApiParams,
  GetClientListParams,
  GetContractListParams,
  GetSubmissionsParams,
  UpsertSubmissionParams,
  UpdateContractInfoParams,
} from "@/types/api";

export const quotationsApi = {
  getItems: <T = any>(params: BaseApiParams) => getFeatureData<T>("api/get-item", params),
  getClients: <T = any>(params: GetClientListParams) => getFeatureData<T>("api/get-client-list", params),
  getContracts: <T = any>(params: GetContractListParams) => getFeatureData<T>("api/get-quotation-list", params),
  getMainContracts: <T = any>(params: GetContractListParams) => getFeatureData<T>("api/get-contract-list", params),
  getSubmissions: <T = any>(params: GetSubmissionsParams) => getFeatureData<T>("api/get-quotationsubmission", params),
  getSubmissionStatus: <T = any>(params: BaseApiParams) => getFeatureData<T>("api/get-quotationsubmission-status", params),
  getProcessingStatuses: <T = any>(params: BaseApiParams) => getFeatureData<T>("api/get-processing-status-list", params),
  updateContractInfo: <T = any>(params: UpdateContractInfoParams, mode?: string) => postFeatureData<T>("api/update-quotation-info", params, mode),
  upsertSubmission: <T = any>(params: UpsertSubmissionParams, mode?: string) => postFeatureData<T>("api/upsert-quotationsubmission", params, mode),
  updateSubmissionReview: <T = any>(params: Record<string, any>, mode?: string) => postFeatureData<T>("api/update-submission-review", params, mode),
  importSubmission: <T = any>(formData: FormData) => postFeatureForm<T>("api/upsert-quotationsubmission/import-excel-preview", formData),
  uploadImportData: <T = any>(formData: FormData) => postFeatureForm<T>("api/import-data", formData),
  importQuotationPreview: <T = any>(params: { CacheId: string }) => postFeatureData<T>("api/quotation/import-preview", params),
  importQuotationExecute: <T = any>(params: { CacheId: string; LogIn?: string; ContractId?: number; SessionId?: string; Language?: string }) => postFeatureData<T>("api/quotation/import-execute", params),
};

