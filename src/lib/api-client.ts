import axios from "axios";
import { UserSession } from "@/types";

const IS_BROWSER = typeof window !== "undefined";

// Use internal Next.js proxy route to eliminate CORS issues
const BASE_URL = "/api/consims";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Tăng lên 60s để các API truy vấn báo cáo / danh sách hợp đồng lớn không bị timeout 10s
});

export const DEFAULT_SESSION: UserSession = {
  LogIn: "",
  SessionId: "",
  Language: "vi",
};

function normalizeSession(value: unknown): UserSession | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const stored = value as Record<string, unknown>;
  const logInValue = typeof stored.LogIn === "string" ? stored.LogIn : stored.Email;
  const logIn = typeof logInValue === "string" ? logInValue.trim() : "";
  const sessionId = typeof stored.SessionId === "string" ? stored.SessionId.trim() : "";

  if (!logIn || !sessionId) return null;

  const clientId =
    typeof stored.ClientId === "string" || typeof stored.ClientId === "number"
      ? stored.ClientId
      : undefined;

  return {
    LogIn: logIn,
    Email: typeof stored.Email === "string" ? stored.Email : undefined,
    FullName: typeof stored.FullName === "string" ? stored.FullName : undefined,
    SessionId: sessionId,
    Language: stored.Language === "en" ? "en" : "vi",
    ClientId: clientId,
    JobTitle: typeof stored.JobTitle === "string" ? stored.JobTitle : undefined,
    IsActive: typeof stored.IsActive === "string" ? stored.IsActive : undefined,
    Avatar: typeof stored.Avatar === "string" ? stored.Avatar : undefined,
  };
}

export const getStoredSession = (): UserSession | null => {
  if (!IS_BROWSER) return null;
  try {
    // Ưu tiên đọc từ localStorage (chia sẻ giữa các tab), nếu không có fallback sang sessionStorage
    const raw = localStorage.getItem("consims_session") || sessionStorage.getItem("consims_session");
    if (!raw) return null;
    const session = normalizeSession(JSON.parse(raw));
    if (session) {
      // Đảm bảo đồng bộ cả hai storage
      try {
        sessionStorage.setItem("consims_session", JSON.stringify(session));
      } catch (_) {}
      return session;
    }
    clearSession();
    return null;
  } catch (e) {
    console.error("Error reading stored session:", e);
    clearSession();
    return null;
  }
};

