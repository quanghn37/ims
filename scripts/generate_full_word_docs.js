const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
} = require("docx");

function createTitle(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, before: 200 },
    run: {
      size: 34,
      bold: true,
      color: "008F89",
      font: "Segoe UI",
    },
  });
}

function createSubTitle(text) {
  return new Paragraph({
    text,
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    run: {
      size: 22,
      italics: true,
      color: "475569",
      font: "Segoe UI",
    },
  });
}

function createHeading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 350, after: 120 },
    run: {
      size: 26,
      bold: true,
      color: "008F89",
      font: "Segoe UI",
    },
  });
}

function createHeading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 90 },
    run: {
      size: 22,
      bold: true,
      color: "0F766E",
      font: "Segoe UI",
    },
  });
}

function createHeading3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 70 },
    run: {
      size: 20,
      bold: true,
      color: "1E293B",
      font: "Segoe UI",
    },
  });
}

function createPara(text, options = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text,
        size: 19,
        font: "Segoe UI",
        color: options.color || "1E293B",
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
  });
}

function createBullet(title, desc) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 70 },
    children: [
      new TextRun({
        text: title + ": ",
        size: 19,
        bold: true,
        font: "Segoe UI",
        color: "0F172A",
      }),
      new TextRun({
        text: desc,
        size: 19,
        font: "Segoe UI",
        color: "334155",
      }),
    ],
  });
}

function createCodeBlock(jsonStr) {
  const lines = jsonStr.split("\n");
  const paragraphs = lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 20, before: 20 },
        children: [
          new TextRun({
            text: line,
            size: 15.5,
            font: "Consolas",
            color: "0F766E",
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: paragraphs,
          }),
        ],
      }),
    ],
  });
}

const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "CBD5E1",
};

const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};

function createCell(text, isHeader = false, widthPercent = 20, options = {}) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    shading: {
      type: ShadingType.CLEAR,
      fill: isHeader ? "E6F4F2" : (options.bg || "FFFFFF"),
    },
    margins: {
      top: 80,
      bottom: 80,
      left: 100,
      right: 100,
    },
    children: [
      new Paragraph({
        alignment: options.align || (isHeader ? AlignmentType.CENTER : AlignmentType.LEFT),
        children: [
          new TextRun({
            text: text || "",
            bold: isHeader || options.bold || false,
            size: isHeader ? 17.5 : 16.5,
            color: isHeader ? "006965" : (options.mono ? "0F766E" : "1E293B"),
            font: options.mono ? "Consolas" : "Segoe UI",
          }),
        ],
      }),
    ],
  });
}

