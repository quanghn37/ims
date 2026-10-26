"use client";

import React from "react";
import { Modal, Button, Upload, Typography } from "antd";
import { UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

interface ImportExcelModalProps {
  open: boolean;
  onClose: () => void;
  selectedOrderId?: any;
  importFileList: any[];
  setImportFileList: (list: any[]) => void;
  importing: boolean;
  onImport: () => void;
}

export default function ImportExcelModal({
  open,
  onClose,
  selectedOrderId,
  importFileList,
  setImportFileList,
  importing,
  onImport,
}: ImportExcelModalProps) {
  const { t, language } = useTranslation();

  return (
    <Modal
      title={language === "en" ? "Import Items from Excel File" : "Nhập dữ liệu mặt hàng từ File Excel"}
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <div style={{ padding: "12px 0" }}>
        <Text>
          {language === "en"
            ? `Select an Excel file containing items according to the template to import into PO #${selectedOrderId}.`
            : `Chọn file Excel chứa danh sách mặt hàng theo biểu mẫu để cập nhật tự động vào Đơn hàng PO #${selectedOrderId}.`}
        </Text>

        <div style={{ margin: "20px 0" }}>
          <Upload
            beforeUpload={(file) => {
              setImportFileList([file]);
              return false;
            }}
            fileList={importFileList}
            onRemove={() => setImportFileList([])}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>
              {language === "en" ? "Select Excel file (.xlsx, .xls)" : "Chọn file Excel (.xlsx, .xls)"}
            </Button>
          </Upload>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            style={{ background: "#008f89", borderColor: "#008f89" }}
            onClick={onImport}
            loading={importing}
            disabled={importFileList.length === 0}
          >
            {language === "en" ? "Proceed with Import" : "Tiến hành Import"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
