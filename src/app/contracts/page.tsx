"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Form, message, Space, Tabs, Spin } from "antd";
import dynamic from "next/dynamic";
import { IconFileText, IconPencil } from "@tabler/icons-react";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { contractsApi } from "./api";
import { ContractItem } from "@/types";
import dayjs from "dayjs";

import { useAuth } from "@/lib/auth-context";
import { AttachmentFile, parseDateSafe, debounce } from "./_components/types";
import ContractsTable from "./_components/ContractsTable";
import { useContracts } from "./_hooks/useContracts";
import { useTranslation } from "@/locales/LanguageContext";

const ContractFormDrawer = dynamic(() => import("./_components/ContractFormDrawer"), {
  loading: () => (
    <div style={{ padding: 40, textAlign: "center" }}>
      <Spin />
      <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>Đang tải biểu mẫu hợp đồng...</div>
    </div>
  ),
  ssr: false,
});
const ClientLovModal = dynamic(() => import("@/components/lov/ClientLovModal"), { ssr: false });
const MainContractLovModal = dynamic(() => import("@/components/lov/MainContractLovModal"), { ssr: false });

export default function ContractsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    contracts, loading, searchKeyword, setSearchKeyword, columnFilters, setColumnFilters,
    pagination, setPagination, fetchContracts, columnSuggestions, filteredContracts, isFiltering,
  } = useContracts();

  const currentUserId = user?.LogIn || "";
  const STORAGE_KEY_MAIN = `table_cols_contracts_main_${currentUserId}`;

  // --- Tab Navigation & Edit Contract Tab ---
  const [activeTabKey, setActiveTabKey] = useState<string>("list");
  const [isEditTabOpen, setIsEditTabOpen] = useState(false);

  // --- Modal Create / Edit Contract Form ---
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null);
  const [contractForm] = Form.useForm();
  const [submittingContract, setSubmittingContract] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachmentKeys, setSelectedAttachmentKeys] = useState<React.Key[]>([]);

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

  // ---------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------
  const fetchClientList = async (keyword = "") => {
    setLoadingClients(true);
    try {
      const data = await contractsApi.getClients({
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
      const data = await contractsApi.getContracts({
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

  const handleSelectClient = (record: any) => {
    const clientId = record.ClientId ?? record.CompanyId ?? record.Id;
    const clientName = record.CompanyName || record.Venname || `NCC #${clientId}`;
    contractForm.setFieldsValue({ ClientId: clientId, SourceId: undefined });
    setSelectedClientDisplay(clientName);
    setIsClientLovOpen(false);
  };

  const handleClearClient = () => {
    contractForm.setFieldsValue({ ClientId: undefined, SourceId: undefined });
    setSelectedClientDisplay("");
  };

  const handleSelectMainContract = (record: any) => {
    const contractId = record.ContractId ?? record.MainContractId;
    const contractCode = record.ContractCode || record.MainContractCode || `#${contractId}`;
    const contractName = record.ContractName || record.MainContractName || record.Description || "";
    const displayStr = contractName ? `${contractCode} - ${contractName}` : contractCode;
    contractForm.setFieldsValue({
      MainContractId: contractId,
    });
    setSelectedMainContractDisplay(displayStr);
    setIsMainContractLovOpen(false);
  };

  const handleClearMainContract = () => {
    contractForm.setFieldsValue({
      MainContractId: undefined,
    });
    setSelectedMainContractDisplay("");
  };

  // ---------------------------------------------------------------
  // Open / Close Handlers
  // ---------------------------------------------------------------
  const handleOpenCreateContract = () => {
    setEditingContract(null);
    contractForm.resetFields();
    setSelectedClientDisplay("");
    setSelectedMainContractDisplay("");
    contractForm.setFieldsValue({
      Currency: "VND",
      Amount: 0,
      SignDate: dayjs(),
      FromDate: dayjs(),
      ToDate: null,
      IsVcontract: false,
      ContractCode: "",
      ParentContractId: undefined,
      ParentContractCode: "",
      PayTerms: undefined,
    });
    setAttachments([]);
    setSelectedAttachmentKeys([]);
    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleEditContract = (record: ContractItem) => {
    setEditingContract(record);
    contractForm.resetFields();

    const clientId = record.ClientID ?? record.ClientId ?? undefined;
    const clientName = record.Venname || record.ClientName || (clientId ? `NCC #${clientId}` : "");
    setSelectedClientDisplay(clientName);

    const mainContractId = record.MainContractId ?? (record as any).SubconOf ?? (record as any).MainId ?? undefined;
    const mainContractDisplay = record.MainCode || record.MainContractCode || (mainContractId ? `HĐ #${mainContractId}` : "");
    setSelectedMainContractDisplay(mainContractDisplay);

    const sourceId = record.SourceId ? Number(record.SourceId) : undefined;

    // PLHĐ của: Ưu tiên lấy từ thuộc tính MasterContract / MasterContractCode / ParentContractCode trả về từ API get-contract-list (mat_equip)
    const masterContractVal =
      (record as any).MasterContract ??
      (record as any).MasterContractCode ??
      (record as any).MasterContractNo ??
      (record as any).MasterContractName ??
      (record as any).ParentContractCode ??
      (record as any).ParentContractNo ??
      (record as any).ParentCode ??
      (record as any).MasterCode ??
      "";

    const rawParentId = (record as any).ParentContractId || (record as any).ParentId || (record as any).MasterContractId;
    const parentContractId = rawParentId ? Number(rawParentId) : undefined;

    let parentContractCode = String(masterContractVal || "");
    if (!parentContractCode && parentContractId) {
      const parentInList = contracts.find((c) => Number(c.ContractId) === Number(parentContractId));
      if (parentInList?.ContractCode) {
        parentContractCode = parentInList.ContractCode;
      }
    }

    contractForm.setFieldsValue({
      ClientId: clientId,
      MainContractId: mainContractId,
      ContractCode: record.ContractCode || "",
      ParentContractId: parentContractId || undefined,
      ParentContractCode: parentContractCode || "",
      SourceId: sourceId,
      Amount: Number((record as any).ContractedAmount ?? record.Amount ?? 0),
      Description: record.Description || "",
      Currency: record.Currency || "VND",
      SignDate: parseDateSafe(record.ContractDate || record.Contractdate || (record as any).SignDate) || dayjs(),
      FromDate: parseDateSafe(record.StartDate || record.FromDate),
      ToDate: parseDateSafe(record.EndDate || record.ToDate),
      IsVcontract: Boolean((record as any).IsVcontract ?? (record as any).IsVContract),
      PayTerms:
        record.PayTerms ||
        (record as any).PaymentTerm ||
        (record as any).PaytermId ||
        (record as any).PaytermsId ||
        undefined,
    });

    setAttachments([]);
    setSelectedAttachmentKeys([]);

    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleCreateAddendum = (record: ContractItem) => {
    setEditingContract(null);
    contractForm.resetFields();

    const clientId = record.ClientID ?? record.ClientId ?? undefined;
    const clientName = record.Venname || record.ClientName || (clientId ? `NCC #${clientId}` : "");
    setSelectedClientDisplay(clientName);

    const mainContractId = record.MainContractId ?? (record as any).SubconOf ?? (record as any).MainId ?? undefined;
    const mainContractDisplay = record.MainCode || record.MainContractCode || (mainContractId ? `HĐ #${mainContractId}` : "");
    setSelectedMainContractDisplay(mainContractDisplay);

    const parentContractId = Number(record.ContractId);
    const parentContractCode = record.ContractCode || String(record.ContractId);

    contractForm.setFieldsValue({
      ClientId: clientId,
      MainContractId: mainContractId,
      ContractCode: "",
      ParentContractId: parentContractId,
      ParentContractCode: parentContractCode,
      Description: `Phụ lục cho HĐ ${record.ContractCode || record.ContractId}`,
      Currency: record.Currency || "VND",
      Amount: 0,
      SignDate: dayjs(),
      FromDate: parseDateSafe(record.StartDate || record.FromDate) || dayjs(),
      ToDate: parseDateSafe(record.EndDate || record.ToDate) || null,
      IsVcontract: false,
      PayTerms:
        record.PayTerms ||
        (record as any).PaymentTerm ||
        (record as any).PaytermId ||
        (record as any).PaytermsId ||
        undefined,
    });

    setAttachments([]);
    setSelectedAttachmentKeys([]);

    setIsEditTabOpen(true);
    setActiveTabKey("edit");
  };

  const handleCloseEditTab = () => {
    setIsEditTabOpen(false);
    setActiveTabKey("list");
    setEditingContract(null);
  };

  const handleDeleteContract = async (record: ContractItem) => {
    try {
      await contractsApi.updateContractInfo(
        {
          ContractId: String(record.ContractId),
          ContractType: "mat_equip",
          WSId: "",
        },
        "delete_contract"
      );
      message.success(`Đã xóa hợp đồng ${record.ContractCode || ""} thành công!`);
      fetchContracts(pagination.current, pagination.pageSize);
    } catch (e: any) {
      message.error(e.message || "Xóa hợp đồng thất bại.");
    }
  };

  const handleSubmitContract = async (values: any) => {
    setSubmittingContract(true);
    try {
      const signDateFormatted = values.SignDate
        ? (dayjs.isDayjs(values.SignDate) ? values.SignDate.format("YYYY-MM-DD") : String(values.SignDate))
        : dayjs().format("YYYY-MM-DD");
      const fromDateFormatted = values.FromDate
        ? (dayjs.isDayjs(values.FromDate) ? values.FromDate.format("YYYY-MM-DD") : String(values.FromDate))
        : null;
      const toDateFormatted = values.ToDate
        ? (dayjs.isDayjs(values.ToDate) ? values.ToDate.format("YYYY-MM-DD") : String(values.ToDate))
        : null;
      const mainContractIdVal = values.MainContractId
        ? Number(values.MainContractId)
        : (editingContract?.MainContractId ? Number(editingContract.MainContractId) : undefined);

      let parentContractId: number | null = null;
      const inputParentCode = values.ParentContractCode ? String(values.ParentContractCode).trim() : "";
      if (inputParentCode) {
        if (values.ParentContractId && Number(values.ParentContractId) !== Number(mainContractIdVal)) {
          parentContractId = Number(values.ParentContractId);
        } else {
          const matched = contracts.find(
            (c) => c.ContractCode && c.ContractCode.toLowerCase() === inputParentCode.toLowerCase()
          );
          if (matched && Number(matched.ContractId) !== Number(mainContractIdVal)) {
            parentContractId = Number(matched.ContractId);
          }
        }
      }

      const paytermVal =
        values.PayTerms !== undefined && values.PayTerms !== null && values.PayTerms !== ""
          ? Number.isFinite(Number(values.PayTerms))
            ? Number(values.PayTerms)
            : values.PayTerms
          : undefined;

      if (editingContract) {
        const rawEditingClientId = editingContract.ClientID ?? editingContract.ClientId;
        const updatePayload = {
          WSId: "",
          ContractId: Number(editingContract.ContractId),
          ContractType: "mat_equip",
          S_Type: "PUR",
          MainContractId: mainContractIdVal,
          ParentContractId: parentContractId,
          ClientId: values.ClientId
            ? Number(values.ClientId)
            : rawEditingClientId
            ? Number(rawEditingClientId)
            : undefined,
          SourceId: values.SourceId
            ? Number(values.SourceId)
            : editingContract.SourceId
            ? Number(editingContract.SourceId)
            : undefined,
          Description: values.Description,
          Amount: Number(values.Amount || 0),
          SignDate: signDateFormatted,
          ContractDate: signDateFormatted,
          FromDate: fromDateFormatted,
          ToDate: toDateFormatted,
          IsVcontract: values.IsVcontract ? 1 : 0,
          Currency: values.Currency || "VND",
          PaytermId: paytermVal,
        };

        await contractsApi.updateContractInfo(updatePayload, "update_contract_info");
        message.success("Cập nhật Hợp đồng NCC thành công!");
        setEditingContract((prev: any) =>
          prev
            ? {
                ...prev,
                ...updatePayload,
                ContractedAmount: updatePayload.Amount,
                StartDate: updatePayload.FromDate,
                EndDate: updatePayload.ToDate,
                PayTerms: values.PayTerms,
              }
            : prev
        );
        fetchContracts(pagination.current, pagination.pageSize);
      } else {
        const createPayload = {
          WSId: "",
          ContractType: "mat_equip",
          S_Type: "PUR",
          MainContractId: mainContractIdVal,
          ParentContractId: parentContractId,
          ClientId: values.ClientId ? Number(values.ClientId) : undefined,
          SourceId: values.SourceId ? Number(values.SourceId) : undefined,
          Description: values.Description,
          Amount: Number(values.Amount || 0),
          SignDate: signDateFormatted,
          ContractDate: signDateFormatted,
          FromDate: fromDateFormatted,
          ToDate: toDateFormatted,
          IsVcontract: values.IsVcontract ? 1 : 0,
          Currency: values.Currency || "VND",
          PaytermId: paytermVal,
        };

        const createRes: any = await contractsApi.updateContractInfo(createPayload, "Create_Contract");
        fetchContracts(1, pagination.pageSize);

        let newContractId = Number(
          createRes?.ContractId ||
            createRes?.Data?.ContractId ||
            createRes?.data?.ContractId ||
            createRes?.Data?.[0]?.ContractId ||
            createRes?.data?.[0]?.ContractId ||
            createRes?.[0]?.ContractId ||
            createRes?.Id
        );

        let createdContract: any = null;
        try {
          const refreshedData = await contractsApi.getContracts({
            DisplayMode: "mat_equip",
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
          }
        } catch (err) {
          console.error("Error fetching refreshed contract:", err);
        }

        if (createdContract) {
          handleEditContract(createdContract);
          message.success("Tạo mới Hợp đồng NCC thành công!");
        } else {
          message.success("Tạo mới Hợp đồng NCC thành công!");
          handleCloseEditTab();
        }
      }
    } catch (e: any) {
      message.error(e.message || "Lưu hợp đồng thất bại.");
    } finally {
      setSubmittingContract(false);
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

  // ---------------------------------------------------------------
  // Tab Items
  // ---------------------------------------------------------------
  const tabItems = [
    {
      key: "list",
      label: (
        <Space size={6}>
          <IconFileText size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span>{t.contract.tabList}</span>
        </Space>
      ),
      closable: false,
      children: (
        <ContractsTable
          filteredContracts={filteredContracts}
          loading={loading}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          pagination={pagination}
          setPagination={setPagination}
          isFiltering={isFiltering}
          columnSuggestions={columnSuggestions}
          storageKey={STORAGE_KEY_MAIN}
          onRefresh={fetchContracts}
          onCreate={handleOpenCreateContract}
          onEdit={handleEditContract}
          onCreateAddendum={handleCreateAddendum}
          onDelete={handleDeleteContract}
        />
      ),
    },
    ...(isEditTabOpen
      ? [
          {
            key: "edit",
            label: (
              <Space size={6}>
                <IconPencil size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
                <span>
                  {editingContract
                    ? `${t.contract.tabEdit}: ${editingContract.ContractCode || editingContract.Description || ""}`
                    : contractForm.getFieldValue("ParentContractCode")
                    ? `${t.contract.tabAddendum}: ${contractForm.getFieldValue("ParentContractCode")}`
                    : t.contract.tabNew}
                </span>
              </Space>
            ),
            closable: true,
            children: (
              <div style={{ background: "#fff", minHeight: "calc(100vh - 110px)" }}>
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
                  attachments={attachments}
                  selectedAttachmentKeys={selectedAttachmentKeys}
                  setSelectedAttachmentKeys={setSelectedAttachmentKeys}
                  onUploadAttachment={handleCustomUploadAttachment}
                  onDeleteAttachment={handleDeleteAttachment}
                  onBatchDeleteAttachments={handleBatchDeleteAttachments}
                  onToggleClientDoc={handleToggleClientDoc}
                  onFinish={handleSubmitContract}
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
        .contracts-page-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .contracts-page-tabs .ant-tabs-tab {
          background: #f7fbfa !important;
          border-color: #dce5e6 !important;
          border-radius: 8px 8px 0 0 !important;
          color: #718894 !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }
        .contracts-page-tabs .ant-tabs-tab:hover {
          color: #008f89 !important;
        }
        .contracts-page-tabs .ant-tabs-tab-active {
          background: #FFFFFF !important;
          border-color: #dce5e6 #dce5e6 #FFFFFF !important;
          color: #008f89 !important;
          font-weight: 600 !important;
        }
        .contracts-page-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #008f89 !important;
        }
        .contracts-page-tabs .ant-tabs-tab .ant-tabs-tab-remove {
          color: #94A3B8 !important;
        }
        .contracts-page-tabs .ant-tabs-tab .ant-tabs-tab-remove:hover {
          color: #EF4444 !important;
        }
      `}</style>
      <Tabs
        className="contracts-page-tabs"
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