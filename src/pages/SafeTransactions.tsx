import { type Address } from "viem";
import { NewTransaction } from "../components/NewTransaction";
import { PendingTxList } from "../components/PendingTxList";
import { useSafeInfo } from "../lib/useSafeInfo";

export function SafeTransactions({ safe }: { safe: Address }) {
  const { owners, threshold, nonce } = useSafeInfo(safe);
  return (
    <>
      <h1 className="page-title">Transactions</h1>
      <p className="page-sub">Propose, sign, and execute multisig transactions.</p>

      {nonce !== undefined && <NewTransaction safeAddress={safe} nonce={nonce} />}
      <PendingTxList safeAddress={safe} threshold={threshold} owners={owners} />
    </>
  );
}
