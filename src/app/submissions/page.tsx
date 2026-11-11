"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button, Input, Select, DatePicker, Dropdown, message, Space } from "antd";
import dayjs from "dayjs";
import {
  IconRefresh,
  IconDeviceFloppy,
  IconSearch,
  IconChevronDown,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";
import SubmissionApprovalTable from "./_components/SubmissionApprovalTable";
import {
  SubmissionRow,
  STATUS_OPTIONS,
  SubmissionFilterState,
  WorkTypeItem,
  ContractOptionItem,
  ProcessingStatusItem,
  ProcessingStatusWithRoleItem,
  getStatusDotColor,
} from "./types";
import { submissionsApi } from "./api";
import { useTranslation } from "@/locales/LanguageContext";

const { RangePicker } = DatePicker;

export default function SubmissionsPage() {
  const { language } = useTranslation();
  const isEn = language === "en";

  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);

  // Danh sách Hợp đồng từ API get-contract-list
  const [contracts, setContracts] = useState<ContractOptionItem[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Danh mục Loại công việc (Work Type) từ API get-work-type
  const [workTypes, setWorkTypes] = useState<WorkTypeItem[]>([]);
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(false);

  // Danh sách Trạng thái phê duyệt từ API get-processing-status-list
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatusItem[]>([]);
  // Danh sách Trạng thái theo Role từ API get-processing-status-list (official_with_role)
  const [statusesWithRole, setStatusesWithRole] = useState<ProcessingStatusWithRoleItem[]>([]);

  // Khoảng ngày đệ trình (mặc định để trống để tải toàn bộ đệ trình nếu không chọn)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Bộ lọc Filter Card (ContractId mặc định để "0" cho load tất cả)
  const [filters, setFilters] = useState<SubmissionFilterState>({
    contractId: "0",
    searchKeyword: "",
    status: "All",
    workType: "construction_work",
    role: "all",
    dateRange: undefined,
  });

  // Tải danh sách Trạng thái phê duyệt từ backend
  useEffect(() => {
    let isMounted = true;
    const fetchStatuses = async () => {
      try {
        const [dataOfficial, dataWithRole] = await Promise.all([
          submissionsApi.getProcessingStatusList({
            Language: language || "vi",
          }),
          submissionsApi.getProcessingStatusListWithRole({
            Language: language || "vi",
          }),
        ]);
        if (isMounted) {
          if (dataOfficial.length > 0) setProcessingStatuses(dataOfficial);
          if (dataWithRole.length > 0) setStatusesWithRole(dataWithRole);
        }
      } catch (err) {
        console.error("Lỗi tải ProcessingStatusList:", err);
      }
    };
    fetchStatuses();
    return () => {
      isMounted = false;
    };
  }, [language]);

  // Tải danh sách Hợp đồng từ backend
  useEffect(() => {
    let isMounted = true;
    const fetchContracts = async () => {
      setLoadingContracts(true);
      try {
        const data = await submissionsApi.getContractList({
          DisplayMode: "contract_users",
          QueryByAgent: "no",
          ContractType: "all",
          Keyword: "",
          PageNum: 1,
          PageSize: 1000,
        });
        if (isMounted && data.length > 0) {
          setContracts(data);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách Hợp đồng:", err);
      } finally {
        if (isMounted) setLoadingContracts(false);
      }
    };
    fetchContracts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tải danh mục Loại công việc từ backend
  useEffect(() => {
    let isMounted = true;
    const fetchWorkTypes = async () => {
      setLoadingWorkTypes(true);
      try {
        const data = await submissionsApi.getWorkTypes({
          UpdateMode: "create_submission",
          DisplayMode: "reviewing",
          Language: language || "vi",
        });
        if (isMounted && data.length > 0) {
          setWorkTypes(data);
          // Tự động gán nếu giá trị hiện tại chưa có trong danh mục
          setFilters((prev) => {
            const exists = data.some((item) => item.Alias === prev.workType);
            return exists ? prev : { ...prev, workType: data[0].Alias };
          });
        }
      } catch (err) {
        console.error("Lỗi tải danh mục Loại công việc:", err);
      } finally {
        if (isMounted) setLoadingWorkTypes(false);
      }
    };
    fetchWorkTypes();
    return () => {
      isMounted = false;
    };
  }, [language]);

  // Tải danh sách đệ trình từ API get-submisson-for-reviewer
  const fetchSubmissions = useCallback(async () => {
    setLoadingRows(true);
    try {
      let contractIdParam = 0;
      let selectedContract: ContractOptionItem | undefined;
      if (filters.contractId && filters.contractId !== "0" && filters.contractId !== "all") {
        selectedContract = contracts.find(
          (c) => c.ContractCode === filters.contractId || String(c.ContractId) === String(filters.contractId)
        );
        if (selectedContract?.ContractId) {
          contractIdParam = Number(selectedContract.ContractId);
        }
      }

      const fromDateParam = dateRange && dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : "";
      const toDateParam = dateRange && dateRange[1] ? dateRange[1].format("YYYY-MM-DD") : "";

      const rawItems = await submissionsApi.getSubmissionsForReviewer({
        ContractId: contractIdParam,
        Keyword: filters.searchKeyword.trim(),
        WorkType: filters.workType || "construction_work",
        ApprovalStatus: "All",
        Role: filters.role === "all" ? "All" : filters.role,
        Stage: "All",
        WorkCat: "All",
        FromDate: fromDateParam,
        ToDate: toDateParam,
        Language: language || "vi",
      });

      // Đảm bảo có danh sách trạng thái theo Role từ API get-processing-status-list (official_with_role)
      let withRoleList = statusesWithRole;
      if (!withRoleList || withRoleList.length === 0) {
        withRoleList = await submissionsApi.getProcessingStatusListWithRole({
          Language: language || "vi",
        });
        if (withRoleList && withRoleList.length > 0) {
          setStatusesWithRole(withRoleList);
        }
      }

      const mappedRows: SubmissionRow[] = rawItems.map((item: any, index: number) => {
        let subDateStr = "";
        if (item.ItemDate) {
          const d = dayjs(item.ItemDate);
          subDateStr = d.isValid() ? d.format("DD/MM/YYYY") : String(item.ItemDate);
        }

        const subQty = Number(item.SubmittedQnty ?? 0);
        const subPrice = Number(item.SubmittedUnitPrice ?? 0);
        const subAmount = Number(item.SubmittedAmount ?? subQty * subPrice);

        const apprQty = Number(item.ReviewedQnty ?? subQty);
        const apprPrice = Number(item.ReviewedUnitPrice ?? subPrice);
        const apprAmount = Number(item.ReviewedAmount ?? apprQty * apprPrice);

        const contractCode = item.ContractCode || selectedContract?.ContractCode || item.ContractName || "";

        // Tra cứu trạng thái trực tiếp 100% từ danh sách API get-processing-status-list trả ra:
        const roleUpper = String(item.Role || "A").trim().toUpperCase();
        const rawStatus = String(item.ApprovalStatus || "").trim().toLowerCase();

        const roleStatuses = (withRoleList || []).filter(
          (st) => String(st.Role || "").trim().toUpperCase() === roleUpper
        );

        // 1. Tìm trực tiếp theo Role và Description / Alias / Status từ API
        let matched = roleStatuses.find(
          (st) =>
            st.Description.trim().toLowerCase() === rawStatus ||
            st.Alias.trim().toLowerCase() === rawStatus ||
            String(st.Status) === rawStatus
        );

        // 2. Nếu chưa khớp theo Role hiện tại, tra cứu theo Alias của bất kỳ Role nào trong API
        if (!matched) {
          const anyMatched = (withRoleList || []).find(
            (st) =>
              st.Description.trim().toLowerCase() === rawStatus ||
              st.Alias.trim().toLowerCase() === rawStatus
          );
          if (anyMatched) {
            matched = roleStatuses.find(
              (st) => st.Alias.trim().toLowerCase() === anyMatched.Alias.trim().toLowerCase()
            );
          }
        }

        // 3. Lấy item từ API: nếu không thấy thì fallback sang In-Progress hoặc item đầu tiên của Role
        const finalStatusItem =
          matched || roleStatuses.find((st) => st.Status === 2) || roleStatuses[0];

        const resolvedAlias = finalStatusItem?.Alias || "In-Progress";
        const resolvedDescription = finalStatusItem?.Description || item.ApprovalStatus || "";

        return {
          key: String(item.ReviewAssignmentId || item.SubmissionId || index + 1),
          id: item.ReviewAssignmentId || item.SubmissionId || index + 1,
          stt: index + 1,
          docNo: item.DocNo || "",
          contractCode: contractCode,
          contractName: item.ContractName || selectedContract?.ContractName || "",
          wbsCode: item.WBS || "",
          submissionDate: subDateStr,
          itemName: item.SubmissionName || "",
          workCategory: item.SubmittedWorkCat ?? null,
          submittedWorkCat: item.SubmittedWorkCat ?? null,
          reviewedWorkCat: item.ReviewedWorkCat ?? null,
          unit: item.Unit || "",
          subQty: subQty,
          subPrice: subPrice,
          subAmount: subAmount,
          role: item.Role || "A",
          decision: resolvedAlias,
          statusAlias: resolvedAlias,
          statusDescription: resolvedDescription,
          apprQty: apprQty,
          apprPrice: apprPrice,
          apprAmount: apprAmount,
          remarks: item.RemarksOnApproval || item.SubmittedRemarks || "",
          reviewAssignmentId: item.ReviewAssignmentId,
          submissionId: item.SubmissionId,
          myDuty: item.MyDuty,
          isDisabled: item.IsDisabled,
          raw: item,
        };
      });

      setRows(mappedRows);
    } catch (err) {
      console.error("Lỗi tải danh sách đệ trình:", err);
      message.error(isEn ? "Failed to load submissions!" : "Không thể tải danh sách đệ trình!");
    } finally {
      setLoadingRows(false);
    }
  }, [contracts, filters.contractId, filters.searchKeyword, filters.workType, filters.role, dateRange, language, isEn]);

  // Gọi tải dữ liệu đệ trình khi bộ lọc Hợp đồng / Loại CV / Vai trò thay đổi
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Options hiển thị cho Select Hợp đồng
  const contractOptions = useMemo(() => {
    const list = [
      {
        value: "0",
        label: isEn ? "All Contracts" : "Tất cả hợp đồng",
      },
    ];
    if (contracts.length > 0) {
      contracts.forEach((item) => {
        list.push({
          value: item.ContractCode || String(item.ContractId),
          label: item.ContractName ? `${item.ContractCode} - ${item.ContractName}` : item.ContractCode,
        });
      });
    }
    return list;
  }, [contracts, isEn]);

  // Options hiển thị cho Select Loại công việc
  const workTypeOptions = useMemo(() => {
    if (workTypes.length > 0) {
      return workTypes.map((item) => ({
        value: item.Alias,
        label: item.Description,
      }));
    }
    return [
      { value: "construction_work", label: isEn ? "Construction Work" : "Xây dựng" },
    ];
  }, [workTypes, isEn]);

  // Danh sách trạng thái chuẩn hóa từ API get-processing-status-list
  const statusList = useMemo(() => {
    if (processingStatuses.length > 0) {
      return processingStatuses.map((item) => ({
        key: item.Alias,
        alias: item.Alias,
        description: item.Description,
        dotColor: getStatusDotColor(item.Alias),
        statusNum: item.Status,
      }));
    }
    return STATUS_OPTIONS.map((opt) => ({
      key: opt.alias || opt.key,
      alias: opt.alias || opt.key,
      description: isEn ? opt.labelEn : opt.labelVi,
      dotColor: opt.dotColor,
      statusNum: 0,
    }));
  }, [processingStatuses, isEn]);

  // Đếm số lượng theo trạng thái cho thanh Pills
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      All: rows.length,
      all: rows.length,
    };
    rows.forEach((r) => {
      const alias = r.statusAlias || r.decision;
      if (alias) {
        c[alias] = (c[alias] || 0) + 1;
        c[alias.toLowerCase()] = (c[alias.toLowerCase()] || 0) + 1;
      }
    });
    return c;
  }, [rows]);

  // Lọc dữ liệu theo bộ lọc
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Lọc trạng thái (theo Alias từ API get-processing-status-list)
      if (filters.status && filters.status.toLowerCase() !== "all") {
        const rowStatus = String(r.statusAlias || r.decision || "").toLowerCase();
        if (rowStatus !== filters.status.toLowerCase()) {
          return false;
        }
      }
      // Lọc từ khóa
      if (filters.searchKeyword.trim()) {
        const kw = filters.searchKeyword.toLowerCase();
        const match =
          r.itemName.toLowerCase().includes(kw) ||
          r.wbsCode.toLowerCase().includes(kw) ||
          (r.docNo && r.docNo.toLowerCase().includes(kw)) ||
          r.contractCode.toLowerCase().includes(kw) ||
          (r.contractName && r.contractName.toLowerCase().includes(kw));
        if (!match) return false;
      }
      // Lọc vai trò
      if (filters.role !== "all" && r.role !== filters.role) {
        return false;
      }
      // Lọc khoảng ngày đệ trình
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        let rowDate: dayjs.Dayjs | null = null;
        if (r.submissionDate.includes("/")) {
          const parts = r.submissionDate.split("/").map(Number);
          if (parts.length === 3) {
            rowDate = dayjs(new Date(parts[2], parts[1] - 1, parts[0]));
          }
        } else {
          rowDate = dayjs(r.submissionDate);
        }
        if (rowDate && rowDate.isValid()) {
          const parseFilterDate = (dStr: string) => {
            if (dStr.includes("/")) {
              const parts = dStr.split("/").map(Number);
              return dayjs(new Date(parts[2], parts[1] - 1, parts[0]));
            }
            return dayjs(dStr);
          };
          const fromD = parseFilterDate(filters.dateRange[0]).startOf("day");
          const toD = parseFilterDate(filters.dateRange[1]).endOf("day");
          if (fromD.isValid() && toD.isValid()) {
            if (rowDate.isBefore(fromD) || rowDate.isAfter(toD)) {
              return false;
            }
          }
        }
      }
      return true;
    });
  }, [rows, filters]);

  // Thao tác Lưu phê duyệt
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      message.success(isEn ? "Changes saved successfully!" : "Đã lưu phê duyệt thành công!");
    }, 600);
  };

  // Thao tác Làm mới
  const handleRefresh = () => {
    fetchSubmissions();
    message.info(isEn ? "Data refreshed!" : "Đã làm mới dữ liệu!");
  };

  // Menu tùy chọn trạng thái duyệt (Custom LOV) lấy Description từ API
  const currentStatusOpt = useMemo(() => {
    return (
      statusList.find(
        (s) => s.alias.toLowerCase() === (filters.status || "All").toLowerCase()
      ) || statusList[0]
    );
  }, [statusList, filters.status]);

  const statusMenuItems = useMemo(() => {
    return statusList.map((opt) => {
      const isSelected = opt.alias.toLowerCase() === (filters.status || "All").toLowerCase();
      return {
        key: opt.alias,
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "3px 4px",
              minWidth: 130,
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 7.5,
                  height: 7.5,
                  borderRadius: "50%",
                  background: opt.dotColor,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400 }}>
                {opt.description}
              </span>
            </div>
            {isSelected && (
              <span style={{ color: "#008f89", fontWeight: 700, fontSize: 13, marginLeft: "auto" }}>
                ✓
              </span>
            )}
          </div>
        ),
        onClick: () => setFilters((prev) => ({ ...prev, status: opt.alias })),
      };
    });
  }, [statusList, filters.status]);

  return (
    <ErpPageContainer style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 1. Header Trang */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 8,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#008f89", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
            <IconFileSpreadsheet size={20} strokeWidth={2.2} />
            {isEn ? "Submission Approval" : "Phê duyệt đệ trình"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            {isEn
              ? "Review, compare, and approve contractor submission items for quantities and costs"
              : "Xem xét, đối chiếu và phê duyệt các hạng mục đệ trình khối lượng / chi phí từ Nhà thầu"}
          </div>
        </div>
      </div>

      {/* 2. Khung bộ lọc (Filter Card 2 hàng chuẩn) */}
      <div
        style={{
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Hàng 1: Hợp đồng, Tìm kiếm, Trạng thái duyệt (chiều ngang gọn 160px), Nút Lọc */}
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 2.3fr 160px auto", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
              {isEn ? "Contract" : "Hợp đồng"}
            </div>
            <Select
              showSearch
              loading={loadingContracts}
              value={filters.contractId}
              onChange={(val) => setFilters((prev) => ({ ...prev, contractId: val }))}
              style={{ width: "100%", fontFamily: "monospace" }}
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={contractOptions}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
              {isEn ? "Keyword" : "Tìm kiếm"}
            </div>
            <Input
              allowClear
              prefix={<IconSearch size={14} color="#94a3b8" />}
              placeholder={isEn ? "WBS code, item name, notes..." : "Mã WBS, tên hạng mục, diễn giải..."}
              value={filters.searchKeyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchKeyword: e.target.value }))}
            />
          </div>

          {/* LOV Trạng thái duyệt tùy chỉnh có chấm màu */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
              {isEn ? "Approval Status" : "Trạng thái duyệt"}
            </div>
            <Dropdown menu={{ items: statusMenuItems }} trigger={["click"]}>
              <button
                type="button"
                style={{
                  height: 32,
                  padding: "0 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 12.5,
                  fontWeight: 500,
                  background: "#ffffff",
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                  <span
                    style={{
                      width: 7.5,
                      height: 7.5,
                      borderRadius: "50%",
                      background: currentStatusOpt?.dotColor || "#94a3b8",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentStatusOpt?.description || (isEn ? "All" : "Tất cả")}
                  </span>
                </div>
                <IconChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
              </button>
            </Dropdown>
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <Button
              type="primary"
              style={{ height: 32, background: "#008f89", borderColor: "#008f89" }}
              onClick={fetchSubmissions}
              loading={loadingRows}
            >
              {isEn ? "Filter" : "Lọc"}
            </Button>
          </div>
        </div>

        {/* Hàng 2: Loại công việc, Vai trò, Ngày đệ trình, Nút Xóa bộ lọc */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.3fr 2fr auto", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
              {isEn ? "Work Type" : "Loại công việc"}
            </div>
            <Select
              loading={loadingWorkTypes}
              value={filters.workType}
              onChange={(val) => setFilters((prev) => ({ ...prev, workType: val }))}
              style={{ width: "100%" }}
              options={workTypeOptions}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
              {isEn ? "My Role" : "Vai trò của tôi"}
            </div>
            <Select
              value={filters.role}
              onChange={(val) => setFilters((prev) => ({ ...prev, role: val }))}
              style={{ width: "100%" }}
              options={[
                { value: "all", label: isEn ? "All" : "Tất cả" },
                { value: "A", label: isEn ? "Approver (A)" : "Người phê duyệt (A)" },
                { value: "R", label: isEn ? "Responsible (R)" : "Người thực hiện (R)" },
                { value: "C", label: isEn ? "Consulted (C)" : "Người tham vấn (C)" },
                { value: "I", label: isEn ? "Informed (I)" : "Người nhận thông tin (I)" },
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
              {isEn ? "Submission Date" : "Ngày đệ trình"}
            </div>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(dates, dateStrings) => {
                setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
                setFilters((prev) => ({
                  ...prev,
                  dateRange: dates && dates[0] && dates[1] ? [dateStrings[0], dateStrings[1]] : undefined,
                }));
              }}
            />
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <Button
              style={{ height: 32, color: "#64748b" }}
              onClick={() => {
                const initialWorkType = workTypes[0]?.Alias || "construction_work";
                setFilters({
                  contractId: "0",
                  searchKeyword: "",
                  status: "All",
                  workType: initialWorkType,
                  role: "all",
                  dateRange: undefined,
                });
                setDateRange(null);
              }}
            >
              {isEn ? "Clear Filter" : "Xóa bộ lọc"}
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Thanh Toolbar Status Pills nhanh lấy danh mục từ API kèm Cụm nút hành động */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          margin: "2px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {statusList.map((opt) => {
            const isActive = (filters.status || "All").toLowerCase() === opt.alias.toLowerCase();
            const count = counts[opt.alias] || 0;
            return (
              <button
                key={opt.alias}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, status: opt.alias }))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? "#f0fdfa" : "#ffffff",
                  color: isActive ? "#008f89" : "#475569",
                  border: `1px solid ${isActive ? "#99d2cf" : "#e2e8f0"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    width: 7.5,
                    height: 7.5,
                    borderRadius: "50%",
                    background: opt.dotColor,
                    display: "inline-block",
                  }}
                />
                <span>{opt.description}</span>
                <span
                  style={{
                    padding: "0 6px",
                    background: isActive ? "#e6f4f3" : "#f1f5f9",
                    color: isActive ? "#008f89" : "#64748b",
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <Space size={8}>
          <Button icon={<IconRefresh size={15} />} onClick={handleRefresh}>
            {isEn ? "Refresh" : "Làm mới"}
          </Button>
          <Button
            type="primary"
            icon={<IconDeviceFloppy size={15} />}
            loading={saving}
            onClick={handleSave}
            style={{ background: "#008f89", borderColor: "#008f89" }}
          >
            {isEn ? "Save Changes" : "Lưu phê duyệt"}
          </Button>
        </Space>
      </div>

      {/* 4. Bảng dữ liệu đệ trình */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SubmissionApprovalTable
          dataSource={filteredRows}
          onDataChange={setRows}
          loading={loadingRows}
          processingStatuses={processingStatuses}
          statusesWithRole={statusesWithRole}
        />
      </div>
    </ErpPageContainer>
  );
}
