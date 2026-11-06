"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Modal, Table, Input, Button, Pagination } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  IconSearch,
  IconRefresh,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import ResizableTitle from "@/components/table/ResizableTitle";
import { useTranslation } from "@/locales/LanguageContext";

const STORAGE_KEY_CONTRACT_LOV = "INVOICES_CONTRACT_LOV_COL_WIDTHS";

const defaultColWidths: Record<string, number> = {
  stt: 50,
  MainCode: 160,
  ContractCode: 210,
  Venname: 240,
  Description: 250,
  Contractdate: 110,
  action: 75,
};

interface ContractLovModalProps {
  open: boolean;
  onClose: () => void;
  contracts: any[];
  loading?: boolean;
  onSelectContract: (contract: any) => void;
}

export const ContractLovModal: React.FC<ContractLovModalProps> = ({
  open,
  onClose,
  contracts,
  loading = false,
  onSelectContract,
}) => {
  const { t, language } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Quản lý độ rộng cột ResizableTitle & lưu localStorage
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaultColWidths;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTRACT_LOV);
      if (saved) return { ...defaultColWidths, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Lỗi đọc cấu hình kích thước cột Contract LOV:", e);
    }
    return defaultColWidths;
  });

  const handleResize = useCallback(
    (colKey: string) => (_: any, { size }: { size: { width: number } }) => {
      setColWidths((prev) => {
        const updated = { ...prev, [colKey]: Math.max(size.width, 40) };
        try {
          localStorage.setItem(STORAGE_KEY_CONTRACT_LOV, JSON.stringify(updated));
        } catch {
          // Best-effort: Lưu cấu hình độ rộng cột vào localStorage
        }
        return updated;
      });
    },
    []
  );

  const filteredContracts = useMemo(() => {
    if (!keyword.trim()) return contracts;
    const lower = keyword.toLowerCase().trim();
    return contracts.filter((c) => {
      const code = String(c.ContractCode || "").toLowerCase();
      const vendor = String(c.Venname || c.VenName || "").toLowerCase();
      const main = String(c.MainCode || c.OwnerContractCode || "").toLowerCase();
      const desc = String(c.Description || "").toLowerCase();
      return (
        code.includes(lower) ||
        vendor.includes(lower) ||
        main.includes(lower) ||
        desc.includes(lower)
      );
    });
  }, [contracts, keyword]);

  const pagedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage, pageSize]);

  const handleSearch = (kw: string) => {
    setKeyword(kw);
    setCurrentPage(1);
  };

  const handleSelect = (record: any) => {
    onSelectContract(record);
    onClose();
  };

  const baseColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: t("invoices.table.stt") || "STT",
        key: "stt",
        width: defaultColWidths.stt,
        align: "center",
        render: (_: any, __: any, index: number) => (
          <span style={{ color: "#64748b", fontWeight: 400 }}>
            {(currentPage - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        title: language === "en" ? "Client Contract" : "HĐ chủ đầu tư",
        key: "MainCode",
        dataIndex: "MainCode",
        width: defaultColWidths.MainCode,
        render: (val: string, r: any) => (
          <span style={{ color: "#123443", fontWeight: 400, fontFamily: "monospace" }}>
            {val || r.OwnerContractCode || "---"}
          </span>
        ),
      },
      {
        title: language === "en" ? "Contract Code" : "Số hợp đồng NCC/NTP",
        dataIndex: "ContractCode",
        key: "ContractCode",
        width: defaultColWidths.ContractCode,
        render: (val: string) => (
          <span style={{ color: "#123443", fontWeight: 400, fontFamily: "monospace" }}>
            {val || "---"}
          </span>
        ),
      },
      {
        title: language === "en" ? "Vendor / Partner" : "Nhà cung cấp / Đối tác",
        key: "Venname",
        width: defaultColWidths.Venname,
        render: (_: any, r: any) => (
          <span style={{ color: "#123443", fontWeight: 400 }}>
            {r.Venname || r.VenName || "---"}
          </span>
        ),
      },
      {
        title: language === "en" ? "Description" : "Diễn giải",
        dataIndex: "Description",
        key: "Description",
        width: defaultColWidths.Description,
        ellipsis: true,
        render: (val: string) => (
          <span style={{ color: "#123443", fontWeight: 400 }} title={val}>
            {val || "---"}
          </span>
        ),
      },
      {
        title: language === "en" ? "Contract Date" : "Ngày ký HĐ",
        key: "Contractdate",
        dataIndex: "Contractdate",
        width: defaultColWidths.Contractdate,
        align: "center",
        render: (_: any, r: any) => {
          const dateVal = r.Contractdate || r.ContractDate || r.StartDate || r.CreatedDate || "";
          return (
            <span style={{ color: "#123443", fontWeight: 400 }}>
              {dateVal || "---"}
            </span>
          );
        },
      },
      {
        title: language === "en" ? "Action" : "Thao tác",
        key: "action",
        width: defaultColWidths.action,
        align: "center",
        render: (_: any, record: any) => (
          <Button
            type="primary"
            size="small"
            icon={<IconCheck size={13} strokeWidth={2} />}
            style={{
              backgroundColor: "#008f89",
              borderColor: "#008f89",
              borderRadius: 4,
              fontSize: 12,
              height: 26,
              padding: "0 8px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(record);
            }}
          >
            {language === "en" ? "Select" : "Chọn"}
          </Button>
        ),
      },
    ],
    [language, currentPage, pageSize, t]
  );

  // Hợp nhất độ rộng cột đã lưu & gắn sự kiện kéo resize
  const mergedColumns = useMemo(() => {
    return baseColumns.map((col: any) => {
      const colKey = String(col.key || col.dataIndex);
      const currentWidth = colWidths[colKey] || col.width || 100;
      return {
        ...col,
        width: currentWidth,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(colKey),
        }),
      };
    });
  }, [baseColumns, colWidths, handleResize]);

  const totalScrollX = useMemo(() => {
    return mergedColumns.reduce((sum, col: any) => sum + (Number(col.width) || 100), 0);
  }, [mergedColumns]);

  return (
    <Modal
      title={
        <div style={{ fontSize: 14, fontWeight: 700, color: "#008f89", textTransform: "uppercase" }}>
          {language === "en" ? "Contract Directory (LOV)" : "Danh mục Hợp đồng (LOV)"}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1050}
      centered
      destroyOnClose
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Pagination
            size="small"
            current={currentPage}
            pageSize={pageSize}
            total={filteredContracts.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
          <Button
            icon={<IconX size={15} strokeWidth={1.8} style={{ color: "#718894" }} />}
            onClick={onClose}
            style={{
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              borderColor: "#dce5e6",
              background: "#FFFFFF",
              color: "#334155",
            }}
          >
            {language === "en" ? "Close" : "Đóng"}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 6 }}>
        {/* Thanh tìm kiếm chuẩn ERP */}
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            placeholder={
              language === "en"
                ? "Search by contract code, vendor name, client contract..."
                : "Tìm kiếm theo mã hợp đồng, tên nhà cung cấp, HĐ CĐT..."
            }
            prefix={<IconSearch size={15} strokeWidth={1.8} style={{ color: "#94a3b8" }} />}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (e.target.value === "") {
                handleSearch("");
              }
            }}
            onPressEnter={() => handleSearch(searchInput)}
            allowClear
            style={{ height: 32, borderColor: "#dce5e6", borderRadius: 6, fontSize: 12.5 }}
          />
          <Button
            type="primary"
            icon={<IconSearch size={15} strokeWidth={1.8} />}
            style={{
              background: "#008f89",
              borderColor: "#008f89",
              height: 32,
              borderRadius: 6,
              fontWeight: 500,
            }}
            onClick={() => handleSearch(searchInput)}
            loading={loading}
          >
            {language === "en" ? "Search" : "Tìm kiếm"}
          </Button>
          <Button
            icon={<IconRefresh size={15} strokeWidth={1.8} style={{ color: "#008f89" }} />}
            style={{
              height: 32,
              borderRadius: 6,
              borderColor: "#dce5e6",
            }}
            onClick={() => {
              setSearchInput("");
              handleSearch("");
            }}
          >
            {language === "en" ? "Refresh" : "Làm mới"}
          </Button>
        </div>

        {/* Bảng dữ liệu chuẩn ERP: .erp-detail-table, bordered, ResizableTitle, font thường #123443 */}
        <Table
          className="erp-detail-table"
          bordered
          size="small"
          loading={loading}
          dataSource={pagedContracts}
          columns={mergedColumns}
          components={{ header: { cell: ResizableTitle } }}
          rowKey={(r, index) => r.ContractId ?? `contract_${index}`}
          pagination={false}
          scroll={{ x: totalScrollX, y: 360 }}
          onRow={(record) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              if (target.closest("button") || target.closest("a") || target.closest(".ant-btn")) {
                return;
              }
              handleSelect(record);
            },
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </Modal>
  );
};

export default ContractLovModal;
