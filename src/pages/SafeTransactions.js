import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { NewTransaction } from "../components/NewTransaction";
import { PendingTxList } from "../components/PendingTxList";
import { useSafeInfo } from "../lib/useSafeInfo";
export function SafeTransactions({ safe }) {
    const { owners, threshold, nonce } = useSafeInfo(safe);
    return (_jsxs(_Fragment, { children: [_jsx("h1", { className: "page-title", children: "Transactions" }), _jsx("p", { className: "page-sub", children: "Propose, sign, and execute multisig transactions." }), nonce !== undefined && _jsx(NewTransaction, { safeAddress: safe, nonce: nonce }), _jsx(PendingTxList, { safeAddress: safe, threshold: threshold, owners: owners })] }));
}
