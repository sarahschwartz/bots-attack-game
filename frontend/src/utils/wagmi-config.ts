import { createWalletClient, custom } from "viem";
import { createConfig } from "wagmi";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const myWindow = window as any;

export const wagmiConfig = createConfig({
  chains: [
    {
      id: 48243,
      name: "Battleship Chain",
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ['http://localhost:3050'],
        },
      },
    },
  ],
  ssr: true,
  client: ({ chain }) =>
    createWalletClient({
      chain,
      transport: custom(myWindow.ethereum!),
    }),
});
