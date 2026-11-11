import { erpGet, extractApiList } from "@/lib/api-client";
import {
  SubmissionRow,
  WorkTypeItem,
  DefaultDateResponse,
  ContractOptionItem,
  ProcessingStatusItem,
  ProcessingStatusWithRoleItem,
} from "./types";

/**
 * Service API quản lý Phê duyệt đệ trình
 */
export const submissionsApi = {
  /**
   * Lấy danh sách trạng thái phê duyệt (Approval Status)
   * Endpoint: api/get-processing-status-list
   */
  getProcessingStatusList: async (params?: Record<string, any>): Promise<ProcessingStatusItem[]> => {
    try {
      const response = await erpGet("api/get-processing-status-list", {
        WSId: "",
        DisplayMode: "official",
        ...params,
      });
      return extractApiList<ProcessingStatusItem>(response);
    } catch (error) {
      console.error("Lỗi gọi API get-processing-status-list:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách trạng thái phê duyệt gắn với vai trò RACI (R, C, A, I)
   * Endpoint: api/get-processing-status-list?DisplayMode=official_with_role
   */
  getProcessingStatusListWithRole: async (params?: Record<string, any>): Promise<ProcessingStatusWithRoleItem[]> => {
    try {
      const response = await erpGet("api/get-processing-status-list", {
        WSId: "",
        DisplayMode: "official_with_role",
        ...params,
      });
      return extractApiList<ProcessingStatusWithRoleItem>(response);
    } catch (error) {
      console.error("Lỗi gọi API get-processing-status-list with role:", error);
      return [];
    }
  },
  /**
   * Lấy danh sách hợp đồng cho bộ lọc
   * Endpoint: api/get-contract-list
   */
  getContractList: async (params?: Record<string, any>): Promise<ContractOptionItem[]> => {
    try {
      const response = await erpGet("api/get-contract-list", {
        DisplayMode: "contract_users",
        QueryByAgent: "no",
        ContractType: "all",
        Keyword: "",
        PageNum: 1,
        PageSize: 1000,
        WSId: "",
        ...params,
      });
      return extractApiList<ContractOptionItem>(response);
    } catch (error) {
      console.error("Lỗi gọi API get-contract-list:", error);
      return [];
    }
  },
  /**
   * Lấy danh sách Loại công việc (Work Type)
   * Endpoint: api/get-work-type?params={"UpdateMode":"create_submission","DisplayMode":"reviewing",...}
   */
  getWorkTypes: async (params?: Record<string, any>): Promise<WorkTypeItem[]> => {
    try {
      const response = await erpGet("api/get-work-type", {
        UpdateMode: "create_submission",
        DisplayMode: "reviewing",
        ...params,
      });
      return extractApiList<WorkTypeItem>(response);
    } catch (error) {
      console.error("Lỗi gọi API get-work-type:", error);
      return [];
    }
  },

  /**
   * Lấy khoảng ngày mặc định theo WorkType truyền vào
   * Endpoint: api/get-default-date?params={"WorkType": "..."}
   */
  getDefaultDate: async (workType: string): Promise<DefaultDateResponse | null> => {
    try {
      const response = await erpGet("api/get-default-date", {
        WorkType: workType,
      });
      let data = response?.Data ?? response?.data ?? response;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (_) {}
      }
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }
      if (data && typeof data === "object" && data.FromDate && data.ToDate) {
        return {
          FromDate: String(data.FromDate),
          ToDate: String(data.ToDate),
        };
      }
      return null;
    } catch (error) {
      console.error("Lỗi gọi API get-default-date:", error);
      return null;
    }
  },

  /**
   * Lấy danh sách đệ trình cho người phê duyệt
   * Endpoint: api/get-submisson-for-reviewer
   */
  getSubmissionsForReviewer: async (params?: Record<string, any>): Promise<any[]> => {
    try {
      const response = await erpGet("api/get-submisson-for-reviewer", {
        ContractId: 0,
        DisplayMode: "to_be_approved_submission",
        PageSize: 1000,
        Keyword: "",
        WorkType: "construction_work",
        ApprovalStatus: "All",
        Role: "All",
        Stage: "All",
        WorkCat: "All",
        FromDate: "",
        ToDate: "",
        ...params,
      });
      return extractApiList(response);
    } catch (error) {
      console.error("Lỗi gọi API get-submisson-for-reviewer:", error);
      return [];
    }
  },

  /**
   * Cập nhật quyết định phê duyệt các dòng đệ trình
   */
  saveSubmissionReviews: async (rows: SubmissionRow[]): Promise<{ success: boolean; message?: string }> => {
    try {
      if (rows.length > 0) {
        // Dự kiến: return await apiClient.post("/api/update-submission-review", { items: rows });
      }
      return { success: true };
    } catch (error) {
      console.error("Lỗi lưu phê duyệt đệ trình:", error);
      throw error;
    }
  },

  /**
   * Duyệt nhanh các dòng được chọn
   */
  quickApprove: async (submissionIds: (string | number)[]): Promise<{ success: boolean }> => {
    try {
      if (submissionIds.length > 0) {
        // Dự kiến: return await apiClient.post("/api/quick-approve-submissions", { ids: submissionIds });
      }
      return { success: true };
    } catch (error) {
      console.error("Lỗi duyệt nhanh đệ trình:", error);
      throw error;
    }
  },
};
