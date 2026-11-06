"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { invoicesApi } from "../../api";
import { IpcRecord } from "../../types";

export default function IpcPrintNoticePage() {
  const params = useParams();
  const ipcId = params?.id ? String(params.id) : "";

  const [ipc, setIpc] = useState<IpcRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // States đóng/mở tương tác phân cấp (Tree Table)
  const [isAExpanded, setIsAExpanded] = useState(true);
  const [isBExpanded, setIsBExpanded] = useState(true);
  const [is10Expanded, setIs10Expanded] = useState(true);
  const [printDateStr, setPrintDateStr] = useState("");

  useEffect(() => {
    const today = new Date();
    setPrintDateStr(
      `${String(today.getDate()).padStart(2, "0")}/${String(
        today.getMonth() + 1
      ).padStart(2, "0")}/${today.getFullYear()}`
    );
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!ipcId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Ưu tiên đọc từ localStorage (nếu mở từ nút In ở tab cha)
    try {
      const stored = localStorage.getItem("PRINT_NOTICE_IPC_DATA");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.IpcId === ipcId || !parsed.IpcId)) {
          if (isMounted) {
            setIpc(parsed);
            setLoading(false);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi đọc dữ liệu in IPC từ localStorage:", err);
    }

    // Gọi API để đồng bộ dữ liệu chuẩn
    invoicesApi
      .getIpcById(ipcId)
      .then((res) => {
        if (isMounted) {
          if (res) {
            setIpc(res);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin IPC từ API:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ipcId]);

  const formatVnd = (num?: number | null) => {
    if (num === undefined || num === null) return "---";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Giá trị tính toán cho mẫu thông báo (đồng bộ theo IPC thực tế)
  const finalAmount = ipc ? (ipc.ApprovedAmount ?? ipc.ProposedAmount ?? 0) : 0;
  const initialContractValue = (ipc as any)?.ContractAmount ?? (ipc as any)?.ContractedAmount ?? finalAmount;
  const contractAdjustedValue = initialContractValue;
  const retentionValue = Math.round(finalAmount * 0.05); // Giữ bảo lưu 5%
  const payableWorkValue = finalAmount - retentionValue;
  const advancePayment = 0;
  const advanceRepayment = 0;
  const deductionValue = 0;
  const withholdingValue = 0;
  const previousProposedValue = 0;
  const currentProposedPayment = payableWorkValue + advancePayment - advanceRepayment - deductionValue - withholdingValue - previousProposedValue;

  const toggleAll = () => {
    const nextState = !(isAExpanded && isBExpanded);
    setIsAExpanded(nextState);
    setIsBExpanded(nextState);
  };

  if (!loading && (!ipc || !ipcId)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: 24,
          fontFamily: "Segoe UI, -apple-system, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "36px 48px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            textAlign: "center",
            maxWidth: 480,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            Không tìm thấy thông tin phiếu IPC
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>
            Mã phiếu không tồn tại hoặc dữ liệu chưa được nạp. Vui lòng kiểm tra lại từ danh sách hóa đơn / IPC.
          </p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                if (window.opener) window.close();
                else window.location.href = "/invoices";
              }
            }}
            style={{
              height: 34,
              padding: "0 18px",
              background: "#008f89",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Đóng trang in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="print-page-wrapper"
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        paddingBottom: 40,
        fontFamily: "Segoe UI, -apple-system, Roboto, sans-serif",
      }}
    >
      {/* ======================================================== */}
      {/* THANH CÔNG CỤ NỔI TRÊN CÙNG (ẨN KHI IN ẤN) */}
      {/* ======================================================== */}
      <header
        className="no-print"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "rgba(0, 143, 137, 0.1)",
              color: "#008f89",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            📄
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              THÔNG BÁO THANH TOÁN (NCC/NTP) • {ipc?.IpcId || ipcId}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Bản in chuẩn khổ A4 (210mm × 297mm) • Tương tác thu gọn / mở rộng trực tiếp
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "none",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background: "#fffbeb",
              color: "#92400e",
              border: "1px solid #fde68a",
              borderRadius: 6,
              fontSize: 11,
            }}
            className="md-hint"
          >
            <span>💡</span>
            <span>Nhấp vào <b>►/▼</b> tại <b>No.</b>, <b>A</b>, <b>B</b> để thu gọn / mở rộng</span>
          </div>

          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "#008f89",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
            }}
          >
            <span>🖨</span>
            <span>In ra giấy / PDF</span>
          </button>

          <button
            onClick={() => window.close()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              background: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <span>✕</span>
            <span>Đóng tab</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* TỜ GIẤY A4 TIÊU CHUẨN (210mm x 297mm)                    */}
      {/* Toàn bộ đường kẻ được quản lý bằng CSS variables ở cuối  */}
      {/* file: --line-strong (khung/ngăn khối) & --line (đường kẻ */}
      {/* nội bộ) để nét đồng nhất, rõ ràng khi in.                */}
      {/* ======================================================== */}
      <main
        className="a4-sheet"
        style={{
          width: "210mm",
          height: "297mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          boxSizing: "border-box",
          margin: "20px auto",
          background: "#ffffff",
          color: "#000000",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          padding: "12mm 15mm",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontSize: "11.5px",
        }}
      >
        {/* KHUNG VIỀN NGOÀI ĐỒNG NHẤT */}
        <div className="ipc-frame">

          {/* 1. KHỐI LOGO + THÔNG TIN HỢP ĐỒNG */}
          <div className="ipc-section" style={{ display: "grid", gridTemplateColumns: "220px 1fr" }}>
            <div className="ipc-logo">
              <svg width="110" height="85" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="55" cy="50" r="35" stroke="#162a56" strokeWidth="16" strokeDasharray="175 48" strokeLinecap="round" fill="none" />
                <circle cx="55" cy="50" r="14" fill="#ea580c" />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", fontSize: "11px" }}>
              <div className="ipc-cell bb">
                <span className="ipc-label" style={{ width: 95 }}>Hợp đồng:</span>
                <span style={{ fontWeight: 600 }}>
                  {ipc?.ContractCode ? `${ipc.ContractCode} - ${ipc.VendorName}` : "SUB-75 08 11-22831 - Công Ty Cổ Phần Tân Thời Đại Home"}
                </span>
              </div>
              <div className="ipc-cell bb">
                <span className="ipc-label" style={{ width: 95 }}>Ngày nhận:</span>
                <span>{ipc?.PaymentDate ? (ipc.PaymentDate.includes("-") ? ipc.PaymentDate.split("-").reverse().join("/") : ipc.PaymentDate) : "05/11/2026"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1 }}>
                <div className="ipc-cell br">
                  <span className="ipc-label" style={{ width: 95 }}>Số hạch toán:</span>
                  <span>{(ipc as any)?.PostingNo || "HT-2026/10-09"}</span>
                </div>
                <div className="ipc-cell">
                  <span className="ipc-label" style={{ width: 90 }}>Kỳ thanh toán:</span>
                  <span>{(ipc as any)?.PaymentPeriod || "Đợt 06"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. TIÊU ĐỀ TRUNG TÂM */}
          <div className="ipc-section" style={{ textAlign: "center", padding: "12px 16px" }}>
            <h1 style={{ fontSize: "15px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, color: "#000000" }}>
              THÔNG BÁO THANH TOÁN
            </h1>
            <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginTop: 2, color: "#000000" }}>
              (NCC/NTP)
            </div>
          </div>

          {/* 3. THÔNG TIN ĐỐI TÁC */}
          <div className="ipc-section" style={{ fontSize: "11.5px" }}>
            <div className="ipc-cell bb">
              <span className="ipc-label" style={{ width: 85 }}>NCC/NTP:</span>
              <span style={{ fontWeight: 500 }}>{ipc?.VendorName || "Công Ty Cổ Phần Tân Thời Đại Home"}</span>
            </div>
            <div className="bb" style={{ display: "grid", gridTemplateColumns: "55% 45%" }}>
              <div className="ipc-cell br">
                <span className="ipc-label" style={{ width: 85 }}>Số HĐ:</span>
                <span>{ipc?.ContractCode || "SUB-75 08 11-22831"}</span>
              </div>
              <div className="ipc-cell">
                <span className="ipc-label" style={{ width: 70 }}>Ký ngày:</span>
                <span>{ipc?.DocDate ? (ipc.DocDate.includes("-") ? ipc.DocDate.split("-").reverse().join("/") : ipc.DocDate) : "30/10/2026"}</span>
              </div>
            </div>
            <div className="ipc-cell">
              <span className="ipc-label" style={{ width: 85 }}>Hạng mục:</span>
              <span>{ipc?.Description || "Thanh toán vật tư gạch AAC đợt 1 theo phiếu nhập RE-008"}</span>
            </div>
          </div>

          {/* 4. BẢNG DỮ LIỆU CÂY PHÂN CẤP (TREE TABLE) */}
          <div className="ipc-section">
            <table className="ipc-table">
              <thead>
                <tr>
                  <th
                    onClick={toggleAll}
                    className="clickable"
                    style={{ width: 58, textAlign: "left" }}
                    title="Nhấp để Thu gọn / Mở rộng tất cả"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 10 }}>{isAExpanded || isBExpanded ? "▼" : "►"}</span>
                      <span>No.</span>
                    </span>
                  </th>
                  <th style={{ textAlign: "center" }}>Nội dung</th>
                  <th style={{ width: 180, textAlign: "center" }}>Giá trị (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {/* SECTION A */}
                <tr className="ipc-group">
                  <td className="clickable" onClick={() => setIsAExpanded(!isAExpanded)} title="Thu gọn / Mở rộng Mục A">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 10 }}>{isAExpanded ? "▼" : "►"}</span>
                      <span>A</span>
                    </span>
                  </td>
                  <td className="clickable upper" onClick={() => setIsAExpanded(!isAExpanded)}>
                    GIÁ TRỊ HỢP ĐỒNG (BAO GỒM VAT)
                  </td>
                  <td className="num"></td>
                </tr>

                {isAExpanded &&
                  [
                    ["1", "Giá trị hợp đồng ban đầu", formatVnd(initialContractValue)],
                    ["2", "Điều chỉnh hợp đồng", formatVnd(0)],
                    ["3", "Giá trị hợp đồng sau điều chỉnh", formatVnd(contractAdjustedValue)],
                  ].map(([no, label, value]) => (
                    <tr key={`a-${no}`}>
                      <td className="idx">{no}</td>
                      <td>{label}</td>
                      <td className="num">{value}</td>
                    </tr>
                  ))}

                {/* SECTION B */}
                <tr className="ipc-group">
                  <td className="clickable" onClick={() => setIsBExpanded(!isBExpanded)} title="Thu gọn / Mở rộng Mục B">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 10 }}>{isBExpanded ? "▼" : "►"}</span>
                      <span>B</span>
                    </span>
                  </td>
                  <td className="clickable upper" onClick={() => setIsBExpanded(!isBExpanded)}>
                    GIÁ TRỊ THANH TOÁN
                  </td>
                  <td className="num"></td>
                </tr>

                {/* Khi B thu gọn: hàng 1-9 ẩn, hàng 10 vẫn hiển thị */}
                {isBExpanded &&
                  [
                    ["1", "Giá trị thực hiện kỳ này", formatVnd(finalAmount)],
                    ["2", "Giá trị thực hiện đến kỳ này", formatVnd(finalAmount)],
                    ["3", "Giá trị giữ bảo lưu đến kỳ này", formatVnd(retentionValue)],
                    ["4", "Giá trị thực hiện được thanh toán đến kỳ này", formatVnd(payableWorkValue)],
                    ["5", "Giá trị tạm ứng đến kỳ này", formatVnd(advancePayment)],
                    ["6", "Hoàn trả tạm ứng đến kỳ này", formatVnd(advanceRepayment)],
                    ["7", "Giá trị khấu trừ đến kỳ này", formatVnd(deductionValue)],
                    ["8", "Giá trị tạm giữ đến kỳ này", formatVnd(withholdingValue)],
                    ["9", "Tổng giá trị đã đề nghị thanh toán đến các kỳ trước (Bao gồm tạm ứng)", formatVnd(previousProposedValue)],
                  ].map(([no, label, value]) => (
                    <tr key={`b-${no}`}>
                      <td className="idx">{no}</td>
                      <td>{label}</td>
                      <td className="num">{value}</td>
                    </tr>
                  ))}

                {/* Row 10: Đề nghị thanh toán kỳ này */}
                <tr className="ipc-total">
                  <td className="clickable" onClick={() => setIs10Expanded(!is10Expanded)} title="Mục 10">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 10 }}>{is10Expanded ? "▼" : "►"}</span>
                      <span>10</span>
                    </span>
                  </td>
                  <td>Đề nghị thanh toán kỳ này (10) = (4)+(5)-(6)-(7)-(8)-(9)</td>
                  <td className="num">{formatVnd(currentProposedPayment)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. BẢNG THÔNG TIN PHÊ DUYỆT */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="ipc-approval-title">Thông tin phê duyệt:</div>
            <table className="ipc-table">
              <thead>
                <tr>
                  <th style={{ width: 80, textAlign: "center" }}>Vai trò</th>
                  <th style={{ width: 180, textAlign: "left" }}>Nhân sự thực hiện</th>
                  <th style={{ width: 110, textAlign: "center" }}>Thời gian</th>
                  <th style={{ width: 110, textAlign: "center" }}>Quyết định</th>
                  <th style={{ textAlign: "left" }}>Ý kiến</th>
                </tr>
              </thead>
              <tbody>
                {ipc?.RaciSteps && ipc.RaciSteps.length > 0 ? (
                  ipc.RaciSteps.map((step) => {
                    const isApproved = step.Decision === "Chấp thuận" || step.StatusCode === 1;
                    const isPending = step.Decision?.includes("Chờ") || step.StatusCode === 2;
                    return (
                      <tr key={step.StepNumber || step.Role}>
                        <td className="idx" style={{ fontWeight: 700 }}>{step.Role}</td>
                        <td style={{ fontWeight: 500 }}>{step.AssigneeName || "---"}</td>
                        <td className="idx">
                          {step.UpdatedDate
                            ? step.UpdatedDate.split(" ")[0].split("-").reverse().join("/")
                            : (step.Decision === "Chấp thuận" ? "30/10/2026" : "---")}
                        </td>
                        <td
                          className="idx"
                          style={{
                            color: isApproved ? "#10b981" : isPending ? "#2563eb" : "#94a3b8",
                            fontWeight: isApproved || isPending ? 600 : 400,
                          }}
                        >
                          {step.Decision || "Chưa duyệt"}
                        </td>
                        <td style={{ color: step.Notes ? "#334155" : "#94a3b8" }}>{step.Notes || "---"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr>
                      <td className="idx" style={{ fontWeight: 700 }}>R</td>
                      <td style={{ fontWeight: 500 }}>Nguyễn Văn Bổn</td>
                      <td className="idx">30/10/2026</td>
                      <td className="idx" style={{ color: "#10b981", fontWeight: 600 }}>Chấp thuận</td>
                      <td style={{ color: "#334155" }}>Đạt yêu cầu hồ sơ thanh toán</td>
                    </tr>
                    <tr>
                      <td className="idx" style={{ fontWeight: 700 }}>C</td>
                      <td>Nguyen Van C</td>
                      <td className="idx" style={{ color: "#94a3b8" }}>---</td>
                      <td className="idx" style={{ color: "#2563eb", fontWeight: 500 }}>Chờ duyệt</td>
                      <td style={{ color: "#94a3b8" }}>---</td>
                    </tr>
                    <tr>
                      <td className="idx" style={{ fontWeight: 700 }}>A</td>
                      <td>Ban Giám Đốc</td>
                      <td className="idx" style={{ color: "#94a3b8" }}>---</td>
                      <td className="idx" style={{ color: "#94a3b8" }}>Chưa duyệt</td>
                      <td style={{ color: "#94a3b8" }}>---</td>
                    </tr>
                    <tr>
                      <td className="idx" style={{ fontWeight: 700 }}>I</td>
                      <td>Kế toán thanh toán</td>
                      <td className="idx" style={{ color: "#94a3b8" }}>---</td>
                      <td className="idx" style={{ color: "#94a3b8" }}>Chưa duyệt</td>
                      <td style={{ color: "#94a3b8" }}>---</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footnote cuối trang */}
        <div
          className="ipc-footnote"
          style={{
            paddingTop: 8,
            fontSize: "10.5px",
            color: "#64748b",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            width: "100%",
          }}
        >
          <span style={{ textAlign: "left" }}>Hệ thống consIMS</span>
          <span style={{ textAlign: "center", fontWeight: 500, color: "#1e293b" }}>1/1</span>
          <span style={{ textAlign: "right" }}>In ngày: {printDateStr}</span>
        </div>
      </main>

      <style jsx global>{`
        /* ---------- TẤT CẢ ĐƯỜNG KẺ ĐỀU LÀ LINE THƯỜNG 1PX ĐỒNG NHẤT ---------- */
        .a4-sheet {
          --line: #000000;  /* Màu chuẩn đen 1px đồng nhất cho cả line dọc và line ngang */
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Khung viền ngoài: line thường 1px */
        .ipc-frame {
          border: 1px solid var(--line);
          background: #ffffff;
          box-sizing: border-box;
        }

        /* Mỗi khối lớn bên trong chỉ có 1 đường phân cách dưới (border-bottom) 1px thường */
        .ipc-section {
          border-bottom: 1px solid var(--line);
          box-sizing: border-box;
        }

        /* Khối logo bên trái: đường ngăn phải (border-right) 1px thường */
        .ipc-logo {
          border-right: 1px solid var(--line);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .ipc-cell {
          padding: 6px 10px;
          display: flex;
          align-items: center;
          box-sizing: border-box;
        }
        .bb { border-bottom: 1px solid var(--line); }
        .br { border-right: 1px solid var(--line); }
        .ipc-label {
          font-weight: 700;
          flex-shrink: 0;
        }

        /* ---------- BẢNG DỮ LIỆU CÂY & PHÊ DUYỆT ---------- */
        .ipc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          background: #ffffff;
        }

        /* Cả đường kẻ dọc (border-right) và kẻ ngang (border-bottom) đều là 1px đồng nhất */
        .ipc-table th,
        .ipc-table td {
          padding: 5px 8px;
          border-right: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          box-sizing: border-box;
          background: #ffffff;
        }

        /* Cột cuối cùng bên phải: triệt tiêu border-right để không chồng lên khung viền ngoài của .ipc-frame */
        .ipc-table th:last-child,
        .ipc-table td:last-child {
          border-right: none !important;
        }

        /* Hàng tiêu đề bảng: viền dưới 1px thường đồng nhất */
        .ipc-table thead th {
          padding: 6px 8px;
          font-weight: 700;
          background: #ffffff;
          border-bottom: 1px solid var(--line);
        }

        .ipc-table .idx { text-align: center; }
        .ipc-table .num {
          text-align: right;
          padding-right: 12px;
          font-variant-numeric: tabular-nums;
        }
        .ipc-table .upper { text-transform: uppercase; }
        .ipc-table .clickable {
          cursor: pointer;
          user-select: none;
        }

        /* Hàng nhóm A / B: nền trắng thuần */
        .ipc-group td {
          padding: 6px 8px;
          font-weight: 700;
          background: #ffffff;
        }
        .ipc-group td.num { padding-right: 12px; }

        /* Hàng 10 (Tổng thanh toán):
           Không dùng border-top để tránh đè lên hàng trên.
           Đáy hàng 10 không có border-bottom vì đã có border-bottom của .ipc-section bao bên ngoài */
        .ipc-total td {
          padding: 6px 8px;
          font-weight: 700;
          background: #ffffff;
          border-bottom: none !important;
        }
        .ipc-total td.num { padding-right: 12px; }

        /* Hàng cuối cùng của bất kỳ bảng nào: triệt tiêu border-bottom để không đè lên đường đáy khối/khung */
        .ipc-table tbody tr:last-child td {
          border-bottom: none !important;
        }

        /* Khối tiêu đề Thông tin phê duyệt: viền dưới 1px thường đồng nhất */
        .ipc-approval-title {
          padding: 6px 10px;
          font-weight: 700;
          font-size: 11px;
          color: #000000;
          background: #ffffff;
          border-bottom: 1px solid var(--line);
          box-sizing: border-box;
        }

        @media (min-width: 768px) {
          .md-hint {
            display: flex !important;
          }
        }
        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0;
          }
          *,
          *::before,
          *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html,
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 100% !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .print-page-wrapper {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 100% !important;
            max-height: 297mm !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-sheet {
            width: 210mm !important;
            max-width: 210mm !important;
            height: 100% !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            padding: 12mm 15mm 12mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-before: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .ipc-frame,
          .ipc-section,
          .ipc-table,
          .ipc-table tr,
          .ipc-table td,
          .ipc-table th,
          .ipc-footnote {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .ipc-footnote {
            width: 100% !important;
            padding-top: 8px !important;
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
