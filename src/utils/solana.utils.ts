import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export { sol } from "@zkprivacysol/sdk-core";

export const lamportsToSol = (lamports: bigint): number => {
  return Number(lamports) / LAMPORTS_PER_SOL;
};
