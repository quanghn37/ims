export type DecisionStatus =
  | "all"
  | "reject"
  | "approved"
  | "conditional"
  | "inprogress"
  | "pending"
  | "returned"
  | "All"
  | "Rejected"
  | "Approved"
  | "Cond-Approved"
  | "In-Progress"
  | "Not-Started"
  | "Returned"
  | string;

export interface ProcessingStatusItem {
  Id: number;
  Status: number;
  Description: string;
  Alias: string;
}

export interface ProcessingStatusWithRoleItem {
  Id: number;
  Status: number;
  Description: string;
  Alias: string;
  Role: "A" | "R" | "C" | "I" | string;
}

export function getStatusDotColor(aliasOrStatus: string | number): string {
  const s = String(aliasOrStatus).toLowerCase();
  if (s === "all" || s === "100") return "#94a3b8";
  if (s.includes("reject") || s === "-1") return "#ef4444";
  if (s === "approved" || s === "0") return "#22c55e";
  if (s.includes("cond") || s === "1") return "#10b981";
  if (s.includes("progress") || s === "2") return "#eab308";
  if (s.includes("not-started") || s.includes("pending") || s === "3") return "#f97316";
  if (s.includes("return") || s === "4") return "#6b7280";
  return "#94a3b8";
}

export function getWorkTypeDotColor(workType?: string): string {
  const wt = String(workType || "").toLowerCase();
  if (wt.includes("purchase") || wt.includes("order") || wt.includes("đơn hàng")) return "#0ea5e9";
  if (wt.includes("construction") || wt.includes("thi công") || wt.includes("xây dựng")) return "#10b981";
  if (wt.includes("price") || wt.includes("điều chỉnh") || wt.includes("giá")) return "#f59e0b";
  if (wt.includes("subcontract") || wt.includes("phụ") || wt.includes("thầu")) return "#8b5cf6";
  if (wt.includes("payment") || wt.includes("thanh toán")) return "#ec4899";
  if (wt.includes("advance") || wt.includes("tạm ứng")) return "#06b6d4";
  if (wt.includes("penalty") || wt.includes("phạt")) return "#ef4444";
  if (wt.includes("backcharge")) return "#f97316";
  return "#64748b";
}

export interface StatusOption {
  key: string;
  alias?: string;
  labelVi: string;
  labelEn: string;
  dotColor: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { key: "All", alias: "All", labelVi: "Tất cả", labelEn: "All", dotColor: "#94a3b8" },
  { key: "Rejected", alias: "Rejected", labelVi: "Từ chối", labelEn: "Rejected", dotColor: "#ef4444" },
  { key: "Approved", alias: "Approved", labelVi: "Duyệt", labelEn: "Approved", dotColor: "#22c55e" },
  { key: "Cond-Approved", alias: "Cond-Approved", labelVi: "Duyệt có ĐK", labelEn: "Cond-Approved", dotColor: "#10b981" },
  { key: "In-Progress", alias: "In-Progress", labelVi: "Đang làm", labelEn: "In-Progress", dotColor: "#eab308" },
  { key: "Not-Started", alias: "Not-Started", labelVi: "Chưa làm", labelEn: "Not-Started", dotColor: "#f97316" },
  { key: "Returned", alias: "Returned", labelVi: "Trả lại", labelEn: "Returned", dotColor: "#6b7280" },
];

export interface SubmissionRow {
  key: string;
  id: string | number;
  stt: number;
  docNo?: string;
  contractCode: string;
  contractName?: string;
  wbsCode: string;
  submissionDate: string;
  itemName: string;
  workType?: string | null;
  workTypeDesc?: string | null;
  workCategory?: string | null;
  submittedWorkCat?: string | null;
  reviewedWorkCat?: string | null;
  unit: string;
  subQty: number;
  subPrice: number;
  subAmount: number;
  role: "A" | "R" | "C" | "I" | string;
  decision: DecisionStatus;
  statusAlias?: string;
  statusDescription?: string;
  apprQty: number;
  apprPrice: number;
  apprAmount: number;
  remarks: string;
  reviewAssignmentId?: number | string;
  submissionId?: number | string;
  myDuty?: string;
  isDisabled?: any;
  raw?: any;
}

