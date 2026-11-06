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
    spacing: { after: 300, before: 200 },
    run: {
      size: 36,
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
    spacing: { after: 400 },
    run: {
      size: 24,
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
    spacing: { before: 400, after: 150 },
    run: {
      size: 28,
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
    spacing: { before: 250, after: 100 },
    run: {
      size: 24,
      bold: true,
      color: "1E293B",
      font: "Segoe UI",
    },
  });
}

function createHeading3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    run: {
      size: 22,
      bold: true,
      color: "334155",
      font: "Segoe UI",
    },
  });
}

function createPara(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        size: 20,
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
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: title + ": ",
        size: 20,
        bold: true,
        font: "Segoe UI",
        color: "0F172A",
      }),
      new TextRun({
        text: desc,
        size: 20,
        font: "Segoe UI",
        color: "334155",
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
      top: 100,
      bottom: 100,
      left: 140,
      right: 140,
    },
    children: [
      new Paragraph({
        alignment: options.align || (isHeader ? AlignmentType.CENTER : AlignmentType.LEFT),
        children: [
          new TextRun({
            text: text || "",
            bold: isHeader || options.bold || false,
            size: isHeader ? 19 : 18,
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

  // Header row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => createCell(h, true, colWidths[i])),
    })
  );

  // Data rows
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
              mono: colIdx === 2 || colIdx === 3,
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

async function generate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          createTitle("HỆ THỐNG ERP XÂY DỰNG - TÀI LIỆU ĐẶC TẢ KỸ THUẬT & ÁNH XẠ API"),
          createSubTitle("Quy chuẩn đặc tả giao diện và kết nối API - Mô hình Đi từ Ngoài vào Trong"),
          createPara("Tài liệu này đặc tả chi tiết 5 phân hệ cốt lõi: Bảng giá, Hợp đồng, Đơn đặt hàng (PO), Nhập kho và Yêu cầu xuất / Xuất kho. Mỗi phân hệ được chuẩn hóa theo quy trình 4 bước: (1) Sơ đồ luồng, (2) Màn hình Danh sách, (3) Form Tạo mới & API nạp dữ liệu LOV, (4) Màn hình Chi tiết chứng từ & Hạng mục vật tư.", { italics: true }),

          // ==========================================
          // 1. PHÂN HỆ BẢNG GIÁ
          // ==========================================
          createHeading1("1. PHÂN HỆ BẢNG GIÁ (QUOTATIONS)"),
          createHeading2("1.1. Luồng nghiệp vụ tổng quan"),
          createBullet("Mục đích", "Quản lý các đợt báo giá vật tư, đơn giá chào thầu cho Chủ đầu tư hoặc Khách hàng."),
          createBullet("Đường dẫn (Route)", "/quotations"),
          createBullet("Chu trình thực hiện", "Xem danh sách bảng giá -> Bấm [+ Tạo bảng giá] -> Chọn Khách hàng & Hợp đồng CĐT -> Lưu thông tin chung -> Chuyển sang Chi tiết bảng giá -> Thêm vật tư / Import Excel -> Trình duyệt."),

          createHeading2("1.2. Màn hình Danh sách Bảng giá"),
          createPara("API tải dữ liệu bảng: GET api/get-quotation-list (Params: { DisplayMode: 'quotation', PageNum: 1, PageSize: 50, Keyword: '', Status: 'ALL' })"),
          createTable(
            ["Khu vực", "Tên Cột / Nút", "Loại", "API & Field Mapping", "Logic hiển thị & Nghiệp vụ"],
            [
              ["Thanh Header", "[+ Tạo bảng giá]", "Button", "Không gọi API", "Chuyển sang form tạo mới bảng giá."],
              ["Thanh Header", "[⟳ Làm mới]", "Button", "api/get-quotation-list", "Tải lại danh sách mới nhất từ server."],
              ["Bộ lọc", "Ô tìm kiếm", "Input", "params.Keyword", "Tìm theo Mã bảng giá, Khách hàng, Diễn giải."],
              ["Bảng danh sách", "Mã bảng giá", "Text", "item.ContractCode", "Font monospace, hiển thị mã bảng giá."],
              ["Bảng danh sách", "Khách hàng", "Text", "item.VenName | item.ClientName", "Tên chủ đầu tư hoặc đối tác."],
              ["Bảng danh sách", "Hợp đồng CĐT", "Text", "item.MainCode", "Mã hợp đồng nguyên tắc liên kết."],
              ["Bảng danh sách", "Ngày lập", "Date", "item.ContractDate", "Format DD/MM/YYYY."],
              ["Bảng danh sách", "Giá trị bảng giá", "Number", "item.ContractedAmount", "Format VNĐ: #,##0 đ."],
              ["Bảng danh sách", "Trạng thái", "Badge", "item.StatusCode, StatusName", "0: Đang lập (Cam), 2: Chờ duyệt (Lam), 1: Đã duyệt (Xanh lá)."],
              ["Bảng danh sách", "Hành động dòng", "Click", "api/get-quotationsubmission", "Nhấn vào dòng mở màn hình Chi tiết Bảng giá."]
            ],
            [15, 18, 12, 27, 28]
          ),

          createHeading2("1.3. Form Tạo mới Bảng giá"),
          createPara("Trước khi lưu, form sử dụng các API danh mục để hỗ trợ tìm kiếm kính lúp (LOV):"),
          createBullet("LOV Khách hàng", "GET api/get-client-list (Params: { DisplayMode: 'all', PageSize: 100 })"),
          createBullet("LOV Hợp đồng CĐT", "GET api/get-contract-list (Params: { DisplayMode: 'main_contract' })"),
          createPara("API thực thi khi bấm [Lưu]: POST api/update-quotation-info (mode: create_quotation)"),
          createTable(
            ["STT", "Trường trên Form", "Bắt buộc", "Payload Field gửi lên", "Ghi chú & Giá trị mặc định"],
            [
              ["1", "Khách hàng (Client)", "Có", "ClientId", "ID đối tác chọn từ LOV get-client-list."],
              ["2", "HĐ Chủ đầu tư", "Không", "MainContractId", "ID hợp đồng chính nếu có liên kết."],
              ["3", "Ngày lập", "Có", "ContractDate", "Format YYYY-MM-DD. Mặc định sysdate."],
              ["4", "Hiệu lực từ / đến", "Không", "FromDate, ToDate", "Khoảng thời gian hiệu lực giá."],
              ["5", "Loại tiền tệ", "Có", "Currency", "Mặc định 'VND'."],
              ["6", "Điều khoản TT", "Không", "PaymentTerm", "Mặc định 'DK03'."],
              ["7", "Diễn giải", "Không", "Description", "Nội dung tóm tắt phạm vi báo giá."],
              ["8", "Tệp đính kèm", "Không", "Attachments", "Mảng danh sách file đính kèm ban đầu."]
            ],
            [8, 22, 12, 28, 30]
          ),

          createHeading2("1.4. Màn hình Chi tiết Bảng giá & Hạng mục Vật tư"),
          createPara("API nạp danh sách vật tư: GET api/get-quotationsubmission (Params: { ContractId: ID, DisplayMode: 'quotation_detail' })"),
          createTable(
            ["Tên Nút / Cột", "Kiểu", "API gọi thực thi", "Mô tả nghiệp vụ"],
            [
              ["[+ Thêm vật tư]", "Button", "POST api/upsert-quotationsubmission", "Mode: add_submission_item. Thêm từng mặt hàng."],
              ["[📥 Import Excel]", "Button", "POST api/quotation/import-execute", "Upload và import hàng loạt mặt hàng từ dự toán Excel."],
              ["[📎 Tệp đính kèm]", "Button", "GET api/get-file-list", "Mở modal quản lý 3 nhóm thư mục hồ sơ báo giá."],
              ["[✈ Trình duyệt]", "Button", "POST api/update-submission-review", "Chuyển trạng thái từ Đang lập sang Chờ duyệt (Status 2)."],
              ["Cột Thành tiền", "Formula", "Thành tiền = SL * Đơn giá", "Tự động tính trên Frontend hoặc lấy từ item.Amount."],
              ["Σ Tổng cộng", "Footer", "Sum(Amount)", "Cố định ở chân bảng (Table.Summary fixed)."]
            ],
            [20, 12, 33, 35]
          ),

          // ==========================================
          // 2. PHÂN HỆ HỢP ĐỒNG
          // ==========================================
          createHeading1("2. PHÂN HỆ HỢP ĐỒNG (CONTRACTS)"),
          createHeading2("2.1. Luồng nghiệp vụ tổng quan"),
          createBullet("Mục đích", "Quản lý hợp đồng giao khoán Nhà thầu phụ, Hợp đồng cung cấp vật tư thiết bị."),
          createBullet("Đường dẫn (Route)", "/contracts"),
          createBullet("Chu trình thực hiện", "Xem danh sách HĐ -> Bấm [+ Tạo hợp đồng] -> Chọn Bảng giá / Nhà thầu -> Lưu thông tin chung -> Chuyển sang Chi tiết HĐ -> Phân bổ khối lượng vật tư -> Trình duyệt theo quy trình RACI."),

          createHeading2("2.2. Màn hình Danh sách Hợp đồng"),
          createPara("API tải dữ liệu bảng: GET api/get-contract-list (Params: { DisplayMode: 'mat_equip', WorkType: 'mat_equip', PageNum: 1, PageSize: 50, Keyword: '' })"),
          createTable(
            ["Khu vực", "Tên Cột / Nút", "Loại", "API & Field Mapping", "Logic hiển thị & Nghiệp vụ"],
            [
              ["Thanh Header", "[+ Tạo hợp đồng]", "Button", "Không gọi API", "Mở Form tạo mới hợp đồng NTP / Cung ứng."],
              ["Thanh Header", "[⟳ Làm mới]", "Button", "api/get-contract-list", "Tải lại danh sách hợp đồng mới nhất."],
              ["Bảng danh sách", "Số hợp đồng", "Text", "item.ContractCode", "Mã số hợp đồng chính thức, font monospace."],
              ["Bảng danh sách", "Nhà thầu / NCC", "Text", "item.VenName | item.Venname", "Tên đơn vị nhà thầu phụ hoặc nhà cung cấp."],
              ["Bảng danh sách", "Hợp đồng CĐT", "Text", "item.MainCode | OwnerContractCode", "Mã HĐ Chủ đầu tư dự án."],
              ["Bảng danh sách", "Ngày ký HĐ", "Date", "item.Contractdate | ContractDate", "Format DD/MM/YYYY."],
              ["Bảng danh sách", "Giá trị hợp đồng", "Number", "item.ContractedAmount", "Format VNĐ: #,##0 đ."],
              ["Bảng danh sách", "Trạng thái duyệt", "Badge", "item.StatusCode, StatusName", "0: Đang lập, 2: Chờ duyệt, 1: Đã duyệt, -1: Từ chối."],
              ["Bảng danh sách", "Người tạo", "Text", "item.CurrentAssignee | CreatedBy", "Tên kỹ sư / chuyên viên quản lý gói thầu."],
              ["Bảng danh sách", "Click dòng", "Click", "api/get-matequipsubmission", "Nhấn vào dòng mở màn hình Chi tiết Hợp đồng."]
            ],
            [15, 18, 12, 27, 28]
          ),

          createHeading2("2.3. Form Tạo mới Hợp đồng"),
          createPara("API nạp danh mục trước khi nhập:"),
          createBullet("LOV Nhà thầu / NCC", "GET api/get-client-list (Params: { DisplayMode: 'subcon', PageSize: 100 })"),
          createBullet("LOV Bảng giá tham chiếu", "GET api/get-quotation-list (Params: { DisplayMode: 'approved_quotation' })"),
          createBullet("LOV Hợp đồng chính CĐT", "GET api/get-contract-list (Params: { DisplayMode: 'main_contract' })"),
          createPara("API thực thi khi bấm [Lưu]: POST api/update-contract-info (mode: create_contract)"),
          createTable(
            ["STT", "Trường trên Form", "Bắt buộc", "Payload Field gửi lên", "Ghi chú & Giá trị mặc định"],
            [
              ["1", "Nhà thầu / NCC", "Có", "VenId / ClientId", "ID nhà thầu lấy từ LOV get-client-list."],
              ["2", "HĐ Chủ đầu tư", "Có", "MainContractId", "ID hợp đồng dự án chính."],
              ["3", "Bảng giá gốc", "Không", "QuotationId", "Chọn bảng giá đã duyệt để kế thừa đơn giá."],
              ["4", "Số hợp đồng NCC", "Có", "ContractCode", "Nhập mã số hợp đồng NTP."],
              ["5", "Ngày ký HĐ", "Có", "ContractDate", "Format YYYY-MM-DD. Mặc định sysdate."],
              ["6", "Thời hạn thi công", "Không", "StartDate, EndDate", "Thời gian bắt đầu và kết thúc gói thầu."],
              ["7", "Điều khoản thanh toán", "Có", "PayTerms", "Quy định tạm ứng, giữ bảo lưu, đợt thanh toán."],
              ["8", "Nội dung gói thầu", "Không", "Description", "Diễn giải phạm vi công việc hợp đồng."]
            ],
            [8, 22, 12, 28, 30]
          ),

          createHeading2("2.4. Màn hình Chi tiết Hợp đồng & Vật tư"),
          createPara("API nạp danh sách vật tư: GET api/get-matequipsubmission (Params: { ContractId: ID, DisplayMode: 'mat_equip' })"),
          createTable(
            ["Tên Nút / Cột", "Kiểu", "API gọi thực thi", "Mô tả nghiệp vụ"],
            [
              ["[+ Thêm hạng mục]", "Button", "POST api/upsert-matequipsubmission", "Mode: Create_MatequipSubmission. Bổ sung vật tư HĐ."],
              ["[Xóa hạng mục]", "Button", "POST api/upsert-matequipsubmission", "Mode: Delete_MatequipSubmission (truyền SubmissionId)."],
              ["[⑂ Quy trình duyệt]", "Button", "GET api/get-contract-status", "Xem tiến trình ký duyệt 4 bước RACI."],
              ["[📎 Tệp đính kèm]", "Button", "GET api/get-file-list", "Quản lý HĐ scan, chứng chỉ năng lực, bảo lãnh."],
              ["[✈ Trình duyệt HĐ]", "Button", "POST api/submit-contract-approval", "Trình duyệt hợp đồng lên cấp quản lý."]
            ],
            [20, 12, 33, 35]
          ),

          // ==========================================
          // 3. PHÂN HỆ ĐƠN ĐẶT HÀNG (PO)
          // ==========================================
          createHeading1("3. PHÂN HỆ ĐƠN ĐẶT HÀNG (PURCHASE ORDERS - PO)"),
          createHeading2("3.1. Luồng nghiệp vụ tổng quan"),
          createBullet("Mục đích", "Phát hành Đơn đặt hàng (PO) mua vật tư / thiết bị từ Hợp đồng khung hoặc Nhà cung cấp."),
          createBullet("Đường dẫn (Route)", "/purchase-orders"),
          createBullet("Chu trình thực hiện", "Xem danh sách PO -> Bấm [+ Tạo đơn hàng] -> Chọn Hợp đồng/NCC và Kho nhận -> Lưu đơn hàng -> Chọn danh sách vật tư cần đặt -> Trình duyệt đơn hàng PO."),

          createHeading2("3.2. Màn hình Danh sách Đơn đặt hàng (PO)"),
          createPara("API tải dữ liệu bảng: GET api/get-purchaseorder-list (Params: { DisplayMode: 'po_list', PageNum: 1, PageSize: 50, Keyword: '' })"),
          createTable(
            ["Khu vực", "Tên Cột / Nút", "Loại", "API & Field Mapping", "Logic hiển thị & Nghiệp vụ"],
            [
              ["Thanh Header", "[+ Tạo đơn hàng]", "Button", "Không gọi API", "Mở popup/drawer tạo mới PO."],
              ["Thanh Header", "[⟳ Làm mới]", "Button", "api/get-purchaseorder-list", "Tải lại danh sách đơn đặt hàng."],
              ["Bảng danh sách", "Mã đơn hàng (PO)", "Text", "item.ContractCode | POCode", "Mã đơn đặt hàng (VD: PO-2026-0089)."],
              ["Bảng danh sách", "Nhà cung cấp", "Text", "item.VenName | VendorName", "Tên nhà cung cấp vật tư."],
              ["Bảng danh sách", "Hợp đồng nguồn", "Text", "item.SourceContractCode", "Số hợp đồng khung làm căn cứ đặt hàng."],
              ["Bảng danh sách", "Ngày đặt hàng", "Date", "item.ContractDate | OrderDate", "Format DD/MM/YYYY."],
              ["Bảng danh sách", "Kho tiếp nhận", "Text", "item.WarehouseName", "Địa điểm kho công trình nhận vật tư."],
              ["Bảng danh sách", "Tổng giá trị PO", "Number", "item.ContractedAmount", "Format VNĐ: #,##0 đ."],
              ["Bảng danh sách", "Trạng thái PO", "Badge", "item.StatusCode, StatusName", "0: Đang lập, 2: Chờ duyệt, 1: Đã duyệt."],
              ["Bảng danh sách", "Click dòng", "Click", "api/get-purchaseordersubmission", "Nhấn vào dòng mở Chi tiết đơn hàng PO."]
            ],
            [15, 18, 12, 27, 28]
          ),

          createHeading2("3.3. Form Tạo mới Đơn đặt hàng (PO)"),
          createPara("API nạp danh mục trước khi nhập:"),
          createBullet("LOV Hợp đồng gốc", "GET api/get-contract-list (Params: { DisplayMode: 'approved_contract' })"),
          createBullet("LOV Nhà cung cấp", "GET api/get-client-list (Params: { DisplayMode: 'vendor' })"),
          createBullet("LOV Kho tiếp nhận", "GET api/get-warehouse-list (Params: { PageSize: 50 })"),
          createPara("API thực thi khi bấm [Lưu]: POST api/update-purchaseorder-info (mode: create_purchase_order)"),
          createTable(
            ["STT", "Trường trên Form", "Bắt buộc", "Payload Field gửi lên", "Ghi chú & Giá trị mặc định"],
            [
              ["1", "Hợp đồng căn cứ", "Có", "ContractId", "Hợp đồng khung đã duyệt."],
              ["2", "Nhà cung cấp", "Có", "VendorId / ClientId", "Lấy tự động theo HĐ hoặc chọn từ LOV."],
              ["3", "Kho tiếp nhận", "Có", "WarehouseId", "Kho công trình tiếp nhận hàng."],
              ["4", "Số đơn hàng", "Có", "POCode", "Hệ thống tự sinh hoặc cho phép nhập."],
              ["5", "Ngày đặt hàng", "Có", "OrderDate", "Format YYYY-MM-DD. Mặc định sysdate."],
              ["6", "Ngày giao dự kiến", "Không", "DeliveryDate", "Hạn giao hàng tại công trường."],
              ["7", "Địa chỉ giao hàng", "Không", "DeliveryAddress", "Vị trí cổng công trình."],
              ["8", "Ghi chú đơn hàng", "Không", "Remarks", "Yêu cầu kỹ thuật, đóng gói, biên bản kiểm tra."]
            ],
            [8, 22, 12, 28, 30]
          ),

          createHeading2("3.4. Màn hình Chi tiết Đơn đặt hàng (PO)"),
          createPara("API nạp danh sách vật tư đặt hàng: GET api/get-purchaseordersubmission (Params: { ContractId: PO_ID, DisplayMode: 'po_submission' })"),
          createTable(
            ["Tên Nút / Cột", "Kiểu", "API gọi thực thi", "Mô tả nghiệp vụ"],
            [
              ["[+ Thêm mặt hàng]", "Button", "POST api/upsert-purchaseordersubmission", "Thêm mặt hàng và số lượng cần đặt."],
              ["[Xóa mặt hàng]", "Button", "POST api/upsert-purchaseordersubmission", "Xóa dòng khỏi đơn hàng."],
              ["[✈ Trình duyệt PO]", "Button", "POST api/submit-purchaserorder-approval", "Gửi phê duyệt đơn hàng (WorkType: 'purchase_order')."],
              ["[🖨 In đơn hàng]", "Button", "Không gọi API", "Mở mẫu in đơn hàng PO theo form chuẩn Central."]
            ],
            [20, 12, 33, 35]
          ),

          // ==========================================
          // 4. PHÂN HỆ NHẬP KHO
          // ==========================================
          createHeading1("4. PHÂN HỆ NHẬP KHO (WAREHOUSE RECEIPT - `/warehouse/receipt`)"),
          createHeading2("4.1. Luồng nghiệp vụ tổng quan"),
          createBullet("Mục đích", "Ghi nhận vật tư nhập về kho công trường dựa trên Đơn hàng (PO) đã duyệt hoặc nhập trực tiếp."),
          createBullet("Đường dẫn (Route)", "/warehouse/receipt"),
          createBullet("Chu trình thực hiện", "Xem danh sách Phiếu nhập -> Bấm [+ Tạo phiếu nhập] -> Chọn PO và Kho nhận -> Đối chiếu khối lượng giao hàng -> Lưu phiếu -> Trình duyệt và Ghi sổ tồn kho."),

          createHeading2("4.2. Màn hình Danh sách Phiếu Nhập kho"),
          createPara("API tải dữ liệu bảng: GET api/get-inventory-transaction (Params: { Type: 'inventory_receipt', PageNum: 1, PageSize: 50, Keyword: '' })"),
          createTable(
            ["Khu vực", "Tên Cột / Nút", "Loại", "API & Field Mapping", "Logic hiển thị & Nghiệp vụ"],
            [
              ["Thanh Header", "[+ Tạo phiếu nhập]", "Button", "Không gọi API", "Mở modal lập phiếu nhập kho."],
              ["Thanh Header", "[⟳ Làm mới]", "Button", "api/get-inventory-transaction", "Tải lại danh sách phiếu nhập kho."],
              ["Bảng danh sách", "Số phiếu nhập", "Text", "item.DocNo | Code", "Mã phiếu nhập (VD: PNK-2026-0125)."],
              ["Bảng danh sách", "Đơn hàng PO", "Text", "item.POCode | ContractCode", "Đơn hàng PO liên kết làm căn cứ giao."],
              ["Bảng danh sách", "Nhà cung cấp", "Text", "item.VendorName | VenName", "Đơn vị giao hàng."],
              ["Bảng danh sách", "Kho nhập", "Text", "item.WarehouseName", "Kho lưu trữ vật tư."],
              ["Bảng danh sách", "Ngày nhập kho", "Date", "item.DocDate | SubmissionDate", "Format DD/MM/YYYY."],
              ["Bảng danh sách", "Số xe / Vận đơn", "Text", "item.ReceiptFrom | Waybill", "Thông tin vận chuyển / Số phiếu giao hàng NCC."],
              ["Bảng danh sách", "Tổng tiền nhập", "Number", "item.TotalAmount | Amount", "Format VNĐ: #,##0 đ."],
              ["Bảng danh sách", "Trạng thái", "Badge", "item.StatusCode, StatusName", "0: Đang lập, 2: Chờ duyệt, 1: Đã nhập kho."],
              ["Bảng danh sách", "Click dòng", "Click", "api/get-inventory-submission", "Nhấn vào dòng mở màn hình Chi tiết Phiếu nhập."]
            ],
            [15, 18, 12, 27, 28]
          ),

          createHeading2("4.3. Form Tạo mới Phiếu Nhập kho"),
          createPara("API nạp danh mục trước khi nhập:"),
          createBullet("LOV Đơn hàng PO chờ nhập", "GET api/get-pendinginventory-po (Params: { PageSize: 50 })"),
          createBullet("LOV Danh sách Kho", "GET api/get-warehouse-list"),
          createBullet("Chi tiết dòng PO đối chiếu", "GET api/get-inventory-po (UpdateMode: 'Reconcile_PurchaseOrder', ContractId: PO_ID)"),
          createPara("API thực thi khi bấm [Lưu]: POST api/create-inventory-receipt (mode: create_from_selected_po_items)"),
          createTable(
            ["STT", "Trường trên Form", "Bắt buộc", "Payload Field gửi lên", "Ghi chú & Giá trị mặc định"],
            [
              ["1", "Đơn hàng PO", "Có", "ContractId", "PO đã duyệt cần nhập kho."],
              ["2", "Kho tiếp nhận", "Có", "WarehouseId", "Kho lưu trữ thực tế tại công trường."],
              ["3", "Số phiếu nhập", "Có", "DocNo", "Mã phiếu nhập kho."],
              ["4", "Ngày nhập kho", "Có", "DocDate", "Format YYYY-MM-DD. Mặc định sysdate."],
              ["5", "Số xe / Phiếu giao hàng", "Không", "ReceiptFrom", "Số chứng từ giao nhận của bên giao."],
              ["6", "Diễn giải", "Không", "Description", "Ghi chú tình trạng hàng hóa khi dỡ."],
              ["7", "Danh sách mặt hàng", "Có", "Items: [{ MaterialId, SourceSubmissionId, Qnty, UnitPrice, TaxRate }]", "Khối lượng thực nhận tại công trường."]
            ],
            [8, 22, 12, 28, 30]
          ),

          createHeading2("4.4. Màn hình Chi tiết Phiếu Nhập kho"),
          createPara("API nạp chi tiết vật tư nhập: GET api/get-inventory-submission (Params: { TransactionId: ID, Type: 'inventory_receipt' })"),
          createTable(
            ["Tên Nút / Cột", "Kiểu", "API gọi thực thi", "Mô tả nghiệp vụ"],
            [
              ["[+ Bổ sung vật tư]", "Button", "POST api/upsert-inventory-submission", "Mode: Create_InventorySubmission."],
              ["[Chỉnh sửa dòng]", "Button", "POST api/upsert-inventory-submission", "Mode: Update_InventorySubmission."],
              ["[Xóa dòng]", "Button", "POST api/upsert-inventory-submission", "Mode: Delete_InventorySubmission."],
              ["[✈ Trình duyệt nhập kho]", "Button", "POST api/submit-inventory-approval", "Xác nhận phiếu nhập, ghi tăng tồn kho vật tư."],
              ["[Hủy xác nhận]", "Button", "POST api/upsert-unpostinventory-transaction", "Hủy ghi sổ nhập kho nếu cần sửa đổi."]
            ],
            [20, 12, 33, 35]
          ),

          // ==========================================
          // 5. PHÂN HỆ YÊU CẦU XUẤT & XUẤT KHO
          // ==========================================
          createHeading1("5. PHÂN HỆ YÊU CẦU XUẤT & XUẤT KHO"),
          createHeading2("5.1. Luồng nghiệp vụ tổng quan"),
          createBullet("Mục đích", "Kỹ thuật công trường lập Phiếu Yêu cầu xuất cấp vật tư cho Nhà thầu phụ/Tổ đội. Sau khi được duyệt, Thủ kho lập Phiếu Xuất kho thực tế để giảm trừ tồn kho."),
          createBullet("Đường dẫn (Route)", "/warehouse/requisition (Yêu cầu xuất) và /warehouse/issue (Xuất kho)"),
          createBullet("Chu trình thực hiện", "Lập Yêu cầu xuất -> Chọn Dự án, Nhà thầu, Kho xuất -> Chọn vật tư & Hạng mục WBS -> Trình duyệt Yêu cầu -> Thủ kho mở danh sách chờ xuất -> Lập Phiếu Xuất kho -> Xác nhận trừ kho."),

          createHeading2("5.2. Màn hình Yêu cầu Xuất kho (Warehouse Requisition)"),
          createPara("API danh sách: GET api/get-inventory-transaction (Params: { Type: 'inventory_request', PageNum: 1, PageSize: 50 })"),
          createBullet("API nạp LOV Nhà thầu phụ thi công", "GET api/get-client-list (DisplayMode: 'subcon')"),
          createBullet("API kiểm tra hạn mức dự toán (Budget)", "GET api/get-approvedbudget-list (ContractId: ID)"),
          createBullet("API lưu Yêu cầu xuất", "POST api/upsert-inventory-request (Mode: 'Create_request')"),
          createTable(
            ["Khu vực", "Tên Cột / Nút", "Loại", "API & Field Mapping", "Logic hiển thị & Nghiệp vụ"],
            [
              ["Form Tạo", "Nhà thầu phụ nhận", "LOV", "SubconOf / ClientId", "Đơn vị thi công nhận cấp vật tư."],
              ["Form Tạo", "Kho yêu cầu xuất", "Select", "WarehouseId", "Kho lưu trữ vật tư sẽ cấp."],
              ["Form Tạo", "Ngày yêu cầu", "DatePicker", "DocDate", "Mặc định sysdate."],
              ["Form Tạo", "Hạng mục công việc", "Select", "Orgcode, OrgName, WBS", "Vị trí kết cấu thi công."],
              ["Chi tiết", "[+ Thêm vật tư yc]", "Button", "POST api/upsert-inventory-submission", "Mode: Create_InventorySubmission (WorkType: 'Inventory_request')."],
              ["Chi tiết", "Cột Tồn khả dụng", "Number", "api/get-inventory-balance", "Hiển thị số lượng tồn kho còn lại."],
              ["Chi tiết", "[✈ Trình duyệt YC]", "Button", "POST api/submit-inventory-approval", "Trình Chỉ huy trưởng duyệt cấp vật tư."]
            ],
            [15, 18, 12, 27, 28]
          ),

          createHeading2("5.3. Màn hình Xuất kho thực tế (Goods Issue)"),
          createPara("API danh sách: GET api/get-inventory-transaction (Params: { Type: 'inventory_issue', PageNum: 1, PageSize: 50 })"),
          createBullet("API lấy Yêu cầu xuất chờ xuất hàng", "GET api/get-pending-forrequest (Params: { WarehouseId: ID })"),
          createBullet("API lưu Phiếu xuất kho", "POST api/upsert-inventory-submission (Mode: 'Create_InventoryIssue')"),
          createBullet("API xác nhận xuất kho", "POST api/submit-inventory-approval (Ghi giảm tồn kho thực tế)"),
          createTable(
            ["Tên Nút / Cột", "Kiểu", "API gọi thực thi", "Mô tả nghiệp vụ"],
            [
              ["[+ Xuất theo YC duyệt]", "Button", "api/get-pending-forrequest", "Chọn các dòng yêu cầu xuất đã được CHT phê duyệt."],
              ["Số lượng thực xuất", "Input", "Qnty", "Số lượng thủ kho thực giao tại cửa kho (<= SL yêu cầu)."],
              ["Người nhận hàng", "Input", "RecipientName", "Họ tên người đại diện NTP ký nhận."],
              ["[Xác nhận xuất kho]", "Button", "POST api/submit-inventory-approval", "Cập nhật thẻ kho, giảm tồn kho ngay lập tức."],
              ["[Tra cứu Thẻ kho]", "Button", "GET api/get-inventory-stockcardreport", "Xem lịch sử nhập - xuất - tồn của vật tư vừa xuất."]
            ],
            [20, 12, 33, 35]
          ),

          // ==========================================
          // 6. QUY CHUẨN THIẾT KẾ DÙNG CHUNG
          // ==========================================
          createHeading1("6. CÁC QUY CHUẨN CHUNG ÁP DỤNG TOÀN HỆ THỐNG"),
          createBullet("Quy cách Modal Tệp đính kèm", "100% sử dụng chung ErpAttachmentsModal với 3 nhóm thư mục (Tài liệu dự án, Tài liệu ký số, Tài liệu đã ký số), hỗ trợ tối đa 50MB/tệp, nút tải lên màu xanh lá #10B981."),
          createBullet("Quy trình phê duyệt RACI", "Tất cả các màn hình chi tiết đều tích hợp nút [⑂ Quy trình duyệt] trên thanh Header để mở Drawer RACI 4 bước, không gắn cố định vào thân phiếu."),
          createBullet("Giao diện danh sách (List View)", "Bọc bằng ErpPageContainer, cố định chiều cao, compact rows (.erp-row), hỗ trợ kéo giãn cột (ResizableTitle) và lưu độ rộng vào localStorage."),
          createBullet("Giao diện chi tiết (Detail View)", "Bọc bằng ErpDetailContainer, mở dạng In-place view toàn màn hình, nút [✕ Đóng] đưa người dùng trở lại danh sách ngay lập tức.")
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join("d:\\web", "TAI_LIEU_DAC_TA_ERP_CONSIMS.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("SUCCESS: Document written to", outPath);
}

generate().catch((err) => {
  console.error("ERROR generating document:", err);
  process.exit(1);
});
