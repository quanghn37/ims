"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Form, message, Space, Tabs, Spin } from "antd";
import dynamic from "next/dynamic";

import { IconEye, IconFileText, IconPencil } from "@tabler/icons-react";

import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { quotationsApi } from "./api";
import { ContractItem } from "@/types";
import dayjs from "dayjs";

import { useAuth } from "@/lib/auth-context";
import { AttachmentFile, parseDateSafe } from "./_components/types";
import QuotationsTable from "./_components/QuotationsTable";
import { useQuotations } from "./_hooks/useQuotations";
import { useQuotationItemsAndWorkflow } from "./_hooks/useQuotationItemsAndWorkflow";

const ContractFormDrawer = dynamic(() => import("./_components/ContractFormDrawer"), {
  loading: () => (
    <div style={{ padding: 40, textAlign: "center" }}>
      <Spin />
      <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>Đang tải biểu mẫu bảng giá...</div>
    </div>
  ),
  ssr: false,
});
const SubmissionDetailDrawer = dynamic(() => import("./_components/SubmissionDetailDrawer"), { ssr: false });
const ItemFormDrawer = dynamic(() => import("./_components/ItemFormDrawer"), { ssr: false });
const ImportExcelModal = dynamic(() => import("./_components/ImportExcelModal"), { ssr: false });
const WorkflowDrawer = dynamic(() => import("./_components/WorkflowDrawer"), { ssr: false });
const ClientLovModal = dynamic(() => import("@/components/lov/ClientLovModal"), { ssr: false });
const MainContractLovModal = dynamic(() => import("@/components/lov/MainContractLovModal"), { ssr: false });
import { useTranslation } from "@/locales/LanguageContext";

