import { useState, useCallback } from "react";
import { Form, message } from "antd";
import type { FormInstance } from "antd";
import dayjs from "dayjs";
import { extractApiList } from "@/lib/api-client";
import { quotationsApi } from "../api";
import { ContractItem, SubmissionItem } from "@/types";
import { parseDateSafe } from "../_components/types";

export function useQuotationItemsAndWorkflow(
  selectedContract: ContractItem | null,
  editingContract: ContractItem | null,
  contractForm: FormInstance
) {
  // --- Drawer Detail Submissions ---
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // --- Drawer Add/Edit Submission Item ---
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingSubmissionItem, setEditingSubmissionItem] = useState<any | null>(null);
  const [itemForm] = Form.useForm();
  const [submittingItem, setSubmittingItem] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Watch item form
  const watchedQnty = Form.useWatch("Qnty", itemForm) || 0;
  const watchedUnitPrice = Form.useWatch("UnitPrice", itemForm) || 0;
  const watchedTaxRate = Form.useWatch("TaxRate", itemForm) ?? 0.08;
  const rawItemTotal = (Number(watchedQnty) || 0) * (Number(watchedUnitPrice) || 0);
  const taxItemTotal = rawItemTotal * (Number(watchedTaxRate) || 0);
  const grandItemTotal = rawItemTotal + taxItemTotal;

  // --- Import Excel ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);

  // --- Workflow Drawer ---
  const [isWorkflowDrawerOpen, setIsWorkflowDrawerOpen] = useState(false);
  const [workflowData, setWorkflowData] = useState<any[]>([]);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<any>(null);

  // --- Workflow Row Detail ---
  const [selectedWorkflowRow, setSelectedWorkflowRow] = useState<any>(null);
  const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);
  const [processingStatusList, setProcessingStatusList] = useState<any[]>([]);
  const [loadingProcessingStatus, setLoadingProcessingStatus] = useState(false);
  const [rowDetailDecision, setRowDetailDecision] = useState<string>("");
  const [rowDetailQnty, setRowDetailQnty] = useState<number>(0);
  const [rowDetailUnitPrice, setRowDetailUnitPrice] = useState<number>(0);
  const [rowDetailRemarks, setRowDetailRemarks] = useState<string>("");
  const [savingRowDetail, setSavingRowDetail] = useState(false);

  const fetchAvailableItems = useCallback(async (keyword = "") => {
    setLoadingItems(true);
    try {
      const data = await quotationsApi.getItems({
        ContractType: "quotation",
        Stage: "plan",
        Keyword: keyword,
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList(data);
      const mapped = list.map((it: any) => ({
        ...it,
        MaterialId: it.MaterialId ?? it.ItemId ?? it.Id,
        ItemId: it.MaterialId ?? it.ItemId ?? it.Id,
        ItemName:
          it.ItemName ||
          it.Description ||
          it.Remarks ||
          (it.MaterialId ? `Vật tư #${it.MaterialId}` : ""),
        ItemCode:
          it.ItemCode ||
          it.SystemCode ||
          it.Code ||
          (it.MaterialId ? String(it.MaterialId) : ""),
      }));
      setAvailableItems(mapped);
    } catch (e) {
      console.error("Error fetching items:", e);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const handleSearchItem = useCallback(
    (keyword: string) => {
      fetchAvailableItems(keyword.trim());
    },
    [fetchAvailableItems]
  );

  const fetchSubmissionsForContract = useCallback(async (contractId: any) => {
    setLoadingSubmissions(true);
    try {
      const data = await quotationsApi.getSubmissions({
        ContractType: "quotation",
        ContractId: Number(contractId),
        Stage: "plan",
        FromDate: "2020-01-01",
        ToDate: "2030-12-31",
        LocalId: "",
        Keyword: "",
        PageNum: 1,
        PageSize: 100,
      });
      const list = extractApiList<SubmissionItem>(data);
      const mapped = list.map((it: any) => ({
        ...it,
        MaterialId: it.MaterialId ?? it.ItemId,
        ItemId: it.MaterialId ?? it.ItemId,
      }));
      setSubmissions(mapped);
    } catch (e: any) {
      message.error("Không thể tải chi tiết vật tư của bảng giá.");
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  // ---------------------------------------------------------------
  // Submission Item Handlers
  // ---------------------------------------------------------------
  const handleOpenAddItem = () => {
    setEditingSubmissionItem(null);
    itemForm.resetFields();
    const target = selectedContract || editingContract;
    const defaultFromDate =
      contractForm.getFieldValue("FromDate") ||
      parseDateSafe(target?.StartDate || target?.FromDate || (target as any)?.EffectiveDate) ||
      dayjs();
    const defaultToDate =
      contractForm.getFieldValue("ToDate") ||
      parseDateSafe(
        target?.EndDate || target?.ToDate || (target as any)?.ExpiredDate || (target as any)?.ExpireDate
      ) ||
      null;

    itemForm.setFieldsValue({
      MaterialId: undefined,
      ItemId: undefined,
      ItemName: "",
      ItemDate: defaultFromDate,
      FromDate: defaultFromDate,
      ToDate: defaultToDate,
      Qnty: 0,
      TaxRate: 0.08,
      UnitPrice: 0,
      Unit: "Cái",
      Remarks: "",
      StartProcessNow: false,
    });
    setIsItemModalOpen(true);
    if (availableItems.length === 0) fetchAvailableItems();
  };

  const handleOpenEditItem = (record: any) => {
    setEditingSubmissionItem(record);
    itemForm.resetFields();

    const currentMaterialId =
      record.MaterialId ?? record.ItemId ? Number(record.MaterialId ?? record.ItemId) : undefined;
    const currentItemName =
      record.Description ||
      record.Remarks ||
      record.ItemName ||
      (currentMaterialId ? `Vật tư #${currentMaterialId}` : "");

    if (currentMaterialId) {
      setAvailableItems((prev) => {
        const exists = prev.some((it) => Number(it.MaterialId ?? it.ItemId) === currentMaterialId);
        if (!exists) {
          return [
            ...prev,
            {
              MaterialId: currentMaterialId,
              ItemId: currentMaterialId,
              ItemName: currentItemName,
              Unit: record.Unit || "Cái",
            },
          ];
        }
        return prev;
      });
    }

    const target = selectedContract || editingContract;
    const parsedFromDate =
      parseDateSafe(record.FromDate || record.StartDate || record.EffectiveDate || record.ItemDate) ||
      contractForm.getFieldValue("FromDate") ||
      parseDateSafe(target?.StartDate || target?.FromDate) ||
      dayjs();
    const parsedToDate =
      parseDateSafe(
        record.Enddate || record.EndDate || record.ToDate || record.ExpiredDate || record.ExpireDate
      ) ||
      contractForm.getFieldValue("ToDate") ||
      parseDateSafe(target?.EndDate || target?.ToDate) ||
      null;

    itemForm.setFieldsValue({
      MaterialId: currentMaterialId,
      ItemId: currentMaterialId,
      ItemName: currentItemName,
      ItemDate: parseDateSafe(record.ItemDate) || parsedFromDate,
      FromDate: parsedFromDate,
      ToDate: parsedToDate,
      Unit: record.Unit || "Cái",
      Qnty: Number(record.Qnty ?? 0),
      UnitPrice: Number(record.UnitPrice || 0),
      TaxRate: Number(record.TaxRate ?? 0.08),
      Remarks: record.Remarks && record.Remarks !== record.Description ? record.Remarks : "",
      StartProcessNow: false,
    });
    setIsItemModalOpen(true);
  };

  const handleCreateSubmission = async (values: any) => {
    const targetContract = selectedContract || editingContract;
    if (!targetContract) return;
    setSubmittingItem(true);
    try {
      const materialId = Number(
        values.MaterialId ||
          values.ItemId ||
          editingSubmissionItem?.MaterialId ||
          editingSubmissionItem?.ItemId ||
          editingSubmissionItem?.LocalId ||
          0
      );

      const itemDateVal = values.FromDate || values.ItemDate;
      const itemDateFormatted = itemDateVal
        ? dayjs.isDayjs(itemDateVal)
          ? itemDateVal.format("YYYY-MM-DD")
          : String(itemDateVal)
        : dayjs().format("YYYY-MM-DD");

      const endDateVal = values.ToDate || values.EndDate;
      const endDateFormatted = endDateVal
        ? dayjs.isDayjs(endDateVal)
          ? endDateVal.format("YYYY-MM-DD")
          : String(endDateVal)
        : "";

      const payload: any = {
        ContractType: "quotation",
        ContractId: targetContract.ContractId,
        MaterialId: materialId,
        ItemDate: itemDateFormatted,
        EndDate: endDateFormatted,
        UnitPrice: Number(values.UnitPrice || 0),
        Qnty: Number(values.Qnty ?? 0),
        TaxRate: Number(values.TaxRate ?? 0.08),
        Remarks: values.Remarks || "",
        StartProcessNow: values.StartProcessNow ? "Yes" : "No",
        ApplyDefinedAssignment: "Yes",
        Stage: "plan",
      };

      if (editingSubmissionItem) {
        payload.SubmissionId = String(
          editingSubmissionItem.SubmissionId || editingSubmissionItem.LocalId
        );
        payload.UpdateMode = "update_quotationSubmission";
      }

      await quotationsApi.upsertSubmission(
        payload,
        editingSubmissionItem ? "update_quotationSubmission" : "create_quotationSubmission"
      );

      message.success(
        editingSubmissionItem
          ? "Cập nhật vật tư thành công!"
          : "Thêm vật tư vào bảng giá thành công!"
      );
      setIsItemModalOpen(false);
      itemForm.resetFields();
      const target = selectedContract || editingContract;
      if (target) fetchSubmissionsForContract(target.ContractId);
    } catch (e: any) {
      message.error(e.message || "Không thể lưu vật tư.");
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: any) => {
    try {
      await quotationsApi.upsertSubmission(
        {
          ContractType: "quotation",
          SubmissionId: String(submissionId),
          UpdateMode: "delete_quotationSubmission",
        },
        "delete_quotationSubmission"
      );

      message.success("Đã xóa vật tư khỏi bảng giá!");
      const target = selectedContract || editingContract;
      if (target) fetchSubmissionsForContract(target.ContractId);
    } catch (e: any) {
      message.error(e.message || "Xóa vật tư thất bại.");
    }
  };

  // ---------------------------------------------------------------
  // Import Excel (3-Step Workflow: Upload -> Preview -> Execute)
  // ---------------------------------------------------------------
  const handleOpenImportModal = () => {
    setImportFileList([]);
    setPreviewResult(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFileList([]);
    setPreviewResult(null);
  };

  const handlePreviewExcel = async (fileParam?: any) => {
    const rawFile = fileParam || (importFileList.length > 0 ? importFileList[0] : null);
    if (!rawFile) {
      message.warning("Vui lòng chọn file Excel!");
      return;
    }
    const cleanFile = rawFile.originFileObj || rawFile;
    setImportFileList([cleanFile]);
    setPreviewing(true);
    setPreviewResult(null);
    try {
      const formData = new FormData();
      formData.append("file", cleanFile);
      formData.append("WorkType", "quotation");
      formData.append("StartRow", "8");

      // 1. Upload thô vào DataTemp lấy CacheId
      const uploadRes: any = await quotationsApi.uploadImportData(formData);
      const cacheId = uploadRes?.CacheId || uploadRes?.Cacheid || uploadRes?.Result?.CacheId;

      if (!cacheId) {
        throw new Error(uploadRes?.Message || "Không thể lấy CacheId phiên làm việc.");
      }

      // 2. Validate & Lấy Preview từ Stored Procedure PRJ_ImportQuotation
      const previewRes: any = await quotationsApi.importQuotationPreview({ CacheId: cacheId });

      setPreviewResult({
        cacheId: cacheId,
        canImport: Boolean(previewRes?.CanImport),
        total: Number(previewRes?.Total || 0),
        validCount: Number(previewRes?.ValidCount || 0),
        invalidCount: Number(previewRes?.InvalidCount || 0),
        data: extractApiList(previewRes?.Data || previewRes),
      });

      message.success("Đã kiểm tra file Excel xong! Vui lòng xem bảng Preview bên dưới.");
    } catch (e: any) {
      console.error("Preview Excel Error:", e);
      message.error(e.message || "Tải lên và kiểm tra file Excel thất bại.");
      setPreviewResult(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleExecuteImport = async () => {
    const target = selectedContract || editingContract;
    if (!target || !previewResult?.cacheId) {
      message.warning("Thiếu dữ liệu phiên làm việc để Import!");
      return;
    }
    if (!previewResult.canImport) {
      message.error("Vẫn còn dòng lỗi trong file Excel. Vui lòng sửa lại trước khi nạp!");
      return;
    }

    setImporting(true);
    try {
      // 3. Thực thi Import chính thức vào bảng Báo giá
      const executeRes: any = await quotationsApi.importQuotationExecute({
        CacheId: previewResult.cacheId,
        ContractId: Number(target.ContractId),
        Language: "vi",
      });

      message.success(executeRes?.Message || "Import dữ liệu vào bảng giá thành công!");
      handleCloseImportModal();
      fetchSubmissionsForContract(target.ContractId);
    } catch (e: any) {
      console.error("Execute Import Error:", e);
      message.error(e.message || "Import Excel thất bại.");
    } finally {
      setImporting(false);
    }
  };

  // ---------------------------------------------------------------
  // Workflow Handlers
  // ---------------------------------------------------------------
  const fetchWorkflowStatus = async (submissionId: any) => {
    if (!submissionId) {
      message.warning("Hạng mục này chưa có SubmissionId!");
      return;
    }
    setCurrentSubmissionId(submissionId);
    setIsWorkflowDrawerOpen(true);
    setLoadingWorkflow(true);
    try {
      const data = await quotationsApi.getSubmissionStatus({
        SubmissionId: Number(submissionId),
        PageNum: 1,
        PageSize: 20,
      });
      setWorkflowData(extractApiList(data));
    } catch (e: any) {
      message.error("Không thể tải trạng thái quy trình duyệt.");
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
      const data = await quotationsApi.getProcessingStatuses({
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
      await quotationsApi.updateSubmissionReview(
        {
          SubmissionDetail: [
            {
              AssignmentId: selectedWorkflowRow.AssignmentId || selectedWorkflowRow.LocalId,
              WorkType: "quotation",
              ApprovalDecision: rowDetailDecision,
              WorkCat: "contracted_quantity",
              Qnty: rowDetailQnty,
              UnitPrice: rowDetailUnitPrice,
              Remarks: rowDetailRemarks,
            },
          ],
        },
        "update_detail_all_work_type"
      );
      message.success("Lưu quyết định thành công!");
      setIsRowDetailOpen(false);
      fetchWorkflowStatus(currentSubmissionId);
    } catch (e: any) {
      message.error(e.message || "Lưu thất bại.");
    } finally {
      setSavingRowDetail(false);
    }
  };

  return {
    submissions,
    setSubmissions,
    loadingSubmissions,
    fetchSubmissionsForContract,
    isItemModalOpen,
    setIsItemModalOpen,
    editingSubmissionItem,
    itemForm,
    submittingItem,
    availableItems,
    loadingItems,
    fetchAvailableItems,
    handleSearchItem,
    watchedTaxRate,
    rawItemTotal,
    taxItemTotal,
    grandItemTotal,
    handleOpenAddItem,
    handleOpenEditItem,
    handleCreateSubmission,
    handleDeleteSubmission,
    isImportModalOpen,
    importFileList,
    setImportFileList,
    previewing,
    importing,
    previewResult,
    setPreviewResult,
    handleOpenImportModal,
    handleCloseImportModal,
    handlePreviewExcel,
    handleExecuteImport,
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
    fetchWorkflowStatus,
    openRowDetail,
    handleSaveRowDetail,
  };
}
