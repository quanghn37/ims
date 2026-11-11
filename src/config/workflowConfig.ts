import { getFeatureData } from "@/lib/feature-api";
import { extractApiList } from "@/lib/api-client";

export interface ProcessingStatusItem {
  Id?: number;
  Status: number; // e.g. -1, 0, 1, 2, 3, 4
  Description: string;
  Alias: string;
  Role?: string; // "R" | "C" | "A" | "I"
}

export type RaciRole = "R" | "C" | "A" | "I";

/**
 * Cấu hình chuẩn 4 vai trò RACI
 * R = Responsible (Xanh dương)
 * C = Consulted (Vàng hổ phách)
 * A = Approver (Đỏ / Coral)
 * I = Informed (Xanh lá)
 */
export const RACI_CONFIG: Record<
  RaciRole,
  {
    code: RaciRole;
    nameVi: string;
    nameEn: string;
    labelVi: string;
    labelEn: string;
    bg: string;
    color: string;
    border: string;
  }
> = {
  R: {
    code: "R",
    nameVi: "Người thực hiện",
    nameEn: "Responsible",
    labelVi: "R - Người thực hiện",
    labelEn: "R - Responsible",
    bg: "#EFF6FF",
    color: "#1D4ED8",
    border: "#BFDBFE",
  },
  C: {
    code: "C",
    nameVi: "Người tham vấn",
    nameEn: "Consulted",
    labelVi: "C - Người tham vấn",
    labelEn: "C - Consulted",
    bg: "#FFFBEB",
    color: "#B45309",
    border: "#FDE68A",
  },
  A: {
    code: "A",
    nameVi: "Người phê duyệt",
    nameEn: "Approver",
    labelVi: "A - Người phê duyệt",
    labelEn: "A - Approver",
    bg: "#FEF2F2",
    color: "#B91C1C",
    border: "#FECACA",
  },
  I: {
    code: "I",
    nameVi: "Người nhận thông tin",
    nameEn: "Informed",
    labelVi: "I - Người nhận thông tin",
    labelEn: "I - Informed",
    bg: "#F0FDF4",
    color: "#15803D",
    border: "#BBF7D0",
  },
};

/**
 * Lấy cấu hình RACI theo mã vai trò
 */
export function getRaciConfig(role?: string) {
  const normalized = String(role || "A").trim().toUpperCase() as RaciRole;
  return RACI_CONFIG[normalized] || {
    code: normalized,
    nameVi: normalized,
    nameEn: normalized,
    labelVi: normalized,
    labelEn: normalized,
    bg: "#F1F5F9",
    color: "#475569",
    border: "#CBD5E1",
  };
}

/**
 * Trả về màu chấm tròn cho trạng thái quyết định
 */
export function getProcessingStatusDotColor(status: number | string, alias?: string): string {
  const s = Number(status);
  const a = String(alias || "").toLowerCase();
  if (s === -1 || a === "rejected" || a === "cancel" || a === "unaccepted" || a === "no-idea") {
    return "#ef4444";
  }
  if (s === 0 || a === "approved" || a === "done" || a === "accepted" || a === "noted") {
    return "#10b981";
  }
  if (s === 1 || a === "cond-approved" || a === "cond-accepted") {
    return "#059669";
  }
  if (s === 2 || a === "in-progress") {
    return "#eab308";
  }
  if (s === 3 || a === "not-started") {
    return "#f97316";
  }
  if (s === 4 || a === "returned") {
    return "#6b7280";
  }
  return "#94a3b8";
}

/**
 * Lọc nghiêm ngặt danh sách trạng thái theo Role từ API (official_with_role)
 */
export function getStatusesByRole(
  statusList: ProcessingStatusItem[],
  role: string
): ProcessingStatusItem[] {
  if (!statusList || statusList.length === 0) return [];
  const normalized = String(role || "A").trim().toUpperCase();
  return statusList.filter(
    (item) => String(item.Role || "").trim().toUpperCase() === normalized
  );
}

/**
 * Ánh xạ giá trị ban đầu vào danh sách trạng thái của Role hiện tại.
 * Tuyệt đối không trả về giá trị ngoài danh mục của Role đó!
 */
