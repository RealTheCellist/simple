const FACTOR_KEYS = ["nq", "sp", "dow", "k200", "kosdaq", "usdkrw"];

export function analyzeRowsQuality(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      rows: 0,
      startDate: null,
      endDate: null,
      invalidRows: 0,
      missingFactorRows: 0,
      maxAbsOpenReturnPct: 0,
      factorCoveragePct: Object.fromEntries(FACTOR_KEYS.map((k) => [k, 0]))
    };
  }

  const factorCounts = Object.fromEntries(FACTOR_KEYS.map((k) => [k, 0]));
  let invalidRows = 0;
  let missingFactorRows = 0;
  let maxAbsOpenReturnPct = 0;

  for (const row of rows) {
    const openReturnPct = Number(row?.openReturnPct);
    if (!Number.isFinite(openReturnPct)) {
      invalidRows += 1;
    } else {
      maxAbsOpenReturnPct = Math.max(maxAbsOpenReturnPct, Math.abs(openReturnPct));
    }

    let missing = false;
    for (const key of FACTOR_KEYS) {
      const value = Number(row?.factors?.[key]);
      if (Number.isFinite(value)) {
        factorCounts[key] += 1;
      } else {
        missing = true;
      }
    }
    if (missing) missingFactorRows += 1;
  }

  const factorCoveragePct = Object.fromEntries(
    FACTOR_KEYS.map((k) => [k, Number(((factorCounts[k] / rows.length) * 100).toFixed(2))])
  );

  return {
    rows: rows.length,
    startDate: rows[0]?.date ?? null,
    endDate: rows[rows.length - 1]?.date ?? null,
    invalidRows,
    missingFactorRows,
    maxAbsOpenReturnPct: Number(maxAbsOpenReturnPct.toFixed(4)),
    factorCoveragePct
  };
}
