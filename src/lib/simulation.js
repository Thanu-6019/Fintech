import { rand } from "./utils";

/**
 * Runs N Monte Carlo simulations and returns P10/P50/P90 outcomes.
 * @param {object} inputs - Simulation parameters
 * @param {number} N      - Number of simulation runs (default 200)
 */
export function runMonteCarlo(inputs, N = 200) {
  const { months, revenueDelta, expenseDelta, hireDelta, priceDelta,
          currentRevenue, currentBurn, cashReserve } = inputs;

  const runs = [];

  for (let n = 0; n < N; n++) {
    let cash = cashReserve, rev = currentRevenue, burn = currentBurn;
    const path = [];
    let runway = months;

    for (let m = 0; m < months; m++) {
      const noise = rand(-0.04, 0.04);
      rev  = rev  * (1 + (revenueDelta / 100) + noise + (priceDelta / 100) * 0.5);
      burn = burn * (1 + (expenseDelta / 100) + (hireDelta * 8000) / burn * 0.8);
      const netFlow = rev - burn;
      cash += netFlow;
      path.push({
        month: m + 1,
        cash:    Math.round(cash),
        revenue: Math.round(rev),
        burn:    Math.round(burn),
        net:     Math.round(netFlow),
      });
      if (cash <= 0 && runway === months) runway = m + 1;
    }
    runs.push({ path, finalCash: cash, runway: cash > 0 ? months : runway });
  }

  runs.sort((a, b) => a.finalCash - b.finalCash);

  const p10 = runs[Math.floor(N * 0.1)];
  const p50 = runs[Math.floor(N * 0.5)];
  const p90 = runs[Math.floor(N * 0.9)];

  const chartData = Array.from({ length: months }, (_, i) => ({
    month:   "M" + (i + 1),
    p10:     p10.path[i]?.cash    || 0,
    p50:     p50.path[i]?.cash    || 0,
    p90:     p90.path[i]?.cash    || 0,
    revenue: p50.path[i]?.revenue || 0,
    burn:    p50.path[i]?.burn    || 0,
  }));

  const runways = runs.map(r => r.runway);

  return {
    p10: { runway: p10.runway, finalCash: p10.finalCash },
    p50: { runway: p50.runway, finalCash: p50.finalCash },
    p90: { runway: p90.runway, finalCash: p90.finalCash },
    chartData,
    avgRunway:    (runways.reduce((a, b) => a + b, 0) / N).toFixed(1),
    survivalRate: (runs.filter(r => r.finalCash > 0).length / N * 100).toFixed(0),
    breakEvenMonth: p50.path.findIndex(p => p.net >= 0) + 1,
  };
}
