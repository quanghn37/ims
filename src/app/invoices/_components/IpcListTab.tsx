"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Table, Input, Select, DatePicker, Button, Space, Popover } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IconSearch, IconRefresh, IconPlus, IconX, IconFilter } from "@tabler/icons-react";
import dayjs from "dayjs";
import { renderStatusBadge, getStatusLabel } from "@/config/statusConfig";
import { useTranslation } from "@/locales/LanguageContext";
import ResizableTitle from "@/components/table/ResizableTitle";
import ColumnFilterDropdown from "@/components/table/ColumnFilterDropdown";
import ContractLovModal from "./ContractLovModal";
import { IpcRecord } from "../types";

const { RangePicker } = DatePicker;

const STORAGE_KEY_IPC_LIST_COL_WIDTHS = "IPC_LIST_COL_WIDTHS";

const defaultColWidths: Record<string, number> = {
  stt: 55,
  IpcId: 120,
  ContractCode: 180,
  VendorName: 230,
  DocDate: 110,
  Description: 240,
  ProposedAmount: 130,
  ApprovedAmount: 130,
  StatusName: 130,
  CurrentAssignee: 140,
};

interface IpcListTabProps {
  ipcList: IpcRecord[];
  loading: boolean;
  onRefresh: () => void;
  onSelectIpc: (ipc: IpcRecord) => void;
  onNavigateToTab2: () => void;
  contracts: Array<{ ContractId: number | string; ContractCode: string; VenName?: string; [key: string]: any }>;
}

