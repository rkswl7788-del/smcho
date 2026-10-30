import { plain1 } from './format';
import { aggregateFor } from './filter';
import { FIELDS, type Filters, type SiteRow } from './types';

export const EXPORT_HEADERS = [...FIELDS, 'earnedRate', 'progressGap', 'status', 'monthlyEarned'] as const;

function cell(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 지금 필터 범위(선택 월·지역·유형·현장)를 원본 15열 + 계산 4열의 CSV 문자열로 만든다. 자료가 없으면 null. */
export function buildCsv(all: SiteRow[], f: Filters): string | null {
  const agg = aggregateFor(all, f);
  if (!agg) return null;
  const lines: string[] = [EXPORT_HEADERS.join(',')];
  for (const s of agg.sites) {
    const base = FIELDS.map((k) => cell(s.row[k]));
    const calc = [
      plain1(s.rateT), // earnedRate (%)
      plain1(s.gapT), // progressGap (pp)
      s.status,
      plain1(s.monthlyT), // monthlyEarned (백만원), 계산 불가는 빈 칸
    ];
    lines.push([...base, ...calc].join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

export function csvFileName(all: SiteRow[], f: Filters): string {
  const parts = [f.month, f.region || '전체지역', f.type || '전체유형', f.siteId || '전체현장'];
  return `현장공정기성_${parts.join('_')}.csv`;
}
