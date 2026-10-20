import dayjs from "dayjs";

export interface StockItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  stockQty?: number; // Tồn kho hiện tại (dùng cho xuất kho)
  orderQty?: number; // SL theo PO / yêu cầu
  actualQty: number; // SL thực nhập / thực xuất
  unitPrice: number;
  totalPrice: number;
  binLocation?: string; // Vị trí kho (Kệ A1, Dãy B...)
  note?: string;

  // Raw fields from api/get-inventory-submission:
  LocalId?: number;
  ContractId?: number;
  SystemCode?: string;
  Description?: string;
  Unit?: string;
  UnitPrice?: number;
  Qnty?: number;
  Amount?: number;
  TaxRate?: number;
  TaxAmount?: number;
  SubmissionId?: number;
  ItemDate?: string;
  StageMode?: any;
  CreatedBy?: number | string;
  ApprovalStatus?: number;
  ApprovedOn?: string | null;
  ApprovalStart?: string | null;
  TaskId?: any;
  ApprovalUserId?: any;
  ApprovalAssignmentId?: any;
  StatusCode?: string;
  Editable?: number;
  Orgcode?: string;
  OrgName?: string;
  Orgname?: string;
  WBS?: string;
  BudgetDescription?: string;
  [key: string]: any;
}


export interface StockInReceipt {
  id: string;
  receiptCode: string;
  receiptDate: string;
  receiptType: "PO" | "TRANSFER" | "RETURN" | "OTHER" | string;
  poCode?: string;
  vendorName: string;
  contractCode?: string;
  warehouseId: string | number;
  warehouseName: string;
  invoiceNo?: string;
  deliverer?: string;
  receiver?: string;
  description: string;
  status: "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED" | string;
  totalQty?: number;
  totalAmount?: number;
  items?: StockItemDetail[];
  createdBy?: string;
  createdDate?: string;

  // Raw fields from API (MAT_InventoryTransaction):
  TransactionId?: number | string;
  SubType?: string;
  DocCode?: string;
  DocDate?: string;
  Description?: string;
  WarehouseId?: number | string;
  WarehouseName?: string;
  VenName?: string;
  venname?: string;
  ReferenceNo?: string;
  ReferenceId?: number | string;
  ContractCode?: string;
  ContractId?: number | string;
  SubconOf?: number | string;
  subconOf?: number | string;
  StatusCode?: string;
  Status?: string;
  [key: string]: any;
}

export interface StockOutIssue {
  id: string;
  issueCode: string;
  issueDate: string;
  issueType: "CONSTRUCTION" | "TRANSFER" | "RETURN_VENDOR" | "DISPOSAL";
  projectName: string;
  workPackage?: string;
  contractorName?: string;
  warehouseId: string;
  warehouseName: string;
  requisitionNo?: string;
  receiver: string;
  issuer: string;
  description: string;
  status: "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED";
  totalQty: number;
  totalAmount: number;
  items: StockItemDetail[];
  createdBy: string;
  createdDate: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
  address: string;
}

export const MOCK_WAREHOUSES: WarehouseOption[] = [
  { id: "WH01", name: "Kho Tổng Central - TP.HCM", code: "WH-HCM-01", address: "Khu Công Nghệ Cao, TP. Thủ Đức" },
  { id: "WH02", name: "Kho Dự án Vinhomes Grand Park", code: "WH-VHGP", address: "P. Long Bình, TP. Thủ Đức" },
  { id: "WH03", name: "Kho Dự án Sân bay Long Thành", code: "WH-SBLT", address: "Huyện Long Thành, Đồng Nai" },
  { id: "WH04", name: "Kho Trung chuyển Cát Lái", code: "WH-CL", address: "Cảng Cát Lái, P. Cát Lái, Q.2" },
  { id: "WH05", name: "Kho Miền Bắc - KĐT Starlake Tây Hồ", code: "WH-HN-01", address: "Khu Đô Thị Tây Hồ Tây, Hà Nội" },
  { id: "WH06", name: "Kho Thiết bị & Giàn giáo Bình Dương", code: "WH-BD-01", address: "KCN VSIP 1, Thuận An, Bình Dương" },
];

