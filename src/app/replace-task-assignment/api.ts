import { getFeatureData, postFeatureData } from "@/lib/feature-api";
import { GetContractListParams } from "@/types/api";

export interface ClientUserItem {
  UserId: number;
  FullName: string;
  Account: string;
  Email?: string;
  Address?: string;
  IsActive?: string;
  PhoneDirect?: string;
}

export type ReplaceTaskUpdateMode = "TaskTypicalAssignment" | "Task_Assignment";

export const WORK_TYPE_KEYS = [
  "construction_work",
  "deduction",
  "payment_order",
  "budget",
  "budget_heading",
  "purchase_order",
  "Inventory_request",
  "Inventory_receipt",
  "Inventory_issue",
] as const;

export type WorkTypeKey = (typeof WORK_TYPE_KEYS)[number];

export const ROLE_KEYS = ["R", "A", "C", "I"] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export const TYPE_KEYS = ["SS", "XD", "MEP"] as const;

export type TypeKey = (typeof TYPE_KEYS)[number];

export const TYPE_APPLICABLE_WORK_TYPES = [
  "construction_work",
  "deduction",
  "payment_order",
] as const;

export function isTypeApplicableWorkType(workType?: string | null): boolean {
  return Boolean(
    workType &&
      (TYPE_APPLICABLE_WORK_TYPES as readonly string[]).includes(workType)
  );
}

export interface ReplaceTaskAssignmentPayload {
  OldUserId: number;
  NewUserId: number;
  SubconOf: number;
  WorkType?: string | null;
  Role?: string | null;
  Type?: string | null;
}

export const replaceTaskAssignmentApi = {
  getMainContracts: <T = any>(params: GetContractListParams) =>
    getFeatureData<T>("api/get-contract-list", params),

  getUsers: <T = any>(params: { Keyword?: string; PageNum?: number; PageSize?: number }) =>
    getFeatureData<T>("API/get-client-user", {
      DisplayMode: "users_manage",
      Keyword: params.Keyword ?? "",
      ...(params.PageNum ? { PageNum: params.PageNum } : {}),
      ...(params.PageSize ? { PageSize: params.PageSize } : {}),
    }),

  replaceTaskAssignment: <T = any>(
    payload: ReplaceTaskAssignmentPayload,
    updateMode: ReplaceTaskUpdateMode
  ) => postFeatureData<T>("api/replaceTaskAssignment", payload, updateMode),
};
