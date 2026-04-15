import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { APP_NAME, SUPPORTED_CHAINS, WALLETCONNECT_PROJECT_ID } from "./config";
export const wagmiConfig = getDefaultConfig({
    appName: APP_NAME,
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: SUPPORTED_CHAINS,
    ssr: false,
});
