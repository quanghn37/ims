import { erpGet, extractApiList, extractTotalRows } from "@/lib/api-client";
import { MainContractItem, ProjectContractItem, GetContractsParams } from "./types";

export const projectContractsApi = {
  getMainContracts: async (params: Partial<GetContractsParams> = {}) => {
    const response = await erpGet("api/get-contract-list", {
      DisplayMode: "main_contract",
      WSId: "",
      PageNum: params.PageNum || 1,
      PageSize: params.PageSize || 1000,
      ...params,
    });

    const items = extractApiList<MainContractItem>(response);
    const total = extractTotalRows(response, items.length);

    return {
      items,
      total,
      raw: response,
    };
  },

  getProjectContracts: async (params: Partial<GetContractsParams> = {}) => {
    const response = await erpGet("api/get-contract-list", {
      DisplayMode: "subcontracts",
      WSId: "",
      PageNum: params.PageNum || 1,
      PageSize: params.PageSize || 1000,
      ...params,
    });

    const items = extractApiList<ProjectContractItem>(response);
    const total = extractTotalRows(response, items.length);

    return {
      items,
      total,
      raw: response,
    };
  },
};
