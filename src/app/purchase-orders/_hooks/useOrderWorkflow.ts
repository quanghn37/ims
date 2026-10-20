"use client";

import { useState } from "react";
import { message } from "antd";
import { extractApiList } from "@/lib/api-client";
import { purchaseOrdersApi } from "../api";

export function useOrderWorkflow({
  editingOrder,
  selectedOrder,
  fetchOrderDrawerItems,
}: {
  editingOrder: any;
  selectedOrder: any;
  fetchOrderDrawerItems: (contractId: any) => Promise<void>;
}) {
  const [isWorkflowDrawerOpen, setIsWorkflowDrawerOpen] = useState(false);
  const [workflowData, setWorkflowData] = useState<any[]>([]);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<any>(null);
  const [itemDetail, setItemDetail] = useState<any>(null);

  // Workflow Row Detail
  const [selectedWorkflowRow, setSelectedWorkflowRow] = useState<any>(null);
  const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);
  const [processingStatusList, setProcessingStatusList] = useState<any[]>([]);
  const [loadingProcessingStatus, setLoadingProcessingStatus] = useState(false);
  const [rowDetailDecision, setRowDetailDecision] = useState<string>("");
  const [rowDetailQnty, setRowDetailQnty] = useState<number>(0);
  const [rowDetailUnitPrice, setRowDetailUnitPrice] = useState<number>(0);
  const [rowDetailRemarks, setRowDetailRemarks] = useState<string>("");
  const [savingRowDetail, setSavingRowDetail] = useState(false);

  const fetchWorkflowStatus = async (submissionIdOrRecord: any, item?: any) => {
    let subId = submissionIdOrRecord;
    let detail = item || null;

    if (submissionIdOrRecord && typeof submissionIdOrRecord === "object") {
      subId = submissionIdOrRecord.SubmissionId || submissionIdOrRecord.LocalId;
      detail = submissionIdOrRecord;
    }

    if (!subId) {
      message.warning("Hạng mục này chưa có SubmissionId!");
      return;
    }
    setCurrentSubmissionId(subId);
    setItemDetail(detail);
    setIsWorkflowDrawerOpen(true);
    setLoadingWorkflow(true);
    try {
      const data = await purchaseOrdersApi.getSubmissionStatus({
        SubmissionId: Number(subId),
        PageNum: 1,
        PageSize: 20,
      });
      setWorkflowData(extractApiList(data));
    } catch (e: any) {
      message.error("Không thể tải trạng thái quy trình duyệt PO.");
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const openRowDetail = async (record: any) => {
    setSelectedWorkflowRow(record);
    setRowDetailQnty(Number(record.Qnty || 0));
    setRowDetailUnitPrice(Number(record.UnitPrice || 0));
    setRowDetailRemarks(record.Remarks || "");
    setRowDetailDecision(record.ApprovalStatus || "");
    setIsRowDetailOpen(true);
    setLoadingProcessingStatus(true);
    try {
      const data = await purchaseOrdersApi.getProcessingStatuses({
        DisplayMode: "approval_no_all",
        Role: record.Role || "A",
      });
      setProcessingStatusList(extractApiList(data));
    } catch (e: any) {
      setProcessingStatusList([]);
    } finally {
      setLoadingProcessingStatus(false);
    }
  };

  const handleSaveRowDetail = async () => {
    if (!selectedWorkflowRow) return;
    setSavingRowDetail(true);
    try {
      await purchaseOrdersApi.updateSubmissionReview({
        SubmissionDetail: [{
          AssignmentId: selectedWorkflowRow.AssignmentId || selectedWorkflowRow.LocalId,
          WorkType: "purchase_order",
          ApprovalDecision: rowDetailDecision,
          WorkCat: "contracted_quantity",
          Qnty: rowDetailQnty,
          UnitPrice: rowDetailUnitPrice,
          Remarks: rowDetailRemarks,
        }],
      }, "update_detail_all_work_type");
      message.success("Lưu quyết định thành công!");
      setIsRowDetailOpen(false);
      fetchWorkflowStatus(currentSubmissionId);
      const targetContractId = editingOrder?.ContractId || selectedOrder?.ContractId;
      if (targetContractId) {
        fetchOrderDrawerItems(targetContractId);
      }
    } catch (e: any) {
      message.error(e.message || "Lưu thất bại.");
    } finally {
      setSavingRowDetail(false);
    }
  };

  return {
    isWorkflowDrawerOpen,
    setIsWorkflowDrawerOpen,
    workflowData,
    loadingWorkflow,
    currentSubmissionId,
    selectedWorkflowRow,
    isRowDetailOpen,
    setIsRowDetailOpen,
    processingStatusList,
    loadingProcessingStatus,
    rowDetailDecision,
    setRowDetailDecision,
    rowDetailQnty,
    setRowDetailQnty,
    rowDetailUnitPrice,
    setRowDetailUnitPrice,
    rowDetailRemarks,
    setRowDetailRemarks,
    savingRowDetail,
    itemDetail,
    setItemDetail,
    fetchWorkflowStatus,
    openRowDetail,
    handleSaveRowDetail,
  };
}
