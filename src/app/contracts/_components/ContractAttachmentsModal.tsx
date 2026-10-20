"use client";

import React from "react";
import {
  Button,
  Upload,
  Tooltip,
  Popconfirm,
  Space,
  Typography,
  Checkbox,
  Modal,
  Table,
} from "antd";
import {
  IconPaperclip,
  IconUpload,
  IconTrash,
  IconDownload,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeDoc,
  IconFile,
  IconShieldCheck,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import { AttachmentFile } from "../types";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <IconFileTypePdf size={18} strokeWidth={1.8} style={{ color: "#EF4444" }} />;
  if (["xls", "xlsx", "csv"].includes(ext || "")) return <IconFileTypeXls size={18} strokeWidth={1.8} style={{ color: "#10B981" }} />;
  if (["doc", "docx"].includes(ext || "")) return <IconFileTypeDoc size={18} strokeWidth={1.8} style={{ color: "#2563EB" }} />;
  return <IconFile size={18} strokeWidth={1.8} style={{ color: "#64748B" }} />;
}

function renderSignStatus(record: AttachmentFile, language: string) {
  if (record.hasSign) {
    return (
      <a href={record.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#2563EB", fontSize: 13, display: "inline-flex", alignItems: "center" }}>
        <IconShieldCheck size={16} strokeWidth={1.8} style={{ marginRight: 4, color: "#10B981" }} />
        <span>{language === "en" ? "Signed" : "Đã ký"}</span>
      </a>
    );
  }
  return <Text type="secondary" style={{ fontSize: 12 }}>{language === "en" ? "Unsigned" : "Chưa ký"}</Text>;
}

interface ContractAttachmentsModalProps {
  open: boolean;
  onCancel: () => void;
  attachments: AttachmentFile[];
  selectedAttachmentKeys: React.Key[];
  setSelectedAttachmentKeys: (keys: React.Key[]) => void;
  onUploadAttachment: (options: any) => void;
  onDeleteAttachment: (id: string) => void;
  onBatchDeleteAttachments: () => void;
  onToggleClientDoc: (id: string, checked: boolean) => void;
}

export default function ContractAttachmentsModal({
  open,
  onCancel,
  attachments,
  selectedAttachmentKeys,
  setSelectedAttachmentKeys,
  onUploadAttachment,
  onDeleteAttachment,
  onBatchDeleteAttachments,
  onToggleClientDoc,
}: ContractAttachmentsModalProps) {
  const { t, language } = useTranslation();

  return (
    <Modal
      title={
        <Space>
          <IconPaperclip size={18} strokeWidth={1.8} style={{ color: "#7C3AED" }} />
          <Text strong style={{ fontSize: 16 }}>
            {language === "en" ? "Contract Attachments" : "Danh sách tệp đính kèm"} ({attachments.length})
          </Text>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={920}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
          <Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
            {language === "en"
              ? `Selected: ${selectedAttachmentKeys.length} / ${attachments.length} files`
              : `Đã chọn: ${selectedAttachmentKeys.length} / ${attachments.length} tệp`}
          </Text>

          {selectedAttachmentKeys.length > 0 && (
            <Popconfirm
              title={
                language === "en"
                  ? `Are you sure you want to delete ${selectedAttachmentKeys.length} selected files?`
                  : `Bạn có chắc chắn muốn xóa ${selectedAttachmentKeys.length} tệp đã chọn?`
              }
              onConfirm={onBatchDeleteAttachments}
              okText={t.common.delete}
              cancelText={t.common.cancel}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<IconTrash size={16} strokeWidth={1.8} />}>
                {language === "en"
                  ? `Delete selected (${selectedAttachmentKeys.length})`
                  : `Xóa các tệp đã chọn (${selectedAttachmentKeys.length})`}
              </Button>
            </Popconfirm>
          )}

          <Upload customRequest={onUploadAttachment} showUploadList={false}>
            <Button icon={<IconUpload size={16} strokeWidth={1.8} />} type="primary" style={{ background: "#10B981", borderColor: "#10B981" }}>
              {language === "en" ? "Upload File" : "Tải tệp lên"}
            </Button>
          </Upload>

          <Button type="primary" onClick={onCancel} style={{ background: "#7C3AED", borderColor: "#7C3AED" }}>
            {t.common.close}
          </Button>
        </div>
      }
    >
      <div style={{ padding: "8px 0" }}>
        <Table
          size="small"
          dataSource={attachments}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          rowSelection={{
            selectedRowKeys: selectedAttachmentKeys,
            onChange: (keys) => setSelectedAttachmentKeys(keys),
          }}
          columns={[
            {
              title: language === "en" ? "File Name" : "Tên tệp đính kèm",
              dataIndex: "fileName",
              key: "fileName",
              render: (text, record) => (
                <Space>
                  {getFileIcon(text)}
                  <a href={record.fileUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 500 }}>
                    {text}
                  </a>
                </Space>
              ),
            },
            {
              title: language === "en" ? "Sign Status" : "Trạng thái ký",
              key: "hasSign",
              width: 120,
              align: "center",
              render: (_, record) => renderSignStatus(record, language),
            },
            {
              title: language === "en" ? "Client Doc" : "Văn bản CĐT",
              key: "isClientDoc",
              width: 110,
              align: "center",
              render: (_, record) => (
                <Checkbox
                  checked={record.isClientDoc}
                  onChange={(e) => onToggleClientDoc(record.id, e.target.checked)}
                />
              ),
            },
            {
              title: language === "en" ? "Uploaded By" : "Người tải",
              dataIndex: "uploadedBy",
              key: "uploadedBy",
              width: 120,
            },
            {
              title: language === "en" ? "Uploaded Date" : "Ngày tải",
              dataIndex: "uploadingDate",
              key: "uploadingDate",
              width: 140,
            },
            {
              title: t.common.actions,
              key: "action",
              width: 90,
              align: "center",
              render: (_, record) => (
                <Space size={6}>
                  <a
                    href={record.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", textDecoration: "none" }}
                  >
                    <ActionIconButton
                      action="export"
                      tooltip={language === "en" ? "Download" : "Tải xuống"}
                      size="small"
                    />
                  </a>
                  <Popconfirm
                    title={language === "en" ? "Are you sure you want to delete this file?" : "Bạn muốn xóa tệp này?"}
                    onConfirm={() => onDeleteAttachment(record.id)}
                    okText={t.common.delete}
                    cancelText={t.common.cancel}
                    okButtonProps={{ danger: true }}
                  >
                    <ActionIconButton
                      action="delete"
                      tooltip={t.common.delete}
                      size="small"
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
}
