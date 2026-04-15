import { useBalance, useReadContracts } from "wagmi";
import { type Address } from "viem";
import { safeAbi } from "../abis/safe";

export function useSafeInfo(safe: Address) {
  const { data: balance } = useBalance({ address: safe });
  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: safe, abi: safeAbi, functionName: "getOwners" },
      { address: safe, abi: safeAbi, functionName: "getThreshold" },
      { address: safe, abi: safeAbi, functionName: "nonce" },
    ],
  });
  return {
    owners: data?.[0].result as Address[] | undefined,
    threshold: data?.[1].result as bigint | undefined,
    nonce: data?.[2].result as bigint | undefined,
    balance,
    isLoading,
  };
}
