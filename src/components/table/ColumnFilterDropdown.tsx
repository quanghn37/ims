"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Typography } from "antd";
import {
  IconSearch,
  IconCheck,
  IconFilter,
  IconRotate2,
} from "@tabler/icons-react";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface FilterDropdownProps {
  colKey?: string;
  label: string;
  value: string;
  suggestions: string[];
  onApply: (val: string) => void;
  onClear: () => void;
  close: () => void;
}

export const ColumnFilterDropdown: React.FC<FilterDropdownProps> = ({
  colKey: _colKey,
  label,
  value,
  suggestions,
  onApply,
  onClear,
  close,
}) => {
  const { language } = useTranslation();
  const [tempValue, setTempValue] = useState(value || "");
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setTempValue(value || "");
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [value]);

  const filterInput = (tempValue || "").trim().toLowerCase();
  const displayedSuggestions = useMemo(() => {
    if (!filterInput) return suggestions.slice(0, 10);
    return suggestions
      .filter((v) => v.toLowerCase().includes(filterInput))
      .slice(0, 10);
  }, [suggestions, filterInput]);

  const handleConfirm = (valToApply?: string) => {
    const val = valToApply !== undefined ? valToApply : tempValue;
    onApply(val);
    close();
  };

  const handleReset = () => {
    setTempValue("");
    onClear();
    close();
  };

  const isEn = language === "en";

  return (
    <div
      style={{
        padding: "14px 16px",
        width: 300,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        boxSizing: "border-box",
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* HEADER: Tiêu đề cột & trạng thái */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconFilter size={15} strokeWidth={2} style={{ color: "#008f89" }} />
          <Text strong style={{ fontSize: 13, color: "#123443" }}>
            {isEn ? `Filter: ${label}` : `Lọc: ${label}`}
          </Text>
        </div>
        {value && (
          <span
            style={{
              fontSize: 11,
              color: "#008f89",
              background: "#e6f7f5",
              padding: "2px 7px",
              borderRadius: 10,
              fontWeight: 500,
            }}
          >
            {isEn ? "Filtered" : "Đang lọc"}
          </span>
        )}
      </div>

      {/* Ô NHẬP TÌM KIẾM */}
      <Input
        ref={inputRef}
        prefix={<IconSearch size={15} strokeWidth={1.8} style={{ color: "#94a3b8", marginRight: 2 }} />}
        placeholder={isEn ? `Type to search...` : `Nhập từ khóa tìm kiếm...`}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onPressEnter={() => handleConfirm()}
        allowClear
        style={{
          height: 34,
          borderRadius: 6,
          borderColor: "#dce5e6",
          fontSize: 13,
          marginBottom: displayedSuggestions.length > 0 ? 10 : 12,
        }}
      />

      {/* DANH SÁCH GỢI Ý NHANH (QUICK PICK SUGGESTIONS) */}
      {displayedSuggestions.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {isEn ? "Suggestions" : "Gợi ý nhanh"}
          </div>

          <div
            onWheel={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
            style={{
              maxHeight: 140,
              overflowY: "auto",
              border: "1px solid #eef2f6",
              borderRadius: 6,
              backgroundColor: "#f8fafc",
              padding: "4px",
            }}
          >
            {displayedSuggestions.map((sug) => {
              const isSelected = tempValue.trim().toLowerCase() === sug.trim().toLowerCase();
              return (
                <div
                  key={sug}
                  style={{
                    padding: "6px 8px",
                    fontSize: 12.5,
                    borderRadius: 4,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: isSelected ? "#008f89" : "#334155",
                    backgroundColor: isSelected ? "#e6f7f5" : "transparent",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "#f1f5f9";
                      e.currentTarget.style.color = "#008f89";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#334155";
                    }
                  }}
                  onClick={() => handleConfirm(sug)}
                  title={sug}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{sug}</span>
                  {isSelected && <IconCheck size={14} strokeWidth={2.5} style={{ color: "#008f89", flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER NÚT THAO TÁC */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 10,
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<IconRotate2 size={14} strokeWidth={1.8} />}
          onClick={handleReset}
          disabled={!tempValue && !value}
          style={{
            fontSize: 12,
            color: tempValue || value ? "#ef4444" : "#94a3b8",
            height: 30,
            padding: "0 8px",
            borderRadius: 6,
          }}
        >
          {isEn ? "Reset" : "Xóa lọc"}
        </Button>

        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            onClick={close}
            style={{
              fontSize: 12,
              height: 30,
              padding: "0 10px",
              borderRadius: 6,
              borderColor: "#dce5e6",
            }}
          >
            {isEn ? "Cancel" : "Đóng"}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<IconCheck size={14} strokeWidth={2} />}
            onClick={() => handleConfirm()}
            style={{
              fontSize: 12,
              height: 30,
              padding: "0 14px",
              borderRadius: 6,
              backgroundColor: "#008f89",
              borderColor: "#008f89",
              fontWeight: 500,
            }}
          >
            {isEn ? "Apply" : "Áp dụng"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ColumnFilterDropdown;