export const MOCK_MATERIALS_CATALOG = [
  { itemCode: "VT-THEP-D10", itemName: "Thép vằn D10 CB300-V Hòa Phát", unit: "Kg", unitPrice: 15400, stockQty: 25000 },
  { itemCode: "VT-THEP-D16", itemName: "Thép vằn D16 CB400-V Hòa Phát", unit: "Kg", unitPrice: 15600, stockQty: 18500 },
  { itemCode: "VT-THEP-D20", itemName: "Thép vằn D20 CB400-V Hòa Phát", unit: "Kg", unitPrice: 15650, stockQty: 14200 },
  { itemCode: "VT-XM-PC40", itemName: "Xi măng Hà Tiên PCB40 đóng bao 50kg", unit: "Bao", unitPrice: 88000, stockQty: 1200 },
  { itemCode: "VT-CAT-VANG", itemName: "Cát vàng hạt lớn bê tông", unit: "m3", unitPrice: 380000, stockQty: 450 },
  { itemCode: "VT-DA-1X2", itemName: "Đá 1x2 xanh Biên Hòa", unit: "m3", unitPrice: 420000, stockQty: 320 },
  { itemCode: "VT-CAP-CXV4X16", itemName: "Cáp điện lực hạ thế Cadivi CXV 4x16 mm2", unit: "Mét", unitPrice: 165000, stockQty: 850 },
  { itemCode: "VT-ONG-UPVC90", itemName: "Ống nhựa uPVC D90 C2 Bình Minh", unit: "Cây", unitPrice: 145000, stockQty: 600 },
  { itemCode: "VT-MCB-3P50A", itemName: "Aptomat khối MCCB 3P 50A 25kA Schneider", unit: "Cái", unitPrice: 890000, stockQty: 45 },
  { itemCode: "VT-SON-DULUX-WT", itemName: "Sơn lót chống kiềm ngoài trời Dulux Weathershield 18L", unit: "Thùng", unitPrice: 1850000, stockQty: 80 },
];

export interface InventoryStockItem {
  id: string | number;
  period: string; // Tháng / Kỳ tồn kho (VD: "10/2026")
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  warehouseId: string | number;
  warehouseName: string;
  stockQty: number;
  minStockQty: number;
  maxStockQty: number;
  avgPrice: number;
  totalValue: number;
  status?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVER_STOCK";
  lastTransactionDate: string;
}

export interface StockCardTransaction {
  id: string | number;
  date: string;
  docCode: string;
  type: "RECEIPT" | "ISSUE";
  typeLabel: string;
  partnerName: string;
  inQty: number;
  outQty: number;
  balanceQty: number;
  unitPrice: number;
  notes: string;
}

export interface InventoryBalanceItem {
  BalanceId: number;
  WarehouseId: number;
  WarehouseCode?: string;
  WarehouseName: string;
  MaterialId: number;
  ItemCode: string;
  ItemName: string;
  UomCode: string;
  OnHandQty: number;
  ReservedQty: number;
  AvailableQty: number;
  TotalCost: number;
  AvgUnitCost: number;
  LastReceiptDate?: string | null;
  LastIssueDate?: string | null;
  UpdatedDate?: string;
  [key: string]: any;
}

export interface InventoryPeriodReportItem {
  PeriodId: number;
  Period: string;
  WarehouseId: number;
  WarehouseCode?: string;
  WarehouseName: string;
  MaterialId: number;
  ItemCode: string;
  ItemName: string;
  UomCode: string;
  OpeningQty: number;
  OpeningValue: number;
  ReceiptQty: number;
  ReceiptValue: number;
  IssueQty: number;
  IssueValue: number;
  ClosingQty: number;
  ClosingValue: number;
  AverageCost: number;
  Status?: string;
  CreatedDate?: string;
  UpdatedDate?: string;
  [key: string]: any;
}

export interface StockCardTransactionItem {
  RowNum: number;
  DocDate: string;
  DocCode: string;
  TransType: "Receipt" | "Issue" | string;
  SubType?: string;
  Description?: string;
  ReferenceNo?: string;
  ReceiptQty: number;
  ReceiptUnitPrice: number;
  ReceiptAmount: number;
  IssueQty: number;
  IssueUnitPrice: number;
  IssueAmount: number;
  RunningQty: number;
  RunningValue: number;
  [key: string]: any;
}

export interface StockCardReportData {
  WarehouseId: number;
  WarehouseCode?: string;
  WarehouseName: string;
  MaterialId: number;
  ItemCode: string;
  ItemName: string;
  UomCode: string;
  FromDate: string;
  ToDate: string;
  OpeningQty: number;
  OpeningValue: number;
  TotalReceiptQty: number;
  TotalReceiptValue: number;
  TotalIssueQty: number;
  TotalIssueValue: number;
  ClosingQty: number;
  ClosingValue: number;
  Transactions: StockCardTransactionItem[];
  [key: string]: any;
}

