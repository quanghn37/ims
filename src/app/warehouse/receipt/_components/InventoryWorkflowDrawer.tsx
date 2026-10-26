"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Drawer, message } from "antd";
import { IconRoute } from "@tabler/icons-react";
import InventoryWorkflowRowDetailDrawer from "./InventoryWorkflowRowDetailDrawer";
import { StockItemDetail } from "../../types";
import { warehouseApi } from "../../api";
import { extractApiList } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";
import WorkflowRaciTable from "@/components/common/WorkflowRaciTable";

interface InventoryWorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  itemDetail?: StockItemDetail | any | null;
  displayMode?: string;
  onWorkflowUpdated?: () => void;
}

export default function InventoryWorkflowDrawer({
  open,
  onClose,
  itemDetail,
  displayMode = "Receipt",
  onWorkflowUpdated,
}: InventoryWorkflowDrawerProps) {
  const [workflowData, setWorkflowData] = useState<any[]>([]);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  // State cho row detail modal
  const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);
  const [selectedWorkflowRow, setSelectedWorkflowRow] = useState<any>(null);
  const [processingStatusList, setProcessingStatusList] = useState<any[]>([]);
  const [loadingProcessingStatus, setLoadingProcessingStatus] = useState(false);
  const [rowDetailDecision, setRowDetailDecision] = useState<string>("");
  const [rowDetailQnty, setRowDetailQnty] = useState<number>(0);
  const [rowDetailUnitPrice, setRowDetailUnitPrice] = useState<number>(0);
  const [rowDetailRemarks, setRowDetailRemarks] = useState<string>("");
  const [savingRowDetail, setSavingRowDetail] = useState(false);

  const subId = itemDetail?.SubmissionId ?? itemDetail?.LocalId;

  const fetchWorkflowStatus = useCallback(async () => {
    if (!subId) {
      setWorkflowData([]);
      return;
    }
    setLoadingWorkflow(true);
    try {
      const data = await warehouseApi.getInventorySubmissionStatus({
        DisplayMode: displayMode,
        SubmissionId: Number(subId),
        PageNum: 1,
        PageSize: 20,
      });
      setWorkflowData(extractApiList(data));
    } catch (e: any) {
      console.error("Lỗi tải trạng thái quy trình duyệt:", e);
      message.error(e?.message || "Không thể tải quy trình duyệt chi tiết.");
      setWorkflowData([]);
    } finally {
      setLoadingWorkflow(false);
    }
  }, [subId, displayMode]);

  useEffect(() => {
    if (open && subId) {
      fetchWorkflowStatus();
    } else {
      setWorkflowData([]);
      setIsRowDetailOpen(false);
    }
  }, [open, subId, fetchWorkflowStatus]);

  const openRowDetail = async (record: any) => {
    setSelectedWorkflowRow(record);
    setRowDetailQnty(Number(record.Qnty ?? itemDetail?.Qnty ?? 0));
    setRowDetailUnitPrice(Number(record.UnitPrice ?? itemDetail?.UnitPrice ?? 0));
    setRowDetailRemarks(record.Remarks || "");
    setRowDetailDecision(record.ApprovalStatus || "");
    setIsRowDetailOpen(true);
    setLoadingProcessingStatus(true);

    try {
      const data = await warehouseApi.getProcessingStatuses({
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
    setSavingRowDetail(true);
    try {
      await warehouseApi.updateSubmissionReview(
        {
          SubmissionDetail: [
            {
              AssignmentId: selectedWorkflowRow.AssignmentId || selectedWorkflowRow.LocalId,
              WorkType: displayMode === "Request" ? "Inventory_request" : "Inventory_receipt",
              ApprovalDecision: rowDetailDecision,
              Qnty: rowDetailQnty,
              UnitPrice: rowDetailUnitPrice,
              Remarks: rowDetailRemarks,
            },
          ],
        },
        "update_detail_all_work_type"
      );
      message.success("Lưu quyết định duyệt thành công!");
      setIsRowDetailOpen(false);
      fetchWorkflowStatus();
      if (onWorkflowUpdated) {
        onWorkflowUpdated();
      }
    } catch (e: any) {
      console.error("Lỗi lưu quyết định duyệt:", e);
      message.error(e?.message || "Lưu quyết định duyệt thất bại!");
    } finally {
      setSavingRowDetail(false);
    }
  };

  const { t, language } = useTranslation();
  const numLocale = language === "en" ? "en-US" : "vi-VN";

  const workflowTitle =
    displayMode === "Request"
      ? (language === "en" ? "Material Request" : "Yêu cầu xuất kho")
      : displayMode === "Issue"
      ? (language === "en" ? "Stock Issue" : "Xuất kho")
      : (language === "en" ? "Stock Receipt" : "Nhập kho");

  const docTypeName =
    displayMode === "Request"
      ? (language === "en" ? "Material Requisition Note" : "Phiếu yêu cầu xuất vật tư")
      : displayMode === "Issue"
      ? (language === "en" ? "Stock Issue Note" : "Phiếu xuất kho vật tư")
      : (language === "en" ? "Stock Receipt Note" : "Phiếu nhập vật tư");

  return (
    <>
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#dce5e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconRoute size={20} strokeWidth={1.8} style={{ color: "#008f89" }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#008f89", lineHeight: "24px" }}>
                {language === "en"
                  ? `Approval Workflow (${workflowTitle})`
                  : `Quy trình phê duyệt ${workflowTitle}`}
              </div>
              <div style={{ fontSize: 12, color: "#718894", marginTop: 2 }}>
                Submission #{subId} · {docTypeName}
              </div>
            </div>
          </div>
        }
        placement="right"
        width="54vw"
        open={open}
        onClose={onClose}
        bodyStyle={{ padding: "20px 24px", background: "#FAF5FF08" }}
      >
        {itemDetail && (
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
              {language === "en" ? "REQUISITION INFO" : "THÔNG TIN ĐỀ NGHỊ"}
            </div>
            <div className="erp-summary-card">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
              >
                {/* Ô 1: Mã vật tư */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {t("common.materialCode") || "Mã vật tư"}
                  </span>
                  <div className="erp-summary-value mono">
                    {itemDetail.SystemCode || itemDetail.itemCode || "---"}
                  </div>
                </div>

                {/* Ô 2: Tên vật tư */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {t("common.materialName") || "Tên vật tư"}
                  </span>
                  <div
                    className="erp-summary-value"
                    title={itemDetail.Description || itemDetail.itemName}
                  >
                    {itemDetail.Description || itemDetail.itemName || "---"}
                  </div>
                </div>

                {/* Ô 3: ĐVT */}
                <div className="erp-summary-box">
                  <span className="erp-summary-label">
                    {t("common.unit") || "ĐVT"}
                  </span>
                  <div className="erp-summary-value">
                    {itemDetail.Unit || itemDetail.unit || "---"}
                  </div>
                </div>

                {/* Ô 4, 5, 6: Phân chia theo displayMode */}
                {displayMode === "Request" ? (
                  <>
                    {/* Ô 4: OrgName */}
                    <div className="erp-summary-box">
                      <span className="erp-summary-label">OrgName</span>
                      <div
                        className="erp-summary-value"
                        title={
                          itemDetail.Orgcode && itemDetail.OrgName
                            ? `${itemDetail.Orgcode} - ${itemDetail.OrgName}`
                            : itemDetail.OrgName || itemDetail.orgName || itemDetail.Orgcode || itemDetail.orgCode || ""
                        }
                      >
                        {itemDetail.OrgName || itemDetail.orgName || itemDetail.Orgcode || itemDetail.orgCode || "---"}
                      </div>
                    </div>

                    {/* Ô 5: Số lượng đề nghị */}
                    <div className="erp-summary-box">
                      <span className="erp-summary-label">
                        {language === "en" ? "Requested Qty" : "Số lượng đề nghị"}
                      </span>
                      <div className="erp-summary-value">
                        {Number(itemDetail.requestedQty ?? itemDetail.Qnty ?? itemDetail.actualQty ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>

                    {/* Ô 6: Số lượng duyệt */}
                    <div className="erp-summary-box">
                      <span className="erp-summary-label">
                        {t("workflow.approvedQty") || "Số lượng duyệt"}
                      </span>
                      <div className="erp-summary-value amount">
                        {Number(itemDetail.approvedQty ?? itemDetail.ApprovedQty ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Ô 4: Số lượng đề nghị */}
                    <div className="erp-summary-box">
                      <span className="erp-summary-label">
                        {language === "en" ? "Requested Qty" : "Số lượng đề nghị"}
                      </span>
                      <div className="erp-summary-value">
                        {Number(itemDetail.Qnty ?? itemDetail.actualQty ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>

                    {/* Ô 5: Đơn giá đề nghị */}
                    <div className="erp-summary-box">
                      <span className="erp-summary-label">
                        {language === "en" ? "Requested Unit Price" : "Đơn giá đề nghị"}
                      </span>
                      <div className="erp-summary-value">
                        {Number(itemDetail.UnitPrice ?? itemDetail.unitPrice ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>

                    {/* Ô 6: Thành tiền đề nghị */}
                    <div className="erp-summary-box">
                      <span className="erp-summary-label">
                        {language === "en" ? "Requested Amount" : "Thành tiền đề nghị"}
                      </span>
                      <div className="erp-summary-value amount">
                        {Number(itemDetail.Amount ?? itemDetail.totalPrice ?? 0).toLocaleString(numLocale)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BẢNG CÁC BƯỚC PHÊ DUYỆT RACI DÙNG CHUNG */}
        <WorkflowRaciTable
          dataSource={workflowData}
          loading={loadingWorkflow}
          onRefresh={fetchWorkflowStatus}
          onOpenRowDetail={openRowDetail}
        />
      </Drawer>

      <InventoryWorkflowRowDetailDrawer
        open={isRowDetailOpen}
        onClose={() => setIsRowDetailOpen(false)}
        selectedWorkflowRow={selectedWorkflowRow}
        processingStatusList={processingStatusList}
        loadingProcessingStatus={loadingProcessingStatus}
        rowDetailDecision={rowDetailDecision}
        setRowDetailDecision={setRowDetailDecision}
        rowDetailQnty={rowDetailQnty}
        setRowDetailQnty={setRowDetailQnty}
        rowDetailUnitPrice={rowDetailUnitPrice}
        setRowDetailUnitPrice={setRowDetailUnitPrice}
        rowDetailRemarks={rowDetailRemarks}
        setRowDetailRemarks={setRowDetailRemarks}
        savingRowDetail={savingRowDetail}
        onSave={handleSaveRowDetail}
        displayMode={displayMode}
      />
    </>
  );
}
