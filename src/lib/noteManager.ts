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
    return `veilo0000_notes_${this.publicKey}`;
  }

  private async encryptNote(note: StoredNote): Promise<string> {
    // Convert BigInt to string for JSON serialization
    const serializable = {
      ...note,
      merklePath: note.merklePath
        ? {
            pathElements: note.merklePath.pathElements.map((el) =>
              el.toString()
            ),
            pathIndices: note.merklePath.pathIndices,
          }
        : undefined,
    };
    const noteStr = JSON.stringify(serializable);
    const keyHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(this.encryptionKey)
    );
    const keyArray = new Uint8Array(keyHash);
    const noteArray = new TextEncoder().encode(noteStr);
    const encrypted = new Uint8Array(noteArray.length);

    for (let i = 0; i < noteArray.length; i++) {
      encrypted[i] = noteArray[i] ^ keyArray[i % keyArray.length];
    }

    return btoa(String.fromCharCode(...encrypted));
  }

  private async decryptNote(encryptedStr: string): Promise<StoredNote> {
    const keyHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(this.encryptionKey)
    );
    const keyArray = new Uint8Array(keyHash);
    const encrypted = Uint8Array.from(atob(encryptedStr), (c) =>
      c.charCodeAt(0)
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
        (el: string) => BigInt(el)
      );
    }
    return parsed;
  }

  async saveNote(
    note: Omit<StoredNote, "id"> & { spent?: boolean }
  ): Promise<string> {
    // Generate ID safely (handle missing crypto.randomUUID)
    console.log("saing note........");
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

    const noteWithId: StoredNote = {
      ...note,
      id,
      spent: note.spent ?? false,
    };
    console.log("Saving note:", noteWithId);

    const notes = await this.getAllNotes();

    notes.push(noteWithId);

    await this.saveNotesToStorage(notes);

    console.log(`✅ Note saved: ${noteWithId.id}`);
    return noteWithId.id;
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

    if (isExtension) {
      const result = await chrome.storage.local.get(storageKey);
      const encryptedNotes = (result[storageKey] as string[]) || [];

      // Decrypt each note
      const notes: StoredNote[] = [];
      for (const encrypted of encryptedNotes) {
        try {
          const note = await this.decryptNote(encrypted);
          notes.push(note);
        } catch (e) {
          console.error("Failed to decrypt note:", e);
        }
      }
      return notes;
    } else {
      // Local dev fallback
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];

      const encryptedNotes = JSON.parse(stored) as string[];
      const notes: StoredNote[] = [];
      for (const encrypted of encryptedNotes) {
        try {
          const note = await this.decryptNote(encrypted);
          notes.push(note);
        } catch (e) {
          console.error("Failed to decrypt note:", e);
        }
      }
      return notes;
    }
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