export interface MaterialRequisitionItem {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  availableQty: number; // Tồn khả dụng
  requestedQty: number; // SL yêu cầu
  approvedQty?: number; // SL duyệt
  issuedQty?: number;   // SL đã xuất
  unitPrice?: number;
  totalPrice?: number;
  workLocation?: string; // Vị trí thi công
  note?: string;
  orgCode?: string;     // Mã hạng mục / Orgcode
  status?: string;      // Trạng thái từng dòng
  [key: string]: any;
}

export interface MaterialRequisition {
  id: string;
  requisitionCode: string; // VD: MR-2026-10/001
  requisitionDate: string;
  expectedDate: string; // Ngày cần có vật tư
  priority: "NORMAL" | "HIGH" | "URGENT";
  projectName: string;
  workPackage?: string;
  contractorName: string;
  requesterName: string;
  requesterPhone?: string;
  warehouseId: string;
  warehouseName: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "PARTIAL_ISSUED" | "COMPLETED" | "REJECTED";
  description: string;
  approverName?: string;
  approvedDate?: string;
  rejectReason?: string;
  totalRequestedQty: number;
  totalApprovedQty: number;
  itemCount: number;
  totalEstimatedAmount?: number;
  items: MaterialRequisitionItem[];
  createdBy?: string;
  createdDate?: string;
  contractCode?: string;
  issueType?: string;
  targetName?: string;
  [key: string]: any;
}

