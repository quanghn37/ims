export interface IpcMaterialItem {
  id: string | number;
  ReceiptCode: string;
  ReceiptDate?: string;
  OrgCode?: string;
  OrgName?: string;
  MaterialCode: string;
  MaterialName: string;
  Unit: string;
  InvoiceQty: number;
  UnitPrice: number;
  Amount: number;
  TaxRate?: number | string;
  TotalAmount?: number;
  InvoiceNo?: string;
  InvoiceDate?: string;
  InvoiceSymbol?: string;
  PoCode?: string;
}

export interface IpcRecord {
  IpcId: string;
  PaymentId?: number | string;
  ContractId: string | number;
  ContractCode: string;
  OwnerContractCode?: string;
  VendorName: string;
  DocDate: string;
  PaymentDate?: string;
  PaymentTerms?: string;
  IsEContract?: boolean;
  Description: string;
  ProposedAmount: number;
  ApprovedAmount: number | null;
  Status: number | string;
  StatusName: string;
  CurrentAssignee: string | null;
  Items?: IpcMaterialItem[];
  RaciSteps?: any[];
  POCode?: string;
  POName?: string;
  CreatedBy?: string;
  CreatedDate?: string;
  ContractName?: string;
  ApprovalStatus?: string;
  raw?: any;
}

export interface IpcDetailItem {
  id: string | number;
  isSectionHeader?: boolean;
  Type?: string | null;
  SubmissionId?: number | null;
  WBS?: string | null;
  PaymentDate?: string | null;
  WorkName: string;
  WorkCat?: string | null;
  Unit?: string | null;
  Qnty?: number | null;
  UnitPrice?: number | null;
  Amount?: number | null;
  TaxRate?: number | string | null;
  TaxAmount?: number | null;
  Total?: number | null;
  Remarks?: string | null;
  VATInvoice?: string | null;
  P_ApprovedAmount?: number | null;
  P_TaxAmount?: number | null;
  P_TotalAmount?: number | null;
  Warning?: string | null;
  OrgCode?: string;
  OrgName?: string;
  MaterialName?: string;
  MaterialCode?: string;
  InvoiceQty?: number | null;
  TotalAmount?: number | null;
  ReceiptCode?: string;
  ReceiptNo?: string;
  InvoiceNo?: string;
  InvoiceDate?: string;
  PoCode?: string;
  PO?: string;
}

export interface IpcTaxItem {
  id?: string | number;
  Invoice?: string | null;
  Amount?: number | null;
  TaxAmount?: number | null;
  TotalAmount?: number | null;
  [key: string]: any;
}

export interface PaymentPrepItem {
  id: string | number;
  ContractId: string | number;
  ContractCode: string;
  OrgCode: string;
  OrgName: string;
  ReceiptDate: string;
  ReceiptCode: string;
  MaterialId?: string | number;
  MaterialCode: string;
  MaterialName: string;
  Unit: string;
  ProposedQty: number;
  ApprovedQty: number;
  UnitPrice: number;
  InvoiceQty: number;
  Amount: number;
  ReceiptStatus: string;
  ReceiptStatusCode: number;
  WorkType?: string;
  WBS?: string;
  Code?: string;
  SubmissionDate?: string;
  ItemCode?: string;
  WorkName?: string;
  SubmissionName?: string;
  SubmissionId?: number | string;
  TransactionId?: number | string;
  DocNo?: string;
  ApprovedReceiptQnty?: number;
  InvoicedQnty?: number;
  SubmittedQnty?: number;
  SubmittedUnitPrice?: number;
  SubmittedAmount?: number;
  ApprovedQnty?: number;
  ApprovedUnitPrice?: number;
  ApprovedAmount?: number;
  RemarksOnApproval?: string | null;
  ApprovedWorkCat?: string;
  BillQnty?: number;
}

export interface FinancialKpiSummary {
  performed: number;
  added: number;
  deducted: number;
  payable: number;
}
