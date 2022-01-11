import { Token as SafeToken, TOKEN_PROGRAM_ID as SAFE_TOKEN_PROGRAM_ID, u64 as SafecoinU64 } from "@safecoin/safe-token";
import { Token as SplToken, TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID, u64 as SolanaU64 } from "@solana/spl-token";
import { Connection as SafecoinConnection, PublicKey as SafecoinPublicKey, Transaction as SafecoinTransaction } from "@safecoin/web3.js";
import { Connection as SolanaConnection, PublicKey as SolanaPublicKey, Transaction as SolanaTransaction } from "@solana/web3.js";
import { ixFromRustSafecoin } from "../safecoin";
import { ixFromRustSolana } from "../solana";
import { importMigrationWasm as importMigrationSafecoinWasm } from "../safecoin/wasm";
import { importMigrationWasm as importMigrationSolanaWasm } from "../solana/wasm";

export async function migrateSafecoinTokens(
  connection: SafecoinConnection,
  payerAddress: string,
  program_id: string,
  from_mint: string,
  to_mint: string,
  input_token_account: string,
  output_token_account: string,
  amount: BigInt
) {
  const { authority_address, migrate_tokens } = await importMigrationSafecoinWasm();
  const approvalIx = SafeToken.createApproveInstruction(
    SAFE_TOKEN_PROGRAM_ID,
    new SafecoinPublicKey(input_token_account),
    new SafecoinPublicKey(authority_address(program_id)),
    new SafecoinPublicKey(payerAddress),
    [],
    new SafecoinU64(amount.toString(16), 16)
  );
  const ix = ixFromRustSafecoin(
    migrate_tokens(
      program_id,
      from_mint,
      to_mint,
      input_token_account,
      output_token_account,
      amount
    )
  );
  const transaction = new SafecoinTransaction().add(approvalIx, ix);
  const { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = new SafecoinPublicKey(payerAddress);
  return transaction;
}

export async function migrateSolanaTokens(
  connection: SolanaConnection,
  payerAddress: string,
  program_id: string,
  from_mint: string,
  to_mint: string,
  input_token_account: string,
  output_token_account: string,
  amount: BigInt
) {
  const { authority_address, migrate_tokens } = await importMigrationSolanaWasm();
  const approvalIx = SplToken.createApproveInstruction(
    SPL_TOKEN_PROGRAM_ID,
    new SolanaPublicKey(input_token_account),
    new SolanaPublicKey(authority_address(program_id)),
    new SolanaPublicKey(payerAddress),
    [],
    new SolanaU64(amount.toString(16), 16)
  );
  const ix = ixFromRustSolana(
    migrate_tokens(
      program_id,
      from_mint,
      to_mint,
      input_token_account,
      output_token_account,
      amount
    )
  );
  const transaction = new SolanaTransaction().add(approvalIx, ix);
  const { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = new SolanaPublicKey(payerAddress);
  return transaction;
}
