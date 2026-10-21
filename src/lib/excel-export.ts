import ExcelJS from "exceljs";

export interface DynamicExcelColumn {
  key: string;
  title: string;
  width?: number;
  align?: "left" | "center" | "right";
  dataType?: "string" | "number" | "date";
  numFmt?: string; // Ví dụ: '#,##0', '#,##0.00', 'DD/MM/YYYY'
  children?: DynamicExcelColumn[]; // Hỗ trợ header 2 tầng (Grouped columns)
}

export interface ExcelSummaryConfig {
  /**
   * Cấu hình gộp ô cho nhãn "TỔNG CỘNG"
   * Ví dụ: startColKey = "WarehouseName", endColKey = "ItemName", label = "TỔNG CỘNG"
   */
  mergeLabel?: {
    startColKey: string;
    endColKey: string;
    label: string;
  };
  /**
   * Giá trị tổng cộng cho từng cột (key trùng với column key)
   */
  values?: Record<string, number | string>;
}

export interface DynamicExcelExportOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  metadata?: { label: string; value: string | number }[];
  columns: DynamicExcelColumn[];
  data: any[];
  summary?: ExcelSummaryConfig;
  themeColor?: string; // Mã màu hex (vd: '008F89')
}

/**
 * Hàm lấy danh sách các cột lá (leaf columns) phục vụ việc ghi dữ liệu hàng
 */
function getLeafColumns(columns: DynamicExcelColumn[]): DynamicExcelColumn[] {
  const leaves: DynamicExcelColumn[] = [];
  for (const col of columns) {
    if (col.children && col.children.length > 0) {
      leaves.push(...getLeafColumns(col.children));
    } else {
      leaves.push(col);
    }
  }
  return leaves;
}

/**
 * Kiểm tra xem cấu hình cột có chứa nhóm cột cha-con (2 tầng) hay không
 */
function hasNestedColumns(columns: DynamicExcelColumn[]): boolean {
  return columns.some((col) => col.children && col.children.length > 0);
}

/**
 * Tiện ích xuất Excel động đa năng dùng chung cho toàn bộ dự án
 */
