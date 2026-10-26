import React from "react";

export interface StatusStyle {
  dotColor: string;
  bg: string;
  border: string;
  color: string;
  defaultLabelVi: string;
  defaultLabelEn: string;
}

export const STATUS_CONFIG_MAP: Record<string, StatusStyle> = {
  // 1. Duyệt / Approved (Xanh lá - Chuẩn chung phê duyệt)
  approved: {
    dotColor: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    color: "#047857",
    defaultLabelVi: "Đã duyệt",
    defaultLabelEn: "Approved",
  },
  // 2. Chấp thuận / Accepted (Đồng bộ chuẩn Xanh lá phê duyệt toàn hệ thống)
  accepted: {
    dotColor: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    color: "#047857",
    defaultLabelVi: "Chấp thuận",
    defaultLabelEn: "Approved",
  },
  // 3. Duyệt có ĐK / Cond-Approved (Xanh ngọc / Emerald)
  cond_approved: {
    dotColor: "#059669",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    color: "#065f46",
    defaultLabelVi: "Duyệt có ĐK",
    defaultLabelEn: "Cond-Approved",
  },
  // 3.1. Chờ duyệt / In-Review / Pending (Xanh dương / Blue)
  in_review: {
    dotColor: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    color: "#1d4ed8",
    defaultLabelVi: "Chờ duyệt",
    defaultLabelEn: "In-Review",
  },
  // 4. Đang làm / In-Progress (Vàng tươi)
  in_progress: {
    dotColor: "#eab308",
    bg: "#fefce8",
    border: "#fef08a",
    color: "#854d0e",
    defaultLabelVi: "Đang làm",
    defaultLabelEn: "In-Progress",
  },
  // 5. Chưa làm / Not-Started (Cam)
  not_started: {
    dotColor: "#f97316",
    bg: "#fff7ed",
    border: "#fed7aa",
    color: "#c2410c",
    defaultLabelVi: "Chưa làm",
    defaultLabelEn: "Not-Started",
  },
  // 6. Từ chối / Rejected (Đỏ)
  rejected: {
    dotColor: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
    color: "#b91c1c",
    defaultLabelVi: "Từ chối",
    defaultLabelEn: "Rejected",
  },
  // 7. Bản nháp / Draft (Xám nhẹ / Slate)
  draft: {
    dotColor: "#94a3b8",
    bg: "#f8fafc",
    border: "#e2e8f0",
    color: "#475569",
    defaultLabelVi: "Bản nháp",
    defaultLabelEn: "Draft",
  },
  // 8. Mặc định / Unknown (Xám)
  default: {
    dotColor: "#94a3b8",
    bg: "#f8fafc",
    border: "#e2e8f0",
    color: "#475569",
    defaultLabelVi: "---",
    defaultLabelEn: "---",
  },
};

/**
 * Tự động xác định ngôn ngữ hiện tại từ localStorage hoặc biến truyền vào
 */
export function getCurrentLanguage(explicitLang?: string): string {
  if (explicitLang === "en" || explicitLang === "vi") return explicitLang;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("consims_lang");
      if (stored === "en" || stored === "vi") return stored;
    } catch (e) {}
  }
  return "vi";
}

/**
 * Lấy nhãn hiển thị đa ngôn ngữ chuẩn cho trạng thái
 */
export function getStatusLabel(rawStatus: any, language: string = "vi"): string {
  if (rawStatus === undefined || rawStatus === null || rawStatus === "") {
    return language === "en" ? "Not-Started" : "Chưa làm";
  }

  const clean = String(rawStatus)
    .replace(/[✅❌⏳🕒✓💬✕\s]+/g, " ")
    .trim()
    .toLowerCase();

  const isEn = language === "en";

  if (
    clean === "0" ||
    clean === "chưa làm" ||
    clean === "chua lam" ||
    clean.includes("not-started") ||
    clean.includes("not started")
  ) {
    return isEn ? "Not-Started" : "Chưa làm";
  }

  if (clean === "chấp thuận" || clean === "chap thuan") {
    return isEn ? "Approved" : "Chấp thuận";
  }

  if (
    clean === "duyệt" ||
    clean === "duyet" ||
    clean === "đã duyệt" ||
    clean === "da duyet" ||
    clean === "approved" ||
    clean === "accepted" ||
    clean === "appr" ||
    clean === "1"
  ) {
    return isEn ? "Approved" : "Đã duyệt";
  }

  if (
    clean.includes("có đk") ||
    clean.includes("co dk") ||
    clean.includes("điều kiện") ||
    clean.includes("dieu kien") ||
    clean.includes("cond")
  ) {
    return isEn ? "Cond-Approved" : "Duyệt có ĐK";
  }

  if (
    clean === "đang làm" ||
    clean === "dang lam" ||
    clean === "đang xử lý" ||
    clean === "dang xu ly" ||
    clean.includes("in-progress") ||
    clean.includes("in progress") ||
    clean.includes("processing")
  ) {
    return isEn ? "In-Progress" : "Đang làm";
  }

  if (
    clean === "chờ duyệt" ||
    clean === "cho duyet" ||
    clean === "pending" ||
    clean.includes("in-review") ||
    clean.includes("in review") ||
    clean === "2"
  ) {
    return isEn ? "In-Review" : "Chờ duyệt";
  }

  if (
    clean === "từ chối" ||
    clean === "tu choi" ||
    clean === "rejected" ||
    clean === "hủy" ||
    clean === "huy" ||
    clean === "reject"
  ) {
    return isEn ? "Rejected" : "Từ chối";
  }

  if (clean === "draft" || clean === "bản nháp" || clean === "ban nhap" || clean === "nháp") {
    return isEn ? "Draft" : "Bản nháp";
  }

  return String(rawStatus);
}

