"use client";

import React from "react";
import ErpAttachmentsModal, { AttachmentFolderKey } from "@/components/common/ErpAttachmentsModal";
import { AttachmentFile } from "./types";
import { useTranslation } from "@/locales/LanguageContext";

export interface OrderAttachmentsModalProps {
  open: boolean;
  onClose: () => void;
  attachments: AttachmentFile[];
  onUploadAttachment: (options: any, folder?: AttachmentFolderKey) => void;
  onDeleteAttachment: (id: string) => void;
  onToggleClientDoc?: (id: string, val: boolean) => void;
}

export default function OrderAttachmentsModal({
  open,
  onClose,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
}: OrderAttachmentsModalProps) {
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
