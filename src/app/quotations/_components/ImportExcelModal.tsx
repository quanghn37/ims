"use client";

import React from "react";
import { Modal, Button, Upload, Typography, Table, Space, Tag, Spin } from "antd";
import {
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  InfoCircleFilled,
  CloudUploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;
const { Dragger } = Upload;

export interface PreviewResult {
  cacheId?: string;
  canImport?: boolean;
  total?: number;
  validCount?: number;
  invalidCount?: number;
  data?: any[];
}

interface ImportExcelModalProps {
  open: boolean;
  onClose: () => void;
  selectedContractId?: any;
  importFileList: any[];
  setImportFileList: (list: any[]) => void;
  previewing: boolean;
  importing: boolean;
  onPreview: (file?: any) => void;
  onExecuteImport: () => void;
  previewResult: PreviewResult | null;
  onResetPreview: () => void;
}

export default function ImportExcelModal({
  open,
  onClose,
  selectedContractId,
  importFileList,
  setImportFileList,
  previewing,
  importing,
  onPreview,
  onExecuteImport,
  previewResult,
  onResetPreview,
}: ImportExcelModalProps) {
  const { t, language } = useTranslation();

  React.useEffect(() => {
    if (!open) {
      setImportFileList([]);
      onResetPreview();
    }
  }, [open]);

  const handleSelectFile = (file: any) => {
    setImportFileList([file]);
    onPreview(file);
  };

  const columns = [
    {
      title: t.table.stt,
      dataIndex: "LocalId",
      key: "LocalId",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <Text style={{ fontSize: 14, color: "#475569" }}>{index + 1}</Text>
      ),
    },
    {
      title: t.table.itemName,
      dataIndex: "ItemName",
      key: "ItemName",
      render: (itemName: string, record: any) => (
        <div style={{ padding: "2px 0" }}>
          <div style={{ fontWeight: 400, fontSize: 14, color: "#1e293b", lineHeight: 1.4 }}>
            {itemName || "—"}
          </div>
          {record.ItemCode && (
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2, fontWeight: 400 }}>
              {record.ItemCode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t.table.unit,
      dataIndex: "Unit",
      key: "Unit",
      width: 80,
      align: "center" as const,
      render: (val: string) => <Text style={{ fontSize: 14, color: "#334155" }}>{val || "—"}</Text>,
    },
    {
      title: t.table.qty,
      dataIndex: "Qnty",
      key: "Qnty",
      width: 100,
      align: "right" as const,
      render: (val: any) => <Text style={{ fontSize: 14, fontWeight: 400, color: "#334155" }}>{val ?? 0}</Text>,
    },
    {
      title: t.table.unitPrice,
      dataIndex: "UnitPrice",
      key: "UnitPrice",
      width: 130,
      align: "right" as const,
      render: (val: any) => (
        <Text style={{ fontSize: 14, fontWeight: 400, color: "#1e293b" }}>
          {val ? Number(val).toLocaleString(language === "en" ? "en-US" : "vi-VN") : "0"}
        </Text>
      ),
    },
    {
      title: t.table.status,
      dataIndex: "IsValid",
      key: "IsValid",
      width: 120,
      align: "center" as const,
      render: (isValid: boolean | number) => {
        const ok = isValid === true || isValid === 1;
        return ok ? (
          <span style={{ color: "#16a34a", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5 }}>
            <CheckCircleOutlined style={{ fontSize: 14 }} /> {language === "en" ? "Valid" : "Hợp lệ"}
          </span>
        ) : (
          <span style={{ color: "#dc2626", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5 }}>
            <CloseCircleOutlined style={{ fontSize: 14 }} /> {language === "en" ? "Error" : "Lỗi"}
          </span>
        );
      },
    },
    {
      title: language === "en" ? "Message" : "Thông báo",
      dataIndex: "Messenger",
      key: "Messenger",
      width: 220,
      ellipsis: true,
      render: (msg: string, record: any) => {
        const ok = record.IsValid === true || record.IsValid === 1;
        return (
          <Text style={{ fontSize: 13, color: ok ? "#64748b" : "#dc2626", fontWeight: ok ? 400 : 500 }}>
            {msg || "—"}
          </Text>
        );
      },
    },
  ];

  const hasFile = importFileList.length > 0;

  return (
    <Modal
      title={null}
      zIndex={1100}
      open={open}
      onCancel={onClose}
      width={1050}
      footer={null}
      destroyOnClose
    >
      <div style={{ padding: "8px 0 4px 0" }}>
        {/* DÒNG HƯỚNG DẪN */}
        <Text style={{ fontSize: 14, color: "#475569" }}>
          {language === "en"
            ? "Select or drag & drop an Excel file matching the template to import into Price List #"
            : "Chọn hoặc kéo thả file Excel chứa danh sách vật tư theo biểu mẫu để nạp vào Bảng giá #"}
          <strong style={{ color: "#7C3AED" }}>{selectedContractId}</strong>.
        </Text>

        {/* TRẠNG THÁI 1: CHƯA CÓ FILE (HIỂN THỊ KHUNG KÉO THẢ XL) */}
        {!hasFile && !previewing && (
          <div style={{ marginTop: 16 }}>
            <Dragger
              beforeUpload={(file) => {
                handleSelectFile(file);
                return false;
              }}
              showUploadList={false}
              maxCount={1}
              accept=".xlsx, .xls"
              style={{
                background: "#FAF5FF",
                border: "2px dashed #C4B5FD",
                borderRadius: 12,
                padding: "24px 16px",
                transition: "all 0.2s ease",
              }}
            >
              <p style={{ margin: 0, marginBottom: 8 }}>
                <CloudUploadOutlined style={{ fontSize: 44, color: "#7C3AED" }} />
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", margin: 0, marginBottom: 4 }}>
                {language === "en" ? "Drag & drop Excel file here, or " : "Kéo & thả file Excel vào đây, hoặc "}
                <span style={{ color: "#7C3AED", textDecoration: "underline" }}>
                  {language === "en" ? "Click to select file" : "Bấm để chọn file"}
                </span>
              </p>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                {language === "en"
                  ? "Supports Excel files (.xlsx, .xls) containing item data"
                  : "Hỗ trợ định dạng file Excel (.xlsx, .xls) chứa dữ liệu vật tư"}
              </p>
            </Dragger>
          </div>
        )}

        {/* TRẠNG THÁI 2: ĐÃ CHỌN FILE HOẶC ĐANG LOAD PREVIEW / ĐÃ CÓ KẾT QUẢ PREVIEW */}
        {(hasFile || previewing || previewResult) && (
          <div style={{ marginTop: 14 }}>
            {/* BAR TRÊN: FILE TAG + ĐỔI FILE + STATS BOX */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {hasFile && (
                <Tag
                  color="purple"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    padding: "0 12px",
                    borderRadius: 6,
                    height: 38,
                    margin: 0,
                    border: "1px solid #e9d5ff",
                    backgroundColor: "#faf5ff",
                    color: "#6b21a8",
                  }}
                >
                  <PaperClipOutlined />
                  <span>{importFileList[0].name || importFileList[0].fileName || "File Excel"}</span>
                  <DeleteOutlined
                    style={{ cursor: "pointer", marginLeft: 4, color: "#ff4d4f" }}
                    onClick={() => {
                      setImportFileList([]);
                      onResetPreview();
                    }}
                  />
                </Tag>
              )}

              <Upload
                beforeUpload={(file) => {
                  handleSelectFile(file);
                  return false;
                }}
                showUploadList={false}
                maxCount={1}
                accept=".xlsx, .xls"
              >
                <Button icon={<UploadOutlined />} style={{ borderRadius: 6, height: 38, fontSize: 13 }}>
                  {hasFile
                    ? (language === "en" ? "Change file" : "Đổi file khác")
                    : (language === "en" ? "Select Excel file" : "Chọn file Excel")}
                </Button>
              </Upload>

              {previewResult && !previewing && (
                <div
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 6,
                    backgroundColor: previewResult.canImport ? "#F5F3FF" : "#FEF2F2",
                    border: `1px solid ${previewResult.canImport ? "#DDD6FE" : "#FCA5A5"}`,
                    margin: 0,
                  }}
                >
                  <Space style={{ fontSize: 14 }}>
                    <InfoCircleFilled style={{ color: previewResult.canImport ? "#7C3AED" : "#dc2626", marginRight: 2 }} />
                    <span style={{ color: "#334155" }}>
                      {language === "en" ? "Total rows:" : "Tổng số dòng:"} <strong>{previewResult.total || 0}</strong>
                    </span>
                    <span style={{ color: "#cbd5e1" }}>|</span>
                    <span style={{ color: "#16a34a" }}>
                      {language === "en" ? "Valid:" : "Hợp lệ:"} <strong>{previewResult.validCount || 0}</strong>
                    </span>
                    <span style={{ color: "#cbd5e1" }}>|</span>
                    <span style={{ color: "#dc2626" }}>
                      {language === "en" ? "Error:" : "Lỗi:"} <strong>{previewResult.invalidCount || 0}</strong>
                    </span>
                  </Space>
                </div>
              )}
            </div>

            {/* SPIN LOADING KHI ĐANG CHECK FILE */}
            {previewing && (
              <div
                style={{
                  marginTop: 16,
                  padding: "40px 0",
                  textAlign: "center",
                  background: "#FAF5FF",
                  borderRadius: 8,
                  border: "1px dashed #DDD6FE",
                }}
              >
                <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: "#7C3AED" }} spin />} />
                <div style={{ marginTop: 12, fontSize: 14, color: "#7C3AED", fontWeight: 500 }}>
                  {language === "en" ? "Validating Excel file data..." : "Đang kiểm tra dữ liệu file Excel..."}
                </div>
              </div>
            )}

            {/* BẢNG PREVIEW DỮ LIỆU */}
            {!previewing && previewResult && (
              <div style={{ marginTop: 14 }}>
                <Table
                  dataSource={previewResult.data || []}
                  columns={columns}
                  rowKey={(rec) => rec.LocalId || rec.ItemCode || Math.random()}
                  size="middle"
                  pagination={{ pageSize: 6, showSizeChanger: false }}
                  scroll={{ y: 300 }}
                  rowClassName={(record) => {
                    const ok = record.IsValid === true || record.IsValid === 1;
                    return ok ? "" : "bg-red-50";
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* NÚT THAO TÁC FOOTER */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
          <Button onClick={onClose} style={{ borderRadius: 6, height: 38, padding: "0 20px" }}>
            {t.common.cancel}
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={onExecuteImport}
            loading={importing}
            disabled={!previewResult || !previewResult.canImport || previewing}
            style={{
              borderRadius: 6,
              height: 38,
              padding: "0 24px",
              backgroundColor: previewResult && previewResult.canImport && !previewing ? "#7C3AED" : undefined,
              borderColor: previewResult && previewResult.canImport && !previewing ? "#7C3AED" : undefined,
              fontWeight: 600,
            }}
          >
            {language === "en" ? "Confirm Import" : "Xác nhận Import"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