export function resolveDecisionForRole(
  currentValue: any,
  _role: string,
  roleStatuses: ProcessingStatusItem[]
): string {
  if (!roleStatuses || roleStatuses.length === 0) {
    return "";
  }
  if (!currentValue && currentValue !== 0) {
    // Mặc định chọn In-Progress (Status 2) hoặc item đầu tiên của Role
    const inProgress = roleStatuses.find((item) => Number(item.Status) === 2);
    return inProgress?.Description || roleStatuses[0]?.Description || "";
  }

  const strVal = String(currentValue).trim().toLowerCase();

  // 1. Khớp chính xác theo Description của Role hiện tại
  const exactDesc = roleStatuses.find(
    (item) => item.Description.trim().toLowerCase() === strVal
  );
  if (exactDesc) return exactDesc.Description;

  // 2. Khớp theo Alias
  const matchAlias = roleStatuses.find(
    (item) => item.Alias.trim().toLowerCase() === strVal
  );
  if (matchAlias) return matchAlias.Description;

  // 3. Khớp theo Status số
  if (!isNaN(Number(currentValue))) {
    const num = Number(currentValue);
    const matchStatus = roleStatuses.find((item) => Number(item.Status) === num);
    if (matchStatus) return matchStatus.Description;
  }

  // 4. Khớp theo ngữ nghĩa trạng thái phổ quát:
  // - Hoàn thành / Phê duyệt / Đồng ý / Trình -> Status 0
  if (
    strVal.includes("chấp thuận") ||
    strVal.includes("approved") ||
    strVal.includes("đồng ý") ||
    strVal.includes("trình") ||
    strVal.includes("done") ||
    strVal.includes("accepted") ||
    strVal.includes("noted")
  ) {
    const statusZero = roleStatuses.find((item) => Number(item.Status) === 0);
    if (statusZero) return statusZero.Description;
  }

  // - Từ chối / Hủy / Không đồng ý -> Status -1
  if (
    strVal.includes("hủy") ||
    strVal.includes("cancel") ||
    strVal.includes("từ chối") ||
    strVal.includes("reject") ||
    strVal.includes("unaccepted") ||
    strVal.includes("không đồng ý") ||
    strVal.includes("no-idea")
  ) {
    const statusNeg = roleStatuses.find((item) => Number(item.Status) === -1);
    if (statusNeg) return statusNeg.Description;
  }

  // - Đang làm / Đang xử lý -> Status 2
  if (
    strVal.includes("đang làm") ||
    strVal.includes("in-progress") ||
    strVal.includes("processing") ||
    strVal.includes("đang xử lý")
  ) {
    const statusTwo = roleStatuses.find((item) => Number(item.Status) === 2);
    if (statusTwo) return statusTwo.Description;
  }

  // - Chưa làm / Chưa tới phiên -> Status 3
  if (strVal.includes("chưa") || strVal.includes("not-started")) {
    const statusThree = roleStatuses.find((item) => Number(item.Status) === 3);
    if (statusThree) return statusThree.Description;
  }

  // Fallback an toàn: Trả về In-Progress (2) hoặc item đầu tiên của Role
  const fallback = roleStatuses.find((item) => Number(item.Status) === 2) || roleStatuses[0];
  return fallback?.Description || "";
}

// Memory cache để toàn ứng dụng không phải gọi API get-processing-status-list nhiều lần
const statusCache = new Map<string, { time: number; data: ProcessingStatusItem[] }>();
const pendingPromises = new Map<string, Promise<ProcessingStatusItem[]>>();

/**
 * Fetch danh sách trạng thái theo Role từ API get-processing-status-list
 * Endpoint: api/get-processing-status-list?DisplayMode=official_with_role&Language=...
 */
export async function fetchProcessingStatusesWithRole(
  language: string = "vi"
): Promise<ProcessingStatusItem[]> {
  const langKey = language === "en" ? "en" : "vi";
  const now = Date.now();

  // Cache 5 phút
  const cached = statusCache.get(langKey);
  if (cached && now - cached.time < 300000) {
    return cached.data;
  }

  const existingPromise = pendingPromises.get(langKey);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      const res = await getFeatureData<any>("api/get-processing-status-list", {
        WSId: "",
        DisplayMode: "official_with_role",
        Language: langKey,
      });
      const list = extractApiList<ProcessingStatusItem>(res);
      statusCache.set(langKey, { time: Date.now(), data: list });
      return list;
    } catch (err) {
      console.error("Lỗi khi tải get-processing-status-list (official_with_role):", err);
      return [];
    } finally {
      pendingPromises.delete(langKey);
    }
  })();

  pendingPromises.set(langKey, fetchPromise);
  return fetchPromise;
}
