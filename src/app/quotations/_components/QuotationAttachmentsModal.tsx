"use client";

import React from "react";
import ErpAttachmentsModal, { AttachmentFolderKey } from "@/components/common/ErpAttachmentsModal";
import { AttachmentFile } from "./types";
import { useTranslation } from "@/locales/LanguageContext";

export interface QuotationAttachmentsModalProps {
  open: boolean;
  onClose: () => void;
  isReadOnly?: boolean;
  attachments: AttachmentFile[];
  onUploadAttachment: (options: any, folder?: AttachmentFolderKey) => void;
  onDeleteAttachment: (id: string) => void;
  onToggleClientDoc?: (id: string, checked: boolean) => void;
}

export default function QuotationAttachmentsModal({
  open,
  onClose,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
}: QuotationAttachmentsModalProps) {
  const { language } = useTranslation();

  return (
    <ErpAttachmentsModal
      open={open}
      onCancel={onClose}
      title={language === "en" ? "Attachments" : "Tệp đính kèm"}
      attachments={attachments}
      onUploadAttachment={(opts, folder) => onUploadAttachment(opts, folder)}
      onDeleteAttachment={onDeleteAttachment}
      maxSizeMB={50}
    />
  );
}
