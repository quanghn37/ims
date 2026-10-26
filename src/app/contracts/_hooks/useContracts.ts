import { useEffect, useState } from "react";
import { message } from "antd";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useColumnFiltering } from "@/lib/table-utils";
import { ContractItem } from "@/types";
import { contractsApi } from "../api";

type PaginationState = { current: number; pageSize: number; total: number };

export const contractColumnFields: Record<string, string[]> = {
  ContractCode: ["ContractCode", "Contractcode", "Code"],
  S_Type: ["S_Type", "s_type", "S_type", "ContractCategory", "Category"],
  MainCode: ["MainCode", "MainContractCode", "MainContractName"],
  MasterContract: ["MasterContract", "MasterContractCode", "MasterContractNo", "ParentContractCode", "ParentCode"],
  QuotationCode: ["QuotationCode", "Quotationcode", "SourceCode"],
  Venname: ["Venname", "ClientName", "CompanyName", "VendorName"],
  Description: ["Description", "Remarks", "ContractName"],
  PayTerms: ["PayTerms", "PaymentTerm", "PaytermId"],
  ContractDate: ["ContractDate", "Contractdate", "SignDate", "Signdate"],
  StatusName: ["StatusName", "Status", "StatusCode"],
  CurrentAssignee: ["CurrentAssignee", "Assignee", "CurrentRole"],
  CreatedBy: ["CreatedBy", "Createdby"],
};

const getContractSearchValues = (contract: ContractItem) => [
  contract.Description ?? contract.Remarks ?? contract.ContractName ?? "",
  contract.ContractCode ?? contract.Contractcode ?? contract.Code ?? "",
  contract.S_Type ?? (contract as any).s_type ?? (contract as any).S_type ?? contract.ContractCategory ?? "",
  contract.Venname ?? contract.ClientName ?? contract.CompanyName ?? "",
  contract.MainCode ?? contract.MainContractCode ?? "",
  (contract as any).MasterContract ?? (contract as any).MasterContractCode ?? (contract as any).ParentContractCode ?? "",
  contract.QuotationCode ?? contract.Quotationcode ?? "",
  contract.StatusName ?? contract.Status ?? "",
  contract.CurrentAssignee &&
  !["đã hoàn tất", "hoàn tất", "completed", "done"].includes(contract.CurrentAssignee.trim().toLowerCase())
    ? contract.CurrentAssignee
    : "",
  contract.CreatedBy ?? contract.Createdby ?? "",
];

export function useContracts() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 100, total: 0 });
  const { columnFilters, setColumnFilters, columnSuggestions, filteredRows: filteredContracts, isFiltering } = useColumnFiltering({
    rows: contracts,
    fields: contractColumnFields,
    searchKeyword,
    getSearchValues: getContractSearchValues,
  });

  const fetchContracts = async (page = 1, pageSize = 100) => {
    setLoading(true);
    try {
      const data = await contractsApi.getContracts({
        DisplayMode: "mat_equip",
      });
      const list = extractApiList<ContractItem>(data);
      setContracts(list);
      setPagination({ current: page, pageSize, total: extractTotalRows(data, list.length) });
    } catch (e: any) {
      console.error("Error fetching contracts:", e);
      message.error("Không thể tải danh sách hợp đồng NCC.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(1, 100); }, []);

  useEffect(() => {
    setPagination((previous) => previous.current !== 1 ? { ...previous, current: 1 } : previous);
  }, [searchKeyword, columnFilters]);

  return {
    contracts, loading, searchKeyword, setSearchKeyword, columnFilters, setColumnFilters,
    pagination, setPagination, fetchContracts, columnSuggestions, filteredContracts, isFiltering,
  };
}
