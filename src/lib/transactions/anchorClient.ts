import * as anchor from "@coral-xyz/anchor";
import idl from "../../../program/idl/privacy_pool.json";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "../../utils/wallet";
import { getRpcEndpoint } from "../network";

export function makeProgram() {
  const connection = new Connection(getRpcEndpoint(), "confirmed");
  const kp = Keypair.generate();
  const wallet = new Wallet(kp);

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  anchor.setProvider(provider);

  return new anchor.Program(idl as anchor.Idl, provider);
}
