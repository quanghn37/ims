"use client";

import React from "react";
import { Tag } from "antd";
import { useTranslation } from "@/locales/LanguageContext";
import { getRaciConfig } from "@/config/workflowConfig";

export interface RaciRoleTagProps {
  role?: string;
  language?: string;
  style?: React.CSSProperties;
  className?: string;
  short?: boolean; // nếu true thì chỉ hiện mã "R", "C", "A", "I"
}

export const RaciRoleTag: React.FC<RaciRoleTagProps> = ({
  role = "A",
  language: explicitLang,
  style,
  className,
  short = false,
}) => {
  const { language: currentLang } = useTranslation();
  const lang = explicitLang || currentLang || "vi";
  const config = getRaciConfig(role);

  const label = short
    ? config.code
    : lang === "en"
    ? config.labelEn
    : config.labelVi;

  return (
    <Tag
      className={className}
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        borderRadius: 16,
        fontWeight: 700,
        fontSize: 12,
        padding: short ? "1px 8px" : "2px 10px",
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {label}
    </Tag>
  );
};

export default RaciRoleTag;
