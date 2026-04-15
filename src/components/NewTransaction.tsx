import { useState } from "react";
import { type Address, type Hex, isAddress, parseEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { safeAbi } from "../abis/safe";
import { buildSafeTx, toStored } from "../lib/safe";
import { createPending } from "../lib/storage";

interface Props {
  safeAddress: Address;
  nonce: bigint;
}

export function NewTransaction({ safeAddress, nonce }: Props) {
  const { chain } = useAccount();
  const pub = usePublicClient();
  const [to, setTo] = useState("");
  const [value, setValue] = useState("0");
  const [data, setData] = useState<string>("0x");
  const [status, setStatus] = useState("");

  async function propose() {
    if (!pub || !chain) return;
    if (!isAddress(to)) return setStatus("Invalid `to` address");
    const tx = buildSafeTx({
      to: to as Address,
      value: parseEther(value || "0"),
      data: (data || "0x") as Hex,
      nonce,
    });
    const safeTxHash = (await pub.readContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: "getTransactionHash",
      args: [
        tx.to, tx.value, tx.data, tx.operation,
        tx.safeTxGas, tx.baseGas, tx.gasPrice,
        tx.gasToken, tx.refundReceiver, tx.nonce,
      ],
    })) as Hex;
    await createPending(
      toStored(tx, { safeAddress, chainId: chain.id, safeTxHash }),
    );
    setStatus(`Proposed: ${safeTxHash}`);
    setTo(""); setValue("0"); setData("0x");
  }

  return (
    <div className="card">
      <h3>New Transaction</h3>
      <label>Recipient</label>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." />
      <div className="grid-2">
        <div>
          <label>Value (ETH)</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div>
          <label>Data (hex)</label>
          <input value={data} onChange={(e) => setData(e.target.value)} placeholder="0x" />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button onClick={propose}>Propose</button>
        {status && <p className="status-text" style={{ margin: 0 }}>{status}</p>}
      </div>
    </div>
  );
}
