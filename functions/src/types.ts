export interface AnalyticsDataEntry {
  columnName: string;
  value: string | number | boolean | null;
}

export interface SessionMetaData {
  projectId: string;
  schemaVersion: string;
  sessionId: string;
  platform: string;
  startedAt: string;
  endedAt: string;
}

export interface SessionData {
  metaData: SessionMetaData;
  data: AnalyticsDataEntry[];
}

export interface SubmitSessionRequest {
  sessionData: SessionData;
}
