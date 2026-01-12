/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/privacy_pool.json`.
 */
export type PrivacyPool = {
  address: "25nWpBnbvqh8mQ19SpnkVcDnmm72m3R7YCSh2RAEpLQF";
  metadata: {
    name: "privacyPool";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
          relations: ["config"];
        }
      ];
      args: [
        {
          name: "mintAddress";
          type: "pubkey";
        },
        {
          name: "newRelayer";
          type: "pubkey";
        }
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
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
        }
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
                  49
                ];
              }
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "setPaused";
      discriminator: [91, 60, 125, 192, 176, 225, 166, 218];
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
          relations: ["config"];
        }
      ];
      args: [
        {
          name: "mintAddress";
          type: "pubkey";
        },
        {
          name: "paused";
          type: "bool";
        }
      ];
    },
    {
      name: "transact";
      docs: [
        "Unified UTXO transaction instruction",
        "Circuit equation: sumIns + publicAmount = sumOuts",
        "Handles deposits (publicAmount > 0), withdrawals (publicAmount < 0), and transfers (publicAmount = 0)"
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
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
                  49
                ];
              }
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
            ];
          };
        },
        {
          name: "nullifierMarker0";
          docs: [
            "First nullifier marker (must not exist - ensures nullifier is fresh)"
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "arg";
                path: "inputNullifier0";
              }
            ];
          };
        },
        {
          name: "nullifierMarker1";
          docs: [
            "Second nullifier marker (must not exist - ensures nullifier is fresh)"
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              },
              {
                kind: "arg";
                path: "inputNullifier1";
              }
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
        }
      ];
      args: [
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
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
        }
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
                  49
                ];
              }
            ];
          };
        },
        {
          name: "admin";
          signer: true;
          relations: ["globalConfig"];
        }
      ];
      args: [
        {
          name: "relayerEnabled";
          type: {
            option: "bool";
          };
        }
      ];
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
                  51
                ];
              },
              {
                kind: "arg";
                path: "mintAddress";
              }
            ];
          };
        },
        {
          name: "admin";
          signer: true;
          relations: ["config"];
        }
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
        }
      ];
    }
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
      name: "vault";
      discriminator: [211, 8, 232, 43, 2, 152, 117, 119];
    }
  ];
  events: [
    {
      name: "commitmentEvent";
      discriminator: [89, 205, 140, 111, 36, 129, 217, 125];
    },
    {
      name: "nullifierSpent";
      discriminator: [166, 111, 130, 54, 212, 115, 152, 215];
    }
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
      msg: "Merkle tree is full";
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
      name: "relayersDisabledGlobally";
      msg: "Relayers are globally disabled";
    }
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
          }
        ];
      };
    },
    {
      name: "extData";
      docs: [
        "External data that gets hashed into ext_data_hash",
        "These are public parameters that affect financial flows"
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
          }
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
          {
            name: "relayerEnabled";
            docs: ["Global relayer toggle (emergency kill switch)"];
            type: "bool";
          }
        ];
      };
    },
    {
      name: "merkleTreeAccount";
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
                16
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
                32
              ];
            };
          }
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
            name: "bump";
            docs: ["PDA bump"];
            type: "u8";
          }
        ];
      };
    },
    {
      name: "nullifierSet";
      docs: [
        "Nullifier set metadata (actual nullifiers stored as individual PDAs)."
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
          }
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
          }
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
            name: "paused";
            docs: ["Is pool paused?"];
            type: "bool";
          },
          {
            name: "feeBps";
            docs: ["Fee in basis points (0–10_000) for withdrawals"];
            type: "u16";
          },
          {
            name: "minWithdrawalFee";
            docs: [
              "Minimum fee for withdrawals (in lamports) to ensure relayer compensation"
            ];
            type: "u64";
          },
          {
            name: "totalTvl";
            docs: ["Total value locked (all deposits combined)"];
            type: "u64";
          },
          {
            name: "mintAddress";
            docs: [
              "Token mint address (for now: SOL, future: multi-token support)"
            ];
            type: "pubkey";
          },
          {
            name: "minDepositAmount";
            docs: [
              "Minimum amount allowed per deposit (in lamports/token units)"
            ];
            type: "u64";
          },
          {
            name: "maxDepositAmount";
            docs: [
              "Maximum amount allowed per deposit (in lamports/token units)"
            ];
            type: "u64";
          },
          {
            name: "minWithdrawAmount";
            docs: [
              "Minimum amount allowed per withdrawal (in lamports/token units)"
            ];
            type: "u64";
          },
          {
            name: "maxWithdrawAmount";
            docs: [
              "Maximum amount allowed per withdrawal (in lamports/token units)"
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
          }
        ];
      };
    },
    {
      name: "transactionProof";
      docs: [
        "Proof for new UTXO transaction circuit (same structure, different VK)"
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
          }
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
          }
        ];
      };
    }
  ];
};
