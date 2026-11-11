"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Select } from "antd";
import { useTranslation } from "@/locales/LanguageContext";
import {
  ProcessingStatusItem,
  fetchProcessingStatusesWithRole,
  getProcessingStatusDotColor,
  getStatusesByRole,
  resolveDecisionForRole,
} from "@/config/workflowConfig";

export interface ApprovalDecisionSelectProps {
  role?: string; // "R" | "C" | "A" | "I"
  value?: string | number;
  onChange?: (value: string, item?: ProcessingStatusItem) => void;
  statusList?: ProcessingStatusItem[]; // Danh sách đã có sẵn từ ngoài, nếu không truyền sẽ tự fetch từ API
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  allowClear?: boolean;
  size?: "large" | "middle" | "small";
}

/**
 * Component Dropdown chọn Quyết định Phê duyệt dùng chung toàn dự án
 * - Gọi duy nhất API api/get-processing-status-list (DisplayMode: official_with_role)
 * - Tự động lọc nghiêm ngặt theo điều kiện Role (R, C, A, I)
 * - Tự động ánh xạ giá trị vào đúng tập quyết định hợp lệ của Role, tuyệt đối không xuất hiện giá trị ngoại lai
 */
export const ApprovalDecisionSelect: React.FC<ApprovalDecisionSelectProps> = ({
  role = "A",
  value,
  onChange,
  statusList,
  loading = false,
  disabled = false,
  placeholder,
  style,
  className,
  allowClear = false,
  size,
}) => {
  const { language } = useTranslation();
  const [internalList, setInternalList] = useState<ProcessingStatusItem[]>([]);
  const [fetching, setFetching] = useState(false);

  // Tự động nạp dữ liệu từ API nếu props statusList chưa có
  useEffect(() => {
    if (statusList && statusList.length > 0) {
      setInternalList(statusList);
      return;
    }

    let isMounted = true;
    setFetching(true);
    fetchProcessingStatusesWithRole(language || "vi")
      .then((data) => {
        if (isMounted) {
          setInternalList(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setFetching(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [statusList, language]);

  const effectiveList = statusList && statusList.length > 0 ? statusList : internalList;

  // Lọc nghiêm ngặt các mục theo Role (R, C, A, I)
  const roleStatuses = useMemo(() => {
    return getStatusesByRole(effectiveList, role);
  }, [effectiveList, role]);

  // Tạo danh sách Options hiển thị kèm chấm màu chuẩn
  const options = useMemo(() => {
    if (!roleStatuses || roleStatuses.length === 0) return [];
    return roleStatuses.map((item) => {
      const dotColor = getProcessingStatusDotColor(item.Status, item.Alias);
      return {
        value: item.Description,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 7.5,
                height: 7.5,
                borderRadius: "50%",
                background: dotColor,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>
              {item.Description}
            </span>
          </div>
        ),
        rawItem: item,
      };
    });
  }, [roleStatuses]);

  // Xác định giá trị hợp lệ của Role hiện tại (Auto-mapping)
  const resolvedValue = useMemo(() => {
    if (!roleStatuses || roleStatuses.length === 0) {
      return value !== undefined && value !== null ? String(value) : undefined;
    }

    // 1. Nếu giá trị hiện tại đã thuộc Role này -> Dùng trực tiếp
    const exactMatch = roleStatuses.find(
      (item) => item.Description.trim().toLowerCase() === String(value || "").trim().toLowerCase()
    );
    if (exactMatch) {
      return exactMatch.Description;
    }

    // 2. Nếu không thuộc Role này (ví dụ: Role R nhưng dữ liệu cũ lưu "Chấp thuận")
    // Tự động map sang giá trị hợp lệ của Role này (ví dụ: Chấp thuận -> Trình)
    return resolveDecisionForRole(value, role, roleStatuses);
  }, [value, role, roleStatuses]);

  // Nếu giá trị resolved khác với value ban đầu (do lệch Role), đồng bộ lại state cha
  const lastSyncRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      resolvedValue &&
      resolvedValue !== value &&
      lastSyncRef.current !== resolvedValue &&
      roleStatuses.length > 0
    ) {
      lastSyncRef.current = resolvedValue;
      const matched = roleStatuses.find((item) => item.Description === resolvedValue);
      if (onChange) {
        onChange(resolvedValue, matched);
      }
    }
  }, [resolvedValue, value, roleStatuses, onChange]);

  const defaultPlaceholder =
    language === "en" ? "— Select Decision —" : "— Chọn quyết định —";

  return (
    <Select
      value={resolvedValue || undefined}
      onChange={(val, opt: any) => {
        if (onChange) {
          onChange(val, opt?.rawItem);
        }
      }}
      options={options}
      placeholder={placeholder || defaultPlaceholder}
      loading={loading || fetching}
      disabled={disabled}
      style={{ width: "100%", ...style }}
      className={className}
      allowClear={allowClear}
      size={size}
    />
  );
};

export default ApprovalDecisionSelect;
