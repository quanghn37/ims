"use client";

import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Upload,
  Popconfirm,
  Empty,
  Tooltip,
  Switch,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileOutlined,
  SafetyCertificateOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { AttachmentFile } from "./types";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
  if (["xls", "xlsx", "csv"].includes(ext || ""))
    return <FileExcelOutlined style={{ color: "#52c41a" }} />;
  if (["doc", "docx"].includes(ext || ""))
    return <FileWordOutlined style={{ color: "#1677ff" }} />;
  return <FileOutlined style={{ color: "#8c8c8c" }} />;
}

function renderSignStatus(record: AttachmentFile) {
  if (record.hasSign) {
    return (
      <a
        href={record.fileUrl}
        target="_blank"
        rel="noreferrer"
        style={{ color: "#008f89", fontSize: 13 }}
      >
        <SafetyCertificateOutlined style={{ marginRight: 4 }} />
        View
      </a>
    );
  }
  return (
    <Text type="secondary" style={{ fontSize: 12 }}>
      ---
    </Text>
  );
}

interface QuotationAttachmentsModalProps {
  open: boolean;
  onClose: () => void;
  isReadOnly: boolean;
  attachments: AttachmentFile[];
  selectedAttachmentKeys: React.Key[];
  onUploadAttachment: (options: any) => void;
  onDeleteAttachment: (id: string) => void;
  onBatchDeleteAttachments: () => void;
  onToggleClientDoc: (id: string, checked: boolean) => void;
}

export default function QuotationAttachmentsModal({
  open,
  onClose,
  isReadOnly,
  attachments,
  selectedAttachmentKeys,
  onUploadAttachment,
  onDeleteAttachment,
  onBatchDeleteAttachments,
  onToggleClientDoc,
}: QuotationAttachmentsModalProps) {
  const { t, language } = useTranslation();

  return (
    <Modal
      title={
        <Space>
          <PaperClipOutlined style={{ color: "#008f89" }} />
          <span>
            {language === "en" ? "Price List Attachments" : "Tệp đính kèm Bảng giá"} ({attachments.length})
          </span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          style={{
            background: "#008f89",
            borderColor: "#008f89",
            borderRadius: 8,
          }}
          onClick={onClose}
        >
          {t.common.close}
        </Button>,
      ]}
      width={740}
      destroyOnClose
    >
      {!isReadOnly && (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            background: "#eef8f6",
            borderRadius: 8,
            border: "1px solid #b2ded9",
          }}
        >
          <Text type="secondary" style={{ fontSize: 13, color: "#718894" }}>
            {language === "en"
              ? "Upload and manage attached documents, quotation sheets."
              : "Tải lên và quản lý hồ sơ, tài liệu, bảng chào giá đính kèm."}
          </Text>
          <Upload customRequest={onUploadAttachment} showUploadList={false} multiple>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              style={{
                background: "#008f89",
                borderColor: "#008f89",
                borderRadius: 8,
              }}
            >
              {language === "en" ? "Upload File" : "Tải file lên"}
            </Button>
          </Upload>
        </div>
      )}

      {!isReadOnly && selectedAttachmentKeys.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Popconfirm
            title={
              language === "en"
                ? `Delete ${selectedAttachmentKeys.length} selected files?`
                : `Xóa ${selectedAttachmentKeys.length} tệp đã chọn?`
            }
            onConfirm={onBatchDeleteAttachments}
            okText={t.common.delete}
            cancelText={t.common.cancel}
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              {language === "en" ? "Delete selected" : "Xóa mục chọn"} ({selectedAttachmentKeys.length})
            </Button>
          </Popconfirm>
        </div>
      )}

      {attachments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Empty
            description={language === "en" ? "No attachments yet" : "Chưa có tệp đính kèm nào"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {attachments.map((file) => (
            <div
              key={file.id}
              style={{
                background: "#f7fbfa",
                border: "1px solid #dce5e6",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Space size={8} style={{ flex: 1, minWidth: 0 }}>
                  {getFileIcon(file.fileName)}
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#008f89",
                      wordBreak: "break-all",
                    }}
                  >
                    {file.fileName}
                  </a>
                </Space>
                <Space size={4}>
                  <a
                    href={file.fileUrl}
                    download={file.fileName}
                    title={language === "en" ? "Download" : "Tải về"}
                    style={{ color: "#718894" }}
                  >
                    <Button type="text" size="small" icon={<DownloadOutlined />} />
                  </a>
                  {!isReadOnly && (
                    <Popconfirm
                      title={language === "en" ? "Delete this file?" : "Xóa tệp này?"}
                      okText={t.common.delete}
                      cancelText={t.common.cancel}
                      okButtonProps={{ danger: true }}
                      onConfirm={() => onDeleteAttachment(file.id)}
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  )}
                </Space>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                  fontSize: 11,
                  color: "#8c8c8c",
                }}
              >
                <span>
                  {file.uploadedBy || "---"} • {file.uploadingDate}
                </span>
                <Space size={8}>
                  {renderSignStatus(file)}
                  <Tooltip
                    title={
                      file.isClientDoc
                        ? (language === "en" ? "Visible to partner" : "Hiển thị cho đối tác")
                        : (language === "en" ? "Internal only" : "Chỉ dùng nội bộ")
                    }
                  >
                    <span style={{ fontSize: 11 }}>Client Doc:</span>
                    <Switch
                      size="small"
                      disabled={isReadOnly}
                      checked={file.isClientDoc}
                      onChange={(val) => onToggleClientDoc(file.id, val)}
                    />
                  </Tooltip>
                </Space>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