function createTable(headers, rows, colWidths) {
  const tableRows = [];

  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => createCell(h, true, colWidths[i])),
    })
  );

  rows.forEach((r, rowIdx) => {
    tableRows.push(
      new TableRow({
        children: r.map((cellText, colIdx) =>
          createCell(
            cellText,
            false,
            colWidths[colIdx],
            {
              bg: rowIdx % 2 === 1 ? "F8FAFC" : "FFFFFF",
              mono: colIdx === 0,
            }
          )
        ),
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

function createApiSpecBlock(apiNumber, title, method, endpoint, description, paramsList, fullUrlExample, resJson) {
  const items = [];
  items.push(createHeading3(`${apiNumber}. ${title}`));
  items.push(createPara(`• Phương thức: ${method} | Endpoint: ${endpoint}`, { bold: true, color: "008F89" }));
  items.push(createPara(`• Mục đích: ${description}`));
  items.push(createPara("Bảng chi tiết đầy đủ 100% các tham số (Request Parameters / Payload):", { bold: true }));

  const headers = ["Tên Param", "Kiểu", "Bắt buộc", "Nguồn lấy", "Giá trị mẫu / Cho phép", "Ý nghĩa nghiệp vụ"];
  const colWidths = [18, 10, 12, 18, 22, 20];
  items.push(createTable(headers, paramsList, colWidths));

  if (fullUrlExample) {
    items.push(createPara(method === "GET" ? "URL Request đầy đủ (Copy chạy trực tiếp trên Postman/Browser):" : "Payload JSON Body đầy đủ (POST):", { bold: true }));
    items.push(createCodeBlock(fullUrlExample));
  }

  if (resJson) {
    items.push(createPara("JSON Response mẫu trả về:", { bold: true }));
    items.push(createCodeBlock(resJson));
  }

  return items;
}

const COMMON_SESSION_PARAMS = [
  ["LogIn", "string", "Có", "Session.LogIn", '"r@gmail.com"', "Tài khoản email của người dùng đang đăng nhập."],
  ["SessionId", "string", "Có", "Session.SessionId", '"778C4190-35FF-494D-B77C-380CFC836353"', "Mã GUID phiên đăng nhập hợp lệ."],
  ["WSId", "string", "Có", "Session.WSId", '""', "Mã không gian làm việc (để trống nếu mặc định)."],
  ["Language", "string", "Có", "Storage / Session", '"vi"', "Ngôn ngữ trả về dữ liệu (vi / en)."],
  ["Keyword", "string", "Không", "Input Search", '""', "Từ khóa tìm kiếm (mã, tên, ghi chú)."],
  ["PageNum", "number", "Có", "Pagination", "1", "Số thứ tự trang hiện tại."],
  ["PageSize", "number", "Có", "Pagination", "10", "Số lượng bản ghi trên một trang."]
];

async function generate() {
  const docElements = [];

  // TITLE & INTRODUCTION
  docElements.push(createTitle("HỆ THỐNG ERP XÂY DỰNG - TÀI LIỆU ĐẶC TẢ KỸ THUẬT & TOÀN BỘ API PARAMS"));
  docElements.push(createSubTitle("Phiên bản chuẩn hóa đầy đủ 100% URL Request dạng ?params={...} & Toàn bộ tham số phiên"));
  docElements.push(createPara("Tài liệu này đặc tả chi tiết 5 phân hệ cốt lõi: Bảng giá, Hợp đồng, Đơn đặt hàng (PO), Nhập kho và Yêu cầu xuất / Xuất kho (chưa bao gồm IPC). Mỗi API được chuẩn hóa đầy đủ 100% các tham số bắt buộc của hệ thống (LogIn, SessionId, WSId, Language, Keyword, PageNum, PageSize) và URL đầy đủ định dạng http://localhost:3000/api/<endpoint>?params={...} copy dán chạy được ngay trên Postman.", { italics: true }));

  // ==========================================
  // PHÂN HỆ 1: BẢNG GIÁ (QUOTATIONS)
  // ==========================================
  docElements.push(createHeading1("PHÂN HỆ 1: BẢNG GIÁ (QUOTATIONS - `/quotations`)"));
  docElements.push(createHeading2("1.1. Luồng nghiệp vụ tổng quan"));
  docElements.push(createBullet("Mục đích", "Quản lý đơn giá chào thầu, bảng báo giá vật tư cho Chủ đầu tư hoặc Khách hàng."));
  docElements.push(createBullet("Chu trình thực hiện", "1. Danh sách bảng giá -> 2. Form tạo mới (nạp LOV Khách hàng & HĐ CĐT) -> 3. Lưu bảng giá -> 4. Chi tiết vật tư (Thêm dòng / Import Excel preview & execute / Kính lúp chọn VT chuẩn) -> 5. Trình duyệt toàn bảng hoặc duyệt từng dòng."));

  docElements.push(createHeading2("1.2. Ánh xạ Màn hình Giao diện & Nút bấm"));
  docElements.push(createTable(
    ["Khu vực", "Tên Cột / Nút", "Loại", "API kết nối", "Logic & Xử lý"],
    [
      ["Header", "[+ Tạo bảng giá]", "Button", "Không gọi API", "Chuyển sang form tạo mới bảng giá."],
      ["Header", "[⟳ Làm mới]", "Button", "GET api/get-quotation-list", "Tải lại danh sách mới nhất."],
      ["Header", "[Xóa bảng giá]", "Button", "POST api/update-quotation-info (delete)", "Xóa bảng giá nháp khi chưa duyệt."],
      ["Bộ lọc", "Ô tìm kiếm", "Input", "params.Keyword", "Lọc theo mã bảng giá, đối tác, diễn giải."],
      ["Bảng", "Mã bảng giá", "Text", "item.ContractCode", "Mã bảng giá (VD: BG-2026-001)."],
      ["Bảng", "Khách hàng", "Text", "item.VenName | ClientName", "Tên chủ đầu tư hoặc đối tác."],
      ["Bảng", "Hợp đồng CĐT", "Text", "item.MainCode", "Mã hợp đồng nguyên tắc liên kết."],
      ["Bảng", "Ngày lập", "Date", "item.ContractDate", "Format DD/MM/YYYY."],
      ["Bảng", "Giá trị", "Number", "item.ContractedAmount", "Format VNĐ: #,##0 đ."],
      ["Bảng", "Trạng thái", "Badge", "item.StatusCode, StatusName", "0: Đang lập, 2: Chờ duyệt, 1: Đã duyệt."],
      ["Bảng", "Click dòng", "Click", "GET api/get-quotationsubmission", "Mở màn hình Chi tiết Bảng giá."],
      ["Chi tiết", "[+ Thêm vật tư]", "Button", "GET api/get-item & POST api/upsert-quotationsubmission", "Chọn vật tư chuẩn từ danh mục công ty và lưu."],
      ["Chi tiết", "[📥 Import Excel]", "Button", "POST .../import-excel-preview & POST .../import-execute", "Upload preview file Excel rồi thực thi import hàng loạt."],
      ["Chi tiết", "[Duyệt từng dòng]", "Icon", "GET api/get-quotationsubmission-status", "Xem tiến trình duyệt RACI cho riêng từng dòng vật tư."]
    ],
    [15, 18, 12, 27, 28]
  ));

  docElements.push(createHeading2("1.3. Đặc tả chi tiết toàn bộ các API Phân hệ Bảng giá"));

  // API 1.1: get-quotation-list
  docElements.push(...createApiSpecBlock(
    "API 1.1", "Lấy danh sách Bảng giá", "GET", "api/get-quotation-list",
    "Tải danh sách bảng giá có phân trang và lọc theo trạng thái, từ khóa.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"quotation"', "Chế độ lấy danh mục bảng giá."],
      ["Status", "string", "Không", "Select Status", '"ALL" | "0" | "1"', "Lọc theo trạng thái phê duyệt."],
      ["Keyword", "string", "Không", "Input Search", '"" hoặc "Thép"', "Từ khóa tìm kiếm tự do."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang hiện tại."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng trên 1 trang."]
    ],
    `http://localhost:3000/api/get-quotation-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "quotation",
  "Keyword": "",
  "Status": "ALL",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "TotalRows": 1,
  "Data": [
    {
      "ContractId": 14502,
      "ContractCode": "BG-2026-001",
      "VenName": "Công Ty Cổ Phần Tân Thời Đại Home",
      "MainCode": "CC1000225.09/001",
      "ContractDate": "2026-11-06T00:00:00",
      "ContractedAmount": 1250000000,
      "StatusCode": 0,
      "StatusName": "Đang lập"
    }
  ]
}`
  ));

  // API 1.2: get-client-list
  docElements.push(...createApiSpecBlock(
    "API 1.2", "LOV Danh sách Khách hàng / Chủ đầu tư", "GET", "api/get-client-list",
    "Nạp danh sách đối tác vào modal kính lúp để người dùng chọn khi tạo bảng giá.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"all" | "subcon"', "Chế độ lọc khách hàng/nhà thầu."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm kiếm theo tên đối tác."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "100", "Lấy 100 dòng cho modal."]
    ],
    `http://localhost:3000/api/get-client-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "all",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 100
}`,
    `{
  "Success": "true",
  "TotalRows": 50,
  "Data": [{ "ClientId": 1763, "ClientCode": "C-001", "ClientName": "Công Ty Cổ Phần Tân Thời Đại Home", "TaxCode": "0312456789" }]
}`
  ));

  // API 1.3: get-contract-list (main contract)
  docElements.push(...createApiSpecBlock(
    "API 1.3", "LOV Hợp đồng chính Chủ đầu tư", "GET", "api/get-contract-list",
    "Nạp danh sách hợp đồng dự án chính để liên kết bảng giá nếu cần.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"main_contract"', "Lấy hợp đồng chính."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm theo số HĐ hoặc tên gói thầu."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "100", "Số dòng lấy lên modal."]
    ],
    `http://localhost:3000/api/get-contract-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "main_contract",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 100
}`,
    `{
  "Success": "true",
  "Data": [{ "ContractId": 122008, "ContractCode": "CC1000225.09/001", "Description": "Hợp đồng Tổng thầu Khu phức hợp Central Park" }]
}`
  ));

  // API 1.4: update-quotation-info
  docElements.push(...createApiSpecBlock(
    "API 1.4", "Tạo mới / Cập nhật / Xóa Bảng giá", "POST", "api/update-quotation-info",
    "Lưu thông tin chung của Bảng giá hoặc xóa bảng giá nháp.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param URL", '"create_quotation" | "update_quotation" | "delete_quotation"', "Chế độ."],
      ["ClientId", "string | number", "Có", "LOV Khách hàng", '"1763"', "ID của khách hàng nhận báo giá."],
      ["MainContractId", "string", "Không", "LOV HĐ CĐT", '"CC1000225.09/001"', "Mã HĐ CĐT liên kết."],
      ["ContractType", "string", "Có", "Cố định", '"quotation"', "Loại chứng từ."],
      ["ContractDate", "string", "Có", "Form DatePicker", '"2026-11-06"', "Ngày lập (YYYY-MM-DD)."],
      ["FromDate", "string", "Không", "Form DatePicker", '"2026-11-06"', "Hiệu lực từ ngày."],
      ["ToDate", "string", "Không", "Form DatePicker", '"2027-11-06"', "Hiệu lực đến ngày."],
      ["Currency", "string", "Có", "Form Select", '"VND"', "Loại tiền tệ."],
      ["PaymentTerm", "string", "Không", "Form Select", '"DK03"', "Mã điều khoản thanh toán."],
      ["Description", "string", "Không", "Form TextArea", '"Báo giá vật tư thép"', "Diễn giải."],
      ["Attachments", "Array", "Không", "Modal File", "[]", "Mảng tệp đính kèm ban đầu."]
    ],
    `// URL: POST http://localhost:3000/api/update-quotation-info?mode=create_quotation
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ClientId": "1763",
  "MainContractId": "CC1000225.09/001",
  "ContractType": "quotation",
  "ContractDate": "2026-11-06",
  "FromDate": "2026-11-06",
  "ToDate": "2027-11-06",
  "Currency": "VND",
  "PaymentTerm": "DK03",
  "Description": "Bảng giá cung cấp thép hình dự án Empire",
  "Attachments": []
}`,
    `{ "Success": "true", "Message": "Created successfully", "ContractId": 14502 }`
  ));

  // API 1.5: get-quotationsubmission
  docElements.push(...createApiSpecBlock(
    "API 1.5", "Lấy danh sách vật tư chi tiết của Bảng giá", "GET", "api/get-quotationsubmission",
    "Nạp bảng Mục II (Chi tiết hạng mục vật tư / đơn giá chào thầu) của bảng giá.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID Bảng giá", "14502", "ID của bảng giá."],
      ["DisplayMode", "string", "Có", "Cố định", '"quotation_detail"', "Chế độ lấy chi tiết submission."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "1000", "Lấy toàn bộ dòng vật tư."]
    ],
    `http://localhost:3000/api/get-quotationsubmission?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 14502,
  "DisplayMode": "quotation_detail",
  "PageNum": 1,
  "PageSize": 1000
}`,
    `{
  "Success": "true",
  "TotalRows": 2,
  "Data": [
    {
      "SubmissionId": 801,
      "MaterialId": 501,
      "MaterialCode": "VT-THEP-D10",
      "MaterialName": "Thép cuộn Pomina D10",
      "Unit": "kg",
      "Qnty": 10000,
      "UnitPrice": 16500,
      "Amount": 165000000
    }
  ]
}`
  ));

  // API 1.6: upsert-quotationsubmission
  docElements.push(...createApiSpecBlock(
    "API 1.6", "Thêm / Sửa / Xóa dòng vật tư Bảng giá", "POST", "api/upsert-quotationsubmission",
    "Cập nhật từng dòng vật tư trong bảng giá.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"add_submission_item" | "update" | "delete"', "Hành động."],
      ["ContractId", "number", "Có", "ID Bảng giá", "14502", "Bảng giá chứa vật tư."],
      ["SubmissionId", "number", "Không", "Dòng đang sửa", "801", "ID dòng (bắt buộc khi sửa/xóa)."],
      ["MaterialId", "number", "Có", "LOV Vật tư", "501", "Mã ID vật tư."],
      ["SubmissionName", "string", "Có", "Input Tên", '"Thép cuộn D10"', "Tên mô tả hạng mục."],
      ["Unit", "string", "Có", "Input ĐVT", '"kg"', "Đơn vị tính."],
      ["Qnty", "number", "Có", "Input Số lượng", "10000", "Số lượng báo giá."],
      ["UnitPrice", "number", "Có", "Input Đơn giá", "16500", "Đơn giá chưa thuế."],
      ["Amount", "number", "Có", "Tính toán", "165000000", "Thành tiền (Qnty * UnitPrice)."]
    ],
    `// URL: POST http://localhost:3000/api/upsert-quotationsubmission?mode=add_submission_item
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "ContractId": 14502,
  "MaterialId": 501,
  "SubmissionName": "Thép cuộn Pomina D10",
  "Unit": "kg",
  "Qnty": 10000,
  "UnitPrice": 16500,
  "Amount": 165000000
}`,
    `{ "Success": "true", "SubmissionId": 801 }`
  ));

  // API 1.7: import-excel-preview
  docElements.push(...createApiSpecBlock(
    "API 1.7", "Bước 1 Import Excel: Upload & Xem trước (Preview)", "POST", "api/upsert-quotationsubmission/import-excel-preview",
    "Upload file Excel dự toán từ máy tính để phân tích và sinh mã tạm thời CacheId.",
    [
      ["file", "File Binary", "Có", "FormData Upload", "DuToan_Thep.xlsx", "File Excel dự toán."],
      ["ContractId", "number", "Có", "ID Bảng giá", "14502", "Bảng giá đích."],
      ["LogIn", "string", "Có", "Session", '"r@gmail.com"', "Tài khoản."],
      ["SessionId", "string", "Có", "Session", '"778C4190..."', "Phiên."]
    ],
    `// FormData POST with multipart/form-data:
file: [File Binary DuToan_Thep.xlsx]
ContractId: 14502
LogIn: r@gmail.com
SessionId: 778C4190-35FF-494D-B77C-380CFC836353`,
    `{
  "Success": "true",
  "CacheId": "cache_import_89437",
  "PreviewRowsCount": 45,
  "PreviewItems": [{ "MaterialCode": "VT-01", "MaterialName": "Thép Pomina", "Unit": "kg", "Qnty": 1000, "UnitPrice": 16500 }]
}`
  ));

  // API 1.8: import-execute
  docElements.push(...createApiSpecBlock(
    "API 1.8", "Bước 2 Import Excel: Thực thi lưu hàng loạt", "POST", "api/quotation/import-execute",
    "Ghi đè hoặc thêm hàng loạt vật tư vào bảng giá từ CacheId của bước preview.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["CacheId", "string", "Có", "Từ bước preview", '"cache_import_89437"', "Mã cache file upload tạm."],
      ["ContractId", "number", "Có", "ID Bảng giá", "14502", "Bảng giá nhận dữ liệu."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "CacheId": "cache_import_89437",
  "ContractId": 14502
}`,
    `{ "Success": "true", "ImportedRows": 45 }`
  ));

  // API 1.9: get-item
  docElements.push(...createApiSpecBlock(
    "API 1.9", "LOV Kính lúp chọn Vật tư từ Danh mục chuẩn công ty", "GET", "api/get-item",
    "Khi bấm nút [+ Thêm vật tư] thủ công, người dùng mở ô kính lúp để chọn vật tư từ hệ thống.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["Keyword", "string", "Không", "Input Search", '"Thép"', "Tìm theo mã hoặc tên vật tư."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-item?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "Keyword": "Thép",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [{ "ItemId": 501, "ItemCode": "VT-THEP-D10", "Description": "Thép cuộn Pomina D10", "UomCode": "kg" }]
}`
  ));

  // API 1.10: update-submission-review
  docElements.push(...createApiSpecBlock(
    "API 1.10", "Trình duyệt toàn bộ Bảng giá", "POST", "api/update-submission-review",
    "Chuyển trạng thái bảng giá từ Đang lập sang Chờ duyệt (Status: 2).",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID Bảng giá", "14502", "Bảng giá cần duyệt."],
      ["WorkType", "string", "Có", "Cố định", '"quotation"', "Loại công việc."],
      ["StatusCode", "number", "Có", "Cố định", "2", "2: Chờ duyệt (In-Review)."],
      ["StatusName", "string", "Có", "Cố định", '"In-Review"', "Tên trạng thái."],
      ["Remarks", "string", "Không", "Input", '"Trình ban giám đốc duyệt bảng giá"', "Ý kiến trình duyệt."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "ContractId": 14502,
  "WorkType": "quotation",
  "StatusCode": 2,
  "StatusName": "In-Review",
  "Remarks": "Trình duyệt bảng giá gói thầu thép"
}`,
    `{ "Success": "true", "Message": "Submitted for approval" }`
  ));

  // API 1.11: get-quotationsubmission-status
  docElements.push(...createApiSpecBlock(
    "API 1.11", "Tra cứu tiến trình duyệt RACI theo từng dòng vật tư", "GET", "api/get-quotationsubmission-status",
    "Nạp tiến trình phê duyệt chi tiết của riêng từng dòng vật tư (hỗ trợ phân quyền duyệt theo chuyên môn).",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID Bảng giá", "14502", "ID Bảng giá."],
      ["SubmissionId", "number", "Có", "ID Dòng", "801", "ID dòng vật tư cụ thể."]
    ],
    `http://localhost:3000/api/get-quotationsubmission-status?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 14502,
  "SubmissionId": 801
}`,
    `{
  "Success": "true",
  "Data": [{ "Step": 1, "Role": "Duyệt đơn giá", "Assignee": "Phòng Dự toán", "Status": "Approved" }]
}`
  ));

  // API 1.12: get-file-list
  docElements.push(...createApiSpecBlock(
    "API 1.12", "Lấy danh sách tệp đính kèm phân loại 3 nhóm", "GET", "api/get-file-list",
    "Lấy danh sách tệp hồ sơ gắn với bảng giá. Phân loại theo trường Category: 0/null -> Tài liệu dự án, 1 -> Ký số, 2 -> Đã ký số.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"by_contract"', "Lấy file theo chứng từ."],
      ["PaymentId", "number", "Có", "ID Chứng từ", "14502", "ID chứng từ / hợp đồng."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm tên file."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Cố định", "1000", "Lấy tất cả file."]
    ],
    `http://localhost:3000/api/get-file-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "by_contract",
  "PaymentId": 14502,
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 1000
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "FileId": 101,
      "FileName": "Bang_chao_gia_ky_dong_dau.pdf",
      "FilePath": "/uploads/2026/11/Bang_chao_gia.pdf",
      "Category": 0,
      "UploadedBy": "Nguyen Van A",
      "UploadedDate": "2026-11-06T08:30:00"
    }
  ]
}`
  ));

  // ==========================================
  // PHÂN HỆ 2: HỢP ĐỒNG (CONTRACTS)
  // ==========================================
  docElements.push(createHeading1("PHÂN HỆ 2: HỢP ĐỒNG (CONTRACTS - `/contracts`)"));
  docElements.push(createHeading2("2.1. Luồng nghiệp vụ tổng quan"));
  docElements.push(createBullet("Mục đích", "Quản lý hợp đồng giao khoán Nhà thầu phụ, Hợp đồng cung cấp vật tư thiết bị công trình."));
  docElements.push(createBullet("Chu trình thực hiện", "1. Danh sách HĐ -> 2. Form tạo HĐ (nạp LOV Nhà thầu phụ, HĐ CĐT) -> 3. Lưu HĐ -> 4. Chi tiết khối lượng hợp đồng (Tự thêm hoặc bấm [Đối chiếu bảng giá] kế thừa vật tư từ nhiều bảng giá) -> 5. Trình duyệt toàn HĐ và duyệt theo dòng."));

  docElements.push(createHeading2("2.2. Ánh xạ Màn hình Giao diện & Nút bấm"));
  docElements.push(createTable(
    ["Khu vực", "Tên Cột / Nút", "Loại", "API kết nối", "Logic & Xử lý"],
    [
      ["Header", "[+ Tạo hợp đồng]", "Button", "Không gọi API", "Mở Form tạo mới Hợp đồng."],
      ["Header", "[⟳ Làm mới]", "Button", "GET api/get-contract-list", "Tải lại danh sách hợp đồng."],
      ["Bảng", "Số hợp đồng", "Text", "item.ContractCode", "Số hiệu HĐ (VD: SUB-75 08 11-22831)."],
      ["Bảng", "Nhà thầu / NCC", "Text", "item.VenName", "Tên đối tác ký hợp đồng."],
      ["Bảng", "Hợp đồng CĐT", "Text", "item.MainCode", "Mã HĐ dự án gốc."],
      ["Bảng", "Ngày ký HĐ", "Date", "item.Contractdate", "Format DD/MM/YYYY."],
      ["Bảng", "Giá trị HĐ", "Number", "item.ContractedAmount", "Format VNĐ: #,##0 đ."],
      ["Bảng", "Trạng thái", "Badge", "item.StatusCode, StatusName", "0: Đang lập, 2: Chờ duyệt, 1: Đã duyệt."],
      ["Bảng", "Click dòng", "Click", "GET api/get-matequipsubmission", "Mở màn hình Chi tiết Hợp đồng."],
      ["Mục II", "[Đối chiếu bảng giá]", "Button", "api/get-quotation-list (quotation_for_contract)", "Mở modal cây đối chiếu: chọn vật tư từ nhiều bảng giá gán vào HĐ."],
      ["Mục II", "[Duyệt từng dòng]", "Icon", "POST api/update-submission-review", "Mở Drawer duyệt riêng cho từng dòng vật tư."]
    ],
    [15, 18, 12, 27, 28]
  ));

  docElements.push(createHeading2("2.3. Đặc tả chi tiết toàn bộ các API Phân hệ Hợp đồng"));

  // API 2.1: get-contract-list
  docElements.push(...createApiSpecBlock(
    "API 2.1", "Lấy danh sách Hợp đồng Nhà thầu phụ / Cung cấp", "GET", "api/get-contract-list",
    "Tải danh sách các hợp đồng vật tư, thiết bị với các đối tác.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"mat_equip"', "Chế độ hợp đồng vật tư thiết bị."],
      ["WorkType", "string", "Có", "Cố định", '"mat_equip"', "Loại gói thầu vật tư."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm kiếm theo số HĐ, tên đối tác."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng trên trang."]
    ],
    `http://localhost:3000/api/get-contract-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "mat_equip",
  "WorkType": "mat_equip",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "TotalRows": 1,
  "Data": [
    {
      "ContractId": 122007,
      "ContractCode": "SUB-75 08 11-22831-26.09/001",
      "VenName": "Công Ty Cổ Phần Tân Thời Đại Home",
      "MainCode": "CC1000225.09/001",
      "Contractdate": "2026-10-29T00:00:00",
      "ContractedAmount": 3450000000,
      "StatusCode": 1,
      "StatusName": "Đã duyệt"
    }
  ]
}`
  ));

  // API 2.2: get-client-list (subcon)
  docElements.push(...createApiSpecBlock(
    "API 2.2", "LOV Nhà thầu phụ / Nhà cung ứng", "GET", "api/get-client-list",
    "Lấy danh mục đối tác phân loại nhà thầu phụ (subcon) cho ô chọn đối tượng.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"subcon"', "Chế độ lọc nhà thầu phụ."],
      ["Keyword", "string", "Không", "Input Search", '""', "Từ khóa tìm kiếm."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Cố định", "100", "Số dòng."]
    ],
    `http://localhost:3000/api/get-client-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "subcon",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 100
}`,
    `{
  "Success": "true",
  "Data": [{ "ClientId": 1763, "ClientName": "Công Ty Cổ Phần Tân Thời Đại Home" }]
}`
  ));

  // API 2.3: get-quotation-list (approved)
  docElements.push(...createApiSpecBlock(
    "API 2.3", "LOV Bảng giá tham chiếu đã duyệt", "GET", "api/get-quotation-list",
    "Chọn Bảng giá đã được phê duyệt để kế thừa đơn giá ban đầu.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"approved_quotation"', "Chỉ lấy bảng giá đã duyệt."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm kiếm."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-quotation-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "approved_quotation",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [{ "ContractId": 14502, "ContractCode": "BG-2026-001", "Description": "Bảng giá thép Pomina" }]
}`
  ));

  // API 2.4: update-contract-info
  docElements.push(...createApiSpecBlock(
    "API 2.4", "Tạo mới / Cập nhật Hợp đồng", "POST", "api/update-contract-info",
    "Lưu thông tin chung của hợp đồng (Số HĐ, Đối tác, HĐ CĐT, Thời hạn, Điều khoản thanh toán).",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"create_contract" | "update_contract"', "Chế độ tạo hoặc sửa."],
      ["VenId", "number | string", "Có", "LOV Đối tác", "1763", "ID nhà thầu phụ."],
      ["MainContractId", "string", "Có", "LOV HĐ CĐT", '"CC1000225.09/001"', "Mã HĐ dự án."],
      ["QuotationId", "number", "Không", "LOV Bảng giá", "14502", "ID bảng giá tham chiếu."],
      ["ContractCode", "string", "Có", "Input Số HĐ", '"SUB-75 08 11-22831"', "Mã số hợp đồng chính thức."],
      ["ContractDate", "string", "Có", "DatePicker", '"2026-10-29"', "Ngày ký hợp đồng."],
      ["StartDate", "string", "Không", "DatePicker", '"2026-11-01"', "Ngày khởi công."],
      ["EndDate", "string", "Không", "DatePicker", '"2027-05-30"', "Ngày hoàn thành."],
      ["PayTerms", "string", "Có", "Input ĐKTT", '"Tạm ứng 10%, TT theo đợt"', "Điều khoản thanh toán."],
      ["Description", "string", "Không", "TextArea", '"Gói thầu xây tô và kết cấu"', "Phạm vi hợp đồng."]
    ],
    `// URL: POST http://localhost:3000/api/update-contract-info?mode=create_contract
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "VenId": 1763,
  "MainContractId": "CC1000225.09/001",
  "QuotationId": 14502,
  "ContractCode": "SUB-75 08 11-22831-26.09/001",
  "ContractDate": "2026-10-29",
  "StartDate": "2026-11-01",
  "EndDate": "2027-05-30",
  "PayTerms": "Tạm ứng 10%, thanh toán theo đợt 15 ngày",
  "Description": "Hợp đồng vật tư gạch AAC và phụ gia",
  "ContractType": "mat_equip"
}`,
    `{ "Success": "true", "ContractId": 122007 }`
  ));

  // API 2.5: get-matequipsubmission
  docElements.push(...createApiSpecBlock(
    "API 2.5", "Lấy chi tiết khối lượng vật tư Hợp đồng", "GET", "api/get-matequipsubmission",
    "Nạp bảng Mục II (Chi tiết hạng mục vật tư gói thầu).",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID Hợp đồng", "122007", "ID hợp đồng."],
      ["DisplayMode", "string", "Có", "Cố định", '"mat_equip"', "Chế độ lấy chi tiết."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Cố định", "1000", "Lấy toàn bộ dòng."]
    ],
    `http://localhost:3000/api/get-matequipsubmission?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 122007,
  "DisplayMode": "mat_equip",
  "PageNum": 1,
  "PageSize": 1000
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "SubmissionId": 901,
      "MaterialCode": "GACH-AAC-100",
      "SubmissionName": "Gạch bê tông khí chưng áp AAC 100mm",
      "Unit": "m3",
      "Qnty": 1500,
      "UnitPrice": 1350000,
      "Amount": 2025000000,
      "OrgCode": "2.1.1",
      "OrgName": "Xây tường tầng hầm"
    }
  ]
}`
  ));

  // API 2.6: get-quotation-list (quotation_for_contract)
  docElements.push(...createApiSpecBlock(
    "API 2.6", "Nút [Đối chiếu Bảng giá]: Nạp danh mục cây Bảng giá -> Vật tư", "GET", "api/get-quotation-list",
    "Khi bấm [Đối chiếu bảng giá] trong HĐ, API này tải cây dữ liệu gồm Bảng giá cha và các vật tư con của đối tác để chọn đưa vào hợp đồng.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"quotation_for_contract"', "Chế độ lấy bảng giá đối chiếu."],
      ["ClientId", "number", "Có", "ID HĐ CĐT", "1763", "ID khách hàng CĐT."],
      ["SubconOf", "number", "Có", "ID Nhà thầu phụ", "122007", "ID nhà thầu phụ."],
      ["ContractId", "number", "Không", "ID Hợp đồng", "122007", "ID hợp đồng hiện tại."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-quotation-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "quotation_for_contract",
  "ClientId": 1763,
  "SubconOf": 122007,
  "ContractId": 122007,
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "ContractId": 14502,
      "ContractCode": "BG-2026-001",
      "SubmissionId": 801,
      "MaterialId": 501,
      "MaterialName": "Thép Pomina D10",
      "UnitPrice": 16500,
      "Unit": "kg"
    }
  ]
}`
  ));

  // API 2.7: update-quotation-info (add_pricelist)
  docElements.push(...createApiSpecBlock(
    "API 2.7", "Gán các Bảng giá cha vào Hợp đồng", "POST", "api/update-quotation-info",
    "Khi bấm xác nhận đối chiếu, hệ thống liên kết các bảng giá đã chọn vào hợp đồng hiện tại.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"add_pricelist"', "Chế độ gán bảng giá."],
      ["ContractId", "number", "Có", "ID Hợp đồng", "122007", "Hợp đồng nhận liên kết."],
      ["PriceListIds", "Array<number>", "Có", "Các Bảng giá chọn", "[14502, 14503]", "Mảng ID các bảng giá cha."]
    ],
    `// URL: POST http://localhost:3000/api/update-quotation-info?mode=add_pricelist
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "ContractId": 122007,
  "PriceListIds": [14502]
}`,
    `{ "Success": "true", "Message": "Price lists linked" }`
  ));

  // API 2.8: upsert-matequipsubmission
  docElements.push(...createApiSpecBlock(
    "API 2.8", "Thêm / Xóa khối lượng vật tư Hợp đồng (có SourceId liên kết)", "POST", "api/upsert-matequipsubmission",
    "Lưu từng dòng vật tư vào hợp đồng. Trường SourceId trỏ về SubmissionId của bảng giá đối chiếu.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"Create_MatequipSubmission" | "Delete_MatequipSubmission"', "Hành động."],
      ["ContractId", "number", "Có", "ID Hợp đồng", "122007", "ID hợp đồng."],
      ["SubmissionId", "number", "Không", "ID dòng", "901", "Bắt buộc khi xóa."],
      ["MaterialId", "number", "Có", "LOV Vật tư", "702", "ID vật tư."],
      ["SourceId", "number", "Không", "ID dòng Bảng giá", "801", "ID dòng gốc từ bảng giá đối chiếu."],
      ["SubmissionName", "string", "Có", "Input Tên", '"Gạch AAC 100mm"', "Tên vật tư."],
      ["Unit", "string", "Có", "Input ĐVT", '"m3"', "Đơn vị tính."],
      ["Qnty", "number", "Có", "Input SL", "1500", "Khối lượng hợp đồng."],
      ["UnitPrice", "number", "Có", "Input Đơn giá", "1350000", "Đơn giá ký kết."],
      ["TaxRate", "number", "Không", "Thuế", "0.08", "Thuế suất."],
      ["OrgCode", "string", "Không", "Input WBS", '"2.1.1"', "Mã phân bổ WBS."]
    ],
    `// URL: POST http://localhost:3000/api/upsert-matequipsubmission?mode=Create_MatequipSubmission
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "UpdateMode": "Create_MatequipSubmission",
  "ContractId": 122007,
  "MaterialId": 702,
  "SourceId": 801,
  "SubmissionName": "Gạch bê tông khí chưng áp AAC 100mm",
  "Unit": "m3",
  "Qnty": 1500,
  "UnitPrice": 1350000,
  "TaxRate": 0.08,
  "OrgCode": "2.1.1"
}`,
    `{ "Success": "true", "SubmissionId": 901 }`
  ));

  // API 2.9: submit-contract-approval
  docElements.push(...createApiSpecBlock(
    "API 2.9", "Trình duyệt toàn bộ Hợp đồng lên cấp quản lý", "POST", "api/submit-contract-approval",
    "Khởi tạo luồng phê duyệt hợp đồng theo ma trận phân quyền RACI.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID Hợp đồng", "122007", "ID hợp đồng cần duyệt."],
      ["WorkType", "string", "Có", "Cố định", '"mat_equip"', "Loại gói thầu."],
      ["Remarks", "string", "Không", "Input", '"Trình duyệt hợp đồng gạch"', "Ý kiến trình."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "ContractId": 122007,
  "WorkType": "mat_equip",
  "Remarks": "Trình Giám đốc dự án duyệt hợp đồng cung ứng gạch AAC"
}`,
    `{ "Success": "true", "Message": "Approval process started" }`
  ));

  // API 2.10: update-submission-review
  docElements.push(...createApiSpecBlock(
    "API 2.10", "Duyệt chi tiết theo từng dòng vật tư HĐ", "POST", "api/update-submission-review",
    "Mở Drawer ContractWorkflowRowDetailDrawer để duyệt hoặc từ chối từng dòng vật tư cụ thể.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"update_detail_all_work_type"', "Chế độ duyệt dòng."],
      ["SubmissionId", "number", "Có", "ID Dòng HĐ", "901", "ID dòng cần duyệt."],
      ["StatusCode", "number", "Có", "Select", "1", "1: Duyệt, -1: Từ chối."],
      ["Remarks", "string", "Không", "Input", '"Đạt yêu cầu kỹ thuật"', "Ý kiến."]
    ],
    `// URL: POST http://localhost:3000/api/update-submission-review?mode=update_detail_all_work_type
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "SubmissionId": 901,
  "StatusCode": 1,
  "Remarks": "Khối lượng phù hợp thiết kế"
}`,
    `{ "Success": "true", "Message": "Row approved" }`
  ));

  // API 2.11: get-contract-status
  docElements.push(...createApiSpecBlock(
    "API 2.11", "Tra cứu tiến trình phê duyệt RACI 4 bước", "GET", "api/get-contract-status",
    "Hiển thị Drawer Quy trình duyệt 4 bước RACI của toàn hợp đồng.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID Hợp đồng", "122007", "ID hợp đồng."],
      ["WorkType", "string", "Có", "Cố định", '"mat_equip"', "Loại hợp đồng."],
      ["PageNum", "number", "Có", "Cố định", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "20", "Số dòng bước duyệt."]
    ],
    `http://localhost:3000/api/get-contract-status?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 122007,
  "WorkType": "mat_equip",
  "PageNum": 1,
  "PageSize": 20
}`,
    `{
  "Success": "true",
  "Data": [
    { "Step": 1, "RoleName": "Kỹ sư lập hợp đồng", "Assignee": "Nguyen Van A", "Status": "Approved", "ApproveDate": "2026-10-29" },
    { "Step": 2, "RoleName": "Trưởng phòng Đấu thầu", "Assignee": "Tran Van B", "Status": "Approved", "ApproveDate": "2026-10-30" },
    { "Step": 3, "RoleName": "Giám đốc Dự án", "Assignee": "Le Van C", "Status": "In-Review", "ApproveDate": null }
  ]
}`
  ));

  // ==========================================
  // PHÂN HỆ 3: ĐƠN ĐẶT HÀNG (PO)
  // ==========================================
  docElements.push(createHeading1("PHÂN HỆ 3: ĐƠN ĐẶT HÀNG (PURCHASE ORDERS - PO - `/purchase-orders`)"));
  docElements.push(createHeading2("3.1. Luồng nghiệp vụ tổng quan"));
  docElements.push(createBullet("Mục đích", "Phát hành Đơn đặt hàng (PO) dựa trên Hợp đồng khung đã duyệt, chỉ định kho nhận và tiến độ giao hàng."));
  docElements.push(createBullet("Chu trình thực hiện", "1. Danh sách PO -> 2. Form tạo PO (nạp LOV HĐ khung, Nhà cung cấp, Kho công trình) -> 3. Lưu PO -> 4. Chi tiết mặt hàng đặt (Thêm thủ công hoặc bấm [Đối chiếu từ HĐ]) -> 5. Trình duyệt PO."));

  docElements.push(createHeading2("3.2. Ánh xạ Màn hình Giao diện & Nút bấm"));
  docElements.push(createTable(
    ["Khu vực", "Tên Cột / Nút", "Loại", "API kết nối", "Logic & Xử lý"],
    [
      ["Header", "[+ Tạo đơn hàng]", "Button", "Không gọi API", "Mở modal tạo mới đơn hàng PO."],
      ["Header", "[⟳ Làm mới]", "Button", "GET api/get-purchaseorder-list", "Tải lại danh sách PO."],
      ["Header", "[Xóa đơn hàng]", "Button", "POST api/update-purchaseorder-info (delete)", "Xóa đơn hàng nháp khi chưa duyệt."],
      ["Bảng", "Mã đơn hàng", "Text", "item.POCode | ContractCode", "Mã số PO (VD: PO-2026-0089)."],
      ["Bảng", "Nhà cung cấp", "Text", "item.VenName", "Tên đơn vị bán hàng."],
      ["Bảng", "HĐ căn cứ", "Text", "item.SourceContractCode", "Số HĐ khung ký kết."],
      ["Bảng", "Ngày đặt", "Date", "item.ContractDate", "Format DD/MM/YYYY."],
      ["Bảng", "Kho tiếp nhận", "Text", "item.WarehouseName", "Địa điểm kho công trường giao."],
      ["Bảng", "Tổng giá trị", "Number", "item.ContractedAmount", "Format VNĐ: #,##0 đ."],
      ["Bảng", "Trạng thái", "Badge", "item.StatusCode, StatusName", "0: Đang lập, 2: Chờ duyệt, 1: Đã duyệt."],
      ["Bảng", "Click dòng", "Click", "GET api/get-purchaseordersubmission", "Mở màn hình Chi tiết Đơn hàng PO."],
      ["Mục II", "[⚖ Đối chiếu từ HĐ]", "Button", "GET api/get-approvedbudget-list & GET api/get-item", "Đối chiếu toàn bộ vật tư từ HĐ khung để nạp vào PO."]
    ],
    [15, 18, 12, 27, 28]
  ));

  docElements.push(createHeading2("3.3. Đặc tả chi tiết toàn bộ các API Phân hệ Đơn đặt hàng (PO)"));

  // API 3.1: get-purchaseorder-list
  docElements.push(...createApiSpecBlock(
    "API 3.1", "Lấy danh sách Đơn đặt hàng (PO)", "GET", "api/get-purchaseorder-list",
    "Tải danh sách đơn đặt hàng có phân trang, lọc theo kho và nhà cung cấp.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"po_list"', "Chế độ lấy danh mục PO."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm theo mã PO, NCC, HĐ."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-purchaseorder-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "po_list",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "TotalRows": 1,
  "Data": [
    {
      "ContractId": 18201,
      "POCode": "PO-2026-0089",
      "VenName": "Công Ty Cổ Phần Tân Thời Đại Home",
      "SourceContractCode": "SUB-75 08 11-22831",
      "WarehouseName": "Kho Tổng Dự án Empire",
      "ContractDate": "2026-11-06T00:00:00",
      "ContractedAmount": 711000000,
      "StatusCode": 1,
      "StatusName": "Đã duyệt"
    }
  ]
}`
  ));

  // API 3.2: get-contract-list (approved)
  docElements.push(...createApiSpecBlock(
    "API 3.2", "LOV Hợp đồng khung làm căn cứ đặt hàng", "GET", "api/get-contract-list",
    "Chỉ chọn các hợp đồng đã được phê duyệt còn hiệu lực để phát hành đơn đặt hàng.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["DisplayMode", "string", "Có", "Cố định", '"approved_contract"', "Lọc HĐ đã duyệt."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm kiếm."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "100", "Số dòng."]
    ],
    `http://localhost:3000/api/get-contract-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "DisplayMode": "approved_contract",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 100
}`,
    `{
  "Success": "true",
  "Data": [{ "ContractId": 122007, "ContractCode": "SUB-75 08 11-22831", "VenName": "Tân Thời Đại Home" }]
}`
  ));

  // API 3.3: get-warehouse-list (ĐÃ CẬP NHẬT ĐẦY ĐỦ 100% PARAMS THEO ĐÚNG GÓP Ý)
  docElements.push(...createApiSpecBlock(
    "API 3.3", "LOV Kho tiếp nhận hàng tại công trình", "GET", "api/get-warehouse-list",
    "Nạp danh sách kho công trình để chọn địa điểm dỡ hàng trong form PO và phiếu nhập xuất kho.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm kiếm kho theo mã hoặc tên."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang hiện tại."],
      ["PageSize", "number", "Có", "Pagination", "10", "Số dòng trên 1 trang (mặc định 10)."]
    ],
    `http://localhost:3000/api/get-warehouse-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 10,
  "Language": "vi"
}`,
    `{
  "Success": "true",
  "TotalRows": 2,
  "Data": [
    { "WarehouseId": 10, "WarehouseCode": "KHO-01", "WarehouseName": "Kho Trung tâm Empire" },
    { "WarehouseId": 11, "WarehouseCode": "KHO-02", "WarehouseName": "Kho Phụ Cổng số 2" }
  ]
}`
  ));

  // API 3.4: update-purchaseorder-info
  docElements.push(...createApiSpecBlock(
    "API 3.4", "Tạo mới / Cập nhật / Xóa Đơn đặt hàng (PO)", "POST", "api/update-purchaseorder-info",
    "Lưu đơn đặt hàng mới hoặc xóa PO nháp.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"create_purchase_order" | "delete_purchase_order"', "Hành động."],
      ["ContractId", "number", "Có", "LOV Hợp đồng", "122007", "ID hợp đồng gốc."],
      ["VendorId", "number", "Có", "Tự động theo HĐ", "1763", "ID nhà cung cấp."],
      ["WarehouseId", "number", "Có", "Select Kho", "10", "Kho tiếp nhận hàng."],
      ["POCode", "string", "Có", "Input Mã PO", '"PO-2026-0089"', "Mã đơn hàng."],
      ["OrderDate", "string", "Có", "DatePicker", '"2026-11-06"', "Ngày đặt (YYYY-MM-DD)."],
      ["DeliveryDate", "string", "Không", "DatePicker", '"2026-11-15"', "Hạn giao."],
      ["DeliveryAddress", "string", "Không", "Input", '"Cổng số 2 công trường Empire"', "Địa chỉ giao."],
      ["Remarks", "string", "Không", "TextArea", '"Giao kèm chứng chỉ CO/CQ"', "Ghi chú giao nhận."]
    ],
    `// URL: POST http://localhost:3000/api/update-purchaseorder-info?mode=create_purchase_order
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "ContractId": 122007,
  "VendorId": 1763,
  "WarehouseId": 10,
  "POCode": "PO-2026-0089",
  "OrderDate": "2026-11-06",
  "DeliveryDate": "2026-11-15",
  "DeliveryAddress": "Cổng số 2 công trình Khu phức hợp Empire",
  "Remarks": "Hàng giao đợt 1, yêu cầu biên bản thí nghiệm mẫu"
}`,
    `{ "Success": "true", "ContractId": 18201 }`
  ));

  // API 3.5: get-approvedbudget-list (Đối chiếu từ HĐ Bước 1)
  docElements.push(...createApiSpecBlock(
    "API 3.5", "Nút [Đối chiếu từ HĐ] - Bước 1: Lấy hạn mức ngân sách dự toán HĐ", "GET", "api/get-approvedbudget-list",
    "Khi mở Drawer Đối chiếu từ HĐ (PriceCompareDrawer), API này tải hạn mức ngân sách và khối lượng đã duyệt của HĐ khung.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID HĐ nguồn", "122007", "Hợp đồng nguồn làm căn cứ."],
      ["PageNum", "number", "Có", "Cố định", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "1000", "Lấy toàn bộ hạn mức."]
    ],
    `http://localhost:3000/api/get-approvedbudget-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 122007,
  "PageNum": 1,
  "PageSize": 1000
}`,
    `{
  "Success": "true",
  "Data": [{ "OrgCode": "2.1.1", "OrgName": "Xây tường", "ApprovedBudget": 5000000000 }]
}`
  ));

  // API 3.6: get-item (Đối chiếu từ HĐ Bước 2)
  docElements.push(...createApiSpecBlock(
    "API 3.6", "Nút [Đối chiếu từ HĐ] - Bước 2: Nạp danh mục vật tư từ Hợp đồng", "GET", "api/get-item",
    "Tải danh mục toàn bộ các mặt hàng và đơn giá đã ký trong hợp đồng khung để đối chiếu và nhập SL đặt.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractType", "string", "Có", "Cố định", '"purchase_order"', "Loại đơn hàng."],
      ["ContractId", "number", "Có", "ID Đơn hàng", "18201", "ID PO đang lập."],
      ["Keyword", "string", "Không", "Input Search", '""', "Lọc tên vật tư."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Cố định", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-item?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractType": "purchase_order",
  "ContractId": 18201,
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "MaterialId": 702,
      "ItemCode": "GACH-AAC-100",
      "ItemName": "Gạch bê tông khí chưng áp AAC 100mm",
      "UomCode": "m3",
      "Qnty": 1500,
      "UnitPrice": 1350000,
      "Orgcode": "2.1.1"
    }
  ]
}`
  ));

  // API 3.7: upsert-purchaseordersubmission
  docElements.push(...createApiSpecBlock(
    "API 3.7", "Thêm mặt hàng đối chiếu / thêm thủ công vào PO", "POST", "api/upsert-purchaseordersubmission",
    "Ghi nhận mặt hàng đối chiếu vào chi tiết đơn hàng PO.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"Create_PurchaseorderSubmission"', "Chế độ."],
      ["ContractId", "string", "Có", "ID Đơn hàng", '"18201"', "ID PO."],
      ["MaterialId", "number", "Có", "ID Vật tư", "702", "Mã vật tư."],
      ["Qnty", "number", "Có", "SL đặt mua", "500", "Số lượng cần đặt."],
      ["UnitPrice", "number", "Có", "Đơn giá", "1350000", "Đơn giá HĐ."],
      ["TaxRate", "number", "Không", "Thuế", "0.08", "Thuế suất VAT."],
      ["Orgcode", "string", "Có", "Select WBS", '"2.1.1"', "Mã hạng mục kết cấu."],
      ["Orgname", "string", "Không", "Tên WBS", '"Xây tường"', "Tên hạng mục."]
    ],
    `// URL: POST http://localhost:3000/api/upsert-purchaseordersubmission?mode=Create_PurchaseorderSubmission
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "ContractType": "purchase_order",
  "UpdateMode": "Create_PurchaseorderSubmission",
  "ContractId": "18201",
  "ItemDate": "2026-11-06",
  "MaterialId": 702,
  "Qnty": 500,
  "UnitPrice": 1350000,
  "TaxRate": 0.08,
  "Stage": "plan",
  "StartProcessNow": "No",
  "ApplyDefinedAssignment": "Yes",
  "Orgcode": "2.1.1",
  "Orgname": "Xây tường tầng hầm"
}`,
    `{ "Success": "true", "SubmissionId": 1102 }`
  ));

  // API 3.8: get-purchaseordersubmission
  docElements.push(...createApiSpecBlock(
    "API 3.8", "Lấy danh sách vật tư đã lưu của đơn hàng PO", "GET", "api/get-purchaseordersubmission",
    "Nạp bảng Mục II (Chi tiết các mặt hàng thực tế của đơn hàng PO).",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID PO", "18201", "ID đơn hàng PO."],
      ["DisplayMode", "string", "Có", "Cố định", '"po_submission"', "Chế độ chi tiết PO."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "1000", "Lấy toàn bộ dòng."]
    ],
    `http://localhost:3000/api/get-purchaseordersubmission?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 18201,
  "DisplayMode": "po_submission",
  "PageNum": 1,
  "PageSize": 1000
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "SubmissionId": 1102,
      "MaterialId": 702,
      "SubmissionName": "Gạch bê tông khí chưng áp AAC 100mm",
      "Unit": "m3",
      "Qnty": 500,
      "UnitPrice": 1350000,
      "Amount": 675000000,
      "TaxRate": 8
    }
  ]
}`
  ));

  // API 3.9: submit-purchaserorder-approval
  docElements.push(...createApiSpecBlock(
    "API 3.9", "Trình duyệt Đơn đặt hàng PO", "POST", "api/submit-purchaserorder-approval",
    "Gửi đơn hàng PO lên Chỉ huy trưởng / Phòng Cung ứng phê duyệt phát hành.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID PO", "18201", "ID đơn hàng PO."],
      ["WorkType", "string", "Có", "Cố định", '"purchase_order"', "Loại công việc PO."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 18201,
  "WorkType": "purchase_order"
}`,
    `{ "Success": "true", "Message": "PO submitted for approval" }`
  ));

  // ==========================================
  // PHÂN HỆ 4: NHẬP KHO (WAREHOUSE RECEIPT)
  // ==========================================
  docElements.push(createHeading1("PHÂN HỆ 4: NHẬP KHO (WAREHOUSE RECEIPT - `/warehouse/receipt`)"));
  docElements.push(createHeading2("4.1. Luồng nghiệp vụ tổng quan"));
  docElements.push(createBullet("Mục đích", "Ghi nhận vật tư nhập về kho công trường dựa trên Đơn đặt hàng (PO) đã duyệt."));
  docElements.push(createBullet("Chu trình thực hiện", "1. Danh sách phiếu nhập / Tab đơn hàng chờ nhập -> 2. Tạo phiếu nhập từ PO (đối chiếu khối lượng giao vs còn lại) -> 3. Lưu phiếu nhập -> 4. Bổ sung vật tư từ PO qua nút [Đối chiếu Đơn hàng] -> 5. Xác nhận nhập kho (tăng số dư thẻ kho) hoặc hủy xác nhận (unpost)."));

  docElements.push(createHeading2("4.2. Ánh xạ Màn hình Giao diện & Nút bấm"));
  docElements.push(createTable(
    ["Khu vực", "Tên Cột / Nút", "Loại", "API kết nối", "Logic & Xử lý"],
    [
      ["Header", "[+ Tạo phiếu nhập]", "Button", "Không gọi API", "Mở modal đối chiếu nhập kho."],
      ["Header", "[⟳ Làm mới]", "Button", "GET api/get-inventory-transaction", "Tải lại danh sách phiếu nhập."],
      ["Header", "[Xóa phiếu nhập]", "Button", "POST api/delete-inventory-transaction", "Xóa phiếu khi chưa duyệt."],
      ["Bảng", "Số phiếu nhập", "Text", "item.DocNo | Code", "Mã số phiếu nhập kho (VD: PNK-2026-0125)."],
      ["Bảng", "Đơn hàng PO", "Text", "item.POCode", "Đơn đặt hàng gốc."],
      ["Bảng", "Nhà cung cấp", "Text", "item.VendorName", "Đơn vị vận chuyển / giao hàng."],
      ["Bảng", "Kho nhập", "Text", "item.WarehouseName", "Kho tiếp nhận."],
      ["Bảng", "Ngày nhập", "Date", "item.DocDate", "Format DD/MM/YYYY."],
      ["Bảng", "Số xe / Vận đơn", "Text", "item.ReceiptFrom", "Số xe hoặc số biên bản giao nhận NCC."],
      ["Bảng", "Tổng tiền nhập", "Number", "item.TotalAmount", "Format VNĐ: #,##0 đ."],
      ["Bảng", "Trạng thái", "Badge", "item.StatusCode, StatusName", "0: Đang lập, 2: Chờ duyệt, 1: Đã nhập kho."],
      ["Bảng", "Click dòng", "Click", "GET api/get-inventory-submission", "Mở màn hình Chi tiết Phiếu nhập."],
      ["Mục II", "[Đối chiếu Đơn hàng]", "Button", "GET api/get-inventory-po (Reconcile_PurchaseOrder)", "Bổ sung thêm các mặt hàng khác của PO vào phiếu nhập hiện tại."]
    ],
    [15, 18, 12, 27, 28]
  ));

  docElements.push(createHeading2("4.3. Đặc tả chi tiết toàn bộ các API Phân hệ Nhập kho"));

  // API 4.1: get-inventory-transaction (receipt)
  docElements.push(...createApiSpecBlock(
    "API 4.1", "Lấy danh sách Phiếu Nhập kho", "GET", "api/get-inventory-transaction",
    "Tải danh sách các phiếu nhập kho đã lập.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["Type", "string", "Có", "Cố định", '"inventory_receipt"', "Loại giao dịch nhập kho."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm theo số phiếu, PO, NCC."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-inventory-transaction?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "Type": "inventory_receipt",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "TotalRows": 1,
  "Data": [
    {
      "TransactionId": 5001,
      "DocNo": "PNK-2026-0125",
      "POCode": "PO-2026-0089",
      "VendorName": "Công Ty Cổ Phần Tân Thời Đại Home",
      "WarehouseName": "Kho Tổng Dự án Empire",
      "DocDate": "2026-11-06T00:00:00",
      "ReceiptFrom": "Xe 51C-889.24 / BB-9982",
      "TotalAmount": 711000000,
      "StatusCode": 1,
      "StatusName": "Đã nhập kho"
    }
  ]
}`
  ));

  // API 4.2: get-pendinginventory-po
  docElements.push(...createApiSpecBlock(
    "API 4.2", "Lấy danh sách Đơn hàng PO chờ nhập kho (Tab Ngoài)", "GET", "api/get-pendinginventory-po",
    "Hiển thị danh sách các PO đã duyệt mà còn số lượng chưa nhập về kho.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["WarehouseId", "number", "Không", "Select Kho", "null | 10", "Lọc theo kho (nếu có)."],
      ["ContractId", "number", "Không", "Select PO", "null | 18201", "Lọc theo PO."],
      ["SearchKey", "string", "Không", "Input Search", '""', "Tìm kiếm."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "20", "Số dòng."]
    ],
    `http://localhost:3000/api/get-pendinginventory-po?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "WarehouseId": null,
  "ContractId": null,
  "SearchKey": "",
  "PageNum": 1,
  "PageSize": 20
}`,
    `{
  "Success": "true",
  "Data": [{ "ContractId": 18201, "POCode": "PO-2026-0089", "VendorName": "Tân Thời Đại Home", "PendingItemsCount": 3 }]
}`
  ));

  // API 4.3: get-inventory-po (Đối chiếu Đơn hàng)
  docElements.push(...createApiSpecBlock(
    "API 4.3", "Nút [Đối chiếu Đơn hàng]: Lấy mặt hàng PO đối chiếu", "GET", "api/get-inventory-po",
    "Gọi khi bấm nút [Đối chiếu Đơn hàng] trong chi tiết phiếu nhập (StockInReconcileModal) để lấy các dòng PO còn lại.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["UpdateMode", "string", "Có", "Cố định", '"Reconcile_PurchaseOrder"', "Chế độ đối chiếu."],
      ["ContractId", "number", "Có", "ID PO", "18201", "ID đơn hàng PO."],
      ["TransactionId", "number", "Có", "ID Phiếu nhập", "5001", "ID phiếu nhập hiện tại."]
    ],
    `http://localhost:3000/api/get-inventory-po?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "UpdateMode": "Reconcile_PurchaseOrder",
  "ContractId": 18201,
  "TransactionId": 5001
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "SourceSubmissionId": 1102,
      "MaterialId": 702,
      "MaterialName": "Gạch AAC 100mm",
      "OrderedQnty": 500,
      "ReceivedQnty": 100,
      "RemainQnty": 400,
      "UnitPrice": 1350000,
      "TaxRate": 10
    }
  ]
}`
  ));

  // API 4.4: create-inventory-receipt
  docElements.push(...createApiSpecBlock(
    "API 4.4", "Tạo Phiếu Nhập kho ban đầu từ các dòng PO đã chọn", "POST", "api/create-inventory-receipt",
    "Khởi tạo phiếu nhập kho và nạp các mặt hàng đã tích chọn đối chiếu.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"create_from_selected_po_items"', "Chế độ tạo."],
      ["ContractId", "number", "Có", "ID PO", "18201", "ID đơn hàng PO."],
      ["WarehouseId", "number", "Có", "Select Kho", "10", "Kho tiếp nhận."],
      ["DocNo", "string", "Có", "Input Số Phiếu", '"PNK-2026-0125"', "Mã phiếu nhập."],
      ["DocDate", "string", "Có", "DatePicker", '"2026-11-06"', "Ngày nhập."],
      ["ReceiptFrom", "string", "Không", "Input", '"Xe 51C-889.24"', "Số xe / Biên bản giao."],
      ["Description", "string", "Không", "TextArea", '"Giao đợt 1"', "Ghi chú."],
      ["Items", "Array", "Có", "Bảng đối chiếu", "Mảng các dòng", "Mảng [{ MaterialId, SourceSubmissionId, Qnty, UnitPrice, TaxRate }]."]
    ],
    `// URL: POST http://localhost:3000/api/create-inventory-receipt?mode=create_from_selected_po_items
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "ContractId": 18201,
  "WarehouseId": 10,
  "DocNo": "PNK-2026-0125",
  "DocDate": "2026-11-06",
  "ReceiptFrom": "Xe 51C-889.24 / BB-9982",
  "Description": "Nhập đợt 1 gạch AAC công trình Empire",
  "StartProcessNow": "No",
  "Items": [
    { "MaterialId": 702, "SourceSubmissionId": 1102, "SubmissionName": "Gạch AAC 100mm", "Qnty": 400, "UnitPrice": 1350000, "TaxRate": 10 }
  ]
}`,
    `{ "Success": "true", "TransactionId": 5001 }`
  ));

  // API 4.5: get-inventory-submission
  docElements.push(...createApiSpecBlock(
    "API 4.5", "Lấy chi tiết vật tư của Phiếu Nhập kho", "GET", "api/get-inventory-submission",
    "Nạp bảng Mục II (Chi tiết vật tư thực nhận của phiếu nhập).",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["TransactionId", "number", "Có", "ID Phiếu nhập", "5001", "ID phiếu nhập."],
      ["Type", "string", "Có", "Cố định", '"inventory_receipt"', "Loại phiếu."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "1000", "Lấy tất cả dòng."]
    ],
    `http://localhost:3000/api/get-inventory-submission?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "TransactionId": 5001,
  "Type": "inventory_receipt",
  "PageNum": 1,
  "PageSize": 1000
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "SubmissionId": 1501,
      "MaterialId": 702,
      "SubmissionName": "Gạch AAC 100mm",
      "Unit": "m3",
      "Qnty": 400,
      "UnitPrice": 1350000,
      "Amount": 540000000,
      "TaxRate": 10
    }
  ]
}`
  ));

  // API 4.6: upsert-inventory-submission
  docElements.push(...createApiSpecBlock(
    "API 4.6", "Thêm / Sửa / Xóa dòng vật tư Nhập kho", "POST", "api/upsert-inventory-submission",
    "Chỉnh sửa khối lượng thực nhận, đơn giá hoặc xóa mặt hàng khỏi phiếu nhập.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"Create_InventorySubmission" | "Update_InventorySubmission" | "Delete_InventorySubmission"', "Hành động."],
      ["TransactionId", "number", "Có", "ID Phiếu nhập", "5001", "ID phiếu nhập."],
      ["SubmissionId", "number", "Không", "ID dòng", "1501", "Bắt buộc khi sửa/xóa."],
      ["MaterialId", "number", "Có", "ID Vật tư", "702", "ID vật tư."],
      ["Qnty", "number", "Có", "Input SL", "400", "Khối lượng thực nhận."],
      ["UnitPrice", "number", "Có", "Input Đơn giá", "1350000", "Đơn giá."],
      ["TaxRate", "number", "Không", "Input Thuế", "10", "Thuế suất."]
    ],
    `// URL: POST http://localhost:3000/api/upsert-inventory-submission?mode=Update_InventorySubmission
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "TransactionId": 5001,
  "SubmissionId": 1501,
  "Qnty": 400,
  "UnitPrice": 1350000,
  "TaxRate": 10
}`,
    `{ "Success": "true", "Message": "Updated submission" }`
  ));

  // API 4.7: submit-inventory-approval
  docElements.push(...createApiSpecBlock(
    "API 4.7", "Xác nhận nhập kho (Ghi tăng tồn kho)", "POST", "api/submit-inventory-approval",
    "Xác nhận hoàn tất thủ tục nhập kho. Hệ thống ghi tăng số lượng trong kho và chuyển trạng thái thành 'Đã nhập kho' (Status: 1).",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["TransactionId", "number", "Có", "ID Phiếu nhập", "5001", "ID phiếu nhập kho."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "TransactionId": 5001
}`,
    `{ "Success": "true", "Message": "Inventory receipt approved and posted" }`
  ));

  // API 4.8: upsert-unpostinventory-transaction
  docElements.push(...createApiSpecBlock(
    "API 4.8", "Hủy xác nhận nhập kho (Unpost)", "POST", "api/upsert-unpostinventory-transaction",
    "Hủy ghi sổ nhập kho khi phát hiện sai sót, đưa trạng thái về 'Đang lập' để chỉnh sửa.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["TransactionId", "number", "Có", "ID Phiếu nhập", "5001", "ID phiếu cần hủy ghi sổ."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "TransactionId": 5001
}`,
    `{ "Success": "true", "Message": "Transaction unposted successfully" }`
  ));

  // API 4.9: delete-inventory-transaction
  docElements.push(...createApiSpecBlock(
    "API 4.9", "Xóa Phiếu Nhập kho", "POST", "api/delete-inventory-transaction",
    "Xóa bỏ phiếu nhập kho khi chưa ghi sổ hoặc sau khi đã unpost.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["TransactionId", "number", "Có", "ID Phiếu nhập", "5001", "Mã ID phiếu cần xóa."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "TransactionId": 5001
}`,
    `{ "Success": "true", "Message": "Transaction deleted" }`
  ));

  // ==========================================
  // PHÂN HỆ 5: YÊU CẦU XUẤT & XUẤT KHO
  // ==========================================
  docElements.push(createHeading1("PHÂN HỆ 5: YÊU CẦU XUẤT & XUẤT KHO"));
  docElements.push(createHeading2("5.1. Luồng nghiệp vụ tổng quan"));
  docElements.push(createBullet("Mục đích", "Kỹ thuật lập Yêu cầu xuất cấp vật tư cho Nhà thầu phụ thi công (kiểm tra dự toán gói thầu và tồn khả dụng). Thủ kho căn cứ phiếu duyệt để xuất kho và trừ thẻ kho."));
  docElements.push(createBullet("Chu trình thực hiện", "1. Lập Yêu cầu xuất (/warehouse/requisition) -> 2. Mở Drawer thêm từ tồn kho dự án -> 3. Kiểm tra định mức dự toán WBS -> 4. CHT duyệt -> 5. Thủ kho mở màn hình Xuất kho (/warehouse/issue) -> 6. Xác nhận xuất thực tế -> 7. Giảm tồn kho."));

  docElements.push(createHeading2("5.2. Ánh xạ Màn hình Giao diện & Nút bấm"));
  docElements.push(createTable(
    ["Màn hình", "Tên Cột / Nút", "Loại", "API kết nối", "Logic & Xử lý"],
    [
      ["Yêu cầu xuất", "[+ Tạo yêu cầu]", "Button", "Không gọi API", "Mở modal lập yêu cầu xuất."],
      ["Yêu cầu xuất", "[Thêm từ tồn kho]", "Button", "api/get-pending-forrequest", "Mở Drawer tra cứu vật tư có sẵn trong kho."],
      ["Yêu cầu xuất", "Hạn mức dự toán", "Badge", "api/get-approvedbudget-list", "So sánh SL yêu cầu với định mức hợp đồng."],
      ["Yêu cầu xuất", "[✈ Trình duyệt YC]", "Button", "api/submit-inventory-approval", "Gửi Chỉ huy trưởng duyệt cấp."],
      ["Yêu cầu xuất", "[Xóa phiếu YC]", "Button", "POST api/delete-inventory-transaction", "Xóa phiếu yêu cầu xuất nháp."],
      ["Xuất kho", "[+ Xuất theo YC]", "Button", "api/get-pending-forrequest", "Nạp các dòng yêu cầu xuất đã được duyệt."],
      ["Xuất kho", "SL thực xuất", "Input", "Field: Qnty", "Số lượng thực giao tại cửa kho (<= SL yêu cầu)."],
      ["Xuất kho", "[Xác nhận xuất kho]", "Button", "api/submit-inventory-approval", "Ghi giảm thẻ kho, hoàn tất phiếu xuất."]
    ],
    [15, 18, 12, 27, 28]
  ));

  docElements.push(createHeading2("5.3. Đặc tả chi tiết toàn bộ các API Phân hệ Yêu cầu xuất & Xuất kho"));

  // API 5.1: get-inventory-transaction (request / issue)
  docElements.push(...createApiSpecBlock(
    "API 5.1", "Lấy danh sách Phiếu Yêu cầu xuất / Phiếu Xuất kho", "GET", "api/get-inventory-transaction",
    "Tải danh sách các phiếu yêu cầu xuất hoặc phiếu xuất kho.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["Type", "string", "Có", "Cố định", '"inventory_request" | "inventory_issue"', "Loại phiếu tương ứng với tab."],
      ["Keyword", "string", "Không", "Input Search", '""', "Tìm theo số phiếu, nhà thầu, kho."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-inventory-transaction?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "Type": "inventory_request",
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "TotalRows": 1,
  "Data": [
    {
      "TransactionId": 6001,
      "DocNo": "YCX-2026-0045",
      "VendorName": "Công Ty TNHH XD An Phú",
      "WarehouseName": "Kho Tổng Dự án Empire",
      "DocDate": "2026-11-06T00:00:00",
      "StatusCode": 1,
      "StatusName": "Đã duyệt yêu cầu"
    }
  ]
}`
  ));

  // API 5.2: get-approvedbudget-list
  docElements.push(...createApiSpecBlock(
    "API 5.2", "Kiểm tra hạn mức dự toán gói thầu (Approved Budget)", "GET", "api/get-approvedbudget-list",
    "Tra cứu hạn mức khối lượng vật tư tối đa mà Nhà thầu phụ được phép lĩnh theo hợp đồng.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["ContractId", "number", "Có", "ID Hợp đồng NTP", "122007", "ID hợp đồng NTP."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-approvedbudget-list?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "ContractId": 122007,
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "MaterialId": 702,
      "MaterialName": "Gạch AAC 100mm",
      "ContractQnty": 1500,
      "IssuedQnty": 300,
      "RemainingBudgetQnty": 1200
    }
  ]
}`
  ));

  // API 5.3: upsert-inventory-request
  docElements.push(...createApiSpecBlock(
    "API 5.3", "Tạo Phiếu Yêu cầu xuất cấp vật tư", "POST", "api/upsert-inventory-request",
    "Khởi tạo thông tin chung của phiếu yêu cầu xuất cấp vật tư.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"Create_request"', "Chế độ tạo."],
      ["SubType", "string", "Có", "Cố định", '"Project"', "Xuất cấp dự án."],
      ["SubconOf", "number", "Có", "LOV Đối tác", "1763", "ID nhà thầu phụ nhận cấp."],
      ["WarehouseId", "number", "Có", "Select Kho", "10", "Kho chỉ định xuất hàng."],
      ["DocDate", "string", "Có", "DatePicker", '"2026-11-06"', "Ngày yêu cầu."],
      ["Description", "string", "Không", "TextArea", '"Cấp gạch xây tầng hầm"', "Diễn giải."]
    ],
    `// URL: POST http://localhost:3000/api/upsert-inventory-request?mode=Create_request
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "SubType": "Project",
  "SubconOf": 1763,
  "WarehouseId": 10,
  "DocDate": "2026-11-06",
  "Description": "Yêu cầu cấp gạch xây tường phân cách khu B"
}`,
    `{ "Success": "true", "TransactionId": 6001 }`
  ));

  // API 5.4: get-pending-forrequest
  docElements.push(...createApiSpecBlock(
    "API 5.4", "Nút [Thêm từ tồn kho]: Tra cứu vật tư tồn khả dụng trong kho", "GET", "api/get-pending-forrequest",
    "Mở Drawer RequisitionPendingDrawer để tìm kiếm các vật tư đang có sẵn trong kho kèm số lượng OnHandQty và AvailableQty.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["WarehouseId", "number", "Có", "Select Kho", "10", "Kho xuất chỉ định."],
      ["TransactionId", "number", "Không", "ID Phiếu", "6001", "ID phiếu yêu cầu."],
      ["Keyword", "string", "Không", "Search", '""', "Tìm tên vật tư."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang 1."],
      ["PageSize", "number", "Có", "Cố định", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-pending-forrequest?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "WarehouseId": 10,
  "TransactionId": 6001,
  "Keyword": "",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [
    {
      "MaterialId": 702,
      "ItemCode": "GACH-AAC-100",
      "ItemName": "Gạch AAC 100mm",
      "UomCode": "m3",
      "OnHandQty": 400,
      "AvailableQty": 350,
      "AvgUnitCost": 1350000
    }
  ]
}`
  ));

  // API 5.5: upsert-inventory-submission
  docElements.push(...createApiSpecBlock(
    "API 5.5", "Lưu dòng vật tư yêu cầu xuất vào database", "POST", "api/upsert-inventory-submission",
    "Ghi nhận vật tư chọn từ tồn kho vào phiếu yêu cầu xuất kèm định mức OrgCode WBS.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["mode", "string", "Có", "Query Param", '"Create_InventorySubmission"', "Chế độ."],
      ["TransactionId", "number", "Có", "ID Phiếu YC", "6001", "ID phiếu yêu cầu."],
      ["WorkType", "string", "Có", "Cố định", '"Inventory_request"', "Loại yêu cầu xuất."],
      ["MaterialId", "number", "Có", "ID Vật tư", "702", "Mã vật tư."],
      ["SubmissionName", "string", "Có", "Tên", '"Gạch AAC 100mm"', "Mô tả."],
      ["Orgcode", "string", "Có", "Dropdown WBS", '"2.1.1"', "Mã kết cấu thi công."],
      ["OrgName", "string", "Không", "Tên WBS", '"Xây tường"', "Tên kết cấu."],
      ["Qnty", "number", "Có", "SL yêu cầu", "200", "Số lượng xin cấp."],
      ["Remarks", "string", "Không", "Ghi chú", '"Cấp đợt 1"', "Diễn giải."]
    ],
    `// URL: POST http://localhost:3000/api/upsert-inventory-submission?mode=Create_InventorySubmission
{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "TransactionId": 6001,
  "WorkType": "Inventory_request",
  "MaterialId": 702,
  "SubmissionName": "Gạch AAC 100mm",
  "Orgcode": "2.1.1",
  "OrgName": "Xây tường tầng hầm",
  "Qnty": 200,
  "Remarks": "Cấp đợt 1"
}`,
    `{ "Success": "true", "SubmissionId": 1801 }`
  ));

  // API 5.6: update-inventorytransaction-info
  docElements.push(...createApiSpecBlock(
    "API 5.6", "Chỉnh sửa thông tin chung phiếu giao dịch", "POST", "api/update-inventorytransaction-info",
    "Cập nhật ngày chứng từ hoặc nội dung diễn giải của phiếu kho.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["TransactionId", "number", "Có", "ID Phiếu", "6001", "ID phiếu cần sửa."],
      ["DocDate", "string", "Không", "DatePicker", '"2026-11-06"', "Ngày chứng từ."],
      ["Description", "string", "Không", "TextArea", '"Cấp bổ sung vật tư"', "Diễn giải mới."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "TransactionId": 6001,
  "DocDate": "2026-11-06",
  "Description": "Cấp bổ sung vật tư gạch khu B"
}`,
    `{ "Success": "true", "Message": "Transaction info updated" }`
  ));

  // API 5.7: delete-inventory-transaction
  docElements.push(...createApiSpecBlock(
    "API 5.7", "Xóa phiếu Yêu cầu xuất / Phiếu xuất kho", "POST", "api/delete-inventory-transaction",
    "Xóa bỏ phiếu yêu cầu xuất hoặc phiếu xuất khi ở trạng thái nháp.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["TransactionId", "number", "Có", "ID Phiếu", "6001", "ID phiếu cần xóa."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "TransactionId": 6001
}`,
    `{ "Success": "true", "Message": "Transaction deleted successfully" }`
  ));

  // API 5.8: get-inventory-balance
  docElements.push(...createApiSpecBlock(
    "API 5.8", "Kiểm tra số lượng tồn kho khả dụng", "GET", "api/get-inventory-balance",
    "Kiểm tra số lượng vật tư thực tế còn trong kho trước khi bấm xuất hàng.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["WarehouseId", "number", "Có", "Select Kho", "10", "Mã kho."],
      ["MaterialId", "number", "Có", "ID Vật tư", "702", "Mã vật tư."],
      ["OnlyAvailable", "number", "Có", "Cố định", "1", "1: Chỉ lấy hàng khả dụng."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-inventory-balance?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "WarehouseId": 10,
  "MaterialId": 702,
  "Keyword": "",
  "OnlyAvailable": 1,
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [{ "WarehouseId": 10, "MaterialId": 702, "OnHandQnty": 400, "AvailableQnty": 350 }]
}`
  ));

  // API 5.9: submit-inventory-approval
  docElements.push(...createApiSpecBlock(
    "API 5.9", "Xác nhận xuất kho (Ghi giảm thẻ kho)", "POST", "api/submit-inventory-approval",
    "Thủ kho bấm xác nhận xuất giao vật tư tại cửa kho. Tồn kho tự động bị giảm trừ.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["TransactionId", "number", "Có", "ID Phiếu xuất", "7001", "ID phiếu xuất kho."]
    ],
    `{
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "TransactionId": 7001
}`,
    `{ "Success": "true", "Message": "Goods issued and inventory deducted" }`
  ));

  // API 5.10: get-inventory-stockcardreport
  docElements.push(...createApiSpecBlock(
    "API 5.10", "Tra cứu Thẻ kho lịch sử Nhập - Xuất - Tồn", "GET", "api/get-inventory-stockcardreport",
    "Xem chi tiết từng biến động nhập xuất tồn của một mặt hàng tại kho.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["WarehouseId", "number", "Có", "Mã Kho", "10", "ID kho."],
      ["MaterialId", "number", "Có", "ID Vật tư", "702", "ID vật tư."],
      ["FromDate", "string", "Có", "Từ ngày", '"2026-10-01"', "Ngày bắt đầu."],
      ["ToDate", "string", "Có", "Đến ngày", '"2026-10-31"', "Ngày kết thúc."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-inventory-stockcardreport?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "WarehouseId": 10,
  "MaterialId": 702,
  "FromDate": "2026-10-01",
  "ToDate": "2026-10-31",
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [
    { "DocDate": "2026-11-06", "DocNo": "PNK-2026-0125", "Type": "Nhập", "InQnty": 400, "OutQnty": 0, "BalanceQnty": 400 },
    { "DocDate": "2026-11-06", "DocNo": "PXK-2026-0045", "Type": "Xuất", "InQnty": 0, "OutQnty": 200, "BalanceQnty": 200 }
  ]
}`
  ));

  // API 5.11: get-inventory-periodreport
  docElements.push(...createApiSpecBlock(
    "API 5.11", "Báo cáo tổng hợp Nhập - Xuất - Tồn theo kỳ", "GET", "api/get-inventory-periodreport",
    "Xem báo cáo số dư đầu kỳ, tổng nhập, tổng xuất và tồn cuối kỳ của tất cả vật tư.",
    [
      ...COMMON_SESSION_PARAMS.slice(0, 4),
      ["Period", "string", "Có", "Kỳ báo cáo", '"2026-10"', "Tháng/Năm (YYYY-MM)."],
      ["WarehouseId", "number", "Không", "Select Kho", "null | 10", "ID kho (hoặc null lấy tất cả)."],
      ["MaterialId", "number", "Không", "Select VT", "null | 702", "ID vật tư (null lấy tất cả)."],
      ["OnlyHasMovement", "number", "Có", "Cố định", "1", "1: Chỉ lấy các mặt hàng có phát sinh."],
      ["PageNum", "number", "Có", "Pagination", "1", "Trang."],
      ["PageSize", "number", "Có", "Pagination", "50", "Số dòng."]
    ],
    `http://localhost:3000/api/get-inventory-periodreport?params={
  "LogIn": "r@gmail.com",
  "SessionId": "778C4190-35FF-494D-B77C-380CFC836353",
  "WSId": "",
  "Language": "vi",
  "Period": "2026-10",
  "WarehouseId": null,
  "MaterialId": null,
  "Keyword": "",
  "OnlyHasMovement": 1,
  "PageNum": 1,
  "PageSize": 50
}`,
    `{
  "Success": "true",
  "Data": [{ "MaterialId": 702, "MaterialName": "Gạch AAC", "BeginningQty": 100, "InQty": 400, "OutQty": 200, "EndingQty": 300 }]
}`
  ));

  // ==========================================
  // PHẦN 6: QUY CHUẨN DÙNG CHUNG
  // ==========================================
  docElements.push(createHeading1("PHẦN 6: QUY CHUẨN GIAO DIỆN & THÀNH PHẦN DÙNG CHUNG"));
  docElements.push(createBullet("Modal Tệp đính kèm dùng chung", "Sử dụng ErpAttachmentsModal (width: 1280px, paddingLeft: 60px bù sidebar). Phân loại 3 nhóm thư mục (Tài liệu dự án, Tài liệu ký số, Tài liệu đã ký số). Nút tải file xanh lá #10B981, tối đa 50MB/tệp."));
  docElements.push(createBullet("Quy trình phê duyệt RACI", "Tất cả các màn hình chi tiết chứng từ đều tích hợp nút [⑂ Quy trình duyệt] trên thanh Header để mở Drawer RACI 4 bước, không ghim cố định trong thân phiếu."));
  docElements.push(createBullet("Khung bao màn hình Danh sách", "Bọc bằng ErpPageContainer. Cột có tính năng kéo giãn (ResizableTitle) và ghi nhớ vào localStorage. Dòng compact (.erp-row)."));
  docElements.push(createBullet("Khung bao màn hình Chi tiết", "Bọc bằng ErpDetailContainer. Mở dạng In-place view toàn màn hình thay thế danh sách, có nút [✕ Đóng] ở góc phải để quay về ngay lập tức."));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: docElements,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join("d:\\web", "TAI_LIEU_DAC_TA_ERP_CONSIMS.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("SUCCESS: Document written directly to", outPath, "with total size:", buffer.length);
}

generate().catch((err) => {
  console.error("ERROR generating document:", err);
  process.exit(1);
});
