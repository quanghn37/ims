"use client";

import React from "react";
import { Modal, Button, Space } from "antd";
import { IconEye } from "@tabler/icons-react";
import { PriceListItem, getCleanPriceListName } from "../types";
import { useTranslation } from "@/locales/LanguageContext";

interface PriceListDetailModalProps {
  priceList: PriceListItem | null;
  onClose: () => void;
}

export default function PriceListDetailModal({ priceList, onClose }: PriceListDetailModalProps) {
  const { t, language } = useTranslation();

  return (
    <Modal
      title={
        <Space>
          <IconEye size={18} strokeWidth={1.8} style={{ color: "#7C3AED" }} />
          <span>{language === "en" ? "Price List Details" : "Chi tiết Bảng giá"}</span>
        </Space>
      }
      open={Boolean(priceList)}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          style={{ background: "#7C3AED", borderColor: "#7C3AED", borderRadius: 6 }}
          onClick={onClose}
        >
          {t.common.close}
        </Button>,
      ]}
      width={580}
    >
      {priceList && (
        <div style={{ padding: "12px 0", fontSize: 13, lineHeight: 1.8, color: "#262626" }}>
          <div>
            <span>{language === "en" ? "Price List Code: " : "Mã bảng giá: "}</span>
            <strong>{priceList.code || "-"}</strong>
          </div>
          <div>
            <span>{language === "en" ? "Name / Description: " : "Tên / Diễn giải: "}</span>
            <span>
              {getCleanPriceListName(priceList.code, priceList.name) ||
                priceList.name ||
                "-"}
            </span>
          </div>
          {priceList.supplierName && (
            <div>
              <span>{language === "en" ? "Supplier / Vendor: " : "Đối tượng / Nhà cung cấp: "}</span>
              <span>{priceList.supplierName}</span>
            </div>
          )}
          {priceList.signDate && (
            <div>
              <span>{language === "en" ? "Date Signed / Created: " : "Ngày ký / Ngày lập: "}</span>
              <span>{priceList.signDate}</span>
            </div>
          )}
          {priceList.amount !== undefined && (
            <div>
              <span>{language === "en" ? "Total Value: " : "Giá trị: "}</span>
              <span>{Number(priceList.amount || 0).toLocaleString(language === "en" ? "en-US" : "vi-VN")} VND</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
