import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { extractApiList, extractTotalRows } from "@/lib/api-client";
import { useColumnFiltering } from "@/lib/table-utils";
import { ContractItem } from "@/types";
import { quotationsApi } from "../api";

export const quotationColumnFields: Record<string, string[]> = {
  ContractCode: ["ContractCode"],
  Description: ["Description"],
  Venname: ["Venname", "ClientName"],
  MainContractCode: ["MainContractCode", "MainContractName", "MainContractId"],
  EffectiveDate: ["StartDate", "FromDate"],
  Contractdate: ["Contractdate", "ContractDate", "CreatedDate"],
  CreatedBy: ["CreatedBy"],
};

const getQuotationSearchValues = (quotation: ContractItem) => [
  quotation.Description, quotation.ContractCode, quotation.Venname, quotation.ClientName,
  quotation.MainContractCode, quotation.MainContractName, quotation.CreatedBy,
];

export function useQuotations(enabled = true) {
  const [quotations, setQuotations] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 100, total: 0 });
  const { columnFilters, setColumnFilters, columnSuggestions, filteredRows: filteredQuotations, isFiltering } = useColumnFiltering({
    rows: quotations,
    fields: quotationColumnFields,
    searchKeyword,
    getSearchValues: getQuotationSearchValues,
    excludePlaceholderDateFromFilters: true,
  });

  const fetchQuotations = useCallback(async (page = 1, pageSize = 100, keyword = searchKeyword) => {
    setLoading(true);
    try {
      const data = await quotationsApi.getContracts({
        DisplayMode: "quotation", ClientId: "", WSId: "", Keyword: keyword.trim() || undefined, PageNum: page, PageSize: pageSize,
      });
      const list = extractApiList<ContractItem>(data);
      setQuotations(list);
      setPagination({ current: page, pageSize, total: extractTotalRows(data, list.length) });
    } catch (e: any) {
      message.error("Không thể tải danh sách bảng giá.");
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  useEffect(() => {
    if (!enabled) return;
    const timeoutId = window.setTimeout(() => fetchQuotations(1, 100, searchKeyword), searchKeyword ? 300 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, fetchQuotations, searchKeyword]);

  useEffect(() => {
    setPagination((previous) => previous.current !== 1 ? { ...previous, current: 1 } : previous);
  }, [searchKeyword, columnFilters]);

  return {
    quotations, loading, searchKeyword, setSearchKeyword, columnFilters, setColumnFilters,
    pagination, setPagination, fetchQuotations, columnSuggestions, filteredQuotations, isFiltering,
  };
}
