"use client";

import React from "react";

interface ErpPageContainerProps {
  children: React.ReactNode;
  padding?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Khung layout chuẩn ERP cho màn hình danh sách (Table / Grid):
 * - Tràn viền (Full Canvas), loại bỏ viền card và nền xanh lơ lửng.
 * - Khóa viewport height chuẩn để header bảng cố định (sticky).
 */
export const ErpPageContainer: React.FC<ErpPageContainerProps> = ({
  children,
  padding = "14px 20px 14px 20px",
  style,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        margin: "-16px -20px -24px -20px",
        minHeight: "calc(100vh - 48px)",
        maxHeight: "calc(100vh - 48px)",
        background: "#FFFFFF",
        padding,
        boxSizing: "border-box",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Khung layout chuẩn ERP cho màn hình chi tiết (Form Drawer / Detail Page):
 * - Tràn viền (Full Canvas).
 * - Chiều cao co giãn và cuộn tự nhiên.
 */
export const ErpDetailContainer: React.FC<ErpPageContainerProps> = ({
  children,
  padding = 0,
  style,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        margin: "-16px -20px -24px -20px",
        minHeight: "calc(100vh - 48px)",
        background: "#FFFFFF",
        padding,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default ErpPageContainer;
