"use client";

import { useState } from "react";
import type { FormInstance } from "antd";
import { message } from "antd";
import { warehouseApi } from "../../api";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { WarehouseItem } from "@/components/lov/WarehouseLovModal";

export function useRequisitionLov(
  form: FormInstance,
  onContractChange?: (contractId: any) => void
) {
  // 1. State LOV Hợp đồng CĐT (api/get-contract-list)
  const [isMainContractLovOpen, setIsMainContractLovOpen] = useState(false);
  const [mainContractList, setMainContractList] = useState<any[]>([]);
  const [loadingMainContracts, setLoadingMainContracts] = useState(false);
  const [mainContractSearchInput, setMainContractSearchInput] = useState("");
  const [selectedMainContractDisplay, setSelectedMainContractDisplay] = useState("");
  const [mainContractPagination, setMainContractPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchMainContracts = async (keyword = "", page = 1, pageSize = 20) => {
    setLoadingMainContracts(true);
    try {
      const data = await warehouseApi.getMainContracts({
        Keyword: keyword,
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

  const handleOpenMainContractLov = () => {
    setMainContractSearchInput("");
    fetchMainContracts("", 1, mainContractPagination.pageSize);
    setIsMainContractLovOpen(true);
  };

  const handleSelectMainContract = (record: any) => {
    const contractId = record.ContractId ?? record.MainContractId;
    const contractCode = record.ContractCode || record.MainContractCode || `#${contractId}`;
    const contractName = record.ContractName || record.MainContractName || record.Description || "";
    const contractor = record.Contractor || record.CustomerName || record.ClientName || "";
    const displayStr = contractName ? `${contractCode} - ${contractName}` : contractCode;

    form.setFieldsValue({
      contractCode: contractCode,
      mainContractId: contractId,
    });

    if (!form.getFieldValue("targetName") && contractor) {
      form.setFieldsValue({ targetName: contractor });
      setSelectedClientDisplay(contractor);
    }

    setSelectedMainContractDisplay(displayStr);
    setIsMainContractLovOpen(false);

    if (onContractChange) {
      onContractChange(contractId);
    }
  };

  const handleClearMainContract = () => {
    form.setFieldsValue({
      contractCode: undefined,
      mainContractId: undefined,
    });
    setSelectedMainContractDisplay("");
    if (onContractChange) {
      onContractChange(undefined);
    }
  };

  // 2. State LOV Đối tượng (api/get-client-list)
  const [isClientLovOpen, setIsClientLovOpen] = useState(false);
  const [clientList, setClientList] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [selectedClientDisplay, setSelectedClientDisplay] = useState("");

  const fetchClientList = async (keyword = "") => {
    setLoadingClients(true);
    try {
      const data = await warehouseApi.getClients({
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
      console.error("Error fetching client list:", e);
      message.error("Không thể tải danh sách đối tượng.");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleOpenClientLov = () => {
    setClientSearchInput("");
    fetchClientList("");
    setIsClientLovOpen(true);
  };

  const handleSelectClient = (record: any) => {
    const clientId = record.ClientId ?? record.CompanyId ?? record.Id;
    const clientName = record.CompanyName || record.Venname || `Đối tượng #${clientId}`;
    form.setFieldsValue({
      targetName: clientName,
      clientId: clientId,
    });
    setSelectedClientDisplay(clientName);
    setIsClientLovOpen(false);
  };

  const handleClearClient = () => {
    form.setFieldsValue({
      targetName: undefined,
      clientId: undefined,
    });
    setSelectedClientDisplay("");
  };

  // 3. State LOV Kho xuất (api/get-warehouse-list)
  const [isWarehouseLovOpen, setIsWarehouseLovOpen] = useState(false);
  const [warehouseList, setWarehouseList] = useState<WarehouseItem[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [warehouseSearchInput, setWarehouseSearchInput] = useState("");
  const [selectedWarehouseDisplay, setSelectedWarehouseDisplay] = useState("");

  const fetchWarehouseList = async (keyword = "") => {
    setLoadingWarehouses(true);
    try {
      const data = await warehouseApi.getWarehouseList({
        WSId: "",
        PageNum: 1,
        PageSize: 50,
        Keyword: keyword,
      });
      const list = extractApiList<WarehouseItem>(data);
      setWarehouseList(list);
      return list;
    } catch (e) {
      console.error("Error fetching warehouse list:", e);
      message.error("Không thể tải danh sách kho xuất.");
      return [];
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const handleOpenWarehouseLov = () => {
    setWarehouseSearchInput("");
    fetchWarehouseList("");
    setIsWarehouseLovOpen(true);
  };

  const handleSelectWarehouse = (record: WarehouseItem | any) => {
    const whId = record.WarehouseId ?? record.id ?? record.Id;
    const whName = record.WarehouseName || record.Name || (whId ? `Kho #${whId}` : "");
    form.setFieldsValue({
      warehouseId: whId,
      warehouseName: whName,
    });
    setSelectedWarehouseDisplay(whName);
    setIsWarehouseLovOpen(false);
  };

  const handleClearWarehouse = () => {
    form.setFieldsValue({
      warehouseId: undefined,
      warehouseName: undefined,
    });
    setSelectedWarehouseDisplay("");
  };

  return {
    // MainContract
    isMainContractLovOpen,
    setIsMainContractLovOpen,
    mainContractList,
    loadingMainContracts,
    mainContractSearchInput,
    setMainContractSearchInput,
    selectedMainContractDisplay,
    setSelectedMainContractDisplay,
    mainContractPagination,
    fetchMainContracts,
    handleOpenMainContractLov,
    handleSelectMainContract,
    handleClearMainContract,
    // Client
    isClientLovOpen,
    setIsClientLovOpen,
    clientList,
    loadingClients,
    clientSearchInput,
    setClientSearchInput,
    selectedClientDisplay,
    setSelectedClientDisplay,
    fetchClientList,
    handleOpenClientLov,
    handleSelectClient,
    handleClearClient,
    // Warehouse
    isWarehouseLovOpen,
    setIsWarehouseLovOpen,
    warehouseList,
    loadingWarehouses,
    warehouseSearchInput,
    setWarehouseSearchInput,
    selectedWarehouseDisplay,
    setSelectedWarehouseDisplay,
    fetchWarehouseList,
    handleOpenWarehouseLov,
    handleSelectWarehouse,
    handleClearWarehouse,
  };
}
