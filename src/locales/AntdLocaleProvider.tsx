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
          colorPrimary: "#008f89",
          colorLink: "#008f89",
          colorLinkHover: "#007873",
          colorText: "#123443",
          colorTextHeading: "#123443",
          colorTextSecondary: "#718894",
          colorBorder: "#dce5e6",
          colorBorderSecondary: "#e6eded",
          colorBgLayout: "#f2f6f5",
          colorBgContainer: "#ffffff",
          borderRadius: 8,
          borderRadiusLG: 16,
          borderRadiusSM: 6,
          fontSize: 12,
        },
        components: {
          Table: {
            fontSize: 12,
            headerBg: "#eef5f4",
            headerColor: "#123443",
            rowHoverBg: "#f4f9f8",
            borderColor: "#dce5e6",
          },
          Button: {
            borderRadius: 8,
            colorPrimary: "#008f89",
            colorPrimaryHover: "#007873",
            defaultBorderColor: "#dce5e6",
            defaultColor: "#123443",
          },
          Card: {
            borderRadiusLG: 16,
          },
          Tabs: {
            colorPrimary: "#008f89",
            itemColor: "#718894",
            itemSelectedColor: "#008f89",
            itemHoverColor: "#008f89",
            inkBarColor: "#008f89",
          },
          Input: {
            fontSize: 12,
            borderRadius: 8,
            activeBorderColor: "#008f89",
            hoverBorderColor: "#79c7bf",
          },
          Select: {
            fontSize: 12,
            borderRadius: 8,
            colorPrimary: "#008f89",
            colorBorder: "#dce5e6",
          },
          DatePicker: {
            fontSize: 12,
            borderRadius: 8,
          },
          InputNumber: {
            fontSize: 12,
            borderRadius: 8,
          },
          Form: {
            labelFontSize: 12,
            labelColor: "#123443",
          },
          Modal: {
            fontSize: 12,
            borderRadiusLG: 16,
          },
          Drawer: {
            fontSize: 12,
          },
          Menu: {
            darkItemBg: "#0e2631",
            darkSubMenuItemBg: "#091b24",
            darkItemSelectedBg: "#008f89",
            darkItemSelectedColor: "#ffffff",
          },
        },
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* 1. Chữ trong bảng (Table data) - Chuẩn 12px, nền header #eef5f4, viền #dce5e6 */
        .ant-table,
        .ant-table table,
        .ant-table-thead > tr > th,
        .ant-table-tbody > tr > td,
        .ant-table-summary > tr > td {
          font-size: 12px !important;
          line-height: 1.4 !important;
          color: #123443;
        }
        .ant-table-thead > tr > th {
          padding: 8px 10px !important;
          background: #eef5f4 !important;
          color: #123443 !important;
          font-weight: 600 !important;
          border-bottom: 1px solid #dce5e6 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 6px 10px !important;
          border-bottom: 1px solid #e6eded !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f4f9f8 !important;
        }
        .ant-table .ant-typography,
        .ant-table span,
        .ant-table div {
          font-size: inherit;
        }

        /* 2. Chữ trong ô nhập liệu (Inputs & Controls) - Chuẩn bo góc 8px & viền ngọc */
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
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-select-selector,
        .ant-picker,
        .ant-btn {
          border-radius: 8px !important;
        }
        .ant-input:focus,
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused,
        .ant-select-focused .ant-select-selector,
        .ant-picker-focused {
          border-color: #008f89 !important;
          box-shadow: 0 0 0 2px rgba(121, 199, 191, 0.35) !important;
        }

        /* 3. Panel & Cards - Chuẩn bo góc 16px, viền #dce5e6 */
        .ant-card {
          border: 1px solid #dce5e6 !important;
          border-radius: 16px !important;
          box-shadow: 0 1px 3px rgba(18, 52, 67, 0.04) !important;
        }
        .ant-modal-content {
          border-radius: 16px !important;
          border: 1px solid #dce5e6 !important;
        }

        /* 4. Tiêu đề / Tiêu đề phiếu / Modal / Drawer */
        .ant-modal-title,
        .ant-drawer-title,
        .ant-card-head-title,
        .page-header-title,
        .section-header-title {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #123443 !important;
        }

        /* 5. Tabs & Hovers */
        .ant-tabs-ink-bar {
          background: #008f89 !important;
        }
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #008f89 !important;
          font-weight: 600 !important;
        }
        .ant-tabs-tab:hover {
          color: #008f89 !important;
        }

        /* 6. Huy hiệu đếm kiểu Template */
        .count-badge-mint {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #e7f4ed;
          color: #257875;
          border-radius: 50%;
          min-width: 22px;
          height: 22px;
          font-size: 11px;
          font-weight: 600;
          padding: 0 5px;
        }
      ` }} />
      {children}
    </ConfigProvider>
  );
};
