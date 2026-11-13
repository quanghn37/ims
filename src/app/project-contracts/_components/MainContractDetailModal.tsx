"use client";

import React from "react";
import { Modal, Button, Tag } from "antd";
import dayjs from "dayjs";
import { MainContractItem } from "../types";
import { useTranslation } from "@/locales/LanguageContext";

interface MainContractDetailModalProps {
  open: boolean;
  onClose: () => void;
  contract: MainContractItem | null;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const clean = dateStr.trim();
  if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(clean)) {
    return clean.replace(/-/g, "/");
  }
  const d = dayjs(clean);
  return d.isValid() ? d.format("DD/MM/YYYY") : clean;
}

export default function MainContractDetailModal({
  open,
  onClose,
  contract,
}: MainContractDetailModalProps) {
  const { language } = useTranslation();
  const isEn = language === "en";

  if (!contract) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#008f89", fontWeight: 700, fontSize: 15 }}>
            {isEn ? "CLIENT CONTRACT DETAILS" : "I. THÔNG TIN HỢP ĐỒNG CHỦ ĐẦU TƯ"}
          </span>
          <Tag color="cyan" style={{ fontFamily: "monospace", fontWeight: 600 }}>
            {contract.ContractCode}
          </Tag>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose} style={{ height: 32, borderRadius: 6 }}>
          {isEn ? "Close" : "Đóng"}
        </Button>,
      ]}
      destroyOnClose
    >
      <div className="erp-general-info-card" style={{ marginTop: 12 }}>
        {/* Hàng 1 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 2fr 1.6fr 1fr",
            padding: "8px 6px",
          }}
        >
          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Contract Code" : "Số HĐ CĐT"}</span>
            <span className="erp-info-value mono" style={{ color: "#008f89", fontWeight: 600 }}>
              {contract.ContractCode || "-"}
            </span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Description" : "Tên / Diễn giải HĐ"}</span>
            <span className="erp-info-value" title={contract.Description}>
              {contract.Description || "-"}
            </span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Client / Company" : "Chủ đầu tư"}</span>
            <span className="erp-info-value" title={contract.CompanyName}>
              {contract.CompanyName || "-"}
            </span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Tax ID" : "Mã số thuế"}</span>
            <span className="erp-info-value mono">{contract.TaxID || "-"}</span>
          </div>
        </div>

        <div className="erp-info-divider" />

        {/* Hàng 2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
            padding: "8px 6px",
          }}
        >
          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Contract Date" : "Ngày ký"}</span>
            <span className="erp-info-value">{formatDate(contract.ContractDate)}</span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Start Date" : "Ngày bắt đầu"}</span>
            <span className="erp-info-value">{formatDate(contract.StartDate)}</span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "End Date" : "Ngày kết thúc"}</span>
            <span className="erp-info-value">{formatDate(contract.EndDate)}</span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Actual Start" : "Khởi công TT"}</span>
            <span className="erp-info-value">{formatDate(contract.ActualStart)}</span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Status" : "Trạng thái"}</span>
            <span className="erp-info-value">
              <Tag color={contract.StatusCode === 0 ? "orange" : "blue"}>
                {contract.StatusName || (contract.StatusCode === 0 ? "Đang lập" : "Hiệu lực")}
              </Tag>
            </span>
          </div>

          <div className="erp-info-cell" style={{ borderRight: "none" }}>
            <span className="erp-info-label">{isEn ? "Assignee" : "Người xử lý"}</span>
            <span className="erp-info-value">{contract.CurrentAssignee || contract.CreatedBy || "-"}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
