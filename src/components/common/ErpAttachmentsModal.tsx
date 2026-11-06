"use client";

import React, { useState, useMemo } from "react";
import {
  Modal,
  Button,
  Upload,
  Popconfirm,
  Space,
  Typography,
  Table,
  Input,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconPaperclip,
  IconUpload,
  IconShieldCheck,
  IconSearch,
  IconFolder,
  IconFiles,
  IconSignature,
  IconCertificate,
} from "@tabler/icons-react";
import ActionIconButton from "@/components/common/ActionIconButton";
import { useTranslation } from "@/locales/LanguageContext";

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadingDate: string;
  isClientDoc?: boolean;
  hasSign?: boolean;
  folder?: "project_docs" | "signing_docs" | "signed_docs" | string;
  fileSize?: string;
  [key: string]: any;
}

const { Text } = Typography;

export type AttachmentFolderKey = "all" | "project_docs" | "signing_docs" | "signed_docs" | string;

export interface ErpAttachmentsModalProps {
  open: boolean;
  onCancel: () => void;
  title?: string;
  attachments?: AttachmentFile[];
  onUploadAttachment?: (options: any, folder: AttachmentFolderKey) => void;
  onDeleteAttachment?: (id: string) => void;
  maxSizeMB?: number;
}

export default function ErpAttachmentsModal({
  open,
  onCancel,
  title,
  attachments = [],
  onUploadAttachment,
  onDeleteAttachment,
  maxSizeMB = 50,
}: ErpAttachmentsModalProps) {
  const { t, language } = useTranslation();

  // Quản lý thư mục đang chọn (Mảng 1) - Mặc định "all" (Tất cả)
  const [selectedFolder, setSelectedFolder] = useState<AttachmentFolderKey>("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Danh mục thư mục chuẩn gồm "Tất cả" và 3 thư mục phân loại nghiệp vụ
  const folders = useMemo(
    () => [
      {
        key: "all",
        name: language === "en" ? "All" : "Tất cả",
        icon: <IconFiles size={17} strokeWidth={1.8} />,
      },
      {
        key: "project_docs",
        name: language === "en" ? "Project Documents" : "Tài liệu dự án",
        icon: <IconFolder size={17} strokeWidth={1.8} />,
      },
      {
        key: "signing_docs",
        name: language === "en" ? "Digital Signing Documents" : "Tài liệu ký số",
        icon: <IconSignature size={17} strokeWidth={1.8} />,
      },
      {
        key: "signed_docs",
        name: language === "en" ? "Digitally Signed Documents" : "Tài liệu đã ký số",
        icon: <IconCertificate size={17} strokeWidth={1.8} />,
      },
    ],
    [language]
  );

  // Đếm số lượng file theo từng thư mục (bao gồm "all" tổng hợp tất cả)
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: attachments.length,
      project_docs: 0,
      signing_docs: 0,
      signed_docs: 0,
    };
    attachments.forEach((item) => {
      let fKey = item.folder;
      if (!fKey) {
        fKey = item.hasSign ? "signed_docs" : "project_docs";
      }
      if (counts[fKey] !== undefined) {
        counts[fKey] += 1;
      } else {
        counts.project_docs += 1;
      }
    });
    return counts;
  }, [attachments]);

  // Lọc danh sách file theo thư mục đang chọn & từ khóa tìm kiếm
  const filteredAttachments = useMemo(() => {
    return attachments.filter((item) => {
      let fKey = item.folder;
      if (!fKey) {
        fKey = item.hasSign ? "signed_docs" : "project_docs";
      }
      if (selectedFolder !== "all" && fKey !== selectedFolder) {
        return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        return item.fileName.toLowerCase().includes(kw);
      }
      return true;
    });
  }, [attachments, selectedFolder, searchKeyword]);

  // Tên thư mục hiện tại để hiển thị tiêu đề Mảng 2
  const currentFolderName = useMemo(() => {
    const found = folders.find((f) => f.key === selectedFolder);
    return found ? found.name : language === "en" ? "All Documents" : "Tất cả";
  }, [folders, selectedFolder, language]);

  // Cấu hình các cột bảng Mảng 2 (Đã bỏ Văn bản CĐT, bỏ icon trước file name, tối ưu độ rộng không bị tràn)
  const columns: ColumnsType<AttachmentFile> = [
    {
      title: language === "en" ? "File Name" : "Tên tệp tin",
      dataIndex: "fileName",
      key: "fileName",
      ellipsis: true,
      render: (text: string, record: AttachmentFile) => (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <a
            href={record.fileUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#1e293b",
              fontWeight: 500,
              fontSize: 12.5,
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#008f89")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#1e293b")}
            title={text}
          >
            {text}
          </a>
          {record.fileSize && (
            <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{record.fileSize}</span>
          )}
        </div>
      ),
    },
    {
      title: (
        <span style={{ whiteSpace: "nowrap" }}>
          {language === "en" ? "Sign Status" : "Trạng thái ký"}
        </span>
      ),
      key: "hasSign",
      width: 110,
      align: "center",
      render: (_, record) => {
        if (record.hasSign) {
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                whiteSpace: "nowrap",
              }}
            >
              <IconShieldCheck size={14} strokeWidth={2} />
              <span>{language === "en" ? "Signed" : "Đã ký"}</span>
            </span>
          );
        }
        return (
          <span style={{ color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
            {language === "en" ? "Unsigned" : "Chưa ký"}
          </span>
        );
      },
    },
    {
      title: (
        <span style={{ whiteSpace: "nowrap" }}>
          {language === "en" ? "Uploaded By" : "Người tải"}
        </span>
      ),
      dataIndex: "uploadedBy",
      key: "uploadedBy",
      width: 130,
      ellipsis: true,
      render: (val) => (
        <span style={{ color: "#475569", fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap" }}>
          {val}
        </span>
      ),
    },
    {
      title: (
        <span style={{ whiteSpace: "nowrap" }}>
          {language === "en" ? "Uploaded Date" : "Ngày tải"}
        </span>
      ),
      dataIndex: "uploadingDate",
      key: "uploadingDate",
      width: 125,
      align: "center",
      render: (val) => (
        <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
          {val}
        </span>
      ),
    },
    {
      title: (
        <span style={{ whiteSpace: "nowrap" }}>
          {language === "en" ? "Action" : "Thao tác"}
        </span>
      ),
      key: "action",
      width: 95,
      align: "center",
      onCell: () => ({ style: { padding: "4px 4px", whiteSpace: "nowrap", overflow: "visible" } }),
      render: (_, record) => (
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" }}>
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
            onConfirm={() => onDeleteAttachment?.(record.id)}
            okText={t.common.delete}
            cancelText={t.common.cancel}
            okButtonProps={{ danger: true }}
          >
            <ActionIconButton action="delete" tooltip={t.common.delete} size="small" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space size={8}>
          <IconPaperclip size={18} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <Text strong style={{ fontSize: 15, color: "#123443" }}>
            {title || (language === "en" ? "Attachments" : "Tệp đính kèm")}
          </Text>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={1280}
      centered
      wrapStyle={{ paddingLeft: 60, boxSizing: "border-box" }}
      style={{ maxWidth: "calc(100vw - 100px)" }}
      styles={{
        body: { padding: "0" },
      }}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          {/* Ghi chú dung lượng tối đa ở bên trái */}
          <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>
            {language === "en"
              ? `* Max ${maxSizeMB}MB/file`
              : `* Hỗ trợ tối đa ${maxSizeMB}MB/tệp`}
          </span>

          {/* Dãy nút tác vụ ở bên phải: Tải tệp lên & Đóng (Đã bỏ Đã chọn và Xóa hàng loạt) */}
          <Space size={8}>
            <Upload
              beforeUpload={(file) => {
                const isLtMax = file.size / 1024 / 1024 <= maxSizeMB;
                if (!isLtMax) {
                  message.error(
                    language === "en"
                      ? `File must be smaller than ${maxSizeMB}MB!`
                      : `Kích thước tệp không được vượt quá ${maxSizeMB}MB!`
                  );
                  return Upload.LIST_IGNORE;
                }
                return true;
              }}
              customRequest={(options) => {
                const targetFolder = selectedFolder === "all" ? "project_docs" : selectedFolder;
                onUploadAttachment?.(options, targetFolder);
              }}
              showUploadList={false}
            >
              <Button
                icon={<IconUpload size={15} strokeWidth={1.8} />}
                type="primary"
                style={{
                  background: "#10B981",
                  borderColor: "#10B981",
                  borderRadius: 6,
                  height: 32,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {language === "en" ? "Upload File" : "Tải tệp lên"}
              </Button>
            </Upload>

            <Button
              onClick={onCancel}
              style={{
                borderRadius: 6,
                height: 32,
                fontSize: 13,
                borderColor: "#dce5e6",
                color: "#334155",
              }}
            >
              {t.common.close}
            </Button>
          </Space>
        </div>
      }
    >
      {/* KHUNG CHIA 2 MẢNG (GRID 2 CỘT) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          minHeight: 480,
          overflow: "hidden",
        }}
      >
        {/* ======================================================== */}
        {/* MẢNG 1: THƯ MỤC (CỘT TRÁI) */}
        {/* ======================================================== */}
        <div
          style={{
            background: "#f8fafc",
            borderRight: "1px solid #e2e8f0",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Header Mảng 1: Thư mục */}
          <div style={{ display: "flex", alignItems: "center", paddingLeft: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#008f89",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <IconFolder size={15} />
              <span>{language === "en" ? "Folders" : "Thư mục"}</span>
            </span>
          </div>

          {/* Danh sách 4 mục (Tất cả + 3 thư mục phân loại) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {folders.map((f) => {
              const isActive = selectedFolder === f.key;
              const count = folderCounts[f.key] || 0;
              return (
                <div
                  key={f.key}
                  onClick={() => {
                    setSelectedFolder(f.key);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background: isActive ? "#e6f7f6" : "#FFFFFF",
                    border: `1px solid ${isActive ? "#008f89" : "#e2e8f0"}`,
                    color: isActive ? "#008f89" : "#334155",
                    fontWeight: isActive ? 700 : 500,
                    boxShadow: isActive ? "0 1px 3px rgba(0, 143, 137, 0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <Space size={8}>
                    <span style={{ color: isActive ? "#008f89" : "#64748b", display: "flex" }}>
                      {f.icon}
                    </span>
                    <span style={{ fontSize: 12.5 }}>{f.name}</span>
                  </Space>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 12,
                      background: isActive ? "#FFFFFF" : "#f1f5f9",
                      color: isActive ? "#008f89" : "#64748b",
                      border: `1px solid ${isActive ? "#b2e8e4" : "#e2e8f0"}`,
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MẢNG 2: FILE ĐÍNH KÈM (CỘT PHẢI) */}
        {/* ======================================================== */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div>
            {/* Header Mảng 2: Tên thư mục & Ô tìm kiếm */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 10,
                borderBottom: "1px solid #f1f5f9",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#008f89",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#008f89",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentFolderName}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                  ({filteredAttachments.length} {language === "en" ? "files" : "tệp"})
                </span>
              </div>

              {/* Ô tìm kiếm nhanh file */}
              <Input
                placeholder={language === "en" ? "Search file..." : "Tìm kiếm tệp trong thư mục..."}
                prefix={<IconSearch size={14} style={{ color: "#94a3b8" }} />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 220, borderRadius: 6, fontSize: 12 }}
                size="small"
                allowClear
              />
            </div>

            {/* Bảng danh sách file đính kèm (Bỏ số trang, thêm scroll dọc và scroll ngang) */}
            <Table<AttachmentFile>
              size="small"
              dataSource={filteredAttachments}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800, y: 400 }}
              columns={columns}
              locale={{
                emptyText: (
                  <div style={{ padding: "48px 0", color: "#94a3b8", fontSize: 12 }}>
                    {language === "en" ? "No files in this folder" : "Không có tệp nào trong thư mục này"}
                  </div>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
