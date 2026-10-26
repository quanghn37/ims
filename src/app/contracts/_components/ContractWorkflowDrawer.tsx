"use client";

import React, { useState } from "react";
import { Drawer, message } from "antd";
import { IconGitBranch } from "@tabler/icons-react";
import { useTranslation } from "@/locales/LanguageContext";
import { extractApiList } from "@/lib/api-client";
import { contractsApi } from "../api";
import ContractWorkflowRowDetailDrawer from "./ContractWorkflowRowDetailDrawer";
import WorkflowRaciTable from "@/components/common/WorkflowRaciTable";

interface ContractWorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  contract: any | null;
  workflowData: any[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ContractWorkflowDrawer({
  open,
  onClose,
  contract,
  workflowData,
  loading,
  onRefresh,
}: ContractWorkflowDrawerProps) {
  const { t, language } = useTranslation();

  const [selectedWorkflowRow, setSelectedWorkflowRow] = useState<any>(null);
  const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);
  const [processingStatusList, setProcessingStatusList] = useState<any[]>([]);
  const [loadingProcessingStatus, setLoadingProcessingStatus] = useState(false);
  const [rowDetailDecision, setRowDetailDecision] = useState<string>("");
  const [rowDetailRemarks, setRowDetailRemarks] = useState<string>("");
  const [savingRowDetail, setSavingRowDetail] = useState(false);

  const handleOpenRowDetail = async (record: any) => {
    setSelectedWorkflowRow(record);
    setRowDetailDecision(record.ApprovalDecision || record.ApprovalStatus || (language === "en" ? "Approved" : "Duyệt"));
    setRowDetailRemarks(record.Remarks || "");
    setIsRowDetailOpen(true);
    setLoadingProcessingStatus(true);
    try {
      const data = await contractsApi.getProcessingStatuses({
        DisplayMode: "approval_no_all",
        Role: record.Role || "A",
      });
      setProcessingStatusList(extractApiList(data));
    } catch {
      setProcessingStatusList([]);
    } finally {
      setLoadingProcessingStatus(false);
    }
  };

  const handleSaveRowDetail = async () => {
    if (!selectedWorkflowRow) return;
    const assignmentId = selectedWorkflowRow.AssignmentId ?? selectedWorkflowRow.LocalId;
    if (!assignmentId) {
      message.warning(
        language === "en"
          ? "This row does not have an AssignmentId to update!"
          : "Dòng này không có AssignmentId để cập nhật!"
      );
      return;
    }

    setSavingRowDetail(true);
    try {
      await contractsApi.updateSubmissionReview(
        {
          SubmissionDetail: [
            {
              AssignmentId: Number(assignmentId),
              WorkType: selectedWorkflowRow.WorkType || "mat_equip",
              ApprovalDecision: rowDetailDecision || "Duyệt",
              Remarks: rowDetailRemarks || "",
            },
          ],
        },
        "update_detail_all_work_type"
      );
      message.success(
        language === "en" ? "Decision saved successfully!" : "Lưu quyết định thành công!"
      );
      setIsRowDetailOpen(false);
      onRefresh();
    } catch (e: any) {
      message.error(e?.message || (language === "en" ? "Save failed." : "Lưu quyết định thất bại."));
    } finally {
      setSavingRowDetail(false);
    }
  };

  const contractCode =
    contract?.ContractCode ??
    contract?.Contractcode ??
    contract?.Code ??
    (contract?.ContractId ? `#${contract.ContractId}` : "---");

  const contractId =
    contract?.ContractId ??
    contract?.ContractID ??
    contract?.Id ??
    contract?.ID ??
    "---";

  const vendorName =
    contract?.Venname ??
    contract?.ClientName ??
    contract?.CompanyName ??
    contract?.VendorName ??
    "---";

  const description =
    contract?.Description ??
    contract?.Remarks ??
    contract?.ContractName ??
    "---";

  // Số tiền hợp đồng (từ workflow data dòng đầu tiên hoặc từ thông tin contract)
  const amount = Number(
    workflowData?.[0]?.Amount ??
      contract?.ContractedAmount ??
      contract?.Amount ??
      0
  );



  return (
    <>
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#dce5e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconGitBranch size={20} strokeWidth={1.8} style={{ color: "#008f89" }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#008f89", lineHeight: "22px" }}>
              {language === "en" ? "Contract Approval Workflow" : "Quy trình phê duyệt Hợp đồng"}
            </div>
            <div style={{ fontSize: 12, color: "#718894", marginTop: 2 }}>
              {language === "en" ? "Contract No." : "Số HĐ"}: <strong>{contractCode}</strong> · ID #{contractId}
            </div>
          </div>
        </div>
      }
      placement="right"
      width="54vw"
      open={open}
      onClose={onClose}
      bodyStyle={{ padding: "20px 24px", background: "#fbfcfc" }}
    >
      {/* THÔNG TIN TỔNG QUAN HỢP ĐỒNG */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#718894",
            letterSpacing: 0.5,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          {language === "en" ? "CONTRACT SUMMARY" : "THÔNG TIN HỢP ĐỒNG"}
        </div>
        <div className="erp-summary-card">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {/* Ô 1: Số HĐ */}
            <div className="erp-summary-box">
              <span className="erp-summary-label">
                {language === "en" ? "Contract No." : "Số hợp đồng NCC"}
              </span>
              <div className="erp-summary-value mono">
                {contractCode}
              </div>
            </div>

            {/* Ô 2: Nhà cung cấp */}
            <div className="erp-summary-box">
              <span className="erp-summary-label">
                {language === "en" ? "Vendor / Supplier" : "Đối tượng (NCC)"}
              </span>
              <div
                className="erp-summary-value"
                title={vendorName}
              >
                {vendorName}
              </div>
            </div>

            {/* Ô 3: Giá trị hợp đồng */}
            <div className="erp-summary-box">
              <span className="erp-summary-label">
                {language === "en" ? "Contract Value" : "Giá trị hợp đồng"}
              </span>
              <div className="erp-summary-value amount">
                {amount > 0 ? `${amount.toLocaleString("vi-VN")} VND` : "0 VND"}
              </div>
            </div>
          </div>

          {description && description !== "---" && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #dce5e6", fontSize: 12, color: "#475569" }}>
              <strong style={{ color: "#334155" }}>{language === "en" ? "Description: " : "Diễn giải: "}</strong>
              <span>{description}</span>
            </div>
          )}
        </div>
      </div>

      {/* DANH SÁCH CÁC BƯỚC PHÊ DUYỆT RACI DÙNG CHUNG */}
      <WorkflowRaciTable
        dataSource={workflowData}
        loading={loading}
        onRefresh={onRefresh}
        onOpenRowDetail={handleOpenRowDetail}
        emptyText={
          <div style={{ padding: "30px 0", textAlign: "center", color: "#94A3B8" }}>
            <IconGitBranch size={36} strokeWidth={1.4} style={{ opacity: 0.4, marginBottom: 8 }} />
            <div>
              {language === "en"
                ? "No workflow steps found for this contract."
                : "Chưa có quy trình duyệt cho hợp đồng này."}
            </div>
          </div>
        }
      />
    </Drawer>

    <ContractWorkflowRowDetailDrawer
      open={isRowDetailOpen}
      onClose={() => setIsRowDetailOpen(false)}
      selectedWorkflowRow={selectedWorkflowRow}
      contractAmount={amount}
      processingStatusList={processingStatusList}
      loadingProcessingStatus={loadingProcessingStatus}
      rowDetailDecision={rowDetailDecision}
      setRowDetailDecision={setRowDetailDecision}
      rowDetailRemarks={rowDetailRemarks}
      setRowDetailRemarks={setRowDetailRemarks}
      savingRowDetail={savingRowDetail}
      onSave={handleSaveRowDetail}
    />
    </>
  );
}
