// src/lib/getUpdateData.ts
type BalanceType = "IDR" | "USD" | "USD_CENT";

interface Currencys {
  idr_balance?: number;
  usd_balance?: number;
  usd_cent_balance?: number;
}

export function getUpdateData(
  balanceType: BalanceType,
  currentUser: Currencys,
  resultBalance: number
): Record<string, number> {
  let updateData: Record<string, number> = {};

  if (balanceType === "IDR") {
    updateData = {
      idr_balance: (currentUser.idr_balance || 0) + resultBalance,
    };
  } else if (balanceType === "USD") {
    updateData = {
      usd_balance: (currentUser.usd_balance || 0) + resultBalance,
    };
  } else if (balanceType === "USD_CENT") {
    updateData = {
      usd_cent_balance: (currentUser.usd_cent_balance || 0) + resultBalance,
    };
  }

  return updateData;
}
