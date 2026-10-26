"use client";

import React, { useState } from "react";

export interface ErpDetailCardProps {
  title: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ErpDetailCard - Khung Vùng II (Chi tiết vật tư / Hạng mục) dùng chung toàn bộ dự án
 * Đóng gói vỏ bọc card viền #dce5e6, bo góc 8px, nền trắng, nút tròn thu gọn/mở rộng [-]/[+]
 * và cụm nút thao tác (actions) đặt gọn gàng ở header bên phải.
 */
export const ErpDetailCard: React.FC<ErpDetailCardProps> = ({
  title,
  collapsible = true,
  defaultExpanded = true,
  actions,
  children,
  className = "",
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  return (
    <div
      className={`erp-detail-section-card ${className}`}
      style={{
        marginTop: 10,
        border: "1px solid #dce5e6",
        borderRadius: 8,
        background: "#ffffff",
        padding: "10px 12px",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        ...style,
      }}
    >
      {/* HEADER VÙNG II: Nút [-]/[+] + Tiêu đề (bên trái) | Cụm nút thao tác (bên phải) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isExpanded ? 10 : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: collapsible ? "pointer" : "default",
            userSelect: "none",
          }}
          onClick={() => {
            if (collapsible) {
              setIsExpanded((prev) => !prev);
            }
          }}
        >
          {collapsible && (
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "#dce5e6",
                color: "#008f89",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
                flexShrink: 0,
                transition: "background-color 0.2s ease",
              }}
            >
              {isExpanded ? "−" : "+"}
            </div>
          )}
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#008f89",
              textTransform: "uppercase",
              lineHeight: "20px",
              letterSpacing: "0.2px",
            }}
          >
            {title}
          </span>
        </div>

        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {actions}
          </div>
        )}
      </div>

      {/* NỘI DUNG VÙNG II KHI MỞ RỘNG (EXPANDED) */}
      {isExpanded && <div>{children}</div>}
    </div>
  );
};

export default ErpDetailCard;
