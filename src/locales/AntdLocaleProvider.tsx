"use client";

import React from "react";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import enUS from "antd/locale/en_US";
import { useTranslation } from "@/locales/LanguageContext";

interface AntdLocaleProviderProps {
  children: React.ReactNode;
}

export const AntdLocaleProvider: React.FC<AntdLocaleProviderProps> = ({ children }) => {
  const { language } = useTranslation();
  const currentLocale = language === "en" ? enUS : viVN;

  return (
    <ConfigProvider
      locale={currentLocale}
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 4,
          colorBgContainer: "#ffffff",
          fontSize: 12,
        },
        components: {
          Table: {
            fontSize: 12,
          },
          Input: {
            fontSize: 12,
          },
          Select: {
            fontSize: 12,
          },
          DatePicker: {
            fontSize: 12,
          },
          InputNumber: {
            fontSize: 12,
          },
          Form: {
            labelFontSize: 12,
          },
          Modal: {
            fontSize: 12,
          },
          Drawer: {
            fontSize: 12,
          },
        },
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* 1. Chữ trong bảng (Table data) - Chuẩn 12px & đệm gọn gàng toàn dự án */
        .ant-table,
        .ant-table table,
        .ant-table-thead > tr > th,
        .ant-table-tbody > tr > td,
        .ant-table-summary > tr > td {
          font-size: 12px !important;
          line-height: 1.4 !important;
        }
        .ant-table-thead > tr > th {
          padding: 7px 8px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 6px 8px !important;
        }
        .ant-table .ant-typography,
        .ant-table span,
        .ant-table div {
          font-size: inherit;
        }

        /* 2. Chữ trong ô nhập liệu (Inputs & Controls) - Chuẩn 12px toàn dự án */
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-input-number,
        .ant-input-number-input,
        .ant-select,
        .ant-select-selector,
        .ant-select-item,
        .ant-select-selection-item,
        .ant-select-selection-placeholder,
        .ant-picker,
        .ant-picker-input > input,
        .ant-form-item-label > label,
        .ant-btn {
          font-size: 12px !important;
        }

        /* 3. Tiêu đề / Tiêu đề phiếu / Modal / Drawer - Chuẩn 14px toàn dự án */
        .ant-modal-title,
        .ant-drawer-title,
        .ant-card-head-title,
        .page-header-title,
        .section-header-title {
          font-size: 14px !important;
          font-weight: 600 !important;
        }
      ` }} />
      {children}
    </ConfigProvider>
  );
};
