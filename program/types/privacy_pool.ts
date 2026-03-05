/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/privacy_pool.json`.
 */
export type PrivacyPool = {
  address: "GYy4kM6GHhpgLCUscuABbzkD2ZbJ2fneYryaZ6Ch7fFU";
  metadata: {
    name: "privacyPool";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "addMerkleTree";
      discriminator: [199, 97, 38, 35, 140, 113, 187, 30];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "noteTree";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  111,
                  116,
                  101,
                  95,
                  116,
                  114,
                  101,
                  101,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "arg";
                path: "treeId";
              },
            ];
          };
        },
        {
          name: "relayer";
          docs: [
            "Relayer who can add trees (must be registered in config.relayers)",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "mintAddress";
          type: "pubkey";
        },
        {
          name: "treeId";
          type: "u16";
        },
      ];
    },
    {
      name: "addRelayer";
      discriminator: [184, 240, 94, 199, 19, 71, 21, 192];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "admin";
          docs: [
            "has_one = admin ensures this matches config.admin.",
            "When using Squads, the vault PDA signs after multisig approval.",
          ];
          signer: true;
          relations: ["config"];
        },
      ];
      args: [
        {
          name: "mintAddress";
          type: "pubkey";
        },
        {
          name: "newRelayer";
          type: "pubkey";
        },
      ];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "noteTree";
          docs: ["Initial tree (tree_id = 0)"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  111,
                  116,
                  101,
                  95,
                  116,
                  114,
                  101,
                  101,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "const";
                value: [0, 0];
              },
            ];
          };
        },
        {
          name: "nullifiers";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  115,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "admin";
          docs: [
            "When using Squads multisig, this should be the vault PDA.",
            "Squads will sign this account after multisig approval.",
          ];
          signer: true;
        },
        {
          name: "payer";
          docs: [
            "Transaction fee payer (can be anyone, separate from admin authority)",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "feeBps";
          type: "u16";
        },
        {
          name: "mintAddress";
          type: "pubkey";
        },
        {
          name: "minDepositAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "maxDepositAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "minWithdrawAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "maxWithdrawAmount";
          type: {
            option: "u64";
          };
        },
      ];
    },
    {
      name: "initializeGlobalConfig";
      discriminator: [113, 216, 122, 131, 225, 209, 22, 55];
      accounts: [
        {
          name: "globalConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  49,
                ];
              },
            ];
          };
        },
        {
          name: "admin";
          docs: ["When using Squads multisig, this should be the vault PDA."];
          signer: true;
        },
        {
          name: "payer";
          docs: [
            "Transaction fee payer (can be anyone, separate from admin authority)",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "transact";
      docs: [
        "Unified UTXO transaction instruction",
        "Circuit equation: sumIns + publicAmount = sumOuts",
        "Handles deposits (publicAmount > 0), withdrawals (publicAmount < 0), and transfers (publicAmount = 0)",
        "",
        "Cross-tree transactions:",
        "- input_tree_id: Tree containing input notes (for root validation)",
        "- output_tree_id: Tree for new output commitments",
        "- Can be the same tree or different trees",
        "- Allows withdrawals even when input tree is full (outputs go to new tree)",
      ];
      discriminator: [217, 149, 130, 143, 221, 52, 252, 119];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "globalConfig";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  49,
                ];
              },
            ];
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "inputTree";
          docs: [
            "Input tree - where input notes came from (for root validation)",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  111,
                  116,
                  101,
                  95,
                  116,
                  114,
                  101,
                  101,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "arg";
                path: "inputTreeId";
              },
            ];
          };
        },
        {
          name: "outputTree";
          docs: ["Output tree - where new output commitments will be inserted"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  111,
                  116,
                  101,
                  95,
                  116,
                  114,
                  101,
                  101,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "arg";
                path: "outputTreeId";
              },
            ];
          };
        },
        {
          name: "nullifiers";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  115,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "nullifierMarker0";
          docs: [
            "First nullifier marker (must not exist for withdrawals - ensures nullifier is fresh)",
            "For deposits (public_amount > 0), this should be the zero nullifier marker (reusable)",
            "NOTE: Nullifier markers are global (no tree_id) to prevent cross-tree double-spend",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "arg";
                path: "inputNullifier0";
              },
            ];
          };
        },
        {
          name: "nullifierMarker1";
          docs: [
            "Second nullifier marker (must not exist for withdrawals - ensures nullifier is fresh)",
            "For deposits (public_amount > 0), this should be the zero nullifier marker (reusable)",
            "NOTE: Nullifier markers are global (no tree_id) to prevent cross-tree double-spend",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "arg";
                path: "inputNullifier1";
              },
            ];
          };
        },
        {
          name: "relayer";
          docs: ["Relayer who submits transaction (pays rent, receives fee)"];
          writable: true;
          signer: true;
        },
        {
          name: "recipient";
          docs: ["Recipient (receives withdrawal amount if public_amount > 0)"];
          writable: true;
        },
        {
          name: "vaultTokenAccount";
          docs: ["Vault's token account (ATA for mint_address)"];
          writable: true;
        },
        {
          name: "userTokenAccount";
          docs: ["User's token account (for deposits)"];
          writable: true;
        },
        {
          name: "recipientTokenAccount";
          docs: ["Recipient's token account (for withdrawals)"];
          writable: true;
        },
        {
          name: "relayerTokenAccount";
          docs: ["Relayer's token account (for fees)"];
          writable: true;
        },
        {
          name: "tokenProgram";
          docs: ["SPL Token program"];
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "inputTreeId";
          type: "u16";
        },
        {
          name: "outputTreeId";
          type: "u16";
        },
        {
          name: "publicAmount";
          type: "i64";
        },
        {
          name: "extDataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "mintAddress";
          type: "pubkey";
        },
        {
          name: "inputNullifier0";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "inputNullifier1";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "outputCommitment0";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "outputCommitment1";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "deadline";
          type: "i64";
        },
        {
          name: "extData";
          type: {
            defined: {
              name: "extData";
            };
          };
        },
        {
          name: "proof";
          type: {
            defined: {
              name: "transactionProof";
            };
          };
        },
      ];
    },
    {
      name: "transactSwap";
      docs: [
        "Atomic cross-pool private swap",
        "Consumes notes from source pool, swaps via Raydium CPMM (no Serum), creates notes in dest pool",
        "All in one transaction - see swap.rs for implementation details",
      ];
      discriminator: [36, 133, 230, 184, 198, 10, 202, 249];
      accounts: [
        {
          name: "sourceConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "sourceMint";
              },
            ];
          };
        },
        {
          name: "globalConfig";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  49,
                ];
              },
            ];
          };
        },
        {
          name: "sourceVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "sourceMint";
              },
            ];
          };
        },
        {
          name: "sourceTree";
          docs: ["Source tree - where input notes came from"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  111,
                  116,
                  101,
                  95,
                  116,
                  114,
                  101,
                  101,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "sourceMint";
              },
              {
                kind: "arg";
                path: "sourceTreeId";
              },
            ];
          };
        },
        {
          name: "sourceNullifiers";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  115,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "sourceMint";
              },
            ];
          };
        },
        {
          name: "sourceNullifierMarker0";
          docs: [
            "First nullifier marker for source pool",
            "NOTE: Nullifier markers are global (no tree_id) to prevent cross-tree double-spend",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "sourceMint";
              },
              {
                kind: "arg";
                path: "inputNullifier0";
              },
            ];
          };
        },
        {
          name: "sourceNullifierMarker1";
          docs: [
            "Second nullifier marker for source pool",
            "NOTE: Nullifier markers are global (no tree_id) to prevent cross-tree double-spend",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "sourceMint";
              },
              {
                kind: "arg";
                path: "inputNullifier1";
              },
            ];
          };
        },
        {
          name: "sourceVaultTokenAccount";
          docs: [
            "Source vault's token account — must be the canonical ATA to prevent non-canonical account abuse (AUDIT-003)",
          ];
          writable: true;
        },
        {
          name: "sourceMintAccount";
          docs: ["Source token mint"];
        },
        {
          name: "destConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "destMint";
              },
            ];
          };
        },
        {
          name: "destVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "destMint";
              },
            ];
          };
        },
        {
          name: "destTree";
          docs: [
            "Destination tree - where output commitments will be inserted",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  110,
                  111,
                  116,
                  101,
                  95,
                  116,
                  114,
                  101,
                  101,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "destMint";
              },
              {
                kind: "arg";
                path: "destTreeId";
              },
            ];
          };
        },
        {
          name: "destVaultTokenAccount";
          docs: [
            "Destination vault's token account — must be the canonical ATA to prevent non-canonical account abuse (AUDIT-003)",
          ];
          writable: true;
        },
        {
          name: "destMintAccount";
          docs: ["Destination token mint"];
        },
        {
          name: "executor";
          docs: [
            "Executor PDA - holds tokens during swap",
            "Seeds include source_mint, dest_mint, nullifier, AND relayer key to prevent front-running DoS",
            "(AUDIT-001: Adding relayer key prevents attackers from pre-creating executor PDAs)",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  115,
                  119,
                  97,
                  112,
                  95,
                  101,
                  120,
                  101,
                  99,
                  117,
                  116,
                  111,
                  114,
                ];
              },
              {
                kind: "arg";
                path: "sourceMint";
              },
              {
                kind: "arg";
                path: "destMint";
              },
              {
                kind: "arg";
                path: "inputNullifier0";
              },
              {
                kind: "account";
                path: "relayer";
              },
            ];
          };
        },
        {
          name: "executorSourceToken";
          docs: [
            "Executor's source token account (receives from source vault)",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "executor";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: "account";
                path: "sourceMintAccount";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "executorDestToken";
          docs: [
            "Executor's destination token account (receives swapped tokens)",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "executor";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: "account";
                path: "destMintAccount";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "relayer";
          docs: ["Relayer who submits transaction (pays rent, receives fee)"];
          writable: true;
          signer: true;
        },
        {
          name: "relayerTokenAccount";
          docs: ["Relayer's token account for fees (dest token)"];
          writable: true;
        },
        {
          name: "swapProgram";
          docs: ["Raydium Swap program (CPMM or AMM)"];
        },
        {
          name: "jupiterEventAuthority";
          docs: ["Jupiter Event Authority (required for Jupiter V6 swaps)"];
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [
        {
          name: "proof";
          type: {
            defined: {
              name: "swapProof";
            };
          };
        },
        {
          name: "sourceRoot";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "sourceTreeId";
          type: "u16";
        },
        {
          name: "sourceMint";
          type: "pubkey";
        },
        {
          name: "inputNullifier0";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "inputNullifier1";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "destTreeId";
          type: "u16";
        },
        {
          name: "destMint";
          type: "pubkey";
        },
        {
          name: "outputCommitment0";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "outputCommitment1";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "swapParams";
          type: {
            defined: {
              name: "swapParams";
            };
          };
        },
        {
          name: "swapAmount";
          type: "u64";
        },
        {
          name: "swapData";
          type: "bytes";
        },
        {
          name: "extData";
          type: {
            defined: {
              name: "extData";
            };
          };
        },
      ];
    },
    {
      name: "updateGlobalConfig";
      discriminator: [164, 84, 130, 189, 111, 58, 250, 200];
      accounts: [
        {
          name: "globalConfig";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  49,
                ];
              },
            ];
          };
        },
        {
          name: "admin";
          docs: ["has_one = admin ensures this matches global_config.admin."];
          signer: true;
          relations: ["globalConfig"];
        },
      ];
      args: [];
    },
    {
      name: "updatePoolConfig";
      discriminator: [68, 236, 203, 122, 179, 62, 234, 252];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  105,
                  118,
                  97,
                  99,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  51,
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
            ];
          };
        },
        {
          name: "admin";
          signer: true;
          relations: ["config"];
        },
      ];
      args: [
        {
          name: "mintAddress";
          type: "pubkey";
        },
        {
          name: "minDepositAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "maxDepositAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "minWithdrawAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "maxWithdrawAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "feeBps";
          type: {
            option: "u16";
          };
        },
        {
          name: "minWithdrawalFee";
          type: {
            option: "u64";
          };
        },
        {
          name: "feeErrorMarginBps";
          type: {
            option: "u16";
          };
        },
        {
          name: "minSwapFee";
          type: {
            option: "u64";
          };
        },
        {
          name: "swapFeeBps";
          type: {
            option: "u16";
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "globalConfig";
      discriminator: [149, 8, 156, 202, 160, 252, 176, 217];
    },
    {
      name: "merkleTreeAccount";
      discriminator: [147, 200, 34, 248, 131, 187, 248, 253];
    },
    {
      name: "nullifierMarker";
      discriminator: [160, 124, 83, 42, 185, 14, 141, 101];
    },
    {
      name: "nullifierSet";
      discriminator: [251, 219, 17, 100, 208, 102, 127, 25];
    },
    {
      name: "privacyConfig";
      discriminator: [165, 149, 218, 209, 148, 237, 242, 159];
    },
    {
      name: "swapExecutor";
      discriminator: [28, 237, 82, 118, 158, 162, 39, 225];
    },
    {
      name: "vault";
      discriminator: [211, 8, 232, 43, 2, 152, 117, 119];
    },
  ];
  events: [
    {
      name: "commitmentEvent";
      discriminator: [89, 205, 140, 111, 36, 129, 217, 125];
    },
    {
      name: "nullifierSpent";
      discriminator: [166, 111, 130, 54, 212, 115, 152, 215];
    },
    {
      name: "swapExecutedEvent";
      discriminator: [183, 28, 219, 210, 164, 184, 62, 12];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "paused";
      msg: "Pool is paused";
    },
    {
      code: 6001;
      name: "noDenoms";
      msg: "No denominations configured";
    },
    {
      code: 6002;
      name: "tooManyDenoms";
      msg: "Too many denominations";
    },
    {
      code: 6003;
      name: "badDenomIndex";
      msg: "Bad denomination index";
    },
    {
      code: 6004;
      name: "mathOverflow";
      msg: "Math overflow";
    },
    {
      code: 6005;
      name: "nullifierAlreadyUsed";
      msg: "Nullifier already used";
    },
    {
      code: 6006;
      name: "nullifierTableFull";
      msg: "Nullifier table is full";
    },
    {
      code: 6007;
      name: "unknownRoot";
      msg: "Unknown root";
    },
    {
      code: 6008;
      name: "relayerNotAllowed";
      msg: "Relayer not allowed";
    },
    {
      code: 6009;
      name: "insufficientVaultBalance";
      msg: "Vault balance too low";
    },
    {
      code: 6010;
      name: "tooManyRelayers";
      msg: "Too many relayers";
    },
    {
      code: 6011;
      name: "invalidProof";
      msg: "Invalid proof encoding";
    },
    {
      code: 6012;
      name: "verifyFailed";
      msg: "Groth16 verification failed";
    },
    {
      code: 6013;
      name: "merkleTreeFull";
      msg: "Merkle tree is full - use a different tree_id or add a new tree with add_merkle_tree";
    },
    {
      code: 6014;
      name: "merkleHashFailed";
      msg: "Merkle hash failed";
    },
    {
      code: 6015;
      name: "invalidExtData";
      msg: "Invalid external data hash";
    },
    {
      code: 6016;
      name: "recipientMismatch";
      msg: "Recipient mismatch";
    },
    {
      code: 6017;
      name: "invalidMintAddress";
      msg: "Invalid mint address";
    },
    {
      code: 6018;
      name: "excessiveFee";
      msg: "Excessive fee";
    },
    {
      code: 6019;
      name: "insufficientFee";
      msg: "Fee below minimum required for withdrawal";
    },
    {
      code: 6020;
      name: "arithmeticOverflow";
      msg: "Arithmetic overflow/underflow occurred";
    },
    {
      code: 6021;
      name: "insufficientFundsForWithdrawal";
      msg: "Insufficient funds for withdrawal (including rent exemption)";
    },
    {
      code: 6022;
      name: "insufficientFundsForFee";
      msg: "Insufficient funds for fee payment";
    },
    {
      code: 6023;
      name: "invalidPublicAmount";
      msg: "Invalid public amount data";
    },
    {
      code: 6024;
      name: "invalidFeeAmount";
      msg: "Invalid fee amount";
    },
    {
      code: 6025;
      name: "duplicateNullifiers";
      msg: "Duplicate nullifiers detected";
    },
    {
      code: 6026;
      name: "duplicateCommitments";
      msg: "Duplicate output commitments detected";
    },
    {
      code: 6027;
      name: "missingTokenAccount";
      msg: "Token account required for SPL token operations";
    },
    {
      code: 6028;
      name: "missingTokenProgram";
      msg: "Token program required for SPL token operations";
    },
    {
      code: 6029;
      name: "invalidTokenAuthority";
      msg: "Invalid token account authority";
    },
    {
      code: 6030;
      name: "relayerMismatch";
      msg: "Relayer account does not match ext_data.relayer";
    },
    {
      code: 6031;
      name: "relayerTokenAccountMismatch";
      msg: "Relayer token account not owned by ext_data.relayer";
    },
    {
      code: 6032;
      name: "recipientTokenAccountMismatch";
      msg: "Recipient token account not owned by ext_data.recipient";
    },
    {
      code: 6033;
      name: "depositorTokenAccountMismatch";
      msg: "Depositor token account not owned/delegated to relayer";
    },
    {
      code: 6034;
      name: "invalidPrivateTransferFee";
      msg: "Private transfer (public_amount == 0) must have fee == 0 and refund == 0";
    },
    {
      code: 6035;
      name: "depositBelowMinimum";
      msg: "Deposit amount below pool minimum";
    },
    {
      code: 6036;
      name: "depositLimitExceeded";
      msg: "Deposit amount exceeds pool maximum";
    },
    {
      code: 6037;
      name: "withdrawalBelowMinimum";
      msg: "Withdrawal amount below pool minimum";
    },
    {
      code: 6038;
      name: "withdrawalLimitExceeded";
      msg: "Withdrawal amount exceeds pool maximum";
    },
    {
      code: 6039;
      name: "invalidPoolConfigRange";
      msg: "Invalid PoolConfig range (min > max)";
    },
    {
      code: 6040;
      name: "excessiveFeeBps";
      msg: "Fee basis points exceeds maximum (100 = 1%)";
    },
    {
      code: 6041;
      name: "excessiveFeeMargin";
      msg: "Fee error margin exceeds maximum (5000 = 50%)";
    },
    {
      code: 6042;
      name: "unauthorizedAdmin";
      msg: "Only authorized admin can initialize";
    },
    {
      code: 6043;
      name: "unauthorized";
      msg: "Unauthorized: only admin or relayers can perform this action";
    },
    {
      code: 6044;
      name: "invalidTreeId";
      msg: "Invalid tree_id (tree does not exist or exceeds num_trees)";
    },
    {
      code: 6045;
      name: "tooManyTrees";
      msg: "Maximum number of Merkle trees reached for this pool";
    },
    {
      code: 6046;
      name: "invalidNullifiersForDeposit";
      msg: "Deposits must use zero nullifiers (no notes consumed)";
    },
    {
      code: 6047;
      name: "zeroNullifier";
      msg: "Nullifier cannot be zero for withdrawals/transfers";
    },
    {
      code: 6048;
      name: "zeroCommitment";
      msg: "Output commitment cannot be zero";
    },
    {
      code: 6049;
      name: "invalidTokenAccountOwner";
      msg: "Token account must be owned by SPL Token Program";
    },
    {
      code: 6050;
      name: "vaultTokenAccountNotAta";
      msg: "Vault token account must be the canonical Associated Token Account";
    },
    {
      code: 6051;
      name: "withdrawalTooSmallForMinFee";
      msg: "Withdrawal amount too small: max fee based on fee_bps would be less than min_withdrawal_fee";
    },
    {
      code: 6052;
      name: "invalidNullifierMarkerForDeposit";
      msg: "Nullifier marker account does not correspond to zero nullifier for deposits";
    },
    {
      code: 6053;
      name: "insufficientDelegation";
      msg: "Token account delegation amount insufficient for deposit";
    },
    {
      code: 6054;
      name: "invalidSwapProgram";
      msg: "Invalid swap program: must be Raydium CPMM or AMM";
    },
    {
      code: 6055;
      name: "executorNotStale";
      msg: "Executor PDA exists and is not stale - cannot reclaim yet";
    },
    {
      code: 6056;
      name: "invalidRemainingAccounts";
      msg: "Invalid remaining accounts: wrong count or ownership";
    },
    {
      code: 6057;
      name: "jupiterInsufficientAccounts";
      msg: "Jupiter swap requires additional routing accounts";
    },
    {
      code: 6058;
      name: "jupiterInvalidInstruction";
      msg: "Jupiter instruction data invalid or unsupported version";
    },
    {
      code: 6059;
      name: "invalidSwapParams";
      msg: "Swap params mints do not match instruction mints";
    },
    {
      code: 6060;
      name: "deadlineExpired";
      msg: "Transaction deadline has expired";
    },
  ];
  types: [
    {
      name: "commitmentEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "commitment";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "leafIndex";
            type: "u64";
          },
          {
            name: "newRoot";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "timestamp";
            type: "i64";
          },
          {
            name: "mintAddress";
            type: "pubkey";
          },
          {
            name: "treeId";
            type: "u16";
          },
        ];
      };
    },
    {
      name: "extData";
      docs: [
        "External data that gets hashed into ext_data_hash",
        "These are public parameters that affect financial flows",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "recipient";
            docs: ["Who receives withdrawal"];
            type: "pubkey";
          },
          {
            name: "relayer";
            docs: ["Who submits tx (gets fee)"];
            type: "pubkey";
          },
          {
            name: "fee";
            docs: ["Fee to relayer in lamports"];
            type: "u64";
          },
          {
            name: "refund";
            docs: ["Refund to user in lamports"];
            type: "u64";
          },
        ];
      };
    },
    {
      name: "globalConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["PDA bump"];
            type: "u8";
          },
          {
            name: "admin";
            docs: ["Admin who can configure global settings"];
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "merkleTreeAccount";
      docs: [
        "Layout tests verify 9107 bytes total with 1-byte alignment. Breaking this corrupts all accounts.",
      ];
      serialization: "bytemuckunsafe";
      repr: {
        kind: "rust";
        packed: true;
      };
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            docs: ["Authority allowed to manage the tree (config admin)"];
            type: "pubkey";
          },
          {
            name: "height";
            docs: ["Tree height (number of levels)"];
            type: "u8";
          },
          {
            name: "rootHistorySize";
            docs: ["How many roots we track"];
            type: "u16";
          },
          {
            name: "nextIndex";
            docs: ["Next leaf index"];
            type: "u64";
          },
          {
            name: "rootIndex";
            docs: ["Index into root_history for the current root"];
            type: "u64";
          },
          {
            name: "root";
            docs: ["Current root"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "subtrees";
            docs: ["Cached subtree values for each level"];
            type: {
              array: [
                {
                  array: ["u8", 32];
                },
                22,
              ];
            };
          },
          {
            name: "rootHistory";
            docs: ["Circular buffer of recent roots"];
            type: {
              array: [
                {
                  array: ["u8", 32];
                },
                256,
              ];
            };
          },
        ];
      };
    },
    {
      name: "nullifierMarker";
      docs: ["Per-nullifier PDA marker (created when nullifier is spent)"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "nullifier";
            docs: ["The nullifier that was spent"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "timestamp";
            docs: ["Unix timestamp when spent"];
            type: "i64";
          },
          {
            name: "withdrawalIndex";
            docs: ["Sequential withdrawal index"];
            type: "u32";
          },
          {
            name: "treeId";
            docs: [
              "Tree ID this nullifier belongs to (prevents cross-tree double-spend)",
            ];
            type: "u16";
          },
          {
            name: "bump";
            docs: ["PDA bump"];
            type: "u8";
          },
        ];
      };
    },
    {
      name: "nullifierSet";
      docs: [
        "Nullifier set metadata (actual nullifiers stored as individual PDAs).",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "count";
            type: "u32";
          },
        ];
      };
    },
    {
      name: "nullifierSpent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "nullifier";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "timestamp";
            type: "i64";
          },
          {
            name: "mintAddress";
            type: "pubkey";
          },
          {
            name: "treeId";
            type: "u16";
          },
        ];
      };
    },
    {
      name: "privacyConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["PDA bump for this config"];
            type: "u8";
          },
          {
            name: "vaultBump";
            docs: ["PDA bump for vault"];
            type: "u8";
          },
          {
            name: "admin";
            docs: ["Admin who can configure pool and relayers"];
            type: "pubkey";
          },
          {
            name: "feeBps";
            docs: ["Fee in basis points (0–10_000) for withdrawals"];
            type: "u16";
          },
          {
            name: "minWithdrawalFee";
            docs: [
              "Minimum fee for withdrawals (in lamports) to ensure relayer compensation",
            ];
            type: "u64";
          },
          {
            name: "feeErrorMarginBps";
            docs: [
              "Fee error margin in basis points (e.g., 500 = 5%)",
              "Allows fee variance to prevent timing attacks where identical fees",
              "could correlate deposits/withdrawals",
            ];
            type: "u16";
          },
          {
            name: "totalTvl";
            docs: ["Total value locked (all deposits combined)"];
            type: "u64";
          },
          {
            name: "mintAddress";
            docs: [
              "Token mint address (for now: SOL, future: multi-token support)",
            ];
            type: "pubkey";
          },
          {
            name: "minDepositAmount";
            docs: [
              "Minimum amount allowed per deposit (in lamports/token units)",
            ];
            type: "u64";
          },
          {
            name: "maxDepositAmount";
            docs: [
              "Maximum amount allowed per deposit (in lamports/token units)",
            ];
            type: "u64";
          },
          {
            name: "minWithdrawAmount";
            docs: [
              "Minimum amount allowed per withdrawal (in lamports/token units)",
            ];
            type: "u64";
          },
          {
            name: "maxWithdrawAmount";
            docs: [
              "Maximum amount allowed per withdrawal (in lamports/token units)",
            ];
            type: "u64";
          },
          {
            name: "numRelayers";
            docs: ["Relayer registry"];
            type: "u8";
          },
          {
            name: "relayers";
            type: {
              array: ["pubkey", 16];
            };
          },
          {
            name: "numTrees";
            docs: ["Multi-tree support: number of active Merkle trees"];
            type: "u16";
          },
          {
            name: "nextTreeIndex";
            docs: ["Suggested tree index for next deposit (round-robin)"];
            type: "u16";
          },
          {
            name: "minSwapFee";
            docs: [
              "Minimum swap fee in destination token units (e.g., 100000 = 0.1 USDC)",
              "Ensures relayer compensation for swap transactions",
            ];
            type: "u64";
          },
          {
            name: "swapFeeBps";
            docs: [
              "Swap fee in basis points (0-10_000) of swap output amount",
              "Used with min_swap_fee: actual fee must be >= max(min_swap_fee, output * swap_fee_bps / 10000)",
            ];
            type: "u16";
          },
        ];
      };
    },
    {
      name: "swapExecutedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "sourceMint";
            type: "pubkey";
          },
          {
            name: "destMint";
            type: "pubkey";
          },
          {
            name: "sourceTreeId";
            type: "u16";
          },
          {
            name: "destTreeId";
            type: "u16";
          },
          {
            name: "nullifiers";
            type: {
              array: [
                {
                  array: ["u8", 32];
                },
                2,
              ];
            };
          },
          {
            name: "commitments";
            type: {
              array: [
                {
                  array: ["u8", 32];
                },
                2,
              ];
            };
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "swapExecutor";
      docs: [
        "Ephemeral PDA that holds tokens during swap, created and closed atomically",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "sourceMint";
            type: "pubkey";
          },
          {
            name: "destMint";
            type: "pubkey";
          },
          {
            name: "nullifier";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "createdSlot";
            docs: ["Slot when this executor was created (for stale detection)"];
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "swapParams";
      docs: ["Swap parameters committed to in the ZK proof"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "minAmountOut";
            type: "u64";
          },
          {
            name: "deadline";
            type: "i64";
          },
          {
            name: "sourceMint";
            type: "pubkey";
          },
          {
            name: "destMint";
            type: "pubkey";
          },
          {
            name: "swapDataHash";
            docs: [
              "SHA-256 hash of the raw swap instruction data (swap_data).",
              "Binds the exact DEX instruction bytes into the ZK proof so the relayer",
              "cannot substitute different swap_data (e.g. 0% slippage) after the user",
              "has generated their proof.  Set to [0u8;32] for CPMM/AMM swaps, which",
              "already enforce dex_min_out by direct instruction decoding.",
              "BREAKING: ZK swap circuit must include this field when computing",
              "swap_params_hash = Poseidon(source_mint, dest_mint, min_amount_out,",
              "deadline, swap_data_hash).",
            ];
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "swapProof";
      docs: [
        "Proof for swap transaction circuit (2-in-2-out cross-pool UTXO model)",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "proofA";
            type: {
              array: ["u8", 64];
            };
          },
          {
            name: "proofB";
            type: {
              array: ["u8", 128];
            };
          },
          {
            name: "proofC";
            type: {
              array: ["u8", 64];
            };
          },
        ];
      };
    },
    {
      name: "transactionProof";
      docs: [
        "Proof for new UTXO transaction circuit (same structure, different VK)",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "proofA";
            type: {
              array: ["u8", 64];
            };
          },
          {
            name: "proofB";
            type: {
              array: ["u8", 128];
            };
          },
          {
            name: "proofC";
            type: {
              array: ["u8", 64];
            };
          },
        ];
      };
    },
    {
      name: "vault";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["PDA bump for this vault"];
            type: "u8";
          },
        ];
      };
    },
  ];
};
