"use client";

import React from "react";
import { Modal, Button, Tag } from "antd";
import dayjs from "dayjs";
import { ProjectContractItem } from "../types";
import { useTranslation } from "@/locales/LanguageContext";

interface ProjectContractDetailModalProps {
  open: boolean;
  onClose: () => void;
  contract: ProjectContractItem | null;
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

export default function ProjectContractDetailModal({
  open,
  onClose,
  contract,
}: ProjectContractDetailModalProps) {
  const { language } = useTranslation();
  const isEn = language === "en";

  if (!contract) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={960}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#008f89", fontWeight: 700, fontSize: 15 }}>
            {isEn ? "PROJECT SUBCONTRACT DETAILS" : "I. THÔNG TIN HỢP ĐỒNG DỰ ÁN"}
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
            gridTemplateColumns: "1.4fr 2fr 1.8fr 1.4fr 1.2fr",
            padding: "8px 6px",
          }}
        >
          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Subcontract Code" : "Số HĐ Dự án"}</span>
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
            <span className="erp-info-label">{isEn ? "Subcontractor / Vendor" : "Nhà thầu / Đối tác"}</span>
            <span className="erp-info-value" title={contract.Venname}>
              {contract.Venname || "-"}
            </span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Main Contract Code" : "Số HĐ CĐT"}</span>
            <span className="erp-info-value mono">{contract.MainCode || "-"}</span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Amount" : "Giá trị HĐ"}</span>
            <span className="erp-info-value mono" style={{ fontWeight: 600 }}>
              {contract.ContractedAmount != null
                ? Number(contract.ContractedAmount).toLocaleString("vi-VN")
                : "-"}
            </span>
          </div>
        </div>

        <div className="erp-info-divider" />

        {/* Hàng 2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 1.1fr 1.1fr 1.1fr 1.2fr 1.3fr 1.1fr",
            padding: "8px 6px",
          }}
        >
          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Type" : "Loại"}</span>
            <span className="erp-info-value">{contract.S_Type || "-"}</span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Signed Date" : "Ngày ký HĐ"}</span>
            <span className="erp-info-value">{formatDate(contract.Contractdate)}</span>
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
            <span className="erp-info-label">{isEn ? "Status" : "Trạng thái"}</span>
            <span className="erp-info-value" style={{ color: "#008f89", fontWeight: 600 }}>
              {contract.StatusName || (contract.StatusCode === 1 ? "Chờ duyệt" : "Đang lập")}
            </span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Assignee" : "Người xử lý"}</span>
            <span className="erp-info-value">{contract.CurrentAssignee || "-"}</span>
          </div>

          <div className="erp-info-cell">
            <span className="erp-info-label">{isEn ? "Created By" : "Người tạo"}</span>
            <span className="erp-info-value">{contract.CreatedBy || "-"}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
