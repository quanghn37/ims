"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input, Button, Select, Space, message } from "antd";
import {
  IconSearch,
  IconRefresh,
  IconFileSpreadsheet,
  IconCircleX,
} from "@tabler/icons-react";
import ProjectContractsTable from "./ProjectContractsTable";
import ProjectContractDetailModal from "./ProjectContractDetailModal";
import MatEquipInPlaceDetail from "./MatEquipInPlaceDetail";
import { ProjectContractItem } from "../types";
import { projectContractsApi } from "../api";
import { exportToExcel } from "@/lib/excel-export";
import { useTranslation } from "@/locales/LanguageContext";

export default function ProjectContractsTab() {
  const { language } = useTranslation();
  const isEn = language === "en";

  const [contracts, setContracts] = useState<ProjectContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
  });

  const [selectedContract, setSelectedContract] = useState<ProjectContractItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [inPlaceDetail, setInPlaceDetail] = useState<{
    open: boolean;
    contractId: number | string | null;
    parentId: number | string | null;
    parentRecord?: ProjectContractItem | null;
    action: "edit" | "addendum" | null;
  }>({
    open: false,
    contractId: null,
    parentId: null,
    parentRecord: null,
    action: null,
  });

  // Tải danh sách Hợp đồng Dự án từ API get-contract-list với DisplayMode: "subcontracts"
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectContractsApi.getProjectContracts({
        PageNum: 1,
        PageSize: 1000,
        Language: language || "vi",
      });
      setContracts(res.items || []);
    } catch (err) {
      console.error("Lỗi tải danh sách Hợp đồng Dự án:", err);
      message.error(isEn ? "Failed to load project contracts" : "Lỗi tải danh sách Hợp đồng Dự án");
    } finally {
      setLoading(false);
    }
  }, [language, isEn]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Danh sách các trạng thái thực tế có trong dữ liệu
  const statusOptions = useMemo(() => {
    const statusSet = new Set<string>();
    contracts.forEach((c) => {
      const name = c.StatusName || (c.StatusCode === 1 ? "Chờ duyệt" : c.StatusCode === 0 ? "Đang lập" : "Hiệu lực");
      if (name) statusSet.add(name);
    });

    const opts = [{ value: "all", label: isEn ? "All Statuses" : "Tất cả trạng thái" }];
    statusSet.forEach((st) => {
      opts.push({ value: st, label: st });
    });
    return opts;
  }, [contracts, isEn]);

  // Lọc dữ liệu hiển thị theo từ khóa tìm kiếm và trạng thái
  const filteredContracts = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return contracts.filter((c) => {
      if (statusFilter !== "all") {
        const name = (c.StatusName || (c.StatusCode === 1 ? "Chờ duyệt" : c.StatusCode === 0 ? "Đang lập" : "Hiệu lực")).toLowerCase();
        if (name !== statusFilter.toLowerCase()) return false;
      }

      if (!kw) return true;

      const code = String(c.ContractCode || "").toLowerCase();
      const desc = String(c.Description || "").toLowerCase();
      const ven = String(c.Venname || "").toLowerCase();
      const mainCode = String(c.MainCode || "").toLowerCase();
      const sType = String(c.S_Type || "").toLowerCase();
      const assignee = String(c.CurrentAssignee || "").toLowerCase();

      return (
        code.includes(kw) ||
        desc.includes(kw) ||
        ven.includes(kw) ||
        mainCode.includes(kw) ||
        sType.includes(kw) ||
        assignee.includes(kw)
      );
    });
  }, [contracts, searchKeyword, statusFilter]);

  // Phân trang dữ liệu
  const paginatedContracts = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return filteredContracts.slice(start, start + pagination.pageSize);
  }, [filteredContracts, pagination]);

  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
  }, []);

  // Xuất Excel
  const handleExportExcel = useCallback(() => {
    if (!filteredContracts.length) {
      message.warning(isEn ? "No data to export" : "Không có dữ liệu để xuất");
      return;
    }

    const exportData = filteredContracts.map((c, index) => ({
      stt: index + 1,
      ContractCode: c.ContractCode || "",
      Description: c.Description || "",
      Venname: c.Venname || "",
      MainCode: c.MainCode || "",
      ContractedAmount: c.ContractedAmount != null ? Number(c.ContractedAmount) : "",
      S_Type: c.S_Type || "",
      Contractdate: c.Contractdate || "",
      StartDate: c.StartDate || "",
      EndDate: c.EndDate || "",
      StatusName: c.StatusName || (c.StatusCode === 1 ? "Chờ duyệt" : c.StatusCode === 0 ? "Đang lập" : "Hiệu lực"),
      CurrentAssignee: c.CurrentAssignee || c.CreatedBy || "",
      CreatedBy: c.CreatedBy || "",
      CreatedDate: c.CreatedDate || "",
    }));

    exportToExcel({
      fileName: `HopDong_DuAn_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "HopDongDuAn",
      title: isEn ? "PROJECT SUBCONTRACTS LIST" : "DANH SÁCH HỢP ĐỒNG DỰ ÁN",
      columns: [
        { key: "stt", title: "STT", width: 8, align: "center" },
        { key: "ContractCode", title: isEn ? "Subcontract Code" : "Số HĐ Dự án", width: 22, align: "left" },
        { key: "Description", title: isEn ? "Description" : "Tên / Diễn giải HĐ", width: 32, align: "left" },
        { key: "Venname", title: isEn ? "Vendor / Subcontractor" : "Nhà thầu / Đối tác", width: 28, align: "left" },
        { key: "MainCode", title: isEn ? "Main Contract Code" : "Số HĐ CĐT", width: 20, align: "center" },
        { key: "ContractedAmount", title: isEn ? "Amount" : "Giá trị HĐ", width: 18, align: "right", dataType: "number", numFmt: "#,##0" },
        { key: "S_Type", title: isEn ? "Type" : "Loại", width: 12, align: "center" },
        { key: "Contractdate", title: isEn ? "Contract Date" : "Ngày ký", width: 14, align: "center" },
        { key: "StartDate", title: isEn ? "Start Date" : "Ngày bắt đầu", width: 14, align: "center" },
        { key: "EndDate", title: isEn ? "End Date" : "Ngày kết thúc", width: 14, align: "center" },
        { key: "StatusName", title: isEn ? "Status" : "Trạng thái", width: 16, align: "center" },
        { key: "CurrentAssignee", title: isEn ? "Assignee" : "Người xử lý", width: 20, align: "left" },
        { key: "CreatedBy", title: isEn ? "Created By" : "Người tạo", width: 16, align: "center" },
        { key: "CreatedDate", title: isEn ? "Created Date" : "Ngày tạo", width: 20, align: "center" },
      ],
      data: exportData,
    });
  }, [filteredContracts, isEn]);

  const handleOpenDetail = useCallback((record: ProjectContractItem) => {
    const isMatEquip = String(record.ContractType || "").trim().toLowerCase() === "mat_equip";
    if (isMatEquip) {
      setInPlaceDetail({
        open: true,
        contractId: record.ContractId,
        parentId: null,
        parentRecord: record,
        action: "edit",
      });
    } else {
      setSelectedContract(record);
      setIsDetailOpen(true);
    }
  }, []);

  if (inPlaceDetail.open) {
    return (
      <MatEquipInPlaceDetail
        contractId={inPlaceDetail.contractId}
        parentId={inPlaceDetail.parentId}
        parentRecord={inPlaceDetail.parentRecord}
        action={inPlaceDetail.action}
        onClose={() => {
          setInPlaceDetail({ open: false, contractId: null, parentId: null, parentRecord: null, action: null });
        }}
        onSuccess={() => {
          fetchContracts();
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0%", minHeight: 0, height: "100%", overflow: "hidden" }}>
      {/* Thanh bộ lọc và tác vụ */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 6,
          padding: "8px 12px",
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Nhóm tìm kiếm và lọc bên trái */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Input
            placeholder={
              isEn
                ? "Search by subcontract code, description, vendor, main contract..."
                : "Mã HĐ, tên HĐ, nhà thầu, số HĐ CĐT..."
            }
            prefix={<IconSearch size={15} style={{ color: "#94a3b8" }} />}
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            allowClear
            style={{ width: 300, height: 30 }}
          />

          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            options={statusOptions}
            style={{ width: 160, height: 30 }}
          />

          {(searchKeyword || statusFilter !== "all") && (
            <Button
              icon={<IconCircleX size={14} style={{ color: "#ef4444" }} />}
              onClick={() => {
                setSearchKeyword("");
                setStatusFilter("all");
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              style={{
                height: 30,
                borderRadius: 6,
                borderColor: "#fed7aa",
                background: "#fff7ed",
                color: "#f97316",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {isEn ? "Clear Filter" : "Xóa bộ lọc"}
            </Button>
          )}
        </div>

        {/* Nhóm nút tác vụ bên phải */}
        <Space size={8}>
          <Button
            icon={<IconFileSpreadsheet size={15} style={{ color: "#16a34a" }} />}
            onClick={handleExportExcel}
            style={{ height: 30, fontSize: 12.5 }}
          >
            {isEn ? "Export Excel" : "Xuất Excel"}
          </Button>

          <Button
            icon={<IconRefresh size={15} />}
            onClick={fetchContracts}
            loading={loading}
            style={{ height: 30, fontSize: 12.5 }}
          >
            {isEn ? "Refresh" : "Làm mới"}
          </Button>
        </Space>
      </div>

      {/* Bảng dữ liệu hiển thị toàn màn hình */}
      <ProjectContractsTable
        dataSource={paginatedContracts}
        loading={loading}
        totalRows={filteredContracts.length}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onOpenDetail={handleOpenDetail}
        onRowDoubleClick={handleOpenDetail}
        onCreateAddendum={(record) => {
          const isMatEquip = String(record.ContractType || "").trim().toLowerCase() === "mat_equip";
          if (!isMatEquip) {
            message.warning(
              isEn
                ? `Addendum creation for contract type "${record.ContractType || "other"}" is currently under development.`
                : `Chức năng tạo phụ lục cho loại hợp đồng "${record.ContractType || "khác"}" hiện đang được phát triển.`
            );
            return;
          }

          // ContractType: "mat_equip" -> Mở ngay In-place View tạo phụ lục và map API
          setInPlaceDetail({
            open: true,
            contractId: null,
            parentId: record.ContractId,
            parentRecord: record,
            action: "addendum",
          });
        }}
      />

      {/* Modal chi tiết hợp đồng dự án */}
      <ProjectContractDetailModal
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedContract(null);
        }}
        contract={selectedContract}
      />
    </div>
  );
}
