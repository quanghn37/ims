import { useEffect, useState } from "react";
import { message } from "antd";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useColumnFiltering } from "@/lib/table-utils";
import { getStatusLabel } from "@/config/statusConfig";
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
  StatusName: ["StatusName"],
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
  contract.StatusName ?? getStatusLabel((contract as any).StatusCode, "vi") ?? "",
  contract.CurrentAssignee &&
  !["đã hoàn tất", "hoàn tất", "completed", "done"].includes(contract.CurrentAssignee.trim().toLowerCase())
    ? contract.CurrentAssignee
    : "",
  contract.CreatedBy ?? contract.Createdby ?? "",
];

export function useContracts(enabled = true) {
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
      const list = extractApiList<ContractItem>(data).map((item: any) => {
        const rawStatus = item.StatusName || item.ApprovalStatusName || item.StatusCode;
        const normalizedStatusName = getStatusLabel(rawStatus, "vi");
        return {
          ...item,
          StatusName: item.StatusName && isNaN(Number(item.StatusName)) ? item.StatusName : normalizedStatusName,
        };
      });
      setContracts(list);
      setPagination({ current: page, pageSize, total: extractTotalRows(data, list.length) });
    } catch (e: any) {
      console.error("Error fetching contracts:", e);
      message.error("Không thể tải danh sách hợp đồng NCC.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchContracts(1, 100);
    }
  }, [enabled]);

  useEffect(() => {
    setPagination((previous) => previous.current !== 1 ? { ...previous, current: 1 } : previous);
  }, [searchKeyword, columnFilters]);

  return {
    contracts, loading, searchKeyword, setSearchKeyword, columnFilters, setColumnFilters,
    pagination, setPagination, fetchContracts, columnSuggestions, filteredContracts, isFiltering,
  };
}
