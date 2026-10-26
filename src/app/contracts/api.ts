import { getFeatureData, postFeatureData } from "@/lib/feature-api";
import {
  BaseApiParams,
  GetClientListParams,
  GetContractListParams,
  GetSubmissionsParams,
  UpdateContractInfoParams,
  UpsertMatequipSubmissionParams,
  UpdateSubmissionReviewParams,
} from "@/types/api";

export const contractsApi = {
  getClients: <T = any>(params: GetClientListParams) => getFeatureData<T>("api/get-client-list", params),
  getContracts: <T = any>(params: GetContractListParams, options?: { skipCache?: boolean; ttlMs?: number; timeoutMs?: number }) =>
    getFeatureData<T>("api/get-contract-list", params, options),
  getQuotations: <T = any>(params: GetContractListParams) => getFeatureData<T>("api/get-quotation-list", params),
  getSubmissions: <T = any>(params: GetSubmissionsParams) => getFeatureData<T>("api/get-quotationsubmission", params),
  getMatequipSubmissions: <T = any>(params: BaseApiParams) => getFeatureData<T>("api/get-matequipsubmission", params),
  updateContractInfo: <T = any>(params: UpdateContractInfoParams, mode?: string) => postFeatureData<T>("api/update-contract-info", params, mode),
  updateQuotationInfo: <T = any>(params: UpdateContractInfoParams, mode?: string) => postFeatureData<T>("api/update-quotation-info", params, mode),
  upsertMatequipSubmission: <T = any>(params: UpsertMatequipSubmissionParams | any, mode = "Create_MatequipSubmission") =>
    postFeatureData<T>("api/upsert-matequipsubmission", params, mode),
  deleteMatequipSubmission: <T = any>(submissionId: number | string) =>
    postFeatureData<T>(
      "api/upsert-matequipsubmission",
      {
        SubmissionId: !isNaN(Number(submissionId)) ? Number(submissionId) : submissionId,
        WSId: "",
      },
      "Delete_MatequipSubmission"
    ),
  submitContractApproval: <T = any>(contractId: number | string, params?: Record<string, any>) =>
    postFeatureData<T>("api/submit-contract-approval", {
      ContractId: !isNaN(Number(contractId)) ? Number(contractId) : contractId,
      WorkType: "mat_equip",
      WSId: "",
      ...params,
    }),
  getContractStatus: <T = any>(params: { ContractId: number | string; PageNum?: number; PageSize?: number; [key: string]: any }) =>
    getFeatureData<T>("api/get-contract-status", {
      PageNum: 1,
      PageSize: 20,
      ...params,
    }),
  getProcessingStatuses: <T = any>(params: BaseApiParams) =>
    getFeatureData<T>("api/get-processing-status-list", params),
  updateSubmissionReview: <T = any>(params: UpdateSubmissionReviewParams | any, mode = "update_detail_all_work_type") =>
    postFeatureData<T>("api/update-submission-review", params, mode),
};
