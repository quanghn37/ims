import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "antd";
import { IconCircleX, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "@/locales/LanguageContext";

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
  colKey,
  label,
  value,
  suggestions,
  onApply,
  onClear,
  close,
}) => {
  const { t, language } = useTranslation();
  const [tempValue, setTempValue] = useState(value || "");
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setTempValue(value || "");
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const filterInput = (tempValue || "").trim().toLowerCase();
  const displayedSuggestions = useMemo(() => {
    if (!filterInput) return suggestions.slice(0, 8);
    return suggestions.filter((v) => v.toLowerCase().includes(filterInput)).slice(0, 8);
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

  return (
    <div
      style={{ padding: 12, width: 260 }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Input
        ref={inputRef}
        placeholder={language === "en" ? `Search ${label}...` : `Tìm ${label}...`}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onPressEnter={() => handleConfirm()}
        allowClear
        style={{ marginBottom: displayedSuggestions.length > 0 ? 8 : 12 }}
      />

      {displayedSuggestions.length > 0 && (
        <div
          style={{
            maxHeight: 150,
            overflowY: "auto",
            marginBottom: 12,
            border: "1px solid #f0f0f0",
            borderRadius: 4,
            background: "#fafafa",
          }}
        >
          {displayedSuggestions.map((sug) => (
            <div
              key={sug}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#e6f4ff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
              onClick={() => handleConfirm(sug)}
              title={sug}
            >
              {sug}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button size="small" icon={<IconCircleX size={14} strokeWidth={1.8} />} onClick={handleReset}>
          {t("common.delete") || (language === "en" ? "Reset" : "Xóa")}
        </Button>
        <Button
          type="primary"
          size="small"
          icon={<IconSearch size={14} strokeWidth={1.8} />}
          onClick={() => handleConfirm()}
          style={{ background: "#008f89", borderColor: "#008f89" }}
        >
          {language === "en" ? "Apply" : "Áp dụng"}
        </Button>
      </div>
    </div>
  );
};

export default ColumnFilterDropdown;
