"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { Form, message, Spin } from "antd";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { contractsApi } from "./api";
import { ContractItem } from "@/types";
import dayjs from "dayjs";

import { useAuth } from "@/lib/auth-context";
import { AttachmentFile, parseDateSafe } from "./_components/types";
import ContractsTable from "./_components/ContractsTable";
import { useContracts } from "./_hooks/useContracts";
import { useTranslation } from "@/locales/LanguageContext";
import { ErpPageContainer, ErpDetailContainer } from "@/components/layout/ErpPageContainer";

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

function ContractsPageContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const queryContractId = searchParams.get("id") || searchParams.get("contractId");
  const queryAction = searchParams.get("action");
  const queryParentId = searchParams.get("parentId");

  const isDetailPage = Boolean(queryContractId || queryAction);
  const currentUserId = user?.LogIn || "";
  const STORAGE_KEY_MAIN = `table_cols_contracts_main_${currentUserId}`;

  // ===============================================================
  // STATE CHO MÀN HÌNH DANH SÁCH (KHI Ở TAB DANH SÁCH /contracts)
  // ===============================================================
  const {
    contracts,
    loading: loadingList,
    searchKeyword,
    setSearchKeyword,
    columnFilters,
    setColumnFilters,
    pagination,
    setPagination,
    fetchContracts,
    columnSuggestions,
    filteredContracts,
    isFiltering,
  } = useContracts();

  // Tự động đồng bộ danh sách khi có cập nhật từ tab chi tiết khác
  useEffect(() => {
    if (isDetailPage) return;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "consims_contract_updated") {
        fetchContracts(pagination.current, pagination.pageSize);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isDetailPage, pagination.current, pagination.pageSize, fetchContracts]);

  // ===============================================================
  // STATE CHO MÀN HÌNH CHI TIẾT (KHI MỞ TAB TRÌNH DUYỆT RIÊNG)
  // ===============================================================
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null);
  const [contractForm] = Form.useForm();
  const [submittingContract, setSubmittingContract] = useState(false);
  const [loadingSingleContract, setLoadingSingleContract] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachmentKeys, setSelectedAttachmentKeys] = useState<React.Key[]>([]);

  // LOVs
  const [clientList, setClientList] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isClientLovOpen, setIsClientLovOpen] = useState(false);
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [selectedClientDisplay, setSelectedClientDisplay] = useState("");

  const [mainContractList, setMainContractList] = useState<any[]>([]);
  const [loadingMainContracts, setLoadingMainContracts] = useState(false);
  const [isMainContractLovOpen, setIsMainContractLovOpen] = useState(false);
  const [mainContractSearchInput, setMainContractSearchInput] = useState("");
  const [selectedMainContractDisplay, setSelectedMainContractDisplay] = useState("");
  const [mainContractPagination, setMainContractPagination] = useState({ current: 1, pageSize: 20, total: 0 });

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
    contractForm.setFieldsValue({ MainContractId: undefined });
    setSelectedMainContractDisplay("");
  };

  // Điền dữ liệu một bản ghi hợp đồng vào Form
  const applyContractToForm = useCallback((record: ContractItem) => {
    setEditingContract(record);
    contractForm.resetFields();

    const clientId = record.ClientID ?? record.ClientId ?? undefined;
    const clientName = record.Venname || record.ClientName || (clientId ? `NCC #${clientId}` : "");
    setSelectedClientDisplay(clientName);

    const mainContractId = record.MainContractId ?? (record as any).SubconOf ?? (record as any).MainId ?? undefined;
    const mainContractDisplay = record.MainCode || record.MainContractCode || (mainContractId ? `HĐ #${mainContractId}` : "");
    setSelectedMainContractDisplay(mainContractDisplay);

    const sourceId = record.SourceId ? Number(record.SourceId) : undefined;

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

    const sTypeVal =
      record.S_Type ??
      (record as any).s_type ??
      (record as any).S_type ??
      (record as any).ContractCategory ??
      (record as any).Category ??
      undefined;

    contractForm.setFieldsValue({
      ClientId: clientId,
      MainContractId: mainContractId,
      ContractCode: record.ContractCode || "",
      ParentContractId: parentContractId || undefined,
      ParentContractCode: masterContractVal || "",
      SourceId: sourceId,
      Amount: Number((record as any).ContractedAmount ?? record.Amount ?? 0),
      Description: record.Description || "",
      Currency: record.Currency || "VND",
      SignDate: parseDateSafe(record.ContractDate || record.Contractdate || (record as any).SignDate) || dayjs(),
      FromDate: parseDateSafe(record.StartDate || record.FromDate),
      ToDate: parseDateSafe(record.EndDate || record.ToDate),
      IsVcontract: Boolean((record as any).IsVcontract ?? (record as any).IsVContract),
      S_Type: sTypeVal,
      ContractCategory: sTypeVal,
      PayTerms:
        record.PayTerms ||
        (record as any).PaymentTerm ||
        (record as any).PaytermId ||
        (record as any).PaytermsId ||
        undefined,
    });

    setAttachments([]);
    setSelectedAttachmentKeys([]);
  }, [contractForm]);

  // Khi mở tab trình duyệt có queryContractId: tự động tải thông tin hợp đồng
  useEffect(() => {
    if (!queryContractId) return;

    const loadSingleContract = async () => {
      setLoadingSingleContract(true);
      try {
        const data = await contractsApi.getContracts(
          {
            DisplayMode: "mat_equip",
            ContractId: queryContractId,
          },
          { skipCache: true }
        );
        const list = extractApiList<ContractItem>(data);
        const contract = list.find((c) => Number(c.ContractId) === Number(queryContractId)) || list[0];
        if (contract) {
          applyContractToForm(contract);
          if (typeof document !== "undefined") {
            document.title = `Chi tiết HĐ: ${contract.ContractCode || queryContractId}`;
          }
        } else {
          message.error("Không tìm thấy thông tin hợp đồng này.");
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết hợp đồng:", err);
        message.error("Không thể tải thông tin hợp đồng.");
      } finally {
        setLoadingSingleContract(false);
      }
    };

    loadSingleContract();
  }, [queryContractId, applyContractToForm]);

  // Khi mở tab trình duyệt với action=create hoặc action=addendum
  useEffect(() => {
    if (queryAction === "create") {
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
        S_Type: undefined,
        ContractCategory: undefined,
        ContractCode: "",
        ParentContractId: undefined,
        ParentContractCode: "",
        PayTerms: undefined,
      });
      setAttachments([]);
      setSelectedAttachmentKeys([]);
      if (typeof document !== "undefined") {
        document.title = "Tạo Hợp đồng mới";
      }
    } else if (queryAction === "addendum" && queryParentId) {
      const loadParent = async () => {
        try {
          const data = await contractsApi.getContracts(
            {
              DisplayMode: "mat_equip",
              ContractId: queryParentId,
            },
            { skipCache: true }
          );
          const list = extractApiList<ContractItem>(data);
          const parent = list.find((c) => Number(c.ContractId) === Number(queryParentId)) || list[0];
          if (parent) {
            setEditingContract(null);
            contractForm.resetFields();
            const clientId = parent.ClientID ?? parent.ClientId ?? undefined;
            const clientName = parent.Venname || parent.ClientName || (clientId ? `NCC #${clientId}` : "");
            setSelectedClientDisplay(clientName);

            const mainContractId = parent.MainContractId ?? (parent as any).SubconOf ?? (parent as any).MainId ?? undefined;
            const mainContractDisplay = parent.MainCode || parent.MainContractCode || (mainContractId ? `HĐ #${mainContractId}` : "");
            setSelectedMainContractDisplay(mainContractDisplay);

            const sTypeVal = parent.S_Type ?? (parent as any).s_type ?? (parent as any).ContractCategory ?? undefined;

            contractForm.setFieldsValue({
              ClientId: clientId,
              MainContractId: mainContractId,
              ContractCode: "",
              ParentContractId: Number(parent.ContractId),
              ParentContractCode: parent.ContractCode || String(parent.ContractId),
              Description: `Phụ lục cho HĐ ${parent.ContractCode || parent.ContractId}`,
              Currency: parent.Currency || "VND",
              Amount: 0,
              SignDate: dayjs(),
              FromDate: parseDateSafe(parent.StartDate || parent.FromDate) || dayjs(),
              ToDate: parseDateSafe(parent.EndDate || parent.ToDate) || null,
              IsVcontract: false,
              S_Type: sTypeVal,
              ContractCategory: sTypeVal,
              PayTerms: parent.PayTerms || (parent as any).PaymentTerm || undefined,
            });
            if (typeof document !== "undefined") {
              document.title = `Tạo Phụ lục cho HĐ: ${parent.ContractCode || queryParentId}`;
            }
          }
        } catch (e) {
          console.error("Lỗi tải HĐ gốc tạo phụ lục:", e);
        }
      };
      loadParent();
    }
  }, [queryAction, queryParentId, contractForm]);

  // Xử lý lưu hợp đồng
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
      if (inputParentCode && values.ParentContractId && Number(values.ParentContractId) !== Number(mainContractIdVal)) {
        parentContractId = Number(values.ParentContractId);
      }

      const paytermVal =
        values.PayTerms !== undefined && values.PayTerms !== null && values.PayTerms !== ""
          ? Number.isFinite(Number(values.PayTerms))
            ? Number(values.PayTerms)
            : values.PayTerms
          : undefined;

      const sTypeValue = values.S_Type || values.ContractCategory || "";
      if (!sTypeValue) {
        message.warning(t.contract.contractCategoryRequired || "Vui lòng chọn loại hợp đồng.");
        setSubmittingContract(false);
        return;
      }

      if (editingContract) {
        const rawEditingClientId = editingContract.ClientID ?? editingContract.ClientId;
        const updatePayload = {
          WSId: "",
          ContractId: Number(editingContract.ContractId),
          ContractType: "mat_equip",
          S_Type: sTypeValue,
          s_type: sTypeValue,
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
          ContractCategory: sTypeValue,
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
                S_Type: sTypeValue,
                s_type: sTypeValue,
                ContractCategory: sTypeValue,
                ContractedAmount: updatePayload.Amount,
                StartDate: updatePayload.FromDate,
                EndDate: updatePayload.ToDate,
                PayTerms: values.PayTerms,
              }
            : prev
        );
        try {
          localStorage.setItem("consims_contract_updated", String(Date.now()));
        } catch (e) {}
      } else {
        const createPayload = {
          WSId: "",
          ContractType: "mat_equip",
          S_Type: sTypeValue,
          s_type: sTypeValue,
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
          ContractCategory: sTypeValue,
          Currency: values.Currency || "VND",
          PaytermId: paytermVal,
        };

        const createRes: any = await contractsApi.updateContractInfo(createPayload, "Create_Contract");
        const newContractId = Number(
          createRes?.ContractId ||
            createRes?.Data?.ContractId ||
            createRes?.data?.ContractId ||
            createRes?.Data?.[0]?.ContractId ||
            createRes?.data?.[0]?.ContractId ||
            createRes?.[0]?.ContractId ||
            createRes?.Id
        );

        message.success("Tạo mới Hợp đồng NCC thành công!");
        try {
          localStorage.setItem("consims_contract_updated", String(Date.now()));
        } catch (e) {}

        if (newContractId) {
          // Chuyển URL tab này sang chế độ chi tiết của HĐ mới tạo
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/contracts?id=${newContractId}`);
          }
          const refreshedData = await contractsApi.getContracts(
            { DisplayMode: "mat_equip", ContractId: newContractId },
            { skipCache: true }
          );
          const refreshedList = extractApiList<ContractItem>(refreshedData);
          const createdContract = refreshedList.find((c: any) => Number(c.ContractId) === newContractId) || refreshedList[0];
          if (createdContract) {
            applyContractToForm(createdContract);
          }
        }
      }
    } catch (e: any) {
      message.error(e.message || "Lưu hợp đồng thất bại.");
    } finally {
      setSubmittingContract(false);
    }
  };

  // Xóa hợp đồng tại danh sách
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
      try {
        localStorage.setItem("consims_contract_updated", String(Date.now()));
      } catch (e) {}
    } catch (e: any) {
      message.error(e.message || "Xóa hợp đồng thất bại.");
    }
  };

  // Attachments
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

  // ===============================================================
  // GIAO DIỆN 1: MỞ TAB TRÌNH DUYỆT CHI TIẾT HỢP ĐỒNG (KHI CÓ ?id= HOẶC ?action=)
  // ===============================================================
  if (isDetailPage) {
    if (loadingSingleContract) {
      return (
        <div
          style={{
            margin: "-16px -20px -24px -20px",
            minHeight: "calc(100vh - 48px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFFFF",
          }}
        >
          <Spin size="large" />
          <div style={{ marginTop: 14, color: "#008f89", fontWeight: 600, fontSize: 14 }}>
            Đang tải thông tin chi tiết hợp đồng...
          </div>
        </div>
      );
    }

    return (
      <ErpDetailContainer>
        <ContractFormDrawer
          open={true}
          onClose={() => {
            if (typeof window !== "undefined") {
              if (window.opener) {
                window.close();
              } else {
                window.location.href = "/contracts";
              }
            }
          }}
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
          onRefreshContracts={() => {
            try {
              localStorage.setItem("consims_contract_updated", String(Date.now()));
            } catch (e) {}
          }}
          onUpdateEditingContract={setEditingContract}
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
      </ErpDetailContainer>
    );
  }

  // ===============================================================
  // GIAO DIỆN 2: MÀN HÌNH DANH SÁCH HỢP ĐỒNG CHÍNH (/contracts) - FULL TRÀN VIỀN
  // ===============================================================
  return (
    <ErpPageContainer>
      <ContractsTable
        filteredContracts={filteredContracts}
        loading={loadingList}
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
        onCreate={() => {
          window.open("/contracts?action=create", "_blank");
        }}
        onEdit={(record) => {
          window.open(`/contracts?id=${record.ContractId}`, "_blank");
        }}
        onCreateAddendum={(record) => {
          window.open(`/contracts?action=addendum&parentId=${record.ContractId}`, "_blank");
        }}
        onDelete={handleDeleteContract}
      />
    </ErpPageContainer>
  );
}

export default function ContractsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 60, textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: "#718894", fontSize: 13 }}>
            Đang tải dữ liệu Hợp đồng...
          </div>
        </div>
      }
    >
      <ContractsPageContent />
    </Suspense>
  );
}