export const MOCK_REQUISITIONS: MaterialRequisition[] = [
  {
    id: "req_1",
    requisitionCode: "MR-2026-10/001",
    requisitionDate: "2026-10-13",
    expectedDate: "2026-10-14",
    priority: "URGENT",
    projectName: "Dự án Khu đô thị Vinhomes Grand Park - Phân khu 2",
    workPackage: "Tòa S10.03 - Thi công dầm sàn tầng 12",
    contractorName: "Đội bê tông cốt thép số 1 - Đội trưởng Tuấn",
    requesterName: "KS. Nguyễn Văn Thắng",
    requesterPhone: "0912.345.678",
    warehouseId: "WH02",
    warehouseName: "Kho Dự án Vinhomes Grand Park",
    status: "PENDING",
    description: "Cấp gấp thép và phụ kiện đổ bê tông dầm sàn tầng 12 theo lịch đổ trưa mai",
    totalRequestedQty: 8560,
    totalApprovedQty: 0,
    itemCount: 3,
    totalEstimatedAmount: 141200000,
    createdBy: "thangnv",
    createdDate: "2026-10-13 08:30",
    items: [
      {
        id: "req_item_1",
        itemCode: "VT-THEP-D16",
        itemName: "Thép vằn D16 CB400-V Hòa Phát",
        unit: "Kg",
        availableQty: 18500,
        requestedQty: 5000,
        approvedQty: 0,
        issuedQty: 0,
        unitPrice: 15600,
        totalPrice: 78000000,
        workLocation: "Dầm chính D1-D4 trục A-C",
        note: "Yêu cầu cắt đúng quy cách bản vẽ",
      },
      {
        id: "req_item_2",
        itemCode: "VT-THEP-D20",
        itemName: "Thép vằn D20 CB400-V Hòa Phát",
        unit: "Kg",
        availableQty: 14200,
        requestedQty: 3500,
        approvedQty: 0,
        issuedQty: 0,
        unitPrice: 15650,
        totalPrice: 54775000,
        workLocation: "Cột góc và gia cường lỗ mở sàn",
        note: "Kiểm định mác thép đạt chuẩn",
      },
      {
        id: "req_item_3",
        itemCode: "VT-ONG-UPVC90",
        itemName: "Ống nhựa uPVC D90 C2 Bình Minh",
        unit: "Cây",
        availableQty: 600,
        requestedQty: 60,
        approvedQty: 0,
        issuedQty: 0,
        unitPrice: 145000,
        totalPrice: 8700000,
        workLocation: "Trục chờ thoát nước mưa sàn tầng 12",
        note: "Kèm keo dán ống",
      },
    ],
  },
  {
    id: "req_2",
    requisitionCode: "MR-2026-10/002",
    requisitionDate: "2026-10-12",
    expectedDate: "2026-10-13",
    priority: "HIGH",
    projectName: "Dự án Cảng HKQT Sân bay Long Thành - Gói 5.10",
    workPackage: "Đường cất hạ cánh số 1 - Phân đoạn K4",
    contractorName: "Tổng công ty Xây dựng Công trình Giao thông 1",
    requesterName: "KS. Lê Hoàng Nam",
    requesterPhone: "0988.765.432",
    warehouseId: "WH03",
    warehouseName: "Kho Dự án Sân bay Long Thành",
    status: "APPROVED",
    description: "Cấp xi măng và cốt liệu trạm trộn dã chiến phục vụ thảm bê tông xi măng đường cất hạ cánh",
    approverName: "CHT. Trần Quốc Dũng",
    approvedDate: "2026-10-12 15:30",
    totalRequestedQty: 430,
    totalApprovedQty: 430,
    itemCount: 3,
    totalEstimatedAmount: 79000000,
    createdBy: "namlh",
    createdDate: "2026-10-12 10:15",
    items: [
      {
        id: "req_item_4",
        itemCode: "VT-XM-PC40",
        itemName: "Xi măng Hà Tiên PCB40 đóng bao 50kg",
        unit: "Bao",
        availableQty: 1200,
        requestedQty: 300,
        approvedQty: 300,
        issuedQty: 0,
        unitPrice: 88000,
        totalPrice: 26400000,
        workLocation: "Trạm trộn bê tông dã chiến số 2",
        note: "Bao bì nguyên vẹn, không vón cục",
      },
      {
        id: "req_item_5",
        itemCode: "VT-CAT-VANG",
        itemName: "Cát vàng hạt lớn bê tông",
        unit: "m3",
        availableQty: 450,
        requestedQty: 50,
        approvedQty: 50,
        issuedQty: 0,
        unitPrice: 380000,
        totalPrice: 19000000,
        workLocation: "Bãi tập kết trạm trộn số 2",
        note: "Độ ẩm tiêu chuẩn < 5%",
      },
      {
        id: "req_item_6",
        itemCode: "VT-DA-1X2",
        itemName: "Đá 1x2 xanh Biên Hòa",
        unit: "m3",
        availableQty: 320,
        requestedQty: 80,
        approvedQty: 80,
        issuedQty: 0,
        unitPrice: 420000,
        totalPrice: 33600000,
        workLocation: "Bãi tập kết trạm trộn số 2",
        note: "Đá sàng sạch không lẫn tạp chất",
      },
    ],
  },
  {
    id: "req_3",
    requisitionCode: "MR-2026-10/003",
    requisitionDate: "2026-10-10",
    expectedDate: "2026-10-11",
    priority: "NORMAL",
    projectName: "Khu Đô Thị Starlake Tây Hồ - Tháp Văn Phòng T1",
    workPackage: "Hệ thống cơ điện M&E - Tầng hầm B1, B2",
    contractorName: "Công ty CP Cơ Điện REE",
    requesterName: "KS. Phạm Minh Quân",
    requesterPhone: "0903.112.233",
    warehouseId: "WH05",
    warehouseName: "Kho Miền Bắc - KĐT Starlake Tây Hồ",
    status: "PARTIAL_ISSUED",
    description: "Cấp cáp điện động lực và aptomat tổng cho tủ phân phối tầng hầm B1",
    approverName: "Trưởng ban QLDA Vũ Tuấn Kiệt",
    approvedDate: "2026-10-10 16:00",
    totalRequestedQty: 420,
    totalApprovedQty: 420,
    itemCount: 2,
    totalEstimatedAmount: 83800000,
    createdBy: "quanpm",
    createdDate: "2026-10-10 14:00",
    items: [
      {
        id: "req_item_7",
        itemCode: "VT-CAP-CXV4X16",
        itemName: "Cáp điện lực hạ thế Cadivi CXV 4x16 mm2",
        unit: "Mét",
        availableQty: 850,
        requestedQty: 400,
        approvedQty: 400,
        issuedQty: 200,
        unitPrice: 165000,
        totalPrice: 66000000,
        workLocation: "Trục thang máng cáp hầm B1 kéo về tủ MSB",
        note: "Đã xuất đợt 1 200m ngày 11/10",
      },
      {
        id: "req_item_8",
        itemCode: "VT-MCB-3P50A",
        itemName: "Aptomat khối MCCB 3P 50A 25kA Schneider",
        unit: "Cái",
        availableQty: 45,
        requestedQty: 20,
        approvedQty: 20,
        issuedQty: 20,
        unitPrice: 890000,
        totalPrice: 17800000,
        workLocation: "Tủ điện DB-B1A và DB-B1B",
        note: "Đã xuất đủ 20 cái",
      },
    ],
  },
  {
    id: "req_4",
    requisitionCode: "MR-2026-10/004",
    requisitionDate: "2026-10-08",
    expectedDate: "2026-10-09",
    priority: "NORMAL",
    projectName: "Dự án Khu đô thị Vinhomes Grand Park - Phân khu 2",
    workPackage: "Sơn bả hoàn thiện khối Shophouse D1-D5",
    contractorName: "Đội thi công hoàn thiện - Minh Phát",
    requesterName: "KTV. Nguyễn Văn Hùng",
    requesterPhone: "0977.654.321",
    warehouseId: "WH02",
    warehouseName: "Kho Dự án Vinhomes Grand Park",
    status: "COMPLETED",
    description: "Cấp sơn lót chống kiềm ngoài trời thi công dãy nhà Shophouse D2",
    approverName: "Chỉ huy phó Nguyễn Đình Trọng",
    approvedDate: "2026-10-08 17:00",
    totalRequestedQty: 25,
    totalApprovedQty: 25,
    itemCount: 1,
    totalEstimatedAmount: 46250000,
    createdBy: "hungnv",
    createdDate: "2026-10-08 11:20",
    items: [
      {
        id: "req_item_9",
        itemCode: "VT-SON-DULUX-WT",
        itemName: "Sơn lót chống kiềm ngoài trời Dulux Weathershield 18L",
        unit: "Thùng",
        availableQty: 80,
        requestedQty: 25,
        approvedQty: 25,
        issuedQty: 25,
        unitPrice: 1850000,
        totalPrice: 46250000,
        workLocation: "Mặt ngoài Shophouse D2 căn 01 đến 08",
        note: "Xuất phiếu PXK-2026-10/009 hoàn tất",
      },
    ],
  },
  {
    id: "req_5",
    requisitionCode: "MR-2026-10/005",
    requisitionDate: "2026-10-11",
    expectedDate: "2026-10-12",
    priority: "NORMAL",
    projectName: "Kho Trung chuyển Cát Lái",
    workPackage: "Bảo dưỡng xưởng cơ khí bãi container",
    contractorName: "Tổ bảo trì thiết bị nâng hạ Cát Lái",
    requesterName: "KTV. Trần Văn Hưng",
    requesterPhone: "0934.567.890",
    warehouseId: "WH04",
    warehouseName: "Kho Trung chuyển Cát Lái",
    status: "REJECTED",
    description: "Xin cấp aptomat công suất lớn và cáp nguồn thay thế tủ điện cầu trục bãi số 3",
    approverName: "Giám đốc kho Mai Văn Lộc",
    approvedDate: "2026-10-11 16:45",
    rejectReason: "Mã thiết bị MCCB 3P 50A không đúng công suất chịu tải thực tế của cầu trục (cần 100A). Đề nghị kỹ sư khảo sát lại tải và lập phiếu yêu cầu mới.",
    totalRequestedQty: 10,
    totalApprovedQty: 0,
    itemCount: 1,
    totalEstimatedAmount: 8900000,
    createdBy: "hungtv",
    createdDate: "2026-10-11 13:10",
    items: [
      {
        id: "req_item_10",
        itemCode: "VT-MCB-3P50A",
        itemName: "Aptomat khối MCCB 3P 50A 25kA Schneider",
        unit: "Cái",
        availableQty: 45,
        requestedQty: 10,
        approvedQty: 0,
        issuedQty: 0,
        unitPrice: 890000,
        totalPrice: 8900000,
        workLocation: "Tủ điện điều khiển cầu trục số 3",
        note: "Cần thẩm định lại công suất",
      },
    ],
  },
  {
    id: "req_6",
    requisitionCode: "MR-2026-10/006",
    requisitionDate: "2026-10-13",
    expectedDate: "2026-10-15",
    priority: "NORMAL",
    projectName: "Dự án Khu đô thị Vinhomes Grand Park - Phân khu 2",
    workPackage: "Gia công cốt thép đài móng tháp T2",
    contractorName: "Đội gia công thép số 2",
    requesterName: "KS. Hoàng Trọng Nghĩa",
    requesterPhone: "0945.678.910",
    warehouseId: "WH02",
    warehouseName: "Kho Dự án Vinhomes Grand Park",
    status: "DRAFT",
    description: "Dự trù thép D10 bẻ đai và dầm giằng móng tháp T2",
    totalRequestedQty: 4000,
    totalApprovedQty: 0,
    itemCount: 1,
    totalEstimatedAmount: 61600000,
    createdBy: "nghiahz",
    createdDate: "2026-10-13 16:40",
    items: [
      {
        id: "req_item_11",
        itemCode: "VT-THEP-D10",
        itemName: "Thép vằn D10 CB300-V Hòa Phát",
        unit: "Kg",
        availableQty: 25000,
        requestedQty: 4000,
        approvedQty: 0,
        issuedQty: 0,
        unitPrice: 15400,
        totalPrice: 61600000,
        workLocation: "Bãi gia công móng tháp T2",
        note: "Đang rà soát khối lượng bẻ đai",
      },
    ],
  },
];