export function normalizeApprovalStatusAlias(statusStr?: string | number): string {
  if (statusStr === undefined || statusStr === null || statusStr === "") return "Not-Started";
  const s = String(statusStr).trim().toLowerCase();
  if (s === "100" || s === "all" || s === "tất cả") return "All";

  // Nhóm Status -1: Từ chối / Hủy / Không đồng ý / Không ý kiến
  if (
    s === "-1" ||
    s.includes("reject") ||
    s.includes("từ chối") ||
    s.includes("cancel") ||
    s.includes("hủy") ||
    s.includes("unaccepted") ||
    s.includes("không đồng ý") ||
    s.includes("no-idea") ||
    s.includes("không ý kiến") ||
    s.includes("không liên quan")
  ) {
    return "Rejected";
  }

  // Nhóm Status 0: Duyệt / Chấp thuận / Đồng ý / Trình / Đã biết / Ghi nhận
  if (
    s === "0" ||
    s === "approved" ||
    s === "duyệt" ||
    s === "đã duyệt" ||
    s.includes("chấp thuận") ||
    s.includes("đồng ý") ||
    s.includes("accepted") ||
    s.includes("done") ||
    s.includes("trình") ||
    s.includes("noted") ||
    s.includes("đã biết") ||
    s.includes("ghi nhận")
  ) {
    return "Approved";
  }

  // Nhóm Status 1: Duyệt có ĐK / Chấp thuận có ĐK / Đồng ý có ĐK
  if (
    s === "1" ||
    s.includes("cond") ||
    s.includes("có đk") ||
    s.includes("có điều kiện")
  ) {
    return "Cond-Approved";
  }

  // Nhóm Status 2: Đang làm / Đang xử lý / Đang xem
  if (
    s === "2" ||
    s.includes("progress") ||
    s.includes("đang làm") ||
    s.includes("processing") ||
    s.includes("đang xem") ||
    s.includes("đang xử lý")
  ) {
    return "In-Progress";
  }

  // Nhóm Status 3: Chưa làm / Chưa tới phiên / Chờ duyệt
  if (
    s === "3" ||
    s.includes("not-started") ||
    s.includes("chưa làm") ||
    s.includes("pending") ||
    s.includes("chưa tới phiên")
  ) {
    return "Not-Started";
  }

  // Nhóm Status 4: Trả lại
  if (s === "4" || s.includes("returned") || s.includes("trả lại")) {
    return "Returned";
  }

  return "In-Progress";
}

export function normalizeApprovalStatus(statusStr?: string): DecisionStatus {
  return normalizeApprovalStatusAlias(statusStr);
}

export function mapDecisionToStatusText(decision: DecisionStatus): string {
  switch (decision) {
    case "approved":
      return "Duyệt";
    case "conditional":
      return "Duyệt có ĐK";
    case "reject":
      return "Từ chối";
    case "inprogress":
      return "Đang làm";
    case "pending":
      return "Chưa làm";
    case "returned":
      return "Trả lại";
    default:
      return "All";
  }
}

export interface SubmissionFilterState {
  contractId?: string;
  searchKeyword: string;
  status: DecisionStatus;
  stage?: string;
  workType: string;
  role: string;
  dateRange?: [string, string];
}

export interface WorkTypeItem {
  Id: number | string;
  Alias: string;
  Description: string;
}

export interface DefaultDateResponse {
  FromDate: string;
  ToDate: string;
}

export interface ContractOptionItem {
  ContractId: number | string;
  ContractCode: string;
  ContractName: string;
  ContractType?: string;
  ContractDate?: string;
  [key: string]: any;
}



