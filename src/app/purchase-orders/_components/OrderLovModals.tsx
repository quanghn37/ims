"use client";

import React from "react";
import dynamic from "next/dynamic";

const WarehouseLovModal = dynamic(() => import("@/components/lov/WarehouseLovModal"), { ssr: false });
const ClientLovModal = dynamic(() => import("@/components/lov/ClientLovModal"), { ssr: false });
const ContractLovModal = dynamic(() => import("./ContractLovModal"), { ssr: false });
const PriceListLovModal = dynamic(() => import("./PriceListLovModal"), { ssr: false });

interface OrderLovModalsProps {
  lov: any;
  orderForm: any;
}

export default function OrderLovModals({ lov, orderForm }: OrderLovModalsProps) {
  return (
    <>
      {lov.isWarehouseLovOpen && (
        <WarehouseLovModal
          open={lov.isWarehouseLovOpen}
          onClose={() => lov.setIsWarehouseLovOpen(false)}
          warehouseList={lov.warehouseList}
          loadingWarehouses={lov.loadingWarehouses}
          warehouseSearchInput={lov.warehouseSearchInput}
          setWarehouseSearchInput={lov.setWarehouseSearchInput}
          onSearchWarehouses={(kw: string) => lov.fetchWarehouseList(kw.trim())}
          onSelectWarehouse={lov.handleSelectWarehouse}
        />
      )}

      {lov.isClientLovOpen && (
        <ClientLovModal
          open={lov.isClientLovOpen}
          onClose={() => lov.setIsClientLovOpen(false)}
          clientList={lov.clientList}
          loadingClients={lov.loadingClients}
          clientSearchInput={lov.clientSearchInput}
          setClientSearchInput={lov.setClientSearchInput}
          onSearchClients={(kw: string) => lov.fetchClientList(kw.trim())}
          onSelectClient={lov.handleSelectClient}
        />
      )}

      {lov.isContractLovOpen && (
        <ContractLovModal
          open={lov.isContractLovOpen}
          onClose={() => lov.setIsContractLovOpen(false)}
          contractList={lov.contractRefList}
          loadingContracts={lov.loadingContractRef}
          contractSearchInput={lov.contractSearchInput}
          setContractSearchInput={lov.setContractSearchInput}
          onSearchContracts={(kw: string) =>
            lov.fetchContractRefList(kw.trim(), orderForm.getFieldValue("ClientId"))
          }
          onSelectContract={lov.handleSelectContract}
        />
      )}

      {lov.isPriceListLovOpen && (
        <PriceListLovModal
          open={lov.isPriceListLovOpen}
          onClose={() => lov.setIsPriceListLovOpen(false)}
          priceList={lov.priceListRefList}
          loadingPriceList={lov.loadingPriceListRef}
          priceListSearchInput={lov.priceListSearchInput}
          setPriceListSearchInput={lov.setPriceListSearchInput}
          onSearchPriceList={(kw: string) =>
            lov.fetchPriceListRefList(
              kw.trim(),
              orderForm.getFieldValue("ClientId"),
              orderForm.getFieldValue("ParentId")
            )
          }
          onSelectPriceList={lov.handleSelectPriceList}
        />
      )}
    </>
  );
}
