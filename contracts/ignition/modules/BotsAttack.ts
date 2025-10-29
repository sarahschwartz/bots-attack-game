import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BotsAttackModule", (m) => {
  const game = m.contract("BotsAttack");
  return { game };
});
