"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Input, Select, DatePicker, Space, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  IconRefresh,
  IconDeviceFloppy,
  IconSearch,
} from "@tabler/icons-react";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";
import SubmissionApprovalTableV2 from "./_components/SubmissionApprovalTableV2";
import {
  SubmissionRow,
  WorkTypeItem,
  ProcessingStatusWithRoleItem,
  normalizeApprovalStatusAlias,
} from "../submissions/types";
import { submissionsApi } from "../submissions/api";
import { useTranslation } from "@/locales/LanguageContext";

const { RangePicker } = DatePicker;

export default function SubmissionsV2Page() {
  const { language } = useTranslation();
  const isEn = language === "en";

  // Dữ liệu toàn bộ đệ trình
  const [allRows, setAllRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Danh mục Loại công việc từ API get-work-type
  const [workTypes, setWorkTypes] = useState<WorkTypeItem[]>([]);

  // Danh sách trạng thái theo Role từ API get-processing-status-list (official_with_role)
  const [statusesWithRole, setStatusesWithRole] = useState<ProcessingStatusWithRoleItem[]>([]);

  // Tab Loại công việc đang chọn ("all" hoặc Alias của Loại công việc)
  const [workType, setWorkType] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("all");
  // Khoảng Ngày đệ trình (map từ API get-default-date)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Danh mục Vai trò RACI
  const roleOptions = [
    { value: "all", label: isEn ? "All" : "Tất cả" },
    { value: "A", label: isEn ? "Approver (A)" : "Người phê duyệt (A)" },
    { value: "R", label: isEn ? "Responsible (R)" : "Người thực hiện (R)" },
    { value: "C", label: isEn ? "Consulted (C)" : "Người tham vấn (C)" },
    { value: "I", label: isEn ? "Informed (I)" : "Người nhận thông tin (I)" },
  ];

  // Tải danh sách đệ trình từ backend API get-submisson-for-reviewer
  const fetchSubmissions = useCallback(
    async (
      overrideWorkType?: string,
      overrideDateRange?: [Dayjs | null, Dayjs | null] | null
    ) => {
      const activeWorkType = overrideWorkType !== undefined ? overrideWorkType : workType;
      const activeDateRange = overrideDateRange !== undefined ? overrideDateRange : dateRange;

      setLoading(true);
      try {
        const fromDateParam =
          activeDateRange && activeDateRange[0]
            ? activeDateRange[0].format("YYYY-MM-DD")
            : "";
        const toDateParam =
          activeDateRange && activeDateRange[1]
            ? activeDateRange[1].format("YYYY-MM-DD")
            : "";

        // Gọi API get-submisson-for-reviewer-test cho trang V2
        const rawItems = await submissionsApi.getSubmissionsForReviewerTest({
          WorkType: activeWorkType === "all" ? "all" : activeWorkType,
          FromDate: fromDateParam,
          ToDate: toDateParam,
          Keyword: searchKeyword.trim(),
          PageNum: 1,
          PageSize: 1000,
          Language: language || "vi",
        });

        // Tải danh sách trạng thái theo Role theo ngôn ngữ hiện tại
        let withRoleList = await submissionsApi.getProcessingStatusListWithRole({
          Language: language || "vi",
        });
        if (withRoleList && withRoleList.length > 0) {
          setStatusesWithRole(withRoleList);
        } else {
          withRoleList = statusesWithRole;
        }

        // Tạo bản đồ tra cứu nhanh trạng thái theo Role theo O(1)
        const roleStatusMap = new Map<string, ProcessingStatusWithRoleItem[]>();
        (withRoleList || []).forEach((st) => {
          const r = String(st.Role || "").trim().toUpperCase();
          if (!roleStatusMap.has(r)) roleStatusMap.set(r, []);
          roleStatusMap.get(r)!.push(st);
        });

        const mappedRows: SubmissionRow[] = (rawItems || []).map(
          (item: any, index: number) => {
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

            const roleUpper = String(item.Role || "A").trim().toUpperCase();
            const rawStatus = String(item.ApprovalStatus || "").trim().toLowerCase();

            const roleStatuses = roleStatusMap.get(roleUpper) || [];

            let matched = roleStatuses.find(
              (st) =>
                st.Description.trim().toLowerCase() === rawStatus ||
                st.Alias.trim().toLowerCase() === rawStatus ||
                String(st.Status) === rawStatus
            );

            if (!matched) {
              const normalized = normalizeApprovalStatusAlias(rawStatus).toLowerCase();
              matched = roleStatuses.find(
                (st) => st.Alias.trim().toLowerCase() === normalized
              );
            }

            if (!matched) {
              if (
                rawStatus.includes("chưa") ||
                rawStatus.includes("not-started") ||
                rawStatus.includes("pending")
              ) {
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
                rawStatus.includes("từ chối")
              ) {
                matched = roleStatuses.find((st) => Number(st.Status) === -1);
              }
            }

            const finalStatusDesc = matched ? matched.Description : (item.ApprovalStatus || "In-Progress");
            const finalStatusAlias = matched ? matched.Alias : (item.ApprovalStatus || "in_progress");

            // Xác định Loại công việc chính xác từ API
            const rawWorkType = (
              item.WorkType ||
              item.workType ||
              item.SubmittedWorkCat ||
              item.WorkCat ||
              ""
            ).trim();

            const matchedWt = (workTypes || []).find(
              (w) =>
                w.Alias.toLowerCase() === rawWorkType.toLowerCase() ||
                w.Description.toLowerCase() === rawWorkType.toLowerCase()
            );

            const finalWorkTypeAlias = matchedWt ? matchedWt.Alias : rawWorkType;
            const finalWorkTypeDesc = matchedWt ? matchedWt.Description : rawWorkType;

            const uniqueKey = String(
              item.ReviewAssignmentId
                ? `${item.ReviewAssignmentId}_${index + 1}`
                : item.SubmissionId
                ? `${item.SubmissionId}_${item.DocNo || ""}_${index + 1}`
                : index + 1
            );

            return {
              key: uniqueKey,
              id: item.ReviewAssignmentId || item.SubmissionId || index + 1,
              stt: index + 1,
              reviewAssignmentId: item.ReviewAssignmentId ? String(item.ReviewAssignmentId) : undefined,
              submissionId: item.SubmissionId ? String(item.SubmissionId) : undefined,
              docNo: item.DocNo || item.ContractCode || "",
              contractCode: item.ContractCode || item.ContractName || "",
              contractName: item.ContractName || "",
              wbsCode: item.WBS || "",
              submissionDate: subDateStr,
              itemName: item.SubmissionName || "",
              workType: finalWorkTypeAlias,
              workTypeDesc: finalWorkTypeDesc,
              submittedWorkCat: item.SubmittedWorkCat || item.WorkCat || "",
              workCategory: item.SubmittedWorkCat || item.WorkCat || "",
              unit: item.Unit || "",
              subQty: subQty,
              subPrice: subPrice,
              subAmount: subAmount,
              role: (item.Role || "A") as any,
              decision: finalStatusAlias as any,
              statusAlias: finalStatusAlias,
              statusDescription: finalStatusDesc,
              reviewedWorkCat: item.ReviewedWorkCat || item.SubmittedWorkCat || "",
              apprQty: apprQty,
              apprPrice: apprPrice,
              apprAmount: apprAmount,
              remarks: item.RemarksOnApproval || item.SubmittedRemarks || "",
              isModified: false,
            };
          }
        );

        setAllRows(mappedRows);
      } catch (error) {
        console.error("Lỗi tải danh sách đệ trình:", error);
        message.error(isEn ? "Failed to load submissions" : "Lỗi tải danh sách đệ trình");
      } finally {
        setLoading(false);
      }
    },
    [workType, dateRange, searchKeyword, myRole, language, statusesWithRole, workTypes, isEn]
  );

  // 1. Map API Loại công việc (api/get-work-type) và Ngày đệ trình mặc định (api/get-default-date)
  useEffect(() => {
    let isMounted = true;
    const loadWorkTypesAndDefaultDate = async () => {
      try {
        const data = await submissionsApi.getWorkTypes({
          UpdateMode: "create_submission",
          DisplayMode: "reviewing",
          Language: language || "vi",
        });

        if (isMounted && data.length > 0) {
          setWorkTypes(data);

          // Lấy ngày đệ trình mặc định theo loại công việc đầu tiên
          const firstType = data[0].Alias;
          const defDate = await submissionsApi.getDefaultDate(firstType);
          let newDates: [Dayjs | null, Dayjs | null] | null = null;
          if (defDate?.FromDate && defDate?.ToDate) {
            const start = dayjs(defDate.FromDate);
            const end = dayjs(defDate.ToDate);
            if (start.isValid() && end.isValid()) {
              newDates = [start, end];
              setDateRange(newDates);
            }
          }

          // Tải toàn bộ đệ trình ban đầu để tính số lượng cho các tab
          fetchSubmissions("all", newDates);
        }
      } catch (err) {
        console.error("Lỗi map API get-work-type:", err);
      }
    };

    loadWorkTypesAndDefaultDate();
    return () => {
      isMounted = false;
    };
  }, [language]);

  // Xử lý khi click vào một tab Loại công việc dạng Pill
  const handlePillClick = async (alias: string) => {
    setWorkType(alias);
    if (alias !== "all") {
      try {
        const defDate = await submissionsApi.getDefaultDate(alias);
        if (defDate?.FromDate && defDate?.ToDate) {
          const start = dayjs(defDate.FromDate);
          const end = dayjs(defDate.ToDate);
          if (start.isValid() && end.isValid()) {
            setDateRange([start, end]);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy ngày mặc định:", err);
      }
    }
  };

  // Bản đồ tra cứu nhanh Loại công việc theo O(1)
  const workTypeLookup = useMemo(() => {
    const map = new Map<string, WorkTypeItem>();
    workTypes.forEach((w) => {
      map.set(w.Alias.toLowerCase(), w);
      map.set(w.Description.toLowerCase(), w);
    });
    return map;
  }, [workTypes]);

  // Danh sách Tab Loại công việc chỉ lấy từ dữ liệu thực tế API trả ra (loại bỏ các tab count = 0)
  const activeWorkTypeTabs = useMemo(() => {
    const countMap = new Map<string, { label: string; count: number }>();

    allRows.forEach((row) => {
      const wt = (row.workType || "").trim();
      if (!wt) return;

      const lower = wt.toLowerCase();
      const matched = workTypeLookup.get(lower);
      const aliasKey = matched ? matched.Alias.toLowerCase() : lower;
      const label = matched?.Description || row.workTypeDesc || wt;

      const existing = countMap.get(aliasKey);
      if (existing) {
        existing.count += 1;
      } else {
        countMap.set(aliasKey, { label, count: 1 });
      }
    });

    const tabs: { alias: string; label: string; count: number }[] = [];
    countMap.forEach(({ label, count }, alias) => {
      tabs.push({ alias, label, count });
    });

    return tabs;
  }, [allRows, workTypeLookup]);

  // Lọc dữ liệu hiển thị theo tab Loại công việc đang chọn
  const displayedRows = useMemo(() => {
    if (workType === "all") return allRows;
    const target = workType.trim().toLowerCase();
    const matchedTarget = workTypeLookup.get(target);
    const targetAlias = matchedTarget ? matchedTarget.Alias.toLowerCase() : target;

    return allRows.filter((r) => {
      const rowWt = (r.workType || "").trim().toLowerCase();
      const rowDesc = (r.workTypeDesc || "").trim().toLowerCase();

      if (rowWt === target || rowDesc === target) return true;

      const matchedRow = workTypeLookup.get(rowWt);
      if (matchedRow && matchedRow.Alias.toLowerCase() === targetAlias) {
        return true;
      }

      return false;
    });
  }, [allRows, workType, workTypeLookup]);

  // Cập nhật khi dữ liệu trên ô thay đổi
  const handleRowsChange = useCallback(
    (newRows: SubmissionRow[]) => {
      if (workType === "all") {
        setAllRows(newRows);
      } else {
        const updatedMap = new Map(newRows.map((r) => [r.key, r]));
        setAllRows((prev) => prev.map((r) => updatedMap.get(r.key) || r));
      }
    },
    [workType]
  );

  // Xử lý Lọc
  const handleFilter = () => {
    fetchSubmissions("all");
  };

  // Xóa bộ lọc
  const handleClearFilter = async () => {
    setWorkType("all");
    setSearchKeyword("");
    setMyRole("all");

    const firstType = workTypes[0]?.Alias || "purchase_order";
    const defDate = await submissionsApi.getDefaultDate(firstType);
    let newDates: [Dayjs | null, Dayjs | null] | null = null;
    if (defDate?.FromDate && defDate?.ToDate) {
      const start = dayjs(defDate.FromDate);
      const end = dayjs(defDate.ToDate);
      if (start.isValid() && end.isValid()) {
        newDates = [start, end];
        setDateRange(newDates);
      } else {
        setDateRange(null);
      }
    } else {
      setDateRange(null);
    }
    fetchSubmissions("all", newDates);
    message.success(isEn ? "Filters reset" : "Đã đặt lại bộ lọc");
  };

  // Làm mới
  const handleRefresh = () => {
    fetchSubmissions("all");
    message.success(isEn ? "Data refreshed" : "Đã làm mới dữ liệu");
  };

  // Lưu phê duyệt
  const handleSave = async () => {
    setSaving(true);
    try {
      await submissionsApi.saveSubmissionReviews(displayedRows);
      message.success(isEn ? "Saved successfully" : "Lưu phê duyệt thành công");
    } catch {
      message.error(isEn ? "Failed to save" : "Lỗi lưu phê duyệt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ErpPageContainer style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* 1. KHUNG BỘ LỌC TÌM KIẾM (FILTER CARD V2 - GỌN GÀNG 1 HÀNG) */}
      <div
        style={{
          flexShrink: 0,
          background: "#ffffff",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
          padding: "12px 16px",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 1.2fr 1.6fr auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          {/* Cột 1: Tìm kiếm */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {isEn ? "Search" : "Tìm kiếm"}
            </div>
            <Input
              placeholder={isEn ? "WBS code, item name, notes..." : "Mã WBS, tên hạng mục, diễn giải..."}
              prefix={<IconSearch size={16} style={{ color: "#94a3b8" }} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleFilter}
              allowClear
              style={{ width: "100%" }}
            />
          </div>

          {/* Cột 2: Vai trò của tôi */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {isEn ? "My Role" : "Vai trò của tôi"}
            </div>
            <Select
              value={myRole}
              onChange={(val) => setMyRole(val)}
              style={{ width: "100%" }}
              options={roleOptions}
            />
          </div>

          {/* Cột 3: Ngày đệ trình (Map từ API get-default-date & RangePicker) */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {isEn ? "Submission Date" : "Ngày đệ trình"}
            </div>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={[isEn ? "Start date" : "Ngày bắt đầu", isEn ? "End date" : "Ngày kết thúc"]}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
            />
          </div>

          {/* Cột 4: Nút Lọc và Xóa bộ lọc */}
          <div style={{ alignSelf: "flex-end" }}>
            <Space size={8}>
              <Button
                type="primary"
                style={{ height: 32, background: "#008f89", borderColor: "#008f89" }}
                onClick={handleFilter}
                loading={loading}
              >
                {isEn ? "Filter" : "Lọc"}
              </Button>
              <Button
                style={{ height: 32, color: "#64748b" }}
                onClick={handleClearFilter}
              >
                {isEn ? "Clear Filter" : "Xóa bộ lọc"}
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 2. THANH TAB LOẠI CÔNG VIỆC DẠNG PILLS & NÚT TÁC VỤ (CHỈ HIỂN THỊ CÁC LOẠI CV CÓ TRONG DỮ LIỆU) */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Dải pill tabs bên trái (không có chấm tròn, chỉ hiển thị loại CV có dữ liệu) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: "2px 0",
          }}
        >
          {/* Tab Tất cả */}
          <div
            onClick={() => handlePillClick("all")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 16,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: workType === "all" ? 600 : 400,
              background: workType === "all" ? "#f0fdfa" : "#ffffff",
              border: workType === "all" ? "1.5px solid #008f89" : "1px solid #dce5e6",
              color: workType === "all" ? "#0f766e" : "#334155",
              boxShadow: workType === "all" ? "0 1px 3px rgba(0, 143, 137, 0.12)" : "none",
              transition: "all 0.15s ease",
              userSelect: "none",
            }}
          >
            <span>{isEn ? "All" : "Tất cả"}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: workType === "all" ? "#008f89" : "#64748b",
                background: workType === "all" ? "#ccfbf1" : "#f1f5f9",
                padding: "0 6px",
                borderRadius: 10,
                minWidth: 18,
                textAlign: "center",
                lineHeight: "18px",
              }}
            >
              {allRows.length}
            </span>
          </div>

          {/* Các tab Loại công việc thực tế có trong dữ liệu API trả ra */}
          {activeWorkTypeTabs.map((wt) => {
            const isSelected = workType.toLowerCase() === wt.alias.toLowerCase();

            return (
              <div
                key={wt.alias}
                onClick={() => handlePillClick(wt.alias)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 16,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? "#f0fdfa" : "#ffffff",
                  border: isSelected ? "1.5px solid #008f89" : "1px solid #dce5e6",
                  color: isSelected ? "#0f766e" : "#334155",
                  boxShadow: isSelected ? "0 1px 3px rgba(0, 143, 137, 0.12)" : "none",
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}
              >
                <span>{wt.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isSelected ? "#008f89" : "#64748b",
                    background: isSelected ? "#ccfbf1" : "#f1f5f9",
                    padding: "0 6px",
                    borderRadius: 10,
                    minWidth: 18,
                    textAlign: "center",
                    lineHeight: "18px",
                  }}
                >
                  {wt.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cụm nút tác vụ bên phải */}
        <Space size={8}>
          <Button
            icon={<IconRefresh size={15} />}
            onClick={handleRefresh}
            loading={loading}
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

      {/* 3. BẢNG DỮ LIỆU ĐỆ TRÌNH */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <SubmissionApprovalTableV2
          dataSource={displayedRows}
          onDataChange={handleRowsChange}
          loading={loading}
          statusesWithRole={statusesWithRole}
        />
      </div>
    </ErpPageContainer>
  );
}
