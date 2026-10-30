import type { SiteRow, Status } from './types';

/**
 * 모든 계산은 0.1 단위 정수("tenths")로 한다.
 * 75.8 → 758. 소수 계산 오차로 -5.0이 -5.000000001이 되는 일을 막는다.
 */
export const toTenths = (n: number): number => Math.round(n * 10);

/** 반올림: 0.5는 0에서 먼 쪽으로(엑셀 ROUND와 같은 방식). num/den을 정수로 반올림한다. */
export function divRound(num: number, den: number): number {
  const sign = num < 0 !== den < 0 ? -1 : 1;
  const n = Math.abs(num);
  const d = Math.abs(den);
  return sign * Math.floor((2 * n + d) / (2 * d));
}

export function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function statusFromGapT(gapT: number): Status {
  if (gapT <= -50) return '점검';
  if (gapT < 0) return '주의';
  return '정상';
}

export interface SiteMetrics {
  row: SiteRow;
  gapT: number; // 공정차이 (0.1pp 단위)
  status: Status;
  rateT: number; // 기성률 (0.1% 단위, 반올림)
  monthlyT: number | null; // 당월기성액 (0.1백만원 단위), 전월 없으면 null
}

export function siteMetrics(row: SiteRow, prev: SiteRow | undefined): SiteMetrics {
  const gapT = toTenths(row.actualProgress) - toTenths(row.plannedProgress);
  return {
    row,
    gapT,
    status: statusFromGapT(gapT),
    rateT: divRound(toTenths(row.cumulativeEarned) * 1000, toTenths(row.contractAmount)),
    monthlyT: prev ? toTenths(row.cumulativeEarned) - toTenths(prev.cumulativeEarned) : null,
  };
}

export interface Aggregate {
  count: number;
  contractT: number; // 계약금액 합계 (0.1백만원 단위)
  earnedT: number; // 누적기성액 합계
  rateT: number; // 전체 기성률 (0.1% 단위)
  plannedT: number; // 가중 계획공정률 (0.1% 단위)
  actualT: number; // 가중 실제공정률
  gapT: number; // 전체 공정차이 (반올림 전 값끼리 뺀 뒤 반올림)
  monthlyT: number | null; // 전체 당월기성액, 한 곳이라도 전월이 없으면 null
  normal: number;
  caution: number;
  inspect: number;
  sites: SiteMetrics[];
}

/** 한 달 분량의 행(rows)과 바로 전월의 행(prevRows)으로 전체 지표를 계산한다. 행이 없으면 null. */
export function aggregate(rows: SiteRow[], prevRows: SiteRow[]): Aggregate | null {
  if (rows.length === 0) return null;
  const prevBySite = new Map(prevRows.map((r) => [r.siteId, r]));
  const sites = rows.map((r) => siteMetrics(r, prevBySite.get(r.siteId)));

  let contractT = 0;
  let earnedT = 0;
  let plannedSum = 0;
  let actualSum = 0;
  for (const r of rows) {
    const c = toTenths(r.contractAmount);
    contractT += c;
    earnedT += toTenths(r.cumulativeEarned);
    plannedSum += c * toTenths(r.plannedProgress);
    actualSum += c * toTenths(r.actualProgress);
  }

  const allHavePrev = sites.every((s) => s.monthlyT !== null);
  return {
    count: rows.length,
    contractT,
    earnedT,
    rateT: divRound(earnedT * 1000, contractT),
    plannedT: divRound(plannedSum, contractT),
    actualT: divRound(actualSum, contractT),
    gapT: divRound(actualSum - plannedSum, contractT),
    monthlyT: allHavePrev ? sites.reduce((a, s) => a + (s.monthlyT as number), 0) : null,
    normal: sites.filter((s) => s.status === '정상').length,
    caution: sites.filter((s) => s.status === '주의').length,
    inspect: sites.filter((s) => s.status === '점검').length,
    sites,
  };
}

/** 점검 현장만, 공정차이 오름차순 → 같으면 현장 ID 오름차순 */
export function inspectionRanking(agg: Aggregate | null): SiteMetrics[] {
  if (!agg) return [];
  return agg.sites
    .filter((s) => s.status === '점검')
    .sort((a, b) => a.gapT - b.gapT || a.row.siteId.localeCompare(b.row.siteId));
}
