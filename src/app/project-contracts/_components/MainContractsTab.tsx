"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input, Button, Select, Space, message } from "antd";
import {
  IconSearch,
  IconRefresh,
  IconFileSpreadsheet,
  IconCircleX,
} from "@tabler/icons-react";
import MainContractsTable from "./MainContractsTable";
import MainContractDetailModal from "./MainContractDetailModal";
import { MainContractItem } from "../types";
import { projectContractsApi } from "../api";
import { exportToExcel } from "@/lib/excel-export";
import { useTranslation } from "@/locales/LanguageContext";

export default function MainContractsTab() {
  const { language } = useTranslation();
  const isEn = language === "en";

  const [contracts, setContracts] = useState<MainContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
  });

  const [selectedContract, setSelectedContract] = useState<MainContractItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Tải danh sách Hợp đồng CĐT từ API get-contract-list với DisplayMode: "main_contract"
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectContractsApi.getMainContracts({
        PageNum: 1,
        PageSize: 1000,
        Language: language || "vi",
      });
      setContracts(res.items || []);
    } catch (err) {
      console.error("Lỗi tải danh sách Hợp đồng CĐT:", err);
      message.error(isEn ? "Failed to load client contracts" : "Lỗi tải danh sách Hợp đồng CĐT");
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
      const name = c.StatusName || (c.StatusCode === 0 ? "Đang lập" : "Hiệu lực");
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
        const name = (c.StatusName || (c.StatusCode === 0 ? "Đang lập" : "Hiệu lực")).toLowerCase();
        if (name !== statusFilter.toLowerCase()) return false;
      }

      if (!kw) return true;

      const code = String(c.ContractCode || "").toLowerCase();
      const desc = String(c.Description || "").toLowerCase();
      const company = String(c.CompanyName || "").toLowerCase();
      const tax = String(c.TaxID || "").toLowerCase();
      const assignee = String(c.CurrentAssignee || "").toLowerCase();

      return (
        code.includes(kw) ||
        desc.includes(kw) ||
        company.includes(kw) ||
        tax.includes(kw) ||
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
      CompanyName: c.CompanyName || "",
      TaxID: c.TaxID || "",
      ContractDate: c.ContractDate || "",
      StartDate: c.StartDate || "",
      EndDate: c.EndDate || "",
      ActualStart: c.ActualStart || "",
      StatusName: c.StatusName || (c.StatusCode === 0 ? "Đang lập" : "Hiệu lực"),
      CurrentAssignee: c.CurrentAssignee || c.CreatedBy || "",
      CreatedBy: c.CreatedBy || "",
      CreatedDate: c.CreatedDate || "",
    }));

    exportToExcel({
      fileName: `HopDong_CDT_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "HopDongCDT",
      title: isEn ? "CLIENT CONTRACTS LIST" : "DANH SÁCH HỢP ĐỒNG CHỦ ĐẦU TƯ",
      columns: [
        { key: "stt", title: "STT", width: 8, align: "center" },
        { key: "ContractCode", title: isEn ? "Contract Code" : "Số HĐ CĐT", width: 22, align: "left" },
        { key: "Description", title: isEn ? "Description" : "Tên / Diễn giải HĐ", width: 32, align: "left" },
        { key: "CompanyName", title: isEn ? "Client / Company" : "Chủ đầu tư", width: 28, align: "left" },
        { key: "TaxID", title: isEn ? "Tax ID" : "Mã số thuế", width: 16, align: "center" },
        { key: "ContractDate", title: isEn ? "Contract Date" : "Ngày ký", width: 14, align: "center" },
        { key: "StartDate", title: isEn ? "Start Date" : "Ngày bắt đầu", width: 14, align: "center" },
        { key: "EndDate", title: isEn ? "End Date" : "Ngày kết thúc", width: 14, align: "center" },
        { key: "ActualStart", title: isEn ? "Actual Start" : "Khởi công TT", width: 14, align: "center" },
        { key: "StatusName", title: isEn ? "Status" : "Trạng thái", width: 16, align: "center" },
        { key: "CurrentAssignee", title: isEn ? "Assignee" : "Người xử lý", width: 20, align: "left" },
        { key: "CreatedBy", title: isEn ? "Created By" : "Người tạo", width: 16, align: "center" },
        { key: "CreatedDate", title: isEn ? "Created Date" : "Ngày tạo", width: 20, align: "center" },
      ],
      data: exportData,
    });
  }, [filteredContracts, isEn]);

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
                ? "Search by contract code, description, client, tax ID..."
                : "Mã HĐ, tên HĐ CĐT, chủ đầu tư, MST..."
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
      <MainContractsTable
        dataSource={paginatedContracts}
        loading={loading}
        totalRows={filteredContracts.length}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onRowDoubleClick={(record) => {
          setSelectedContract(record);
          setIsDetailOpen(true);
        }}
      />

      {/* Modal chi tiết hợp đồng CĐT */}
      <MainContractDetailModal
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
