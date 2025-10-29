# Prividium Game Demo

🚧 Under construction

This game is intended for a [Prividium](https://docs.zksync.io/zk-stack/prividium/overview) chain, where the contract state is private.

## Running locally

Setup a local Prividium chain by following [this guide](https://docs.zksync.io/zk-stack/prividium/run-prividium-chain).

Then, compile and deploy the game contract in the `contracts` folder:

```bash
cd contracts
bun install
bun compile
bun deploy:game
```

In the frontend folder, update the contract address in the `src/utils/constants.ts` file.
Also, update the chain information in the `src/utils/wagmi-config.ts` file.

Then, start the frontend with:

```bash
cd frontend
bun install
bun dev
```
