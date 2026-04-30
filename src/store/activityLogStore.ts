import crypto from "crypto";

type LogEntry = {
  id: string;
  type: string;
  timestamp: string;
  data: unknown;
};

class ActivityLogStore {
  private logs: LogEntry[] = [];

  add(type: string, data: unknown) {
    this.logs.push({
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  getAll() {
    return this.logs.slice(-200);
  }
}

export const activityLogStore = new ActivityLogStore();
