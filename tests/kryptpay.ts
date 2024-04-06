// import * as anchor from "@project-serum/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@project-serum/anchor"
import {
  Keypair,
  PublicKey,
  Connection,
  clusterApiUrl
} from "@solana/web3.js";
import { expect } from "chai";
import {
  createMint,
  mintTo,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Kryptpay } from "../target/types/kryptpay";
import dotenv from 'dotenv'
dotenv.config()

const connection = new Connection(
  clusterApiUrl('devnet'),
  'confirmed'
);

describe("Transfer Tokens", async () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Kryptpay as Program<Kryptpay>

  const senderPublicKey = provider.wallet.publicKey
  
  // const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
  //   [Buffer.from("mint")],
  //   program.programId
  // )

  // create keypairs
  const keyPairString: string | undefined = process.env.KEY_PAIR;
  let senderKeyPair: anchor.web3.Keypair | anchor.web3.Signer;
  if (keyPairString) {
      const keyPairBytes: number[] = keyPairString.split(",").map((value) => parseInt(value, 10));
      const seed: Uint8Array = new Uint8Array(keyPairBytes.slice(0, 32));
      senderKeyPair = Keypair.fromSeed(seed);
    } else {
      console.error("Environment variable KEY_PAIR is not set.");
  } 

  console.log("testing..")

  it("It should transfer lamport", async () => {
      // Generate keypair for the new account
    const newAccountKp = new Keypair();
    // Send transaction
    const data = new anchor.BN(1000000);
    const txHash = await program.methods
      .transferLamports(data)
      .accounts({
        from: senderPublicKey,
        to: newAccountKp.publicKey,
      })
      .signers([senderKeyPair])
      .rpc();
    console.log(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

    const newAccountBalance = await program.provider.connection.getBalance(
      newAccountKp.publicKey
    );
    console.log(newAccountBalance)
    expect(newAccountBalance === data.toNumber())

  })

  it("transferSplTokens", async () => {
    // Generate keypairs for the new accounts
    const fromKp = senderKeyPair;
    const toKp = new Keypair();

    // Create a new mint and initialize it
    const mintKp = new Keypair();
    const mint = await createMint(
      provider.connection,
      senderKeyPair,
      fromKp.publicKey,
      null,
      0
    );

    // const tokenAccount = await getAssociatedTokenAddress(
    //   mint,
    //   provider.wallet.publicKey
    // )

    // Create associated token accounts for the new accounts
    const fromAta = await createAssociatedTokenAccount(
      connection,
      senderKeyPair,
      mint,
      fromKp.publicKey
    );
    const toAta = await createAssociatedTokenAccount(
      connection,
      senderKeyPair,
      mint,
      toKp.publicKey
    );
    // Mint tokens to the 'from' associated token account
    const mintAmount = 1000;
    await mintTo(
      connection,
      senderKeyPair,
      mint,
      fromAta,
      senderPublicKey,
      mintAmount
    );

    // Send transaction
    const transferAmount = new anchor.BN(500);
    const txHash = await program.methods
      .transferSplTokens(transferAmount)
      .accounts({
        from: fromKp.publicKey,
        fromAta: fromAta,
        toAta: toAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([senderKeyPair, fromKp])
      .rpc();
    console.log(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    const toTokenAccount = await connection.getTokenAccountBalance(toAta);
    expect(toTokenAccount.value.uiAmount === transferAmount.toNumber())

  });
});