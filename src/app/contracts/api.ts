import { getFeatureData, postFeatureData } from "@/lib/feature-api";
import {
  BaseApiParams,
  GetClientListParams,
  GetContractListParams,
  GetSubmissionsParams,
  UpdateContractInfoParams,
  UpsertSubmissionParams,
  UpsertMatequipSubmissionParams,
} from "@/types/api";

export const contractsApi = {
  getClients: <T = any>(params: GetClientListParams) => getFeatureData<T>("api/get-client-list", params),
  getContracts: <T = any>(params: GetContractListParams) => getFeatureData<T>("api/get-contract-list", params),
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
};
