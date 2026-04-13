export function createMetricsStore() {
  const startedAt = new Date().toISOString();
  const routeCounts = new Map();
  const statusCounts = new Map();
  const authCounts = {
    loginSuccess: 0,
    loginFailure: 0,
    tokenFailure: 0
  };

  function incRoute(method, path) {
    const key = `${String(method || "GET").toUpperCase()} ${String(path || "/")}`;
    routeCounts.set(key, (routeCounts.get(key) ?? 0) + 1);
  }

  function incStatus(statusCode) {
    const key = String(statusCode || 0);
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
  }

  function incAuth(name) {
    if (Object.hasOwn(authCounts, name)) {
      authCounts[name] += 1;
    }
  }

  function objectFromMap(map) {
    return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }

  function snapshot(extra = {}) {
    const statusObject = objectFromMap(statusCounts);
    const totalRequests = Object.values(statusObject).reduce((sum, count) => sum + Number(count), 0);
    return {
      startedAt,
      totalRequests,
      routeCounts: objectFromMap(routeCounts),
      statusCounts: statusObject,
      auth: { ...authCounts },
      ...extra
    };
  }

  return {
    incRoute,
    incStatus,
    incAuth,
    snapshot
  };
}
