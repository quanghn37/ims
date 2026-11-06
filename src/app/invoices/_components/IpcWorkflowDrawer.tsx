"use client";

import React from "react";
import { Drawer } from "antd";
import { IconGitBranch } from "@tabler/icons-react";
import WorkflowRaciTable from "@/components/common/WorkflowRaciTable";
import { useTranslation } from "@/locales/LanguageContext";
import { IpcRecord } from "../types";

interface IpcWorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  ipc: IpcRecord | null;
}

export default function IpcWorkflowDrawer({
  open,
  onClose,
  ipc,
}: IpcWorkflowDrawerProps) {
  const { t, language } = useTranslation();

  if (!ipc) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconGitBranch size={18} style={{ color: "#008f89" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#123443" }}>
            {language === "en" ? "IPC Approval Workflow" : "Quy trình phê duyệt IPC"}
          </span>
          <span style={{ fontSize: 12, color: "#008f89", fontFamily: "monospace", fontWeight: 600 }}>
            #{ipc.IpcId}
          </span>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #dce5e6",
            background: "#fafcfb",
            fontSize: 12,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>{t("invoices.drawer.contract")}:</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{ipc.ContractCode}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>{t("invoices.drawer.vendor")}:</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{ipc.VendorName}</span>
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#008f89",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {language === "en" ? "RACI Approval Steps" : "Các bước phê duyệt RACI"}
          </div>
          <WorkflowRaciTable
            dataSource={
              ipc.RaciSteps || [
                {
                  StepNumber: 1,
                  Role: "R",
                  AssigneeName: "Nguyễn Văn Bổn",
                  Decision: language === "en" ? "Accepted" : "Chấp thuận",
                  StatusCode: 1,
                  Notes: "Đạt yêu cầu hồ sơ thanh toán",
                  UpdatedDate: "2026-10-30 14:20",
                },
                {
                  StepNumber: 2,
                  Role: "C",
                  AssigneeName: "Nguyen Van C",
                  Decision: language === "en" ? "Not Started" : "Chưa làm",
                  StatusCode: 0,
                  Notes: "",
                  UpdatedDate: "",
                },
                {
                  StepNumber: 3,
                  Role: "A",
                  AssigneeName: "Nguyen Van A",
                  Decision: language === "en" ? "Not Started" : "Chưa làm",
                  StatusCode: 0,
                  Notes: "",
                  UpdatedDate: "",
                },
                {
                  StepNumber: 4,
                  Role: "I",
                  AssigneeName: "Ban Giám Đốc",
                  Decision: language === "en" ? "Not Started" : "Chưa làm",
                  StatusCode: 0,
                  Notes: "",
                  UpdatedDate: "",
                },
              ]
            }
          />
        </div>
      </div>
    </Drawer>
  );
}
