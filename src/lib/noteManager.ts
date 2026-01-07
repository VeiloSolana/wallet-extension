
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
}

// Check if chrome.storage is available (prevent crash in dev mode)
const isExtension = typeof chrome !== 'undefined' && !!chrome.storage;

export class NoteManager {
  async saveNote(note: Omit<StoredNote, 'id' | 'spent'>): Promise<string> {
    const noteWithId: StoredNote = {
      ...note,
      id: crypto.randomUUID(),
      spent: false,
    };

    const notes = await this.getAllNotes();

    console.log({notes})
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
    console.log({notes});
    return notes.find((n) => n.commitment === commitment) || null;
  }

  async getAllNotes(): Promise<StoredNote[]> {
    if (isExtension) {
       const result = await chrome.storage.local.get('notes');
       console.log({result});
       return (result.notes as StoredNote[]) || [];
    } else {
       // Local dev fallback
       const stored = localStorage.getItem('notes');
       console.log({stored});
       return stored ? JSON.parse(stored) : [];
    }
  }
  
  async clearAllNotes(): Promise<void> {
     await this.saveNotesToStorage([]);
     console.log('✅ All notes cleared');
  }

  private async saveNotesToStorage(notes: StoredNote[]): Promise<void> {
    if (isExtension) {
       await chrome.storage.local.set({ notes });
    } else {
       localStorage.setItem('notes', JSON.stringify(notes));
    }
  }
}