export default function QuotationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    loading,
    searchKeyword,
    setSearchKeyword,
    columnFilters,
    setColumnFilters,
    pagination,
    setPagination,
    fetchQuotations,
    columnSuggestions,
    filteredQuotations,
    isFiltering,
    quotations,
  } = useQuotations();
  const currentUserId = user?.LogIn || "";

  // --- Tab Navigation & Edit Contract Tab ---
  const [activeTabKey, setActiveTabKey] = useState<string>("list");
  const [isEditTabOpen, setIsEditTabOpen] = useState(false);
  const [contractForm] = Form.useForm();
  const [submittingContract, setSubmittingContract] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachmentKeys, setSelectedAttachmentKeys] = useState<React.Key[]>([]);

  // --- Drawer Detail Submissions ---
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
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
  } = useQuotationItemsAndWorkflow(selectedContract, editingContract, contractForm);

  // --- LOV NCC ---
  const [clientList, setClientList] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isClientLovOpen, setIsClientLovOpen] = useState(false);
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [selectedClientDisplay, setSelectedClientDisplay] = useState("");

  // --- LOV Hợp đồng CĐT ---
  const [mainContractList, setMainContractList] = useState<any[]>([]);
  const [loadingMainContracts, setLoadingMainContracts] = useState(false);
  const [isMainContractLovOpen, setIsMainContractLovOpen] = useState(false);
  const [mainContractSearchInput, setMainContractSearchInput] = useState("");
  const [selectedMainContractDisplay, setSelectedMainContractDisplay] = useState("");
  const [mainContractPagination, setMainContractPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchClientList = async (keyword = "") => {
    setLoadingClients(true);
    try {
      const data = await quotationsApi.getClients({
        Keyword: keyword,
        Page: 1,
        PageSize: 50,
        InMain: null,
        DisplayMode: "full_list",
        ContractId: "",
        WSId: "",
      });
      setClientList(extractApiList(data));
    } catch (e) {
      console.error("Error fetching clients:", e);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchMainContracts = async (keyword = "", page = 1, pageSize = 20) => {
    setLoadingMainContracts(true);
    try {
      const data = await quotationsApi.getMainContracts({
        DisplayMode: "brief_contracts_by_user",
        QueryByAgent: "no",
        Keyword: keyword,
        ContractType: "main_contract",
        ContractFormat: "",
        PageNum: page,
        PageSize: pageSize,
      });
      const list = extractApiList(data);
      setMainContractList(list);
      setMainContractPagination({
        current: page,
        pageSize: pageSize,
        total: extractTotalRows(data, list.length),
      });
    } catch (e) {
      console.error("Error fetching main contracts:", e);
      message.error("Không thể tải danh sách Hợp đồng CĐT.");
    } finally {
      setLoadingMainContracts(false);
    }
  };

  // ---------------------------------------------------------------
  // Client & Main Contract Handlers
  // ---------------------------------------------------------------
  const handleSelectClient = (record: any) => {
    const clientId = record.ClientId ?? record.CompanyId ?? record.Id;
    const clientName = record.CompanyName || record.Venname || `NCC #${clientId}`;
    contractForm.setFieldsValue({ ClientId: clientId });
    setSelectedClientDisplay(clientName);
    setIsClientLovOpen(false);
  };

  const handleClearClient = () => {
    contractForm.setFieldsValue({ ClientId: undefined });
    setSelectedClientDisplay("");
  };

  const handleSelectMainContract = (record: any) => {
    const contractId = record.ContractId ?? record.MainContractId;
    const contractCode = record.ContractCode || record.MainContractCode || `#${contractId}`;
    const contractName = record.ContractName || record.MainContractName || record.Description || "";
    const displayStr = contractName ? `${contractCode} - ${contractName}` : contractCode;
    contractForm.setFieldsValue({
      MainContractId: contractId,
      MainContractCode: contractCode,
    });
    setSelectedMainContractDisplay(displayStr);
    setIsMainContractLovOpen(false);
  };

  const handleClearMainContract = () => {
    contractForm.setFieldsValue({
      MainContractId: undefined,
      MainContractCode: undefined,
    });
    setSelectedMainContractDisplay("");
  };

  const openContractDetails = useCallback(
    async (contract: ContractItem) => {
      setSelectedContract(contract);
      setDrawerOpen(true);
      await fetchSubmissionsForContract(contract.ContractId);
    },
    [fetchSubmissionsForContract]
  );

  // ---------------------------------------------------------------
  // Create / Edit Contract
  // ---------------------------------------------------------------
  const handleOpenCreateContract = () => {
    setEditingContract(null);
    setSelectedContract(null);
    setSubmissions([]);
    contractForm.resetFields();
    setSelectedClientDisplay("");
    setSelectedMainContractDisplay("");
    contractForm.setFieldsValue({
      Currency: "VND",
      ContractDate: dayjs(),
      FromDate: dayjs(),
      ToDate: dayjs().add(1, "year"),
    });
    setAttachments([]);
    setSelectedAttachmentKeys([]);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleOpenEditContract = (record: ContractItem) => {
    setEditingContract(record);
    setSelectedContract(record);
    contractForm.resetFields();

    const clientName =
      record.Venname ||
      record.ClientName ||
      selectedClientDisplay ||
      (record.ClientID ?? record.ClientId ? `NCC #${record.ClientID ?? record.ClientId}` : "");
    setSelectedClientDisplay(clientName);

    const mainContractDisplay = record.MainContractName
      ? `${record.MainContractCode || ""} - ${record.MainContractName}`
      : record.MainContractCode ||
        selectedMainContractDisplay ||
        (record.MainContractId ? `HĐ #${record.MainContractId}` : "");
    setSelectedMainContractDisplay(mainContractDisplay);

    contractForm.setFieldsValue({
      Description: record.Description,
      ClientId: record.ClientID ?? record.ClientId ?? undefined,
      MainContractId: record.MainContractId || undefined,
      MainContractCode: record.MainContractCode || "",
      ContractCode: record.ContractCode || "",
      Currency: record.Currency || "VND",
      PaymentTerm: record.PaymentTerm || "DK03",
      FromDate: parseDateSafe(record.StartDate || record.FromDate || record.EffectiveDate),
      ToDate: parseDateSafe(record.EndDate || record.ToDate || record.ExpiredDate || record.ExpireDate),
      ContractDate: parseDateSafe(record.Contractdate || record.ContractDate),
    });

    setAttachments([
      {
        id: "1",
        fileName: "TBTT_TWC_CongNhat_TranGiaMinh_Dot05.pdf",
        fileUrl: "#",
        uploadedBy: currentUserId,
        uploadingDate: "14/09/2026 21:27",
        isClientDoc: false,
      },
    ]);
    setSelectedAttachmentKeys([]);

    // Tự động tải danh sách chi tiết vật tư hiển thị trong Mục II của Drawer
    fetchSubmissionsForContract(record.ContractId);

    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  // Tự động mở tab chi tiết nếu URL có param ?contractId=... hoặc ?code=...
  const autoOpenedRef = React.useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("contractId") || params.get("id");
    const targetCode = params.get("code") || params.get("contractCode");
    if (!targetId && !targetCode) return;

    // Chờ danh sách bảng giá tải về từ máy chủ
    if (quotations.length > 0) {
      const found = quotations.find((q) => {
        const matchId = targetId ? String(q.ContractId) === String(targetId) : false;
        const matchCode = targetCode
          ? q.ContractCode?.trim().toLowerCase() === targetCode.trim().toLowerCase()
          : false;
        return matchId || matchCode;
      });

      if (found) {
        autoOpenedRef.current = true;
        handleOpenEditContract(found);
      }
    }
  }, [quotations]);

  const handleCloseEditTab = () => {
    setIsEditTabOpen(false);
    setActiveTabKey("list");
    setEditingContract(null);
  };

  const handleSubmitContract = async (values: any) => {
    setSubmittingContract(true);
    try {
      const fromDateFormatted = values.FromDate ? values.FromDate.format("YYYY-MM-DD") : null;
      const toDateFormatted = values.ToDate ? values.ToDate.format("YYYY-MM-DD") : null;
      const contractDateFormatted = values.ContractDate
        ? values.ContractDate.format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      if (editingContract) {
        const updatePayload: any = {
          ContractId: Number(editingContract.ContractId),
          ContractType: "quotation",
          ClientId: values.ClientId || editingContract.ClientID || editingContract.ClientId || "",
          MainContractId: values.MainContractId || editingContract.MainContractId || "",
          Description: values.Description,
          PaymentTerm: values.PaymentTerm || editingContract.PaymentTerm || "DK03",
          Currency: values.Currency || editingContract.Currency || "VND",
          FromDate: fromDateFormatted,
          StartDate: fromDateFormatted,
          ToDate: toDateFormatted,
          EndDate: toDateFormatted,
          ContractDate: contractDateFormatted,
          Contractdate: contractDateFormatted,
          WSId: "",
          Attachments: attachments,
        };
        await quotationsApi.updateContractInfo(updatePayload, "update_quotation");
        message.success("Cập nhật bảng giá thành công!");
        setEditingContract((prev) => (prev ? { ...prev, ...updatePayload } : prev));
        fetchQuotations(pagination.current, pagination.pageSize);
      } else {
        const createPayload: any = {
          ClientId: values.ClientId || "1763",
          MainContractId: values.MainContractId || "",
          ContractType: "quotation",
          Description: values.Description,
          PaymentTerm: values.PaymentTerm || "DK03",
          Currency: values.Currency || "VND",
          FromDate: fromDateFormatted,
          StartDate: fromDateFormatted,
          ToDate: toDateFormatted,
          EndDate: toDateFormatted,
          ContractDate: contractDateFormatted,
          Contractdate: contractDateFormatted,
          WSId: "",
          Attachments: attachments,
        };
        const createRes: any = await quotationsApi.updateContractInfo(createPayload, "create_quotation");

        fetchQuotations(1, pagination.pageSize);

        let newContractId = Number(
          createRes?.ContractId ||
            createRes?.Data?.ContractId ||
            createRes?.data?.ContractId ||
            createRes?.Data?.[0]?.ContractId ||
            createRes?.data?.[0]?.ContractId ||
            createRes?.[0]?.ContractId ||
            createRes?.Id ||
            createRes?.id
        );

        let createdContract: any = null;
        try {
          const refreshedData = await quotationsApi.getContracts({
            DisplayMode: "quotation",
            ClientId: "",
            WSId: "",
            PageNum: 1,
            PageSize: 10,
          });
          const refreshedList = extractApiList<ContractItem>(refreshedData);
          if (newContractId) {
            createdContract = refreshedList.find((c: any) => Number(c.ContractId) === newContractId);
          }
          if (!createdContract && refreshedList.length > 0) {
            createdContract = refreshedList[0];
            newContractId = Number(createdContract.ContractId);
          }
        } catch (err) {
          console.error("Error fetching refreshed contract:", err);
        }

        if (createdContract) {
          handleOpenEditContract(createdContract);
          message.success("Tạo mới bảng giá thành công! Đã chuyển sang màn hình chi tiết để thêm vật tư.");
        } else {
          const fallbackContract: any = {
            ContractId: newContractId || Date.now(),
            ClientID: values.ClientId,
            ClientId: values.ClientId,
            ClientName: selectedClientDisplay,
            Venname: selectedClientDisplay,
            MainContractId: values.MainContractId,
            MainContractName: selectedMainContractDisplay,
            Description: values.Description,
            ContractCode: `PL-${dayjs().format("YYMMDD")}/001`,
            Currency: values.Currency || "VND",
            PaymentTerm: values.PaymentTerm || "DK03",
            StartDate: fromDateFormatted,
            FromDate: fromDateFormatted,
            EndDate: toDateFormatted,
            ToDate: toDateFormatted,
            ContractDate: contractDateFormatted,
          };
          handleOpenEditContract(fallbackContract);
          message.success("Tạo mới bảng giá thành công! Đã chuyển sang màn hình chi tiết để thêm vật tư.");
        }
      }
    } catch (e: any) {
      message.error(e.message || "Lưu bảng giá thất bại.");
    } finally {
      setSubmittingContract(false);
    }
  };

  const handleDeleteContract = async (contractId: any) => {
    try {
      await quotationsApi.updateContractInfo(
        {
          ContractId: String(contractId),
          ContractType: "quotation",
          WSId: "",
        },
        "delete_quotation"
      );
      message.success("Đã xóa bảng giá thành công!");
      if (isEditTabOpen && String(editingContract?.ContractId) === String(contractId)) {
        handleCloseEditTab();
      }
      fetchQuotations(pagination.current, pagination.pageSize);
    } catch (e: any) {
      message.error(e.message || "Xóa bảng giá thất bại.");
    }
  };

  // ---------------------------------------------------------------
  // Attachment Handlers
  // ---------------------------------------------------------------
  const handleCustomUploadAttachment = (options: any) => {
    const { file, onSuccess } = options;
    setTimeout(() => {
      const newFile: AttachmentFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        fileName: file.name,
        fileUrl: "#",
        uploadedBy: currentUserId,
        uploadingDate: dayjs().format("DD/MM/YYYY HH:mm"),
        isClientDoc: false,
        hasSign: file.name.endsWith(".pdf"),
      };
      setAttachments((prev) => [newFile, ...prev]);
      onSuccess("ok");
      message.success(`Đã tải lên: ${file.name}`);
    }, 400);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    setSelectedAttachmentKeys((prev) => prev.filter((key) => key !== id));
    message.success("Đã xóa tệp đính kèm");
  };

  const handleBatchDeleteAttachments = () => {
    setAttachments((prev) => prev.filter((item) => !selectedAttachmentKeys.includes(item.id)));
    setSelectedAttachmentKeys([]);
    message.success("Đã xóa các tệp đã chọn");
  };

  const handleToggleClientDoc = (id: string, checked: boolean) => {
    setAttachments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isClientDoc: checked } : item))
    );
  };

  const tabItems = [
    {
      key: "list",
      label: (
        <Space size={6}>
          <IconFileText size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span>{t.menu.quotations}</span>
        </Space>
      ),
      closable: false,
      children: (
        <QuotationsTable
          filteredQuotations={filteredQuotations}
          storageKey={`table_cols_quotations_main_${currentUserId}`}
          loading={loading}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          pagination={pagination}
          setPagination={setPagination}
          isFiltering={isFiltering}
          columnSuggestions={columnSuggestions}
          onRefresh={fetchQuotations}
          onCreate={handleOpenCreateContract}
          onEdit={handleOpenEditContract}
          onDelete={handleDeleteContract}
        />
      ),
    },
    ...(isEditTabOpen
      ? [
          {
            key: "edit",
            label: (() => {
              const isReadOnly = Boolean(
                editingContract &&
                  (editingContract.Editable === 0 || editingContract.Editable === "0")
              );
              return (
                <Space size={6}>
                  {isReadOnly ? (
                    <IconEye size={16} strokeWidth={1.8} style={{ color: "#718894" }} />
                  ) : (
                    <IconPencil size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
                  )}
                  <span>
                    {editingContract
                      ? `${editingContract.ContractCode || editingContract.Description || t.menu.quotations}`
                      : t.common.addNew}
                  </span>
                </Space>
              );
            })(),
            closable: true,
            children: (
              <div style={{ background: "#FFFFFF", minHeight: "calc(100vh - 110px)" }}>
                <ContractFormDrawer
                  open={isEditTabOpen}
                  onClose={handleCloseEditTab}
                  editingContract={editingContract}
                  form={contractForm}
                  submitting={submittingContract}
                  selectedClientDisplay={selectedClientDisplay}
                  onOpenClientLov={() => {
                    setClientSearchInput("");
                    fetchClientList("");
                    setIsClientLovOpen(true);
                  }}
                  onClearClient={handleClearClient}
                  selectedMainContractDisplay={selectedMainContractDisplay}
                  onOpenMainContractLov={() => {
                    setMainContractSearchInput("");
                    fetchMainContracts("", 1, mainContractPagination.pageSize);
                    setIsMainContractLovOpen(true);
                  }}
                  onClearMainContract={handleClearMainContract}
                  submissions={submissions}
                  loadingSubmissions={loadingSubmissions}
                  onOpenAddItem={handleOpenAddItem}
                  onOpenEditItem={handleOpenEditItem}
                  onDeleteSubmission={handleDeleteSubmission}
                  onFetchWorkflow={fetchWorkflowStatus}
                  onOpenImportExcel={handleOpenImportModal}
                  attachments={attachments}
                  selectedAttachmentKeys={selectedAttachmentKeys}
                  setSelectedAttachmentKeys={setSelectedAttachmentKeys}
                  onUploadAttachment={handleCustomUploadAttachment}
                  onDeleteAttachment={handleDeleteAttachment}
                  onBatchDeleteAttachments={handleBatchDeleteAttachments}
                  onToggleClientDoc={handleToggleClientDoc}
                  onFinish={handleSubmitContract}
                  onDeleteContract={handleDeleteContract}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ padding: 0, width: "100%", minHeight: "calc(100vh - 100px)", background: "#FFFFFF", borderRadius: 16, border: "1px solid #dce5e6", overflow: "hidden", boxShadow: "0 1px 3px rgba(18, 52, 67, 0.04)" }}>
      <style>{`
        .quotation-page-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .quotation-page-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #dce5e6 !important;
        }
        .quotation-page-tabs .ant-tabs-tab {
          border-color: #dce5e6 !important;
          background: #f7fbfa !important;
          color: #718894 !important;
          border-radius: 8px 8px 0 0 !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          transition: all 0.2s ease;
        }
        .quotation-page-tabs .ant-tabs-tab:hover {
          color: #008f89 !important;
        }
        .quotation-page-tabs .ant-tabs-tab-active {
          background: #FFFFFF !important;
          border-bottom-color: #FFFFFF !important;
          color: #008f89 !important;
          font-weight: 600 !important;
        }
        .quotation-page-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #008f89 !important;
        }
        .quotation-page-tabs .ant-tabs-tab .ant-tabs-tab-remove {
          color: #94A3B8 !important;
        }
        .quotation-page-tabs .ant-tabs-tab .ant-tabs-tab-remove:hover {
          color: #EF4444 !important;
        }
      `}</style>
      <Tabs
        className="quotation-page-tabs"
        type="editable-card"
        hideAdd
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        onEdit={(targetKey, action) => {
          if (action === "remove" && targetKey === "edit") {
            handleCloseEditTab();
          }
        }}
        items={tabItems}
        tabBarStyle={{
          margin: 0,
          background: "#FFFFFF",
          padding: "8px 24px 0 24px",
          borderBottom: "1px solid #dce5e6",
        }}
      />

      {drawerOpen && (
        <SubmissionDetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          selectedContract={selectedContract}
          submissions={submissions}
          loadingSubmissions={loadingSubmissions}
          onOpenAddItem={handleOpenAddItem}
          onOpenEditItem={handleOpenEditItem}
          onDeleteSubmission={handleDeleteSubmission}
          onFetchWorkflow={fetchWorkflowStatus}
          onOpenImportExcel={handleOpenImportModal}
        />
      )}

      {isItemModalOpen && (
        <ItemFormDrawer
          open={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          editingSubmissionItem={editingSubmissionItem}
          form={itemForm}
          submitting={submittingItem}
          availableItems={availableItems}
          loadingItems={loadingItems}
          onSearchItem={handleSearchItem}
          onFetchItems={() => fetchAvailableItems("")}
          rawItemTotal={rawItemTotal}
          taxItemTotal={taxItemTotal}
          grandItemTotal={grandItemTotal}
          watchedTaxRate={watchedTaxRate}
          onFinish={handleCreateSubmission}
          readOnly={Boolean(
            (editingContract && (editingContract.Editable === 0 || editingContract.Editable === "0")) ||
              (selectedContract && (selectedContract.Editable === 0 || selectedContract.Editable === "0")) ||
              (editingSubmissionItem &&
                (editingSubmissionItem.EditAble === 1 ||
                  editingSubmissionItem.EditAble === "1" ||
                  editingSubmissionItem.Editable === 1 ||
                  editingSubmissionItem.Editable === "1"))
          )}
        />
      )}

      {isImportModalOpen && (
        <ImportExcelModal
          open={isImportModalOpen}
          onClose={handleCloseImportModal}
          selectedContractId={selectedContract?.ContractId || editingContract?.ContractId}
          importFileList={importFileList}
          setImportFileList={setImportFileList}
          previewing={previewing}
          importing={importing}
          onPreview={handlePreviewExcel}
          onExecuteImport={handleExecuteImport}
          previewResult={previewResult}
          onResetPreview={() => setPreviewResult(null)}
        />
      )}

      {isWorkflowDrawerOpen && (
        <WorkflowDrawer
          open={isWorkflowDrawerOpen}
          onClose={() => setIsWorkflowDrawerOpen(false)}
          currentSubmissionId={currentSubmissionId}
          workflowData={workflowData}
          loadingWorkflow={loadingWorkflow}
          isRowDetailOpen={isRowDetailOpen}
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
          onOpenRowDetail={openRowDetail}
          onCloseRowDetail={() => setIsRowDetailOpen(false)}
          onSaveRowDetail={handleSaveRowDetail}
        />
      )}

      {isClientLovOpen && (
        <ClientLovModal
          open={isClientLovOpen}
          onClose={() => setIsClientLovOpen(false)}
          clientList={clientList}
          loadingClients={loadingClients}
          clientSearchInput={clientSearchInput}
          setClientSearchInput={setClientSearchInput}
          onSearchClients={(keyword) => fetchClientList(keyword.trim())}
          onSelectClient={handleSelectClient}
        />
      )}

      {isMainContractLovOpen && (
        <MainContractLovModal
          open={isMainContractLovOpen}
          onClose={() => setIsMainContractLovOpen(false)}
          mainContractList={mainContractList}
          loadingMainContracts={loadingMainContracts}
          mainContractSearchInput={mainContractSearchInput}
          setMainContractSearchInput={setMainContractSearchInput}
          onSearchMainContracts={(keyword) => fetchMainContracts(keyword.trim(), 1, mainContractPagination.pageSize)}
          onSelectMainContract={handleSelectMainContract}
          pagination={mainContractPagination}
          onPageChange={(page, pageSize) => fetchMainContracts(mainContractSearchInput.trim(), page, pageSize)}
        />
      )}
    </div>
  );
}