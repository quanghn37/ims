export interface UserSession {
  LogIn: string;
  Email?: string;
  FullName?: string;
  SessionId: string;
  Language: string;
  ClientId?: number | string | null;
  JobTitle?: string;
  IsActive?: string;
  Avatar?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  status?: string;
  data?: T;
  message?: string;
  [key: string]: any;
}

export interface ContractItem {
  ContractId: number | string;
  ContractType: "quotation" | "purchase_order" | "Sub_contract" | string;
  S_Type?: string;
  s_type?: string;
  ContractCategory?: string;
  Description?: string;
  FromDate?: string;
  ToDate?: string;
  StartDate?: string;
  EndDate?: string;
  ContractDate?: string;
  Contractdate?: string;
  ContractCode?: string;
  MainContractId?: number | string;
  SubconOf?: number | string;
  MasterContract?: string;
  MasterContractCode?: string;
  ParentContractCode?: string;
  ParentContractId?: number | string;
  Currency?: string;
  ClientId?: number | string;
  ClientID?: number | string;
  ClientName?: string;
  Venname?: string;
  CreatedBy?: string;
  WSId?: string;
  TotalAmount?: number;
  Status?: string;
  StatusName?: string;
  StatusCode?: number | string;
  CurrentAssignee?: string;
  CurrentRole?: string;
  WarehouseId?: number | string;
  WarehouseName?: string;
  Editable?: number | string | boolean;
  TaskAssign?: string;
  [key: string]: any;
}

export interface SubmissionItem {
  SubmissionId?: number | string;
  LocalId?: number | string;
  MaterialId?: number | string;
  ItemId?: number | string;
  ItemName?: string;
  ItemCode?: string;
  ItemDate?: string;
  UnitPrice: number;
  Qnty: number;
  TaxRate: number;
  Remarks?: string;
  Stage?: "plan" | "processing" | "approved" | string;
  ApprovalDecision?: "Duyệt" | "Từ chối" | "Chờ duyệt" | string;
  ContractId?: number | string;
  AssignmentId?: number | string;
  WorkType?: string;
  [key: string]: any;
}

export interface ClientUser {
  LogIn: string;
  Email: string;
  FullName: string;
  Account?: string;
  JobTitle?: string;
  PhoneDirect?: string;
  Phone?: string;
  IsActive: "Yes" | "No" | string;
  IsPrimary?: "Yes" | "No" | string;
  Sex?: "Male" | "Female" | string;
  BirthDay?: string;
  Address?: string;
  ClientId?: number | string | null;
  NativeLanguage?: string;
}