/**
 * Phân tích và lấy cấu hình màu sắc trạng thái từ chuỗi bất kỳ
 */
export function getStatusStyle(rawStatus: any): StatusStyle {
  if (rawStatus === undefined || rawStatus === null || rawStatus === "") {
    return STATUS_CONFIG_MAP.not_started;
  }

  const clean = String(rawStatus)
    .replace(/[✅❌⏳🕒✓💬✕\s]+/g, " ")
    .trim()
    .toLowerCase();

  if (clean === "0" || clean === "chưa làm" || clean === "chua lam" || clean.includes("not-started") || clean.includes("not started")) {
    return STATUS_CONFIG_MAP.not_started;
  }
  if (clean === "chấp thuận" || clean === "chap thuan" || clean === "accepted") {
    return STATUS_CONFIG_MAP.accepted;
  }
  if (
    clean === "duyệt" ||
    clean === "duyet" ||
    clean === "đã duyệt" ||
    clean === "da duyet" ||
    clean === "approved" ||
    clean === "appr" ||
    clean === "1"
  ) {
    return STATUS_CONFIG_MAP.approved;
  }
  if (
    clean.includes("có đk") ||
    clean.includes("co dk") ||
    clean.includes("điều kiện") ||
    clean.includes("dieu kien") ||
    clean.includes("cond")
  ) {
    return STATUS_CONFIG_MAP.cond_approved;
  }
  if (
    clean === "đang làm" ||
    clean === "dang lam" ||
    clean === "đang xử lý" ||
    clean === "dang xu ly" ||
    clean.includes("in-progress") ||
    clean.includes("in progress") ||
    clean.includes("processing")
  ) {
    return STATUS_CONFIG_MAP.in_progress;
  }
  if (
    clean === "chờ duyệt" ||
    clean === "cho duyet" ||
    clean === "pending" ||
    clean.includes("in-review") ||
    clean.includes("in review") ||
    clean === "2"
  ) {
    return STATUS_CONFIG_MAP.in_review;
  }
  if (clean === "từ chối" || clean === "tu choi" || clean === "rejected" || clean === "hủy" || clean === "huy" || clean === "reject") {
    return STATUS_CONFIG_MAP.rejected;
  }
  if (clean === "draft" || clean === "bản nháp" || clean === "ban nhap" || clean === "nháp") {
    return STATUS_CONFIG_MAP.draft;
  }

  return STATUS_CONFIG_MAP.default;
}

/**
 * Hiển thị dạng Chấm tròn màu + Chữ xám đen cho Dropdown Select (giống ảnh mẫu)
 */
export function renderStatusDotItem(rawStatus: any, customLabel?: string, language?: string) {
  const activeLang = getCurrentLanguage(language);
  const style = getStatusStyle(rawStatus);
  const text = customLabel || getStatusLabel(rawStatus, activeLang);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, verticalAlign: "middle" }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: style.dotColor,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "#1e293b", fontSize: 13, fontWeight: 400 }}>
        {text}
      </span>
    </div>
  );
}

/**
 * Hiển thị dạng Huy hiệu (Badge) mềm kèm chấm tròn cho Bảng dữ liệu (Table column)
 * Tự động dịch chuẩn ngôn ngữ theo hệ thống (English / Tiếng Việt)
 */
export function renderStatusBadge(rawStatus: any, customLabel?: string, language?: string) {
  const activeLang = getCurrentLanguage(language);

  if (rawStatus === undefined || rawStatus === null || rawStatus === "") {
    return (
      <span
        style={{
          background: STATUS_CONFIG_MAP.not_started.bg,
          border: `1px solid ${STATUS_CONFIG_MAP.not_started.border}`,
          color: STATUS_CONFIG_MAP.not_started.color,
          borderRadius: 14,
          padding: "2px 8px",
          fontSize: 12,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: STATUS_CONFIG_MAP.not_started.dotColor,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span>{activeLang === "en" ? "Not-Started" : "Chưa làm"}</span>
      </span>
    );
  }

  const style = getStatusStyle(rawStatus);
  const text = customLabel || getStatusLabel(rawStatus, activeLang);

  return (
    <span
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        borderRadius: 14,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: style.dotColor,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span>{text}</span>
    </span>
  );
}
