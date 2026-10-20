import { ApiResponse, ContractItem, SubmissionItem } from "../index";

export interface BaseApiParams {
  Keyword?: string;
  PageNum?: number;
  PageSize?: number;
  Page?: number;
  WSId?: string;
  ContractType?: string;
  ContractId?: string | number;
  SubmissionId?: string | number;
  DisplayMode?: string;
  Role?: string;
  Stage?: string;
}

export interface GetClientListParams extends BaseApiParams {
  DisplayMode?: "full_list" | "short_list" | string;
  ContractId?: string | number;
  InMain?: boolean | null;
  ClientId?: string | number;
}

export interface GetContractListParams extends BaseApiParams {
  DisplayMode?: "mat_equip" | "all_list" | "quotation" | "purchase_order" | "quotation_for_contract" | "quotation_by_contract" | string;
  ClientId?: string | number;
  ParentId?: string | number;
  ContractType?: "purchase_order" | "quotation" | "mat_equip" | string;
  QueryByAgent?: string;
  SubconOf?: string | number;
  ContractFormat?: string;
}

export interface GetSubmissionsParams extends BaseApiParams {
  ContractType?: "purchase_order" | "quotation" | string;
  ContractId?: string | number;
  Stage?: "plan" | "processing" | "approved" | string;
  FromDate?: string;
  ToDate?: string;
  LocalId?: string | number;
}

export interface UpsertSubmissionParams {
  ContractType?: "purchase_order" | "quotation" | string;
  ContractId?: string | number;
  SubmissionId?: string | number;
  MaterialId?: number | string;
  ItemId?: number | string;
  ParentId?: number | string;
  ItemDate?: string;
  FromDate?: string | null;
  ToDate?: string | null;
  StartDate?: string | null;
  EndDate?: string | null;
  UnitPrice?: number;
  Qnty?: number;
  TaxRate?: number;
  Remarks?: string;
  UpdateMode?: string;
  StartProcessNow?: "Yes" | "No" | boolean;
  ApplyDefinedAssignment?: "Yes" | "No" | boolean;
  Stage?: "plan" | "processing" | "approved" | string;
  Orgcode?: string;
  WBS?: string;
  OrgName?: string;
  Orgname?: string;
}

export interface UpsertMatequipSubmissionParams {
  ContractId?: number | string;
  MaterialId?: number | string;
  Qnty?: number;
  UnitPrice?: number;
  TaxRate?: number;
  ItemDate?: string;
  EndDate?: string;
  Remarks?: string;
  UpdateMode?: "Create_MatequipSubmission" | "Update_MatequipSubmission" | "Delete_MatequipSubmission" | string;
  WSId?: string;
  SubmissionId?: string | number;
  SourceId?: string | number;
}

export interface UpdateContractInfoParams {
  ContractId?: number | string;
  ContractType?: "purchase_order" | "quotation" | "mat_equip" | string;
  S_Type?: string;
  MainContractId?: number | string;
  ParentContractId?: number | string | null;
  Description?: string;
  Amount?: number;
  ContractedAmount?: number;
  TotalAmount?: number;
  SignDate?: string;
  FromDate?: string | null;
  ToDate?: string | null;
  StartDate?: string | null;
  EndDate?: string | null;
  ContractDate?: string;
  Contractdate?: string;
  DeliveryDate?: string;
  Deliverydate?: string;
  ClientId?: string | number;
  WarehouseId?: string | number;
  PaytermId?: string | number;
  PaymentTerm?: string;
  PayTerms?: string;
  IsVcontract?: number | boolean;
  MatequipId?: string | number;
  SourceId?: string | number;
  Currency?: string;
  WSId?: string;
  Attachments?: any[];
  PriceListIds?: (number | string)[];
}

export interface WorkflowReviewParams {
  AssignmentId?: string | number;
  WorkType?: string;
  ApprovalDecision?: string;
  WorkCat?: string;
  Qnty?: number;
  UnitPrice?: number;
  Remarks?: string;
}

export interface UpdateSubmissionReviewParams {
  SubmissionDetail: WorkflowReviewParams[];
}

export type FeatureApiResponse<T = any> = Promise<ApiResponse<T> | T>;