export async function exportToExcel(options: DynamicExcelExportOptions): Promise<void> {
  const {
    fileName,
    sheetName = "Sheet1",
    title,
    metadata = [],
    columns,
    data,
    summary,
    themeColor = "008F89", // Teal chủ đạo ERP
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ERP System";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  const leafCols = getLeafColumns(columns);
  const totalLeafCols = leafCols.length;
  const isNested = hasNestedColumns(columns);

  let currentRow = 1;

  // 1. Ghi TIÊU ĐỀ BÁO CÁO (Nếu có)
  if (title) {
    const titleRow = worksheet.getRow(currentRow);
    titleRow.height = 36;
    worksheet.mergeCells(currentRow, 1, currentRow, totalLeafCols);

    const titleCell = worksheet.getCell(currentRow, 1);
    titleCell.value = title.toUpperCase();
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF123443" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    currentRow += 1;
  }

  // 2. Ghi METADATA / THÔNG TIN BỘ LỌC (Kỳ, Kho, Ngày lập, Người xuất...)
  if (metadata.length > 0) {
    for (const meta of metadata) {
      const metaRow = worksheet.getRow(currentRow);
      metaRow.height = 20;

      const cellLabel = worksheet.getCell(currentRow, 2);
      cellLabel.value = `${meta.label}:`;
      cellLabel.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF475569" } };
      cellLabel.alignment = { vertical: "middle", horizontal: "left" };

      const cellVal = worksheet.getCell(currentRow, 3);
      cellVal.value = meta.value;
      cellVal.font = { name: "Arial", size: 10, color: { argb: "FF1E293B" } };
      cellVal.alignment = { vertical: "middle", horizontal: "left" };

      currentRow += 1;
    }
    // Cách 1 dòng trống trước bảng
    currentRow += 1;
  }

  // 3. Ghi HEADER BẢNG (Hỗ trợ cả 1 tầng và 2 tầng gộp ô)
  const headerStartRow = currentRow;

  if (isNested) {
    // Header 2 tầng
    const row1 = worksheet.getRow(headerStartRow);
    const row2 = worksheet.getRow(headerStartRow + 1);
    row1.height = 28;
    row2.height = 26;

    let colIdx = 1;
    for (const col of columns) {
      if (col.children && col.children.length > 0) {
        // Cột cha: Merge ngang hàng 1
        const childCount = col.children.length;
        worksheet.mergeCells(headerStartRow, colIdx, headerStartRow, colIdx + childCount - 1);
        const parentCell = worksheet.getCell(headerStartRow, colIdx);
        parentCell.value = col.title;

        // Cột con: Điền vào hàng 2
        col.children.forEach((child, cIdx) => {
          const childCell = worksheet.getCell(headerStartRow + 1, colIdx + cIdx);
          childCell.value = child.title;
        });

        colIdx += childCount;
      } else {
        // Cột đơn: Merge dọc từ hàng 1 xuống hàng 2
        worksheet.mergeCells(headerStartRow, colIdx, headerStartRow + 1, colIdx);
        const singleCell = worksheet.getCell(headerStartRow, colIdx);
        singleCell.value = col.title;
        colIdx += 1;
      }
    }

    currentRow += 2;
  } else {
    // Header 1 tầng đơn giản
    const row1 = worksheet.getRow(headerStartRow);
    row1.height = 28;

    leafCols.forEach((col, idx) => {
      const cell = worksheet.getCell(headerStartRow, idx + 1);
      cell.value = col.title;
    });

    currentRow += 1;
  }

  // Style cho toàn bộ ô header
  for (let r = headerStartRow; r < currentRow; r++) {
    for (let c = 1; c <= totalLeafCols; c++) {
      const cell = worksheet.getCell(r, c);
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${themeColor.replace("#", "")}` },
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFDCE5E6" } },
        left: { style: "thin", color: { argb: "FFDCE5E6" } },
        bottom: { style: "thin", color: { argb: "FFDCE5E6" } },
        right: { style: "thin", color: { argb: "FFDCE5E6" } },
      };
    }
  }

  // 4. Ghi DỮ LIỆU CÁC HÀNG (Data rows)
  data.forEach((item, rowIdx) => {
    const dataRow = worksheet.getRow(currentRow);
    dataRow.height = 24;

    leafCols.forEach((col, colIdx) => {
      const cell = worksheet.getCell(currentRow, colIdx + 1);
      let val: any = item[col.key];

      // Nếu là cột STT mà không có sẵn trong item, tự động đánh số
      if (col.key === "stt" || col.key === "RowNum" || col.key === "No") {
        val = val ?? rowIdx + 1;
      }

      // Format kiểu số nếu dataType là number
      if (col.dataType === "number" || typeof val === "number") {
        const numVal = Number(val);
        cell.value = isNaN(numVal) ? 0 : numVal;
        cell.numFmt = col.numFmt || "#,##0";
      } else {
        cell.value = val ?? "";
      }

      // Canh lề
      const align = col.align || (col.dataType === "number" ? "right" : "left");
      cell.alignment = { vertical: "middle", horizontal: align };
      cell.font = { name: "Arial", size: 10, color: { argb: "FF334155" } };

      // Kẻ viền ô
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Màu xen kẽ hàng chẵn/lẻ (Zebra stripes)
      if (rowIdx % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
    });

    currentRow += 1;
  });

  // 5. Ghi DÒNG TỔNG CỘNG (Summary Row nếu có)
  if (summary) {
    const summaryRow = worksheet.getRow(currentRow);
    summaryRow.height = 28;

    // 5.1. Xử lý gộp ô cho nhãn "TỔNG CỘNG"
    if (summary.mergeLabel) {
      const { startColKey, endColKey, label } = summary.mergeLabel;
      const startIdx = leafCols.findIndex((c) => c.key === startColKey) + 1;
      const endIdx = leafCols.findIndex((c) => c.key === endColKey) + 1;

      if (startIdx > 0 && endIdx >= startIdx) {
        worksheet.mergeCells(currentRow, startIdx, currentRow, endIdx);
        const mergedCell = worksheet.getCell(currentRow, startIdx);
        mergedCell.value = label;
        mergedCell.alignment = { vertical: "middle", horizontal: "center" };
      }
    }

    // 5.2. Điền giá trị tổng cho các cột còn lại
    leafCols.forEach((col, colIdx) => {
      const cNum = colIdx + 1;
      // Bỏ qua các ô đã nằm trong vùng merge của mergeLabel (trừ ô đầu tiên đã set giá trị)
      if (
        summary.mergeLabel &&
        cNum >= leafCols.findIndex((c) => c.key === summary.mergeLabel!.startColKey) + 1 &&
        cNum <= leafCols.findIndex((c) => c.key === summary.mergeLabel!.endColKey) + 1
      ) {
        // Vùng merge đã xử lý
      } else {
        const cell = worksheet.getCell(currentRow, cNum);
        if (summary.values && summary.values[col.key] !== undefined) {
          const sVal = summary.values[col.key];
          if (typeof sVal === "number") {
            cell.value = sVal;
            cell.numFmt = col.numFmt || "#,##0";
          } else {
            cell.value = sVal;
          }
        }
        cell.alignment = { vertical: "middle", horizontal: col.align || "right" };
      }

      // Style cho toàn bộ dòng tổng cộng
      const cell = worksheet.getCell(currentRow, cNum);
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF123443" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEEF8F6" }, // Màu xanh ngọc nhạt giống giao diện
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF008F89" } },
        bottom: { style: "medium", color: { argb: "FF008F89" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });

    currentRow += 1;
  }

  // 6. TỰ ĐỘNG ĐỊNH ĐỘ RỘNG CỘT (Column Widths)
  leafCols.forEach((col, idx) => {
    const wsCol = worksheet.getColumn(idx + 1);
    if (col.width) {
      // Đổi từ px (Ant Design width) sang ký tự Excel (chia xấp xỉ 7.5)
      wsCol.width = Math.max(12, Math.round(col.width / 7.5));
    } else {
      wsCol.width = 16;
    }
  });

  // 7. XUẤT FILE VỀ TRÌNH DUYỆT (Download Blob)
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  a.download = safeFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
