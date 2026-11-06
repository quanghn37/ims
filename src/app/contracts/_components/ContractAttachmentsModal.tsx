"use client";

import React from "react";
import ErpAttachmentsModal, { AttachmentFolderKey } from "@/components/common/ErpAttachmentsModal";
import { AttachmentFile } from "../types";

export interface ContractAttachmentsModalProps {
  open: boolean;
  onCancel: () => void;
  title?: string;
  attachments: AttachmentFile[];
  onUploadAttachment: (options: any, folder?: AttachmentFolderKey) => void;
  onDeleteAttachment: (id: string) => void;
  onToggleClientDoc?: (id: string, checked: boolean) => void;
}

export default function ContractAttachmentsModal({
  open,
  onCancel,
  title,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
}: ContractAttachmentsModalProps) {
  return (
    <ErpAttachmentsModal
      open={open}
      onCancel={onCancel}
      title={title}
      attachments={attachments}
      onUploadAttachment={onUploadAttachment}
      onDeleteAttachment={onDeleteAttachment}
      maxSizeMB={50}
    />
  );
}
