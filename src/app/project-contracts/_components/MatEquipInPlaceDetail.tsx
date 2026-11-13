"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Form, message, Spin } from "antd";
import dayjs from "dayjs";
import ContractFormDrawer from "@/app/contracts/_components/ContractFormDrawer";
import { contractsApi } from "@/app/contracts/api";
import { parseDateSafe } from "@/app/contracts/types";
import { ContractItem } from "@/types";
import { AttachmentFile } from "@/components/common/ErpAttachmentsModal";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";
import { useAuth } from "@/lib/auth-context";

const ClientLovModal = dynamic(() => import("@/components/lov/ClientLovModal"), { ssr: false });
const MainContractLovModal = dynamic(() => import("@/components/lov/MainContractLovModal"), { ssr: false });

interface MatEquipInPlaceDetailProps {
  contractId?: number | string | null;
  parentId?: number | string | null;
  parentRecord?: any;
  action?: "edit" | "addendum" | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MatEquipInPlaceDetail({
  contractId,
  parentId,
  parentRecord,
  action = "edit",
  onClose,
  onSuccess,
}: MatEquipInPlaceDetailProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const currentUserId = user?.LogIn || "";

  const [contractForm] = Form.useForm();
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [loadingSingleContract, setLoadingSingleContract] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // LOVs State
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
    const cId = record.ContractId ?? record.MainContractId;
    const cCode = record.ContractCode || record.MainContractCode || `#${cId}`;
    const cName = record.ContractName || record.MainContractName || record.Description || "";
    const displayStr = cName ? `${cCode} - ${cName}` : cCode;
    contractForm.setFieldsValue({
      MainContractId: cId,
    });
    setSelectedMainContractDisplay(displayStr);
    setIsMainContractLovOpen(false);
  };

  const handleClearMainContract = () => {
    contractForm.setFieldsValue({ MainContractId: undefined });
    setSelectedMainContractDisplay("");
  };

  // Áp dụng dữ liệu hợp đồng vào Form
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
      (record as any).ParentContractCode ??
      "";

    const rawParentId = (record as any).ParentContractId || (record as any).ParentId || (record as any).MasterContractId;
    const parentContractId = rawParentId ? Number(rawParentId) : undefined;

    const sTypeVal =
      record.S_Type ??
      (record as any).s_type ??
      (record as any).ContractCategory ??
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
        undefined,
    });

    setAttachments([]);
  }, [contractForm]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    if (action === "addendum" && (parentId || parentRecord)) {
      const applyParent = (parent: any) => {
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
      };

      if (parentRecord) {
        applyParent(parentRecord);
        setLoadingSingleContract(false);
      } else {
        const loadParent = async () => {
          setLoadingSingleContract(true);
          try {
            const data = await contractsApi.getContracts(
              {
                DisplayMode: "mat_equip",
                ContractId: parentId || undefined,
              },
              { skipCache: true }
            );
            const list = extractApiList<ContractItem>(data);
            const parent = list.find((c) => Number(c.ContractId) === Number(parentId)) || list[0];
            if (parent) {
              applyParent(parent);
            }
          } catch (e) {
            console.error("Lỗi tải HĐ gốc tạo phụ lục:", e);
          } finally {
            setLoadingSingleContract(false);
          }
        };
        loadParent();
      }
    } else if (contractId) {
      if (parentRecord) {
        applyContractToForm(parentRecord);
        setLoadingSingleContract(false);
      }
      const loadSingle = async () => {
        if (!parentRecord) setLoadingSingleContract(true);
        try {
          const data = await contractsApi.getContracts(
            {
              DisplayMode: "mat_equip",
              ContractId: contractId || undefined,
            },
            { skipCache: true }
          );
          const list = extractApiList<ContractItem>(data);
          const contract = list.find((c) => Number(c.ContractId) === Number(contractId)) || list[0];
          if (contract) {
            applyContractToForm(contract);
          } else if (!parentRecord) {
            message.error("Không tìm thấy thông tin hợp đồng này.");
          }
        } catch (err) {
          console.error("Lỗi tải chi tiết hợp đồng:", err);
          if (!parentRecord) message.error("Không thể tải thông tin hợp đồng.");
        } finally {
          setLoadingSingleContract(false);
        }
      };
      loadSingle();
    }
  }, [action, contractId, parentId, applyContractToForm, contractForm]);

  // Xử lý lưu hợp đồng / phụ lục
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
        message.warning("Vui lòng chọn loại hợp đồng.");
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
        message.success(language === "en" ? "Contract updated successfully!" : "Cập nhật Hợp đồng thành công!");
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
        onSuccess?.();
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

        message.success(language === "en" ? "Addendum created successfully!" : "Tạo mới Phụ lục HĐ thành công!");
        onSuccess?.();

        if (newContractId) {
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

  const handleUploadAttachment = ({ file, onSuccess: uploadSuccess }: any) => {
    setTimeout(() => {
      const sizeStr = file.size
        ? file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`
        : "1.5 MB";
      const newFile: AttachmentFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        fileName: file.name,
        fileUrl: "#",
        uploadedBy: currentUserId,
        uploadingDate: dayjs().format("DD/MM/YYYY HH:mm"),
        isClientDoc: false,
        hasSign: false,
        folder: "project_docs",
        fileSize: sizeStr,
      };
      setAttachments((prev) => [newFile, ...prev]);
      uploadSuccess?.("ok");
      message.success(`Đã tải lên: ${file.name}`);
    }, 400);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    message.success("Đã xóa tệp đính kèm");
  };

  const handleToggleClientDoc = (id: string, checked: boolean) => {
    setAttachments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isClientDoc: checked } : item))
    );
  };

  if (loadingSingleContract) {
    return (
      <div
        style={{
          flex: "1 1 0%",
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 14, color: "#008f89", fontWeight: 600, fontSize: 14 }}>
          {language === "en" ? "Loading contract details..." : "Đang tải thông tin chi tiết hợp đồng..."}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: "1 1 0%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        paddingTop: 6,
      }}
    >
      <ContractFormDrawer
        open={true}
        onClose={onClose}
        editingContract={editingContract}
        form={contractForm}
        submitting={submittingContract}
        selectedClientDisplay={selectedClientDisplay}
        onOpenClientLov={() => {
          fetchClientList();
          setIsClientLovOpen(true);
        }}
        onClearClient={handleClearClient}
        selectedMainContractDisplay={selectedMainContractDisplay}
        onOpenMainContractLov={() => {
          fetchMainContracts("", 1, 20);
          setIsMainContractLovOpen(true);
        }}
        onClearMainContract={handleClearMainContract}
        attachments={attachments}
        onUploadAttachment={handleUploadAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        onToggleClientDoc={handleToggleClientDoc}
        onFinish={handleSubmitContract}
        onRefreshContracts={() => onSuccess?.()}
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
    </div>
  );
}
