"use client";

import React, { useState } from "react";
import { Button, message } from "antd";
import type { ButtonProps } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";
import { exportToExcel, DynamicExcelExportOptions } from "@/lib/excel-export";

export interface ExportExcelButtonProps extends Omit<ButtonProps, "onClick" | "loading"> {
  /**
   * Hàm callback cung cấp cấu hình xuất Excel (hỗ trợ cả async để tải toàn bộ dữ liệu từ API)
   */
  getExportOptions: () => Promise<DynamicExcelExportOptions> | DynamicExcelExportOptions;
  buttonText?: string;
  successMessage?: string;
}

/**
 * Component Nút Xuất Excel động dùng chung cho toàn bộ các màn hình
 */
export default function ExportExcelButton({
  getExportOptions,
  buttonText = "Xuất Excel",
  successMessage = "Xuất file Excel thành công!",
  style,
  ...restProps
}: ExportExcelButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const options = await getExportOptions();
      if (!options.data || options.data.length === 0) {
        message.warning("Không có dữ liệu để xuất Excel!");
        return;
      }
      await exportToExcel(options);
      message.success(successMessage);
    } catch (err: any) {
      console.error("Lỗi xuất file Excel:", err);
      message.error(err?.message || "Lỗi khi xuất file Excel!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<FileExcelOutlined style={{ color: "#16A34A" }} />}
      loading={loading}
      onClick={handleClick}
      style={{
        borderRadius: 6,
        borderColor: "#CBD5E1",
        fontWeight: 500,
        ...style,
      }}
      {...restProps}
    >
      {buttonText}
    </Button>
  );
}
