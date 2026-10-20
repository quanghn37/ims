"use client";

import React from "react";
import MainContractLovModal from "@/components/lov/MainContractLovModal";
import ClientLovModal from "@/components/lov/ClientLovModal";
import WarehouseLovModal from "@/components/lov/WarehouseLovModal";
import { useRequisitionLov } from "../_hooks/useRequisitionLov";

interface RequisitionLovModalsProps {
  lov: ReturnType<typeof useRequisitionLov>;
}

export default function RequisitionLovModals({ lov }: RequisitionLovModalsProps) {
  return (
    <>
      {/* LOV Hợp đồng Chủ Đầu Tư Modal */}
      {lov.isMainContractLovOpen && (
        <MainContractLovModal
          open={lov.isMainContractLovOpen}
          onClose={() => lov.setIsMainContractLovOpen(false)}
          mainContractList={lov.mainContractList}
          loadingMainContracts={lov.loadingMainContracts}
          mainContractSearchInput={lov.mainContractSearchInput}
          setMainContractSearchInput={lov.setMainContractSearchInput}
          onSearchMainContracts={(keyword) =>
            lov.fetchMainContracts(keyword.trim(), 1, lov.mainContractPagination.pageSize)
          }
          onSelectMainContract={lov.handleSelectMainContract}
          pagination={lov.mainContractPagination}
          onPageChange={(page, pageSize) =>
            lov.fetchMainContracts(lov.mainContractSearchInput.trim(), page, pageSize)
          }
        />
      )}

      {/* LOV Đối Tượng Modal */}
      {lov.isClientLovOpen && (
        <ClientLovModal
          open={lov.isClientLovOpen}
          onClose={() => lov.setIsClientLovOpen(false)}
          clientList={lov.clientList}
          loadingClients={lov.loadingClients}
          clientSearchInput={lov.clientSearchInput}
          setClientSearchInput={lov.setClientSearchInput}
          onSearchClients={(keyword) => lov.fetchClientList(keyword.trim())}
          onSelectClient={lov.handleSelectClient}
        />
      )}

      {/* LOV Kho Xuất Modal */}
      {lov.isWarehouseLovOpen && (
        <WarehouseLovModal
          open={lov.isWarehouseLovOpen}
          onClose={() => lov.setIsWarehouseLovOpen(false)}
          warehouseList={lov.warehouseList}
          loadingWarehouses={lov.loadingWarehouses}
          warehouseSearchInput={lov.warehouseSearchInput}
          setWarehouseSearchInput={lov.setWarehouseSearchInput}
          onSearchWarehouses={(keyword) => lov.fetchWarehouseList(keyword.trim())}
          onSelectWarehouse={lov.handleSelectWarehouse}
        />
      )}
    </>
  );
}
