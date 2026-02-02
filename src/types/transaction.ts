export interface NoteDetail {
  id: string;
  amount: number;
  rawAmount: string;
  commitment: string;
  spent: boolean;
  timestamp: number;
  txSignature?: string;
  mintAddress: string;
  token: string;
}

export interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  timestamp: number;
  status: "confirmed" | "pending";
  address: string;
  txSignature?: string;
  token: string;
  mintAddress: string;
  notes?: NoteDetail[];
  noteCount?: number;
}
