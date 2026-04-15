import { useBalance, useReadContracts } from "wagmi";
import { safeAbi } from "../abis/safe";
export function useSafeInfo(safe) {
    const { data: balance } = useBalance({ address: safe });
    const { data, isLoading } = useReadContracts({
        contracts: [
            { address: safe, abi: safeAbi, functionName: "getOwners" },
            { address: safe, abi: safeAbi, functionName: "getThreshold" },
            { address: safe, abi: safeAbi, functionName: "nonce" },
        ],
    });
    return {
        owners: data?.[0].result,
        threshold: data?.[1].result,
        nonce: data?.[2].result,
        balance,
        isLoading,
    };
}