export const saveSession = (session: UserSession) => {
  if (!IS_BROWSER) return;
  const normalized = normalizeSession(session);
  if (!normalized) {
    throw new Error("Cannot save an invalid Consims session");
  }
  const sessionStr = JSON.stringify(normalized);
  // Lưu vào cả localStorage (để mở tab mới không bị logout) và sessionStorage
  try {
    localStorage.setItem("consims_session", sessionStr);
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
  try {
    sessionStorage.setItem("consims_session", sessionStr);
  } catch (e) {
    console.error("Error saving to sessionStorage:", e);
  }
};

export const clearSession = () => {
  if (!IS_BROWSER) return;
  try {
    sessionStorage.removeItem("consims_session");
    localStorage.removeItem("consims_session");
  } catch (e) {
    console.error("Error clearing stored session:", e);
  }
};

function getSessionHeaders(endpoint: string, session: UserSession | null): Record<string, string> {
  const lang =
    session?.Language ||
    (IS_BROWSER ? (localStorage.getItem("consims_lang") as string) : null) ||
    "vi";

  const headers: Record<string, string> = {
    "Accept-Language": lang,
    "X-Language": lang,
  };

  if (session?.SessionId && !endpoint.toLowerCase().includes("validate-user")) {
    headers["X-LogIn"] = session.LogIn;
    headers["X-Session-Id"] = session.SessionId;
  }

  return headers;
}

/**
 * Utility helper to safely extract array data from various Consims ERP API response formats
 * Handles:
 * - Direct arrays: [...]
 * - res.Data or res.data as array or JSON string
 * - res.JSONString / res.JsonString as JSON string
 * - res.Contracts / res.rows / res.items / res.list
 * - Single-element array containing a JSONString property
 */
export function extractApiList<T = any>(res: any): T[] {
  if (!res) return [];

  const tryParseJson = (val: any) => {
    if (typeof val !== "string") return null;
    const trimmed = val.trim();
    if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  // 1. res itself is a JSON string
  if (typeof res === "string") {
    const parsed = tryParseJson(res);
    if (parsed) return extractApiList<T>(parsed);
  }

  // 2. res is an Array
  if (Array.isArray(res)) {
    // Check if it's an array with a single wrapper object containing JSONString or Data string
    if (res.length === 1 && res[0] && typeof res[0] === "object") {
      const first = res[0];
      const jsonProp = first.JSONString || first.JsonString || first.jsonString;
      if (typeof jsonProp === "string") {
        const parsed = tryParseJson(jsonProp);
        if (Array.isArray(parsed)) return parsed as T[];
        if (parsed) return extractApiList<T>(parsed);
      }
      if (typeof first.Data === "string" || typeof first.data === "string") {
        const parsed = tryParseJson(first.Data || first.data);
        if (Array.isArray(parsed)) return parsed as T[];
        if (parsed) return extractApiList<T>(parsed);
      }
    }
    return res as T[];
  }

  // 3. res.Data or res.data
  let rawData = res.Data !== undefined ? res.Data : res.data;
  if (typeof rawData === "string") {
    const parsed = tryParseJson(rawData);
    if (parsed) rawData = parsed;
  }
  if (Array.isArray(rawData)) return rawData as T[];
  if (rawData && typeof rawData === "object") {
    for (const key of [
      "Contracts",
      "contracts",
      "ContractList",
      "contractList",
      "List",
      "list",
      "Rows",
      "rows",
      "Items",
      "items",
      "Data",
      "data",
    ]) {
      let nested = rawData[key];
      if (typeof nested === "string") {
        const parsed = tryParseJson(nested);
        if (parsed) nested = parsed;
      }
      if (Array.isArray(nested)) return nested as T[];
    }
  }

  // 4. res.JSONString / res.JsonString / res.jsonString
  const jsonStr = res.JSONString || res.JsonString || res.jsonString;
  if (typeof jsonStr === "string") {
    const parsed = tryParseJson(jsonStr);
    if (Array.isArray(parsed)) return parsed as T[];
    if (parsed && typeof parsed === "object") return extractApiList<T>(parsed);
  }

  // 5. Root-level keys
  for (const key of [
    "Contracts",
    "contracts",
    "ContractList",
    "contractList",
    "List",
    "list",
    "Rows",
    "rows",
    "Items",
    "items",
    "Result",
    "result",
  ]) {
    let val = res[key];
    if (typeof val === "string") {
      const parsed = tryParseJson(val);
      if (parsed) val = parsed;
    }
    if (Array.isArray(val)) return val as T[];
  }

  return [];
}

export function extractTotalRows(res: any, fallback = 0): number {
  if (!res) return fallback;
  if (typeof res.TotalRows === "number") return res.TotalRows;
  if (typeof res.totalRows === "number") return res.totalRows;
  if (typeof res.total === "number") return res.total;
  if (res.TotalRows && !isNaN(Number(res.TotalRows))) return Number(res.TotalRows);
  if (res.totalRows && !isNaN(Number(res.totalRows))) return Number(res.totalRows);
  if (res.total && !isNaN(Number(res.total))) return Number(res.total);
  if (res.Data && typeof res.Data === "object" && !Array.isArray(res.Data)) {
    if (res.Data.TotalRows && !isNaN(Number(res.Data.TotalRows))) return Number(res.Data.TotalRows);
    if (res.Data.total && !isNaN(Number(res.Data.total))) return Number(res.Data.total);
  }
  const list = extractApiList(res);
  return list.length || fallback;
}

/**
 * Development Auditor to detect redundant/conflicting params or UI leaks in API requests
 */
function auditApiParams(method: "GET" | "POST", endpoint: string, params: Record<string, any>) {
  if (!IS_BROWSER) return;
  // Cho phép tắt qua localStorage nếu cần: localStorage.setItem("DISABLE_API_AUDIT", "1")
  if (localStorage.getItem("DISABLE_API_AUDIT") === "1") return;

  const warnings: string[] = [];
  const keys = Object.keys(params);

  // 1. Kiểm tra cặp alias / duplicate phổ biến
  const aliasPairs: [string, string, string][] = [
    ["ItemId", "MaterialId", "Trùng alias: cả ItemId và MaterialId đều được truyền! (Nên chỉ truyền MaterialId)"],
    ["WBS", "Orgcode", "Trùng alias: cả WBS và Orgcode đều được truyền! (Nên chỉ truyền Orgcode)"],
    ["OrgName", "Orgname", "Trùng alias hoa/thường: cả OrgName và Orgname đều được truyền! (Nên chỉ truyền Orgname)"],
    ["ContractDate", "Contractdate", "Trùng alias hoa/thường: cả ContractDate và Contractdate đều được truyền!"],
    ["SubconOf", "subconof", "Trùng alias hoa/thường: cả SubconOf và subconof đều được truyền!"],
  ];

  for (const [keyA, keyB, msg] of aliasPairs) {
    if (keyA in params && keyB in params) {
      warnings.push(msg);
    }
  }

  // 2. Kiểm tra các thuộc tính rác từ Ant Design / UI Table state lọt vào
  const uiLeakedKeys = [
    "key",
    "isNew",
    "isModified",
    "formattedPrice",
    "_original",
    "children",
    "selectedRowKeys",
    "tableKey",
  ];
  const foundUiLeaks = uiLeakedKeys.filter((k) => k in params);
  if (foundUiLeaks.length > 0) {
    warnings.push(`Phát hiện trường rác UI lọt vào payload: [${foundUiLeaks.join(", ")}]`);
  }

  // 3. Kiểm tra giá trị bất thường (NaN, 'undefined', 'null')
  const invalidValues = keys.filter(
    (k) => Number.isNaN(params[k]) || params[k] === "undefined" || params[k] === "null"
  );
  if (invalidValues.length > 0) {
    warnings.push(`Giá trị bất thường (NaN/undefined/null dạng chuỗi): [${invalidValues.join(", ")}]`);
  }

  // 4. Kiểm tra quy tắc theo UpdateMode của Submissions
  if (endpoint.includes("upsert-purchaseordersubmission") || endpoint.includes("upsert-quotationsubmission")) {
    const mode = params.UpdateMode;
    if (mode === "Update_PurchaseorderSubmission" || mode === "update_purchaseordersubmission") {
      if ("ParentId" in params) {
        warnings.push(`UpdateMode "${mode}" không cần truyền ParentId (thừa param)!`);
      }
      if (!params.SubmissionId) {
        warnings.push(`UpdateMode "${mode}" thiếu SubmissionId bắt buộc!`);
      }
    } else if (mode === "Delete_PurchaseorderSubmission" || mode === "delete_purchaseordersubmission") {
      const redundantInDelete = ["MaterialId", "ItemId", "UnitPrice", "Qnty", "TaxRate", "ParentId", "Orgcode", "WBS", "Orgname", "OrgName"];
      const foundInDelete = redundantInDelete.filter((k) => k in params);
      if (foundInDelete.length > 0) {
        warnings.push(`DeleteMode "${mode}" thừa các trường dữ liệu: [${foundInDelete.join(", ")}]`);
      }
    } else if (mode === "Create_PurchaseorderSubmission" || mode === "create_purchaseordersubmission") {
      if (params.SubmissionId) {
        warnings.push(`CreateMode "${mode}" không được có SubmissionId!`);
      }
    }
  }

  // 5. Log ra Dev Console
  if (warnings.length > 0) {
    console.group(`%c⚠️ [API AUDIT - CẢNH BÁO PARAMS THỪA] ${method} ${endpoint}`, "color: #ff4d4f; font-weight: bold; font-size: 12px;");
    console.warn("⚠️ Cảnh báo chi tiết:", warnings);
    console.warn("📦 Payload gửi đi:", params);
    console.groupEnd();
  } else {
    console.groupCollapsed(`%c✓ [API AUDIT - SẠCH] ${method} ${endpoint}`, "color: #52c41a; font-weight: bold;");
    console.log("📦 Clean Payload:", params);
    console.groupEnd();
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
}
const erpGetCache = new Map<string, CacheEntry>();
const erpInFlightRequests = new Map<string, Promise<any>>();
const recentRequestTimestamps = new Map<string, number>();
const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 60s in-memory cache for snappy navigation
let erpCacheGeneration = 0;

export function clearErpCache() {
  erpCacheGeneration += 1;
  erpGetCache.clear();
  erpInFlightRequests.clear();
}

function handleSessionError(msg?: string) {
  if (!msg || typeof msg !== "string") return;
  const lower = msg.toLowerCase();
  if (
    lower.includes("sessionid là bắt buộc") ||
    lower.includes("sessionid la bat buoc") ||
    lower.includes("cannot validate user") ||
    lower.includes("phiên hết hạn") ||
    lower.includes("phiên làm việc hết hạn") ||
    lower.includes("session expired") ||
    lower.includes("invalid session")
  ) {
    clearSession();
    if (IS_BROWSER && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
}

/**
 * Consims API GET Helper:
 * Encodes params as JSON string query parameter ?params={...}
 */
export async function erpGet<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  options?: { skipCache?: boolean; ttlMs?: number; timeoutMs?: number }
): Promise<T> {
  const session = getStoredSession();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;

  const activeLang =
    params.Language ??
    session?.Language ??
    (IS_BROWSER ? (localStorage.getItem("consims_lang") as string) : null) ??
    "vi";

  const mergedParams: Record<string, any> = {
    Language: activeLang,
    LogIn: params.LogIn ?? session?.LogIn ?? session?.Email ?? "",
    SessionId: params.SessionId ?? session?.SessionId ?? "",
    ...params,
  };

  const cacheKey = `${cleanEndpoint}?${JSON.stringify(mergedParams)}`;
  const now = Date.now();
  const ttl = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const cacheGeneration = erpCacheGeneration;

  // 1. Kiểm tra cache đã hoàn tất và còn hạn (TTL)
  if (!options?.skipCache && erpGetCache.has(cacheKey)) {
    const entry = erpGetCache.get(cacheKey)!;
    if (now - entry.timestamp < ttl) {
      return entry.data as T;
    }
    erpGetCache.delete(cacheKey);
  }

  // 2. In-flight request deduplication: Tránh gọi 2 HTTP requests đồng thời khi nhiều component cùng mount
  if (!options?.skipCache && erpInFlightRequests.has(cacheKey)) {
    return erpInFlightRequests.get(cacheKey) as Promise<T>;
  }

  // 3. Cảnh báo phát hiện gọi lặp nhanh (< 1 giây) giúp dev phát hiện useEffect loop/leak
  if (IS_BROWSER) {
    const lastTime = recentRequestTimestamps.get(cacheKey);
    if (lastTime && now - lastTime < 1000 && !options?.skipCache) {
      console.warn(
        `%c⚠️ [API AUDIT - CẢNH BÁO SPAM]: Endpoint "${cleanEndpoint}" vừa được gọi cách đây ${now - lastTime}ms! Hãy kiểm tra lại useEffect dependencies hoặc chuyển sang On-Demand fetching.`,
        "color: #ff4d4f; font-weight: bold; background: #fff1f0; padding: 2px 6px; border-radius: 4px;"
      );
    }
    recentRequestTimestamps.set(cacheKey, now);
  }

  auditApiParams("GET", cleanEndpoint, mergedParams);

  const queryString = `params=${encodeURIComponent(JSON.stringify(mergedParams))}`;
  const separator = cleanEndpoint.includes("?") ? "&" : "?";
  const url = `/${cleanEndpoint}${separator}${queryString}`;

  let fetchPromise: Promise<T> | null = null;
  fetchPromise = (async () => {
    try {
      const response = await apiClient.get<any>(url, {
        headers: getSessionHeaders(cleanEndpoint, session),
        timeout: options?.timeoutMs ?? 60000,
      });
      const data = response.data;
      if (data?.Success === "false" || data?.success === false) {
        const errMsg = data?.Message || data?.message || "Lỗi tải dữ liệu từ máy chủ";
        handleSessionError(errMsg);
        throw new Error(errMsg);
      }

      if (cacheGeneration === erpCacheGeneration) {
        erpGetCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data as T;
    } finally {
      if (fetchPromise && erpInFlightRequests.get(cacheKey) === fetchPromise) {
        erpInFlightRequests.delete(cacheKey);
      }
    }
  })();

  if (!options?.skipCache) {
    erpInFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Consims API POST Helper:
 * Sends body as { params: { ... } } with LogIn and SessionId auto-populated
 */
export async function erpPost<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  updateMode?: string
): Promise<T> {
  // Invalidate in-memory cache on any mutation
  clearErpCache();

  const session = getStoredSession();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;

  const activeLang =
    params.Language ??
    session?.Language ??
    (IS_BROWSER ? (localStorage.getItem("consims_lang") as string) : null) ??
    "vi";

  const mergedParams: Record<string, any> = {
    Language: activeLang,
    LogIn: params.LogIn ?? session?.LogIn ?? session?.Email ?? "",
    SessionId: params.SessionId ?? session?.SessionId ?? "",
    ...(updateMode ? { UpdateMode: updateMode } : {}),
    ...params,
  };

  auditApiParams("POST", cleanEndpoint, mergedParams);

  try {
    const response = await apiClient.post<any>(`/${cleanEndpoint}`, {
      ...mergedParams,
      params: mergedParams,
    }, {
      headers: getSessionHeaders(cleanEndpoint, session),
    });

    let data = response.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {}
    }

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
      const first = data[0];
      if (first?.Success === "false" || first?.success === false) {
        const errMsg = first?.Message || first?.message || "Thao tác không thành công";
        handleSessionError(errMsg);
        throw new Error(errMsg);
      }
    } else if (data?.Success === "false" || data?.success === false) {
      const errMsg = data?.Message || data?.message || data?.error || "Thao tác không thành công";
      handleSessionError(errMsg);
      throw new Error(errMsg);
    }
    return data as T;
  } finally {
    clearErpCache();
  }
}

/**
 * Consims FormData POST Helper (for Excel and file uploads)
 */
export async function erpPostForm<T = any>(endpoint: string, formData: FormData): Promise<T> {
  // Invalidate in-memory cache on form upload
  clearErpCache();

  const session = getStoredSession();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;

  const logIn = session?.LogIn || session?.Email || "";
  const sessionId = session?.SessionId || "";

  if (!formData.has("LogIn") && logIn) {
    formData.append("LogIn", logIn);
  }
  if (!formData.has("SessionId") && sessionId) {
    formData.append("SessionId", sessionId);
  }
  if (!formData.has("Language")) {
    const language =
      session?.Language ||
      (IS_BROWSER ? localStorage.getItem("consims_lang") : null) ||
      "vi";
    formData.append("Language", language);
  }

  try {
    const response = await apiClient.post<any>(`/${cleanEndpoint}`, formData, {
      headers: {
        ...getSessionHeaders(cleanEndpoint, session),
        "Content-Type": "multipart/form-data",
      },
    });

    const data = response.data;
    if (data?.Success === "false" || data?.success === false) {
      throw new Error(data?.Message || data?.message || "Tải lên thất bại");
    }
    return data as T;
  } finally {
    clearErpCache();
  }
}
