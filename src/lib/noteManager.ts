export interface StoredNote {
  id: string;
  amount: string; // Store as string for chrome.storage to avoid BigInt issues
  commitment: string;
  root?: string; // Merkle root at creation/sync
  nullifier: string;
  blinding: string;
  privateKey: string;
  publicKey: string;
  leafIndex: number;
  timestamp: number;
  spent: boolean;
  spentAt?: number;
  txSignature?: string;
  mintAddress: string; // SPL token mint address (PublicKey.default for SOL)
  treeId: number; // Merkle tree identifier
  merklePath?: {
    pathElements: bigint[];
    pathIndices: number[];
  };
}

// Check if chrome.storage is available (prevent crash in dev mode)
const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

export class NoteManager {
  private publicKey: string;
  private encryptionKey: string;

  constructor(publicKey: string, encryptionKey: string) {
    this.publicKey = publicKey;
    this.encryptionKey = encryptionKey; // Use this to encrypt/decrypt notes
  }

  private getStorageKey(): string {
    // Create account-specific storage key
    return `veilo-pk2-n-${this.publicKey}`;
  }

  private async encryptNote(note: StoredNote): Promise<string> {
    // Convert BigInt to string for JSON serialization
    const serializable = {
      ...note,
      merklePath: note.merklePath
        ? {
            pathElements: note.merklePath.pathElements.map((el) =>
              el.toString(),
            ),
            pathIndices: note.merklePath.pathIndices,
          }
        : undefined,
    };
    const noteStr = JSON.stringify(serializable);

    // Use AES-256-GCM encryption from encryption.ts
    const { encrypt } = await import("../utils/encryption");
    const encryptedData = await encrypt(noteStr, this.encryptionKey);

    // Return as JSON string containing all encryption components
    return JSON.stringify(encryptedData);
  }

