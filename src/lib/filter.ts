import { aggregate, prevMonth, type Aggregate } from './calc';
import type { Filters, SiteRow } from './types';

export const ALL = '';

export function monthsOf(all: SiteRow[]): string[] {
  return Array.from(new Set(all.map((r) => r.month))).sort();
}

export interface SiteInfo {
  siteId: string;
  siteName: string;
  region: string;
  projectType: string;
}

export function siteInfos(all: SiteRow[]): SiteInfo[] {
  const map = new Map<string, SiteInfo>();
  for (const r of all) {
    if (!map.has(r.siteId)) {
      map.set(r.siteId, { siteId: r.siteId, siteName: r.siteName, region: r.region, projectType: r.projectType });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.siteId.localeCompare(b.siteId));
}

export const regionsOf = (all: SiteRow[]) => Array.from(new Set(all.map((r) => r.region)));
export const typesOf = (all: SiteRow[]) => Array.from(new Set(all.map((r) => r.projectType)));

export function matchesScope(r: { region: string; projectType: string; siteId: string }, f: Filters): boolean {
  return (
    (f.region === ALL || r.region === f.region) &&
    (f.type === ALL || r.projectType === f.type) &&
    (f.siteId === ALL || r.siteId === f.siteId)
  );
}

/** 지금 지역·유형 범위에 들어오는 현장 목록(현장 선택 목록용) */
export function sitesInScope(all: SiteRow[], f: Filters): SiteInfo[] {
  return siteInfos(all).filter(
    (s) => (f.region === ALL || s.region === f.region) && (f.type === ALL || s.projectType === f.type),
  );
}

/** 필터를 바꾼 뒤, 선택한 현장이 범위에서 빠졌으면 현장을 전체로 되돌린다. */
export function normalizeFilters(all: SiteRow[], f: Filters): { filters: Filters; siteReset: boolean } {
  if (f.siteId !== ALL && !sitesInScope(all, f).some((s) => s.siteId === f.siteId)) {
    return { filters: { ...f, siteId: ALL }, siteReset: true };
  }
  return { filters: f, siteReset: false };
}

export function rowsForMonth(all: SiteRow[], f: Filters, month: string): SiteRow[] {
  return all.filter((r) => r.month === month && matchesScope(r, f)).sort((a, b) => a.siteId.localeCompare(b.siteId));
}

/** 선택 월의 전체 지표 (필터 범위). 자료가 없으면 null */
export function aggregateFor(all: SiteRow[], f: Filters, month: string = f.month): Aggregate | null {
  return aggregate(rowsForMonth(all, f, month), rowsForMonth(all, f, prevMonth(month)));
}

export interface TrendPoint {
  month: string;
  agg: Aggregate | null;
}

/** 자료의 첫 달부터 선택 월까지 매월 따로 집계 */
export function trendFor(all: SiteRow[], f: Filters): TrendPoint[] {
  return monthsOf(all)
    .filter((m) => m <= f.month)
    .map((m) => ({ month: m, agg: aggregateFor(all, f, m) }))
    .filter((p) => p.agg !== null);
}

/** AI 답변이 어느 범위의 것인지 구별하는 키 */
export function scopeKey(f: Filters): string {
  return [f.month, f.region, f.type, f.siteId].join('|');
}