export const IpcListTab: React.FC<IpcListTabProps> = ({
  ipcList,
  loading,
  onRefresh,
  onSelectIpc,
  onNavigateToTab2,
  contracts,
}) => {
  const { t, language } = useTranslation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedContract, setSelectedContract] = useState<string>("ALL");
  const [isContractLovOpen, setIsContractLovOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Bộ lọc theo nhãn từng cột (Filter on header label)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<{ bottom: number; left: number; width: number } | null>(null);

  // Quản lý kéo dãn cột & lưu vào localStorage
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IPC_LIST_COL_WIDTHS);
      if (saved) return { ...defaultColWidths, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột danh sách IPC:", e);
    }
    return defaultColWidths;
  });

  const handleResize = useCallback(
    (colKey: string) => (_: any, { size }: { size: { width: number } }) => {
      setColWidths((prev) => {
        const updated = { ...prev, [colKey]: Math.max(size.width, 40) };
        try {
          localStorage.setItem(STORAGE_KEY_IPC_LIST_COL_WIDTHS, JSON.stringify(updated));
        } catch {
          // Best-effort: Lưu độ rộng cột vào localStorage
        }
        return updated;
      });
    },
    []
  );

  const formatVnd = (num?: number | null) => {
    if (num === undefined || num === null) return "---";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Hợp đồng được chọn hiện tại
  const currentContract = useMemo(() => {
    if (selectedContract === "ALL") return null;
    return contracts.find(
      (c) => String(c.ContractId) === selectedContract || c.ContractCode === selectedContract
    );
  }, [contracts, selectedContract]);

  // Gợi ý lọc cho từng cột từ danh sách ipcList
  const columnSuggestions = useMemo(() => {
    const sets: Record<string, Set<string>> = {
      IpcId: new Set(),
      ContractCode: new Set(),
      VendorName: new Set(),
      DocDate: new Set(),
      Description: new Set(),
      ProposedAmount: new Set(),
      ApprovedAmount: new Set(),
      StatusName: new Set(),
      CurrentAssignee: new Set(),
    };

    ipcList.forEach((item) => {
      const ipcCode = item.IpcId || item.POCode;
      if (ipcCode) sets.IpcId.add(String(ipcCode).trim());

      if (item.ContractCode) sets.ContractCode.add(String(item.ContractCode).trim());

      const vName = item.VendorName && item.VendorName !== "---" ? item.VendorName : item.ContractName;
      if (vName && vName !== "---") sets.VendorName.add(String(vName).trim());

      const d = item.DocDate || item.PaymentDate || item.CreatedDate;
      if (d) {
        const formatted = dayjs(d).isValid() ? dayjs(d).format("DD/MM/YYYY") : String(d).split("T")[0];
        if (formatted) sets.DocDate.add(formatted);
      }

      const desc = item.Description && item.Description !== "---" ? item.Description : item.POName;
      if (desc && desc !== "---") sets.Description.add(String(desc).trim());

      if (item.ProposedAmount) sets.ProposedAmount.add(formatVnd(item.ProposedAmount));
      if (item.ApprovedAmount) sets.ApprovedAmount.add(formatVnd(item.ApprovedAmount));

      const st = item.StatusName || item.ApprovalStatus;
      if (st) sets.StatusName.add(String(st).trim());

      const user = item.CurrentAssignee && item.CurrentAssignee !== "---" ? item.CurrentAssignee : item.CreatedBy;
      if (user && user !== "---") sets.CurrentAssignee.add(String(user).trim());
    });

    const map: Record<string, string[]> = {};
    for (const [k, s] of Object.entries(sets)) {
      map[k] = Array.from(s).slice(0, 50);
    }
    return map;
  }, [ipcList]);

  // Đóng popover khi scroll ngoài
  useEffect(() => {
    if (!openFilterKey) return;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.closest === "function" && target.closest(".ant-popover")) {
        return;
      }
      setOpenFilterKey(null);
      setAnchorRect(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [openFilterKey]);

  // Dữ liệu lọc kết hợp cả Toolbar + Column Filters
  const filteredData = useMemo(() => {
    return ipcList.filter((item) => {
      // 1. Contract Filter (từ LOV Modal / Box)
      if (selectedContract !== "ALL") {
        if (
          String(item.ContractId) !== selectedContract &&
          item.ContractCode !== selectedContract &&
          item.ContractName !== selectedContract
        ) {
          return false;
        }
      }

      // 2. Status Filter (từ Toolbar)
      if (selectedStatus !== "ALL") {
        const statusMatch =
          String(item.Status) === selectedStatus ||
          item.StatusName?.toLowerCase() === selectedStatus.toLowerCase() ||
          item.ApprovalStatus?.toLowerCase() === selectedStatus.toLowerCase();
        if (!statusMatch) return false;
      }

      // 3. Search keyword (từ Toolbar)
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchIpc = item.IpcId?.toLowerCase().includes(kw) || item.POCode?.toLowerCase().includes(kw);
        const matchDesc = item.Description?.toLowerCase().includes(kw) || item.POName?.toLowerCase().includes(kw);
        const matchContract = item.ContractCode?.toLowerCase().includes(kw) || item.ContractName?.toLowerCase().includes(kw);
        const matchVendor = item.VendorName?.toLowerCase().includes(kw);
        const matchUser = item.CurrentAssignee?.toLowerCase().includes(kw) || item.CreatedBy?.toLowerCase().includes(kw);
        if (!matchIpc && !matchDesc && !matchContract && !matchVendor && !matchUser) return false;
      }

      // 4. Date Range (từ Toolbar)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const dateStr = item.DocDate || item.PaymentDate || item.CreatedDate;
        if (dateStr) {
          const itemDate = dayjs(dateStr);
          if (itemDate.isValid() && (itemDate.isBefore(dateRange[0], "day") || itemDate.isAfter(dateRange[1], "day"))) {
            return false;
          }
        }
      }

      // 5. Column Filters (từ từng tiêu đề cột trên Header)
      for (const [colKey, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal || !filterVal.trim()) continue;
        const targetVal = filterVal.trim().toLowerCase();

        if (colKey === "IpcId") {
          const val = (item.IpcId || item.POCode || (item.PaymentId ? `IPC-${item.PaymentId}` : "")).toLowerCase();
          if (!val.includes(targetVal)) return false;
        } else if (colKey === "ContractCode") {
          const val = (item.ContractCode || "").toLowerCase();
          if (!val.includes(targetVal)) return false;
        } else if (colKey === "VendorName") {
          const val = (item.VendorName || item.ContractName || "").toLowerCase();
          if (!val.includes(targetVal)) return false;
        } else if (colKey === "DocDate") {
          const d = item.DocDate || item.PaymentDate || item.CreatedDate;
          const formatted = d && dayjs(d).isValid() ? dayjs(d).format("DD/MM/YYYY") : (d ? String(d).split("T")[0] : "");
          if (!formatted.toLowerCase().includes(targetVal)) return false;
        } else if (colKey === "Description") {
          const val = (item.Description || item.POName || "").toLowerCase();
          if (!val.includes(targetVal)) return false;
        } else if (colKey === "ProposedAmount") {
          const val = String(item.ProposedAmount ?? "");
          const formatted = formatVnd(item.ProposedAmount);
          if (!val.includes(targetVal) && !formatted.includes(targetVal)) return false;
        } else if (colKey === "ApprovedAmount") {
          const val = String(item.ApprovedAmount ?? "");
          const formatted = formatVnd(item.ApprovedAmount);
          if (!val.includes(targetVal) && !formatted.includes(targetVal)) return false;
        } else if (colKey === "StatusName") {
          const val = (item.StatusName || item.ApprovalStatus || "").toLowerCase();
          if (!val.includes(targetVal)) return false;
        } else if (colKey === "CurrentAssignee") {
          const val = (item.CurrentAssignee || item.CreatedBy || "").toLowerCase();
          if (!val.includes(targetVal)) return false;
        }
      }

      return true;
    });
  }, [ipcList, selectedContract, selectedStatus, searchKeyword, dateRange, columnFilters]);

  // Cột gốc hiển thị
  const baseColumns: ColumnsType<IpcRecord> = useMemo(
    () => [
      {
        title: t("invoices.table.stt"),
        key: "stt",
        width: defaultColWidths.stt,
        align: "center",
        render: (_: any, __: any, index: number) => (
          <span style={{ color: "#64748b" }}>{index + 1}</span>
        ),
      },
      {
        title: t("invoices.table.ipc"),
        dataIndex: "IpcId",
        key: "IpcId",
        width: defaultColWidths.IpcId,
        align: "left",
        render: (val: string, record: IpcRecord) => (
          <span style={{ color: "#008f89", fontWeight: 700, fontFamily: "monospace" }}>
            {val || record.POCode || (record.PaymentId ? `IPC-${record.PaymentId}` : "---")}
          </span>
        ),
      },
      {
        title: t("invoices.table.contractCode"),
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: defaultColWidths.ContractCode,
        align: "left",
        render: (val: string) => <span>{val || "---"}</span>,
      },
      {
        title: t("invoices.table.vendor"),
        dataIndex: "VendorName",
        key: "VendorName",
        width: defaultColWidths.VendorName,
        align: "left",
        ellipsis: true,
        render: (val: string, record: IpcRecord) => {
          const text = val && val !== "---" ? val : record.ContractName || "---";
          return <span title={text}>{text}</span>;
        },
      },
      {
        title: t("invoices.table.dateCreated"),
        dataIndex: "DocDate",
        key: "DocDate",
        width: defaultColWidths.DocDate,
        align: "center",
        render: (val: string, record: IpcRecord) => {
          const d = val || record.PaymentDate || record.CreatedDate;
          return (
            <span>
              {d && dayjs(d).isValid() ? dayjs(d).format("DD/MM/YYYY") : (d ? String(d).split("T")[0] : "---")}
            </span>
          );
        },
      },
      {
        title: t("invoices.table.desc"),
        dataIndex: "Description",
        key: "Description",
        width: defaultColWidths.Description,
        align: "left",
        ellipsis: true,
        render: (val: string, record: IpcRecord) => {
          const text = val && val !== "---" ? val : record.POName || "---";
          return <span title={text}>{text}</span>;
        },
      },
      {
        title: t("invoices.table.proposedAmount"),
        dataIndex: "ProposedAmount",
        key: "ProposedAmount",
        width: defaultColWidths.ProposedAmount,
        align: "right",
        render: (val: number) => <span>{val ? formatVnd(val) : "---"}</span>,
      },
      {
        title: t("invoices.table.approvedAmount"),
        dataIndex: "ApprovedAmount",
        key: "ApprovedAmount",
        width: defaultColWidths.ApprovedAmount,
        align: "right",
        render: (val: number | null) => (
          <span style={{ color: val ? "#123443" : "#94a3b8" }}>
            {val ? formatVnd(val) : "---"}
          </span>
        ),
      },
      {
        title: t("invoices.table.status"),
        dataIndex: "StatusName",
        key: "StatusName",
        width: defaultColWidths.StatusName,
        align: "left",
        render: (_: any, record: IpcRecord) =>
          renderStatusBadge(
            record.Status ?? record.StatusName ?? record.ApprovalStatus,
            record.StatusName || record.ApprovalStatus || getStatusLabel(record.Status, language)
          ),
      },
      {
        title: t("invoices.table.assignee"),
        dataIndex: "CurrentAssignee",
        key: "CurrentAssignee",
        width: defaultColWidths.CurrentAssignee,
        align: "left",
        render: (val: string | null, record: IpcRecord) => {
          const text = val && val !== "---" ? val : record.CreatedBy || "---";
          return <span style={{ color: text !== "---" ? "#123443" : "#94a3b8" }}>{text}</span>;
        },
      },
    ],
    [t, language]
  );

  // Meta cột đang mở Popover lọc
  const activeColumnMeta = useMemo(() => {
    if (!openFilterKey) return null;
    const col = baseColumns.find((c: any) => (c.key || c.dataIndex) === openFilterKey);
    const label = typeof col?.title === "string" ? col.title : openFilterKey;
    const suggestions = columnSuggestions[openFilterKey] || [];
    return { label, suggestions };
  }, [openFilterKey, baseColumns, columnSuggestions]);

  // Hợp nhất độ rộng cột đã lưu, gắn sự kiện kéo resize & click lọc trên label
  const mergedColumns = useMemo(() => {
    const filterableKeys = [
      "IpcId",
      "ContractCode",
      "VendorName",
      "DocDate",
      "Description",
      "ProposedAmount",
      "ApprovedAmount",
      "StatusName",
      "CurrentAssignee",
    ];

    return baseColumns.map((col: any) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = colWidths[colKey] || col.width || 100;
      const isFilterable = filterableKeys.includes(colKey);
      const activeValue = columnFilters[colKey] || "";
      const rawTitle = typeof col.title === "string" ? col.title : colKey;

      const titleNode = isFilterable ? (
        <span
          className="column-title-clickable"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setAnchorRect({
              bottom: rect.bottom,
              left: rect.left,
              width: rect.width,
            });
            setOpenFilterKey((prev) => (prev === colKey ? null : colKey));
          }}
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            color: activeValue ? "#008f89" : "inherit",
            fontWeight: activeValue ? 700 : "inherit",
            userSelect: "none",
          }}
          title={language === "en" ? `Click to filter by ${rawTitle}` : `Bấm để lọc theo ${rawTitle}`}
        >
          <span>{rawTitle}</span>
          {activeValue ? (
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#008f89",
                flexShrink: 0,
              }}
              title={`Đang lọc: "${activeValue}"`}
            />
          ) : (
            <IconFilter size={12} style={{ color: "#94a3b8", opacity: 0.6 }} />
          )}
        </span>
      ) : (
        col.title
      );

      return {
        ...col,
        title: titleNode,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(colKey),
        }),
      };
    });
  }, [baseColumns, colWidths, handleResize, columnFilters, language]);

  const totalScrollX = useMemo(() => {
    return mergedColumns.reduce((sum, col: any) => sum + (Number(col.width) || 100), 0);
  }, [mergedColumns]);

  const hasActiveFilters = Object.keys(columnFilters).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      {/* Filter Bar */}
      <div
        style={{
          background: "#fafcfb",
          border: "1px solid #dce5e6",
          borderRadius: 8,
          padding: "8px 12px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Space wrap size={8}>
          {/* LOV Hợp đồng: Popup lên giống tab chờ lập hóa đơn */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{t("invoices.filter.contract")}</span>
            <div
              onClick={() => setIsContractLovOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 28,
                padding: "0 8px",
                border: "1px solid #dce5e6",
                borderRadius: 4,
                backgroundColor: "#ffffff",
                cursor: "pointer",
                width: 260,
                fontSize: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
              title={
                currentContract
                  ? `${currentContract.ContractCode}${currentContract.VenName ? ` - ${currentContract.VenName}` : ""}`
                  : (selectedContract === "ALL"
                      ? (language === "en" ? "All Contracts / Vendors" : "Tất cả Hợp đồng / NCC")
                      : (language === "en" ? "Select contract..." : "Chọn hợp đồng..."))
              }
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: currentContract || selectedContract !== "ALL" ? "#1e293b" : "#64748b",
                  maxWidth: 210,
                  fontSize: 12,
                }}
              >
                {currentContract
                  ? `${currentContract.ContractCode}${currentContract.VenName ? ` - ${currentContract.VenName}` : ""}`
                  : (selectedContract === "ALL"
                      ? (language === "en" ? "All Contracts / Vendors" : "Tất cả Hợp đồng / NCC")
                      : (language === "en" ? "Select contract..." : "Chọn hợp đồng..."))}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {selectedContract !== "ALL" && (
                  <IconX
                    size={13}
                    style={{ color: "#94a3b8", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContract("ALL");
                    }}
                  />
                )}
                <IconSearch size={14} style={{ color: "#008f89", flexShrink: 0 }} />
              </div>
            </div>
          </div>

          {/* Bộ lọc trạng thái */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{t("invoices.filter.status")}</span>
            <Select
              size="small"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 130 }}
              options={[
                { value: "ALL", label: t("invoices.filter.allStatuses") },
                { value: "0", label: getStatusLabel(0, language) },
                { value: "2", label: getStatusLabel(2, language) },
                { value: "1", label: getStatusLabel(1, language) },
                { value: "-1", label: getStatusLabel(-1, language) },
              ]}
            />
          </div>

          {/* Khoảng ngày */}
          <RangePicker
            size="small"
            format="DD/MM/YYYY"
            value={dateRange}
            onChange={(dates) => setDateRange(dates as any)}
            style={{ width: 220 }}
            placeholder={[language === "en" ? "From date" : "Từ ngày", language === "en" ? "To date" : "Đến ngày"]}
          />

          {/* Tìm kiếm chung */}
          <Input
            size="small"
            prefix={<IconSearch size={14} color="#94a3b8" />}
            placeholder={t("invoices.filter.searchPlaceholder")}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 190 }}
            allowClear
          />

          {/* Nút xóa nhanh tất cả lọc trên cột nếu có */}
          {hasActiveFilters && (
            <Button
              size="small"
              icon={<IconX size={13} />}
              onClick={() => setColumnFilters({})}
              style={{
                borderColor: "#FED7AA",
                background: "#FFF7ED",
                color: "#F97316",
                fontSize: 12,
              }}
            >
              {language === "en" ? "Clear column filters" : "Xóa lọc cột"}
            </Button>
          )}
        </Space>

        <Space size={8}>
          <Button
            size="small"
            icon={<IconRefresh size={14} />}
            onClick={() => {
              setColumnFilters({});
              onRefresh();
            }}
            loading={loading}
          >
            {t("invoices.filter.refresh")}
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<IconPlus size={14} />}
            onClick={onNavigateToTab2}
            style={{ backgroundColor: "#008f89", borderColor: "#008f89" }}
          >
            {t("invoices.filter.createIpc")}
          </Button>
        </Space>
      </div>

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table<IpcRecord>
          className="erp-detail-table"
          bordered
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
          columns={mergedColumns}
          dataSource={filteredData}
          rowKey={(record) => String(record.PaymentId || record.IpcId || record.POCode)}
          size="small"
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onClick: () => onSelectIpc(record),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: Math.max(totalScrollX, 1200), y: "calc(100vh - 250px)" }}
        />
      </div>

      {/* Popover lọc theo cột khi bấm vào tiêu đề (Label) */}
      <Popover
        open={Boolean(openFilterKey && anchorRect)}
        onOpenChange={(visible) => {
          if (!visible) {
            setOpenFilterKey(null);
            setAnchorRect(null);
          }
        }}
        trigger={[]}
        placement="bottomLeft"
        overlayStyle={{ zIndex: 1050 }}
        content={
          openFilterKey && activeColumnMeta ? (
            <ColumnFilterDropdown
              colKey={openFilterKey}
              label={activeColumnMeta.label}
              value={columnFilters[openFilterKey] || ""}
              suggestions={activeColumnMeta.suggestions}
              close={() => {
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
              onApply={(val) => {
                const trimmed = val ? val.trim() : "";
                setColumnFilters((previous) => {
                  if (!trimmed) {
                    const next = { ...previous };
                    delete next[openFilterKey];
                    return next;
                  }
                  return { ...previous, [openFilterKey]: trimmed };
                });
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
              onClear={() => {
                setColumnFilters((previous) => {
                  const next = { ...previous };
                  delete next[openFilterKey];
                  return next;
                });
                setOpenFilterKey(null);
                setAnchorRect(null);
              }}
            />
          ) : null
        }
      >
        {anchorRect ? (
          <div
            style={{
              position: "fixed",
              top: anchorRect.bottom,
              left: anchorRect.left,
              width: anchorRect.width,
              height: 1,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </Popover>

      {/* Contract LOV Popup Modal */}
      <ContractLovModal
        open={isContractLovOpen}
        onClose={() => setIsContractLovOpen(false)}
        contracts={contracts}
        loading={loading}
        onSelectContract={(contract) => {
          const cId = String(contract.ContractId || contract.ContractCode);
          setSelectedContract(cId);
          setIsContractLovOpen(false);
        }}
      />
    </div>
  );
};

export default IpcListTab;