  private async decryptNote(encryptedStr: string): Promise<StoredNote> {
    try {
      // Try new AES-256-GCM format first
      const { decrypt } = await import("../utils/encryption");
      const encryptedData = JSON.parse(encryptedStr);

      const noteStr = await decrypt(encryptedData, this.encryptionKey);
      const parsed = JSON.parse(noteStr);

      // Convert string back to BigInt
      if (parsed.merklePath) {
        parsed.merklePath.pathElements = parsed.merklePath.pathElements.map(
          (el: string) => BigInt(el),
        );
      }
      return parsed;
    } catch (e) {
      // Fallback to old XOR format for backward compatibility
      try {
        const keyHash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(this.encryptionKey),
        );
        const keyArray = new Uint8Array(keyHash);
        const encrypted = Uint8Array.from(atob(encryptedStr), (c) =>
          c.charCodeAt(0),
        );
        const decrypted = new Uint8Array(encrypted.length);

        for (let i = 0; i < encrypted.length; i++) {
          decrypted[i] = encrypted[i] ^ keyArray[i % keyArray.length];
        }

        const noteStr = new TextDecoder().decode(decrypted);
        const parsed = JSON.parse(noteStr);

        // Convert string back to BigInt
        if (parsed.merklePath) {
          parsed.merklePath.pathElements = parsed.merklePath.pathElements.map(
            (el: string) => BigInt(el),
          );
        }
        return parsed;
      } catch {
        throw new Error(`Failed to decrypt note with both methods: ${e}`);
      }
    }
  }

  async saveNote(
    note: Omit<StoredNote, "id"> & { spent?: boolean },
  ): Promise<string> {
    const notes = await this.getAllNotes();

    // Check if a note with the same commitment already exists to prevent duplicates
    const existing = notes.find((n) => n.commitment === note.commitment);
    if (existing) {
      return existing.id;
    }

    // Generate ID safely (handle missing crypto.randomUUID)
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

    const noteWithId: StoredNote = {
      ...note,
      id,
      spent: note.spent ?? false,
    };

    notes.push(noteWithId);

    await this.saveNotesToStorage(notes);

    return noteWithId.id;
  }

  // Batch save multiple notes at once (more efficient for bulk operations)
  async saveNotesBatch(
    newNotes: Array<Omit<StoredNote, "id"> & { spent?: boolean }>,
  ): Promise<string[]> {
    const existingNotes = await this.getAllNotes();
    const existingCommitments = new Set(existingNotes.map((n) => n.commitment));

    const notesToAdd: StoredNote[] = [];
    const addedIds: string[] = [];

    for (const note of newNotes) {
      // Skip duplicates
      if (existingCommitments.has(note.commitment)) {
        const existing = existingNotes.find(
          (n) => n.commitment === note.commitment,
        );
        if (existing) {
          addedIds.push(existing.id);
        }
        continue;
      }

      // Generate ID
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);

      const noteWithId: StoredNote = {
        ...note,
        id,
        spent: note.spent ?? false,
      };

      notesToAdd.push(noteWithId);
      addedIds.push(id);
      existingCommitments.add(note.commitment);
    }

    if (notesToAdd.length > 0) {
      const allNotes = [...existingNotes, ...notesToAdd];
      await this.saveNotesToStorage(allNotes);
    }

    return addedIds;
  }

  async getUnspentNotes(): Promise<StoredNote[]> {
    const notes = await this.getAllNotes();
    return notes.filter((n) => !n.spent);
  }

  async getBalance(): Promise<bigint> {
    const unspent = await this.getUnspentNotes();
    return unspent.reduce((sum, note) => sum + BigInt(note.amount), 0n);
  }

  async getUnspentNotesByMint(mintAddress: string): Promise<StoredNote[]> {
    const notes = await this.getAllNotes();
    return notes.filter((n) => !n.spent && n.mintAddress === mintAddress);
  }

  async getNotesByMint(mintAddress: string): Promise<StoredNote[]> {
    const notes = await this.getAllNotes();
    return notes.filter((n) => n.mintAddress === mintAddress);
  }

  async getBalanceByMint(mintAddress: string): Promise<bigint> {
    const unspent = await this.getUnspentNotesByMint(mintAddress);
    return unspent.reduce((sum, note) => sum + BigInt(note.amount), 0n);
  }

  async markAsSpent(id: string, txSignature: string): Promise<void> {
    const notes = await this.getAllNotes();
    const note = notes.find((n) => n.id === id);

    if (!note) {
      throw new Error(`Note not found: ${id}`);
    }

    note.spent = true;
    note.spentAt = Date.now();
    note.txSignature = txSignature;

    await this.saveNotesToStorage(notes);
    console.log(`✅ Note marked as spent: ${id}`);
  }

  async getNoteByCommitment(commitment: string): Promise<StoredNote | null> {
    const notes = await this.getAllNotes();
    return notes.find((n) => n.commitment === commitment) || null;
  }

  async getAllNotes(): Promise<StoredNote[]> {
    const storageKey = this.getStorageKey();
    let encryptedNotes: string[] = [];

    if (isExtension) {
      const result = await chrome.storage.local.get(storageKey);
      encryptedNotes = (result[storageKey] as string[]) || [];
    } else {
      // Local dev fallback
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        encryptedNotes = JSON.parse(stored) as string[];
      }
    }

    const notes: StoredNote[] = [];
    const commitments = new Set<string>();
    let hasDuplicates = false;

    for (const encrypted of encryptedNotes) {
      try {
        const note = await this.decryptNote(encrypted);

        // Check for duplicates based on commitment
        if (commitments.has(note.commitment)) {
          hasDuplicates = true;
          continue;
        }

        commitments.add(note.commitment);
        notes.push(note);
      } catch {
        // Silently skip notes that can't be decrypted
      }
    }

    // If we found duplicates during load, save the cleaned list back to storage immediately
    if (hasDuplicates) {
      await this.saveNotesToStorage(notes);
    }

    return notes;
  }

  async clearAllNotes(): Promise<void> {
    await this.saveNotesToStorage([]);
    console.log("✅ All notes cleared");
  }

  private async saveNotesToStorage(notes: StoredNote[]): Promise<void> {
    const storageKey = this.getStorageKey();

    // Encrypt each note
    const encryptedNotes: string[] = [];
    for (const note of notes) {
      const encrypted = await this.encryptNote(note);
      encryptedNotes.push(encrypted);
    }

    if (isExtension) {
      await chrome.storage.local.set({ [storageKey]: encryptedNotes });
    } else {
      localStorage.setItem(storageKey, JSON.stringify(encryptedNotes));
    }
  }
}
