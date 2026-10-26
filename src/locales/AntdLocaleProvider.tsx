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
        /* 1. Chữ trong bảng (Table data) - Chuẩn 12px, nền header #eef5f4, viền #dce5e6, In Đậm Tiêu Đề Cột */
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
          color: #1e293b !important;
          font-weight: 700 !important;
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

        /* 1.1. Chuẩn Bảng Chi Tiết Vật Tư Dùng Chung Toàn Dự Án (ERP Detail Table - Compact Auto-fit, In Đậm Tiêu Đề Cột) */
        .erp-detail-table .ant-table,
        .erp-detail-table .ant-table table,
        .po-order-table .ant-table,
        .po-order-table .ant-table table,
        .quotation-detail-table .ant-table,
        .quotation-detail-table .ant-table table {
          font-family: inherit;
        }
        .erp-detail-table .ant-table-thead > tr > th,
        .po-order-table .ant-table-thead > tr > th,
        .quotation-detail-table .ant-table-thead > tr > th {
          background-color: #f7fbfa !important;
          color: #1e293b !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          line-height: 1.3 !important;
          border-color: #dce5e6 !important;
          padding: 6px 8px !important;
        }
        .erp-detail-table .ant-table-tbody > tr > td,
        .po-order-table .ant-table-tbody > tr > td,
        .quotation-detail-table .ant-table-tbody > tr > td {
          color: #123443 !important;
          font-size: 12.5px !important;
          line-height: 1.35 !important;
          border-color: #e6eded !important;
          padding: 5px 8px !important;
          height: auto !important;
        }
        .erp-detail-table .ant-table-tbody > tr:hover > td,
        .po-order-table .ant-table-tbody > tr:hover > td,
        .quotation-detail-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc !important;
        }
        .erp-detail-table .ant-table-container,
        .po-order-table .ant-table-container,
        .quotation-detail-table .ant-table-container {
          border: 1px solid #dce5e6 !important;
          border-radius: 6px !important;
          overflow: hidden;
        }
        .erp-detail-table .ant-table-summary .ant-table-cell,
        .po-order-table .ant-table-summary .ant-table-cell,
        .quotation-detail-table .ant-table-summary .ant-table-cell {
          padding: 5px 8px !important;
          font-size: 12.5px !important;
          line-height: 1.35 !important;
          border-color: #dce5e6 !important;
        }
        .erp-detail-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .po-order-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .quotation-detail-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          background: #f7fbfa !important;
        }
        .erp-detail-table .ant-table-tbody > tr > td.ant-table-cell-fix-right,
        .po-order-table .ant-table-tbody > tr > td.ant-table-cell-fix-right,
        .quotation-detail-table .ant-table-tbody > tr > td.ant-table-cell-fix-right {
          background: #ffffff;
        }
        .erp-detail-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
        .po-order-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
        .quotation-detail-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right {
          background: #f1f5f9;
        }
        .erp-detail-table .ant-table-summary .ant-table-cell-fix-right,
        .po-order-table .ant-table-summary .ant-table-cell-fix-right,
        .quotation-detail-table .ant-table-summary .ant-table-cell-fix-right {
          background: #f7fbfa !important;
        }

        /* 1.2. Chuẩn Khung Thông Tin Chung Mục I (ERP General Info Box - In Đậm Label, Giá Trị Thanh Mảnh, Độ Cao Chuẩn 97px Thoáng Đẹp) */
        .erp-general-info-card {
          background: #FFFFFF !important;
          border: 1px solid #dce5e6 !important;
          border-radius: 6px !important;
          padding: 7px 8px !important;
          margin-bottom: 8px !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .erp-info-cell {
          padding: 1px 6px !important;
          border-right: 1px solid #dce5e6 !important;
          min-width: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
        }
        .erp-info-cell:last-child {
          border-right: none !important;
        }
        .erp-info-label {
          font-size: 10.5px !important;
          font-weight: 700 !important;
          color: #334155 !important;
          line-height: 12px !important;
          margin-bottom: 2px !important;
          white-space: nowrap !important;
          display: block !important;
        }
        .erp-info-value {
          font-size: 12.5px !important;
          font-weight: 400 !important;
          color: #1e293b !important;
          line-height: 20px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          min-height: 20px !important;
          height: 20px !important;
          display: flex !important;
          align-items: center !important;
        }
        .erp-info-value.mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        }
        .erp-info-divider {
          height: 1px !important;
          background: #eef2f6 !important;
          margin: 4px 0 !important;
          border: none !important;
          width: 100% !important;
        }

        /* Khống chế toàn bộ Ant Design Form Control trong .erp-general-info-card để đạt độ cao chuẩn 97px */
        .erp-general-info-card {
          border: 1px solid #dce5e6 !important;
          border-radius: 6px !important;
          background: #ffffff !important;
          padding: 6px 12px !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
        }
        /* Ép chuẩn Label in đậm (font-weight: 700) và Giá trị chữ thường (font-weight: 400) */
        .erp-general-info-card .erp-info-label,
        .erp-general-info-card .erp-info-cell > span:first-child,
        .erp-general-info-card .erp-info-cell > div:first-child,
        .erp-general-info-card .ant-col > div:first-child:not(.erp-info-value):not(.ant-form-item) {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #334155 !important;
          line-height: 14px !important;
          margin-bottom: 2px !important;
        }

        .erp-general-info-card .ant-input,
        .erp-general-info-card .ant-input-number-input,
        .erp-general-info-card .ant-picker-input > input,
        .erp-general-info-card .ant-select-selection-item,
        .erp-general-info-card .erp-info-value {
          font-weight: 400 !important;
          color: #1e293b !important;
        }

        .erp-general-info-card .ant-input:disabled,
        .erp-general-info-card .ant-input[disabled],
        .erp-general-info-card .ant-picker-input > input[disabled],
        .erp-general-info-card .ant-select-disabled .ant-select-selection-item {
          color: #1e293b !important;
          -webkit-text-fill-color: #1e293b !important;
          opacity: 1 !important;
        }

        .erp-general-info-card .ant-form-item {
          margin: 0 !important;
          min-height: 20px !important;
          height: 20px !important;
          line-height: 20px !important;
        }
        .erp-general-info-card .ant-form-item-row,
        .erp-general-info-card .ant-form-item-control {
          min-height: 20px !important;
          height: 20px !important;
          line-height: 20px !important;
        }
        .erp-general-info-card .ant-form-item-control-input {
          min-height: 20px !important;
          height: 20px !important;
        }
        .erp-general-info-card .ant-form-item-control-input-content {
          min-height: 20px !important;
          height: 20px !important;
          line-height: 20px !important;
          display: flex !important;
          align-items: center !important;
        }
        .erp-general-info-card .ant-input,
        .erp-general-info-card .ant-input-number,
        .erp-general-info-card .ant-input-number-input,
        .erp-general-info-card .ant-picker,
        .erp-general-info-card .ant-picker-input,
        .erp-general-info-card .ant-picker-input > input,
        .erp-general-info-card .ant-select {
          height: 20px !important;
          min-height: 20px !important;
          line-height: 20px !important;
          font-size: 12.5px !important;
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }
        .erp-general-info-card .ant-input,
        .erp-general-info-card .ant-input-number,
        .erp-general-info-card .ant-input-number-input,
        .erp-general-info-card .ant-picker,
        .erp-general-info-card .ant-picker-input > input {
          padding: 0 !important;
        }
        .erp-general-info-card .ant-select {
          position: relative !important;
          width: 100% !important;
        }
        .erp-general-info-card .ant-select-selector {
          height: 20px !important;
          min-height: 20px !important;
          line-height: 20px !important;
          padding: 0 14px 0 0 !important;
          font-size: 12.5px !important;
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
          display: flex !important;
          align-items: center !important;
        }
        .erp-general-info-card .ant-input-number-input-wrap {
          height: 20px !important;
        }
        .erp-general-info-card .ant-select-selection-item,
        .erp-general-info-card .ant-select-selection-placeholder {
          line-height: 20px !important;
          height: 20px !important;
          font-size: 12.5px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          text-align: left !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .erp-general-info-card .ant-select .ant-select-arrow {
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          right: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 10px !important;
          line-height: 1 !important;
          height: auto !important;
          width: auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #94a3b8 !important;
          pointer-events: none !important;
        }
        .erp-general-info-card .ant-select .ant-select-clear {
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          right: 0 !important;
          margin: 0 !important;
          font-size: 10px !important;
          background: #ffffff !important;
        }
        .erp-general-info-card .ant-picker .ant-picker-suffix {
          font-size: 11px !important;
          line-height: 20px !important;
          height: 20px !important;
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
          color: #94a3b8 !important;
        }
        .erp-general-info-card .erp-amount-input .ant-input-number-input,
        .erp-general-info-card .erp-amount-input input {
          font-weight: 700 !important;
          color: #008f89 !important;
        }

        /* 1.3. Chuẩn Khung Tóm Tắt Chứng Từ / Popup Duyệt (ERP Summary Boxes - In Đậm Label, Giá Trị Chữ Thường) */
        .erp-summary-card {
          background: #FFFFFF !important;
          border: 1px solid #dce5e6 !important;
          border-radius: 10px !important;
          padding: 14px 16px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03) !important;
        }
        .erp-summary-box {
          background: #f7fbfa !important;
          border: 1px solid #dce5e6 !important;
          border-radius: 8px !important;
          padding: 10px 14px !important;
        }
        .erp-summary-label {
          font-size: 11px !important;
          color: #334155 !important;
          font-weight: 700 !important;
          margin-bottom: 4px !important;
          display: block !important;
          line-height: 14px !important;
          text-transform: none;
        }
        .erp-summary-value {
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #123443 !important;
          line-height: 18px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .erp-summary-value.mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        }
        .erp-summary-value.amount {
          color: #008f89 !important;
          font-weight: 700 !important;
          font-size: 14px !important;
        }

        /* 1.4. Chuẩn Khung Vùng II Chi Tiết Vật Tư (ERP Detail Section Card) */
        .erp-detail-section-card {
          border: 1px solid #dce5e6 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          padding: 10px 12px !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
          margin-top: 10px !important;
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
        .ant-form-item-label > label {
          font-weight: 700 !important;
          color: #334155 !important;
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

        /* 5. Tabs & Hovers (Compact & Consistent) */
        .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .ant-tabs-tab {
          padding: 6px 12px !important;
          font-size: 13px !important;
        }
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

        /* 5.1. Pagination Active Mint */
        .ant-pagination .ant-pagination-item-active,
        .stockin-main-table .ant-pagination .ant-pagination-item-active {
          border-color: #008f89 !important;
          background-color: #008f89 !important;
        }
        .ant-pagination .ant-pagination-item-active a,
        .stockin-main-table .ant-pagination .ant-pagination-item-active a {
          color: #FFFFFF !important;
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
