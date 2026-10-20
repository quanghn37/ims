"use client";

import { useState, useCallback } from "react";
import { purchaseOrdersApi } from "../api";
import { extractApiList } from "@/lib/api-client";
import { WarehouseItem } from "@/components/lov/WarehouseLovModal";

export function useOrderLovModals(form: any) {
  // Client LOV State
  const [isClientLovOpen, setIsClientLovOpen] = useState(false);
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [selectedClientDisplay, setSelectedClientDisplay] = useState("");
  const [clientList, setClientList] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Contract LOV State
  const [isContractLovOpen, setIsContractLovOpen] = useState(false);
  const [contractSearchInput, setContractSearchInput] = useState("");
  const [selectedContractDisplay, setSelectedContractDisplay] = useState("");
  const [contractRefList, setContractRefList] = useState<any[]>([]);
  const [loadingContractRef, setLoadingContractRef] = useState(false);

  // PriceList LOV State
  const [isPriceListLovOpen, setIsPriceListLovOpen] = useState(false);
  const [priceListSearchInput, setPriceListSearchInput] = useState("");
  const [selectedPriceListDisplay, setSelectedPriceListDisplay] = useState("");
  const [priceListRefList, setPriceListRefList] = useState<any[]>([]);
  const [loadingPriceListRef, setLoadingPriceListRef] = useState(false);

  // Warehouse LOV State
  const [isWarehouseLovOpen, setIsWarehouseLovOpen] = useState(false);
  const [warehouseSearchInput, setWarehouseSearchInput] = useState("");
  const [selectedWarehouseDisplay, setSelectedWarehouseDisplay] = useState("");
  const [warehouseList, setWarehouseList] = useState<WarehouseItem[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  // Fetch functions
  const fetchClientList = useCallback(async (keyword = "") => {
    setLoadingClients(true);
    try {
      const data = await purchaseOrdersApi.getClients({
        Keyword: keyword,
        Page: 1,
        PageSize: 30,
        InMain: null,
        DisplayMode: "full_list",
        ContractId: "",
        WSId: "",
      });
      setClientList(extractApiList(data));
    } catch (e) {
      console.error("Error fetching client list:", e);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const fetchContractRefList = useCallback(async (keyword = "", clientId: any = "") => {
    setLoadingContractRef(true);
    try {
      const data = await purchaseOrdersApi.getContracts({
        DisplayMode: "mat_equip",
        Keyword: keyword,
        ClientId: clientId || "",
        WSId: "",
        PageNum: 1,
        PageSize: 30,
      });
      setContractRefList(extractApiList(data));
    } catch (e) {
      console.error("Error fetching contract ref list:", e);
    } finally {
      setLoadingContractRef(false);
    }
  }, []);

  const fetchPriceListRefList = useCallback(
    async (keyword = "", clientId: any = "", contractId: any = "") => {
      setLoadingPriceListRef(true);
      try {
        if (contractId) {
          const res = await purchaseOrdersApi.getQuotations({
            DisplayMode: "quotation_by_contract",
            ContractId: Number(contractId),
          });
          let list = extractApiList(res);
          if (keyword) {
            const kw = keyword.toLowerCase();
            list = list.filter(
              (p: any) =>
                (p.ContractCode && p.ContractCode.toLowerCase().includes(kw)) ||
                (p.ContractName && p.ContractName.toLowerCase().includes(kw)) ||
                (p.Description && p.Description.toLowerCase().includes(kw))
            );
          }
          setPriceListRefList(list);
          return list;
        } else {
          setPriceListRefList([]);
          return [];
        }
      } catch (e) {
        console.error("Error fetching price lists:", e);
        return [];
      } finally {
        setLoadingPriceListRef(false);
      }
    },
    []
  );

  const fetchWarehouseList = useCallback(async (keyword = "") => {
    setLoadingWarehouses(true);
    try {
      const data = await purchaseOrdersApi.getWarehouseList({
        Keyword: keyword,
        PageNum: 1,
        PageSize: 50,
      });
      setWarehouseList(extractApiList<WarehouseItem>(data));
    } catch (e) {
      console.error("Error fetching warehouse list:", e);
    } finally {
      setLoadingWarehouses(false);
    }
  }, []);

  // Selection handlers
  const handleSelectClient = useCallback(
    (record: any) => {
      const clientId = record.ClientId ?? record.CompanyId ?? record.Id;
      const clientName = record.CompanyName || record.Venname || `NCC #${clientId}`;
      form.setFieldsValue({ ClientId: clientId, ParentId: undefined, SourceId: undefined });
      setSelectedClientDisplay(clientName);
      setSelectedContractDisplay("");
      setSelectedPriceListDisplay("");
      setContractRefList([]);
      setPriceListRefList([]);
      setIsClientLovOpen(false);
    },
    [form]
  );

  const handleClearClient = useCallback(() => {
    form.setFieldsValue({ ClientId: undefined, ParentId: undefined, SourceId: undefined });
    setSelectedClientDisplay("");
    setSelectedContractDisplay("");
    setSelectedPriceListDisplay("");
    setContractRefList([]);
    setPriceListRefList([]);
  }, [form]);

  const handleSelectContract = useCallback(
    (record: any) => {
      const contractId = record.ContractId;
      const contractDisplay = record.ContractCode
        ? `${record.ContractCode} - ${record.Description || ""}`
        : record.Description || `${contractId}`;
      const contractSubconOf =
        (record as any).SubconOf ??
        (record as any).subconof ??
        (record as any).SubConOf ??
        (record as any).MaincontractId ??
        (record as any).MainContractId ??
        contractId;
      form.setFieldsValue({ ParentId: contractId, SubconOf: contractSubconOf });
      setSelectedContractDisplay(contractDisplay ? String(contractDisplay).replace(/^#+/, "").trim() : "");

      const nccId = record.ClientID ?? record.ClientId ?? record.Venid ?? record.VendorId ?? record.SupplierId;
      let nccName = record.Venname || record.ClientName || record.VendorName || record.CompanyName || "";

      if (!nccName && nccId) {
        const foundInList = clientList.find(
          (c) => String(c.ClientId ?? c.CompanyId ?? c.Id) === String(nccId)
        );
        if (foundInList) {
          nccName = foundInList.CompanyName || foundInList.ClientName || foundInList.Name;
        } else {
          nccName = `NCC #${nccId}`;
        }
      }

      if (nccId) {
        form.setFieldsValue({ ClientId: nccId });
        setSelectedClientDisplay(nccName);
        setClientList((prev) => {
          const exists = prev.some((c) => String(c.ClientId ?? c.CompanyId ?? c.Id) === String(nccId));
          if (exists) return prev;
          return [
            ...prev,
            {
              ClientId: nccId,
              CompanyName: nccName,
            },
          ];
        });
      }

      form.setFieldsValue({ SourceId: undefined });
      setSelectedPriceListDisplay("");
      const effectiveClientId = nccId || form.getFieldValue("ClientId");
      fetchPriceListRefList("", effectiveClientId, contractId).then((plList) => {
        if (plList && plList.length === 1) {
          const singlePl = plList[0];
          const plName = singlePl.ContractName || singlePl.Description || "";
          const autoPlText = singlePl.ContractCode
            ? (plName ? `${singlePl.ContractCode} - ${plName}` : singlePl.ContractCode)
            : `${singlePl.ContractId}`;
          setSelectedPriceListDisplay(autoPlText ? String(autoPlText).replace(/^#+/, "").trim() : "");
          form.setFieldsValue({ SourceId: singlePl.ContractId });
        }
      });
      setIsContractLovOpen(false);
    },
    [form, clientList, fetchPriceListRefList]
  );

  const handleClearContract = useCallback(() => {
    form.setFieldsValue({ ParentId: undefined, SourceId: undefined, ClientId: undefined });
    setSelectedContractDisplay("");
    setSelectedPriceListDisplay("");
    setSelectedClientDisplay("");
    setPriceListRefList([]);
  }, [form]);

  const handleSelectPriceList = useCallback(
    (record: any) => {
      const plId = record.ContractId;
      const plName = record.ContractName || record.Description || "";
      const plDisplay = record.ContractCode
        ? (plName ? `${record.ContractCode} - ${plName}` : record.ContractCode)
        : plName || `${plId}`;
      form.setFieldsValue({ SourceId: plId });
      setSelectedPriceListDisplay(plDisplay ? String(plDisplay).replace(/^#+/, "").trim() : "");
      setIsPriceListLovOpen(false);
    },
    [form]
  );

  const handleClearPriceList = useCallback(() => {
    form.setFieldsValue({ SourceId: undefined });
    setSelectedPriceListDisplay("");
  }, [form]);

  const handleSelectWarehouse = useCallback(
    (record: WarehouseItem | any) => {
      const warehouseId = record.WarehouseId ?? record.id ?? record.Id;
      form.setFieldsValue({ WarehouseId: warehouseId });
      setSelectedWarehouseDisplay(record.WarehouseName || (warehouseId ? `Kho #${warehouseId}` : ""));
      setIsWarehouseLovOpen(false);
    },
    [form]
  );

  const handleClearWarehouse = useCallback(() => {
    form.setFieldsValue({ WarehouseId: undefined });
    setSelectedWarehouseDisplay("");
  }, [form]);

  return {
    // Client LOV
    isClientLovOpen,
    setIsClientLovOpen,
    clientSearchInput,
    setClientSearchInput,
    selectedClientDisplay,
    setSelectedClientDisplay,
    clientList,
    setClientList,
    loadingClients,
    fetchClientList,
    handleSelectClient,
    handleClearClient,

    // Contract LOV
    isContractLovOpen,
    setIsContractLovOpen,
    contractSearchInput,
    setContractSearchInput,
    selectedContractDisplay,
    setSelectedContractDisplay,
    contractRefList,
    setContractRefList,
    loadingContractRef,
    fetchContractRefList,
    handleSelectContract,
    handleClearContract,

    // PriceList LOV
    isPriceListLovOpen,
    setIsPriceListLovOpen,
    priceListSearchInput,
    setPriceListSearchInput,
    selectedPriceListDisplay,
    setSelectedPriceListDisplay,
    priceListRefList,
    setPriceListRefList,
    loadingPriceListRef,
    fetchPriceListRefList,
    handleSelectPriceList,
    handleClearPriceList,

    // Warehouse LOV
    isWarehouseLovOpen,
    setIsWarehouseLovOpen,
    warehouseSearchInput,
    setWarehouseSearchInput,
    selectedWarehouseDisplay,
    setSelectedWarehouseDisplay,
    warehouseList,
    setWarehouseList,
    loadingWarehouses,
    fetchWarehouseList,
    handleSelectWarehouse,
    handleClearWarehouse,
  };
}
