export function createAuditStore(maxEntries = 1000) {
  const logs = [];

  function add(entry) {
    const log = {
      id: `a_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      at: new Date().toISOString(),
      ...entry
    };
    logs.unshift(log);
    if (logs.length > maxEntries) {
      logs.length = maxEntries;
    }
    return log;
  }

  function list({ limit = 100 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);
    return logs.slice(0, safeLimit);
  }

  return {
    add,
    list
  };
}
