export interface SyncHistoryRecord {
  id: number;
  connector_type: string;
  status: string;
  last_operation: string;
  last_operation_ts: string;
  last_error_message: string | null;
  attempt_count: number;
  binding_id: string;
  entity_type: string;
  extern_description: string;
  extern_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
