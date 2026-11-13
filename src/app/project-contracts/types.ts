export interface MainContractItem {
  ContractId: number;
  ContractCode: string;
  ContractDate?: string;
  StartDate?: string;
  EndDate?: string;
  CreatedDate?: string;
  ModifiedDate?: string;
  ActualStart?: string;
  Description?: string;
  ClientID?: number;
  TaxID?: string;
  CompanyName?: string;
  CreatedBy?: string;
  StatusCode?: number;
  StatusName?: string;
  CurrentAssignee?: string;
  [key: string]: any;
}

export interface ProjectContractItem {
  ContractId: number;
  Description?: string;
  ClientID?: number;
  Venname?: string;
  ContractCode: string;
  ContractType?: string;
  Contractdate?: string;
  SubconOf?: number;
  S_Type?: string;
  CreatedDate?: string;
  ModifiedDate?: string;
  MasterContract?: string | null;
  SourceId?: string | number | null;
  StartDate?: string;
  EndDate?: string;
  CreatedBy?: string;
  QuotationCode?: string | null;
  MainCode?: string;
  ContractedAmount?: number;
  PayTerms?: string | null;
  IsVContract?: boolean | null;
  VContractStatus?: string | null;
  IsAddendum?: string | boolean | null;
  StatusCode?: number;
  StatusName?: string;
  CurrentAssignee?: string;
  [key: string]: any;
}

export interface GetContractsParams {
  Language?: string;
  LogIn?: string;
  SessionId?: string;
  DisplayMode?: string;
  WSId?: string;
  PageNum?: number;
  PageSize?: number;
  Keyword?: string;
  [key: string]: any;
}
