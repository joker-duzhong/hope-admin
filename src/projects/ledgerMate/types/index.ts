export type LedgerMateRecordType = 'income' | 'expense';

export interface LedgerMateCategory {
  id: string;
  record_type: LedgerMateRecordType;
  name: string;
  icon?: string | null;
  sort_order: number;
  is_enabled: boolean;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerMateCategoryPayload {
  record_type: LedgerMateRecordType;
  name: string;
  icon?: string | null;
  sort_order: number;
  is_enabled: boolean;
}
