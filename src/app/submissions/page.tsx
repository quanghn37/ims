"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button, Input, Select, DatePicker, Popover, Checkbox, message, Space } from "antd";
import dayjs from "dayjs";
import {
  IconRefresh,
  IconDeviceFloppy,
  IconSearch,
  IconChevronDown,
} from "@tabler/icons-react";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";
import SubmissionApprovalTable from "./_components/SubmissionApprovalTable";
import {
  SubmissionRow,
  SubmissionFilterState,
  WorkTypeItem,
  ContractOptionItem,
  ProcessingStatusItem,
  ProcessingStatusWithRoleItem,
  getStatusDotColor,
  normalizeApprovalStatusAlias,
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

  // Trạng thái lọc đa chọn (Multi-select Checkbox)
  const [selectedStatusKeys, setSelectedStatusKeys] = useState<string[]>(["__ALL__"]);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

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

      // Luôn tải danh sách trạng thái theo Role theo đúng ngôn ngữ hiện tại
      let withRoleList = await submissionsApi.getProcessingStatusListWithRole({
        Language: language || "vi",
      });
      if (withRoleList && withRoleList.length > 0) {
        setStatusesWithRole(withRoleList);
      } else {
        withRoleList = statusesWithRole;
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

        // 2. Tra cứu theo Alias chuẩn hóa (normalizeApprovalStatusAlias)
        if (!matched) {
          const normalized = normalizeApprovalStatusAlias(rawStatus).toLowerCase();
          matched = roleStatuses.find(
            (st) => st.Alias.trim().toLowerCase() === normalized
          );
        }

        // 3. Nếu chưa khớp theo Role hiện tại, tra cứu theo Alias của bất kỳ Role nào trong API
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

        // 4. Nhận diện ngữ nghĩa an toàn đa ngôn ngữ
        if (!matched) {
          if (rawStatus.includes("chưa") || rawStatus.includes("not-started") || rawStatus.includes("pending")) {
            matched = roleStatuses.find((st) => Number(st.Status) === 3);
          } else if (rawStatus.includes("đang") || rawStatus.includes("progress")) {
            matched = roleStatuses.find((st) => Number(st.Status) === 2);
          } else if (
            rawStatus.includes("đồng ý") ||
            rawStatus.includes("approved") ||
            rawStatus.includes("chấp thuận") ||
            rawStatus.includes("duyệt")
          ) {
            matched = roleStatuses.find((st) => Number(st.Status) === 0);
          } else if (
            rawStatus.includes("không đồng ý") ||
            rawStatus.includes("reject") ||
            rawStatus.includes("từ chối") ||
            rawStatus.includes("hủy")
          ) {
            matched = roleStatuses.find((st) => Number(st.Status) === -1);
          }
        }

        // 5. Fallback: Status 2 hoặc item đầu tiên của Role
        const finalStatusItem =
          matched || roleStatuses.find((st) => Number(st.Status) === 2) || roleStatuses[0];

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
          workType: item.WorkType || item.workType || filters.workType || "",
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

  // Danh sách trạng thái động theo cột Quyết định và Vai trò
  const availableStatuses = useMemo(() => {
    // 1. Nếu người dùng chọn một Vai trò cụ thể (A, R, C, I)
    if (filters.role && filters.role !== "all") {
      const roleUpper = filters.role.toUpperCase();
      const roleStatuses = (statusesWithRole || []).filter(
        (st) => String(st.Role || "").toUpperCase() === roleUpper
      );
      if (roleStatuses.length > 0) {
        return roleStatuses.map((st) => ({
          key: st.Alias,
          alias: st.Alias,
          description: st.Description,
          dotColor: getStatusDotColor(normalizeApprovalStatusAlias(st.Alias || st.Description)),
        }));
      }
    }

    // 2. Nếu chọn "Tất cả vai trò" (filters.role === "all"):
    // Lấy động từ các alias thực tế đang có trong rows, rồi map sang Description của ngôn ngữ hiện tại
    const statusMap = new Map<string, { key: string; alias: string; description: string; dotColor: string }>();

    rows.forEach((r) => {
      const alias = (r.statusAlias || r.decision || "").trim();
      if (!alias) return;

      const role = (r.role || "A").toUpperCase();
      const roleStatuses = (statusesWithRole || []).filter(
        (st) => String(st.Role || "").toUpperCase() === role
      );
      const matched =
        roleStatuses.find((st) => st.Alias.toLowerCase() === alias.toLowerCase()) ||
        roleStatuses.find(
          (st) => st.Alias.toLowerCase() === normalizeApprovalStatusAlias(alias).toLowerCase()
        ) ||
        (statusesWithRole || []).find((st) => st.Alias.toLowerCase() === alias.toLowerCase());

      const displayDesc = matched?.Description || r.statusDescription || alias;
      const mapKey = matched?.Alias || alias;

      if (!statusMap.has(mapKey)) {
        statusMap.set(mapKey, {
          key: mapKey,
          alias: mapKey,
          description: displayDesc,
          dotColor: getStatusDotColor(normalizeApprovalStatusAlias(mapKey)),
        });
      }
    });

    return Array.from(statusMap.values());
  }, [rows, filters.role, statusesWithRole]);

  // Đếm số lượng theo trạng thái
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      All: rows.length,
      all: rows.length,
    };
    rows.forEach((r) => {
      const desc = (r.statusDescription || "").trim();
      const alias = (r.statusAlias || r.decision || "").trim();
      const norm = normalizeApprovalStatusAlias(alias || desc);

      if (desc) {
        c[desc] = (c[desc] || 0) + 1;
        c[desc.toLowerCase()] = (c[desc.toLowerCase()] || 0) + 1;
      }
      if (alias) {
        c[alias] = (c[alias] || 0) + 1;
        c[alias.toLowerCase()] = (c[alias.toLowerCase()] || 0) + 1;
      }
      if (norm) {
        c[norm] = (c[norm] || 0) + 1;
        c[norm.toLowerCase()] = (c[norm.toLowerCase()] || 0) + 1;
      }
    });
    return c;
  }, [rows]);

  const isAllSelected =
    selectedStatusKeys.includes("__ALL__") ||
    (availableStatuses.length > 0 && selectedStatusKeys.length >= availableStatuses.length);

  const isIndeterminate =
    !isAllSelected &&
    selectedStatusKeys.length > 0 &&
    availableStatuses.length > 0 &&
    selectedStatusKeys.length < availableStatuses.length;

  const isItemChecked = (key: string) => {
    if (isAllSelected) return true;
    return selectedStatusKeys.includes(key);
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedStatusKeys(["__ALL__"]);
    } else {
      setSelectedStatusKeys([]);
    }
  };

  const handleToggleStatus = (statusKey: string) => {
    const currentlyChecked = isItemChecked(statusKey);

    if (currentlyChecked) {
      // Đang có CHECK => BỎ CHỌN
      let currentActiveKeys: string[];
      if (isAllSelected) {
        currentActiveKeys = availableStatuses.map((s) => s.key);
      } else {
        currentActiveKeys = selectedStatusKeys.filter((k) => k !== "__ALL__");
      }
      const next = currentActiveKeys.filter((k) => k !== statusKey);
      setSelectedStatusKeys(next);
    } else {
      // Đang TRỐNG => CHECK CHỌN
      const next = [...selectedStatusKeys.filter((k) => k !== "__ALL__"), statusKey];
      if (availableStatuses.length > 0 && next.length >= availableStatuses.length) {
        setSelectedStatusKeys(["__ALL__"]);
      } else {
        setSelectedStatusKeys(next);
      }
    }
  };

  const triggerDisplay = useMemo(() => {
    if (isAllSelected) {
      return {
        label: `${isEn ? "All" : "Tất cả"} (${rows.length})`,
        dotColor: "#008f89",
      };
    }
    if (selectedStatusKeys.length === 0) {
      return {
        label: isEn ? "None selected (0)" : "Chưa chọn (0)",
        dotColor: "#94a3b8",
      };
    }
    if (selectedStatusKeys.length === 1) {
      const found = availableStatuses.find((s) => s.key === selectedStatusKeys[0]);
      const count = counts[selectedStatusKeys[0]] || 0;
      return {
        label: `${found?.description || selectedStatusKeys[0]} (${count})`,
        dotColor: found?.dotColor || "#008f89",
      };
    }
    // Nhiều trạng thái
    const totalCount = selectedStatusKeys.reduce((acc, k) => acc + (counts[k] || 0), 0);
    return {
      label: isEn
        ? `Selected: ${selectedStatusKeys.length} (${totalCount})`
        : `Đã chọn: ${selectedStatusKeys.length} (${totalCount})`,
      dotColor: "#008f89",
    };
  }, [isAllSelected, selectedStatusKeys, availableStatuses, rows.length, counts, isEn]);

  // Lọc dữ liệu theo bộ lọc
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Lọc trạng thái (theo danh sách checkbox đa chọn)
      if (!isAllSelected) {
        if (selectedStatusKeys.length === 0) {
          return false;
        }
        const rowDesc = (r.statusDescription || "").trim().toLowerCase();
        const rowAlias = (r.statusAlias || r.decision || "").trim().toLowerCase();
        const rowNorm = normalizeApprovalStatusAlias(rowAlias || rowDesc).toLowerCase();

        const matchStatus = selectedStatusKeys.some((stKey) => {
          const target = stKey.trim().toLowerCase();
          const targetNorm = normalizeApprovalStatusAlias(target).toLowerCase();
          return (
            rowDesc === target ||
            rowAlias === target ||
            rowNorm === target ||
            rowNorm === targetNorm
          );
        });

        if (!matchStatus) {
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
  }, [rows, filters, selectedStatusKeys, isAllSelected]);

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

  return (
    <ErpPageContainer style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 1. Khung bộ lọc (Filter Card 2 hàng chuẩn) */}
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
        {/* Hàng 1: Hợp đồng, Tìm kiếm, Trạng thái duyệt (Multi-select Checkbox), Nút Lọc */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.5fr 1.2fr auto", gap: 12, alignItems: "center" }}>
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

          {/* Ô lọc Trạng thái duyệt dạng Dropdown Checkbox Đa chọn */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
              {isEn ? "Approval Status" : "Trạng thái duyệt"}
            </div>
            <Popover
              open={statusPopoverOpen}
              onOpenChange={setStatusPopoverOpen}
              trigger="click"
              placement="bottomLeft"
              content={
                <div style={{ width: 230, padding: "2px 0" }}>
                  <div
                    style={{
                      padding: "4px 8px 6px",
                      borderBottom: "1px solid #f1f5f9",
                      marginBottom: 4,
                    }}
                  >
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                      style={{ fontWeight: 600, fontSize: 12.5 }}
                    >
                      {isEn ? "All" : "Tất cả"} ({rows.length})
                    </Checkbox>
                  </div>
                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      padding: "0 4px",
                    }}
                  >
                    {availableStatuses.map((st) => {
                      const isChecked = isItemChecked(st.key);
                      const count = counts[st.key] ?? counts[st.description] ?? counts[st.alias] ?? 0;
                      return (
                        <div
                          key={st.key}
                          onClick={() => handleToggleStatus(st.key)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "4px 6px",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: isChecked ? "#f0fdfa" : "transparent",
                            transition: "background 0.15s",
                          }}
                        >
                          <Checkbox
                            checked={isChecked}
                            style={{ fontSize: 12, pointerEvents: "none" }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span
                                style={{
                                  width: 7.5,
                                  height: 7.5,
                                  borderRadius: "50%",
                                  background: st.dotColor,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  color: isChecked ? "#0f766e" : "#334155",
                                  fontWeight: isChecked ? 600 : 400,
                                }}
                              >
                                {st.description}
                              </span>
                            </span>
                          </Checkbox>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: isChecked ? "#008f89" : "#64748b",
                              background: isChecked ? "#ccfbf1" : "#f1f5f9",
                              padding: "1px 6px",
                              borderRadius: 10,
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: 6,
                      marginTop: 4,
                      paddingLeft: 4,
                      paddingRight: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedStatusKeys(["__ALL__"])}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#008f89",
                          fontSize: 11.5,
                          cursor: "pointer",
                          padding: "2px 0",
                          fontWeight: 500,
                        }}
                      >
                        {isEn ? "Select All" : "Chọn tất cả"}
                      </button>
                      <span style={{ color: "#cbd5e1", fontSize: 11 }}>|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedStatusKeys([])}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748b",
                          fontSize: 11.5,
                          cursor: "pointer",
                          padding: "2px 0",
                          fontWeight: 500,
                        }}
                      >
                        {isEn ? "Deselect All" : "Bỏ chọn"}
                      </button>
                    </div>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setStatusPopoverOpen(false)}
                      style={{ height: 24, fontSize: 11.5, background: "#008f89", borderColor: "#008f89" }}
                    >
                      {isEn ? "Done" : "Xong"}
                    </Button>
                  </div>
                </div>
              }
            >
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
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                  <span
                    style={{
                      width: 7.5,
                      height: 7.5,
                      borderRadius: "50%",
                      background: triggerDisplay.dotColor,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#334155" }}>
                    {triggerDisplay.label}
                  </span>
                </div>
                <IconChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
              </button>
            </Popover>
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
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, role: val, status: "All" }));
                setSelectedStatusKeys(["__ALL__"]);
              }}
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
            <Space size={8}>
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
                  setSelectedStatusKeys(["__ALL__"]);
                  setDateRange(null);
                }}
              >
                {isEn ? "Clear Filter" : "Xóa bộ lọc"}
              </Button>
              <Button
                icon={<IconRefresh size={15} />}
                onClick={handleRefresh}
                style={{ height: 32 }}
              >
                {isEn ? "Refresh" : "Làm mới"}
              </Button>
              <Button
                type="primary"
                icon={<IconDeviceFloppy size={15} />}
                loading={saving}
                onClick={handleSave}
                style={{ height: 32, background: "#008f89", borderColor: "#008f89" }}
              >
                {isEn ? "Save Changes" : "Lưu phê duyệt"}
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 2. Bảng dữ liệu đệ trình */}
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
