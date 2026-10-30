import { aggregateFor, trendFor } from './filter';
import { fixed1 } from './format';
import { FIELDS, type Filters, type SiteRow } from './types';

const TREND_WORDS = /추이|추세|회복|변화|월별|지난|늘|줄|증가|감소|개선|악화|전월|이전|최근|동안|\d+\s*월|좁|벌어|나아|호전|정체/;

/** 추이 질문인지 판단한다 (질문 속 단어로 판단, 틀려도 AI가 보낸 범위를 안내하도록 지침을 둔다). */
export function isTrendQuestion(q: string): boolean {
  return TREND_WORDS.test(q);
}

export interface SitePayload {
  siteId: string;
  siteName: string;
  기준월: string;
  계획공정률: string;
  실제공정률: string;
  공정차이: string;
  기성률: string;
  누적기성액: string;
  당월기성액: string;
  상태: string;
}

export interface MonthSummary {
  month: string;
  기성률: string;
  계획공정률: string;
  실제공정률: string;
  공정차이: string;
  누적기성액: string;
  당월기성액: string;
  정상: number;
  주의: number;
  점검: number;
}

export interface AskPayload {
  scope: { month: string; region: string; type: string; siteId: string };
  /** 프로그램이 계산한 값 */
  computed: {
    sites: SitePayload[];
    total: Omit<MonthSummary, 'month'> | null;
  };
  /** 자료의 원문 행(선택 월) */
  rawRows: SiteRow[];
  /** 추이 질문일 때만: 시작 월~선택 월 요약 */
  monthlySummary?: MonthSummary[];
  /** 추이 질문이고 한 현장을 골랐을 때만: 그 현장의 월별 원문 기록 */
  siteMonthlyRecords?: SiteRow[];
  /** 화면의 '참고한 기록 필드' 표시용 */
  fieldsSent: string[];
}

function summaryOf(month: string, all: SiteRow[], f: Filters) {
  const a = aggregateFor(all, f, month);
  if (!a) return null;
  const gap = a.gapT;
  return {
    기성률: `${fixed1(a.rateT)}%`,
    계획공정률: `${fixed1(a.plannedT)}%`,
    실제공정률: `${fixed1(a.actualT)}%`,
    공정차이: `${gap > 0 ? '+' : ''}${fixed1(gap)}pp`,
    누적기성액: `${fixed1(a.earnedT)}백만원`,
    당월기성액: a.monthlyT === null ? '계산 불가' : `${fixed1(a.monthlyT)}백만원`,
    정상: a.normal,
    주의: a.caution,
    점검: a.inspect,
  };
}

export function buildPayload(all: SiteRow[], f: Filters, question: string): AskPayload | null {
  const agg = aggregateFor(all, f);
  if (!agg) return null;
  const sites: SitePayload[] = agg.sites.map((s) => ({
    siteId: s.row.siteId,
    siteName: s.row.siteName,
    기준월: s.row.month,
    계획공정률: `${s.row.plannedProgress.toFixed(1)}%`,
    실제공정률: `${s.row.actualProgress.toFixed(1)}%`,
    공정차이: `${s.gapT > 0 ? '+' : ''}${fixed1(s.gapT)}pp`,
    기성률: `${fixed1(s.rateT)}%`,
    누적기성액: `${fixed1(Math.round(s.row.cumulativeEarned * 10))}백만원`,
    당월기성액: s.monthlyT === null ? '계산 불가' : `${fixed1(s.monthlyT)}백만원`,
    상태: s.status,
  }));

  const payload: AskPayload = {
    scope: { month: f.month, region: f.region || '전체', type: f.type || '전체', siteId: f.siteId || '전체' },
    computed: { sites, total: summaryOf(f.month, all, f) },
    rawRows: agg.sites.map((s) => s.row),
    fieldsSent: ['currentWork', 'issueCategory', 'issueSummary', 'actionPlan'],
  };

  if (isTrendQuestion(question)) {
    payload.monthlySummary = trendFor(all, f).map((p) => ({ month: p.month, ...(summaryOf(p.month, all, f) as object) })) as MonthSummary[];
    if (f.siteId) {
      payload.siteMonthlyRecords = all
        .filter((r) => r.siteId === f.siteId && r.month <= f.month)
        .sort((a, b) => a.month.localeCompare(b.month));
    }
  }
  return payload;
}

export const PAYLOAD_LIMITS = { question: 500, rawRows: 12, monthlySummary: 12, siteMonthlyRecords: 12 };

/** 서버에서 받은 payload의 모양과 크기를 확인한다. 문제가 있으면 이유를 돌려준다. */
export function checkPayloadShape(p: unknown): string | null {
  if (!p || typeof p !== 'object') return '요청 형식이 올바르지 않습니다.';
  const o = p as Record<string, unknown>;
  if (!o.scope || typeof o.scope !== 'object') return '범위 정보가 없습니다.';
  const c = o.computed as { sites?: unknown } | undefined;
  if (!c || !Array.isArray(c.sites)) return '계산 결과가 없습니다.';
  if (!Array.isArray(o.rawRows) || o.rawRows.length === 0 || o.rawRows.length > PAYLOAD_LIMITS.rawRows) return '원문 행 수가 올바르지 않습니다.';
  if (o.monthlySummary !== undefined && (!Array.isArray(o.monthlySummary) || o.monthlySummary.length > PAYLOAD_LIMITS.monthlySummary))
    return '월별 요약이 올바르지 않습니다.';
  if (o.siteMonthlyRecords !== undefined && (!Array.isArray(o.siteMonthlyRecords) || o.siteMonthlyRecords.length > PAYLOAD_LIMITS.siteMonthlyRecords))
    return '월별 기록이 올바르지 않습니다.';
  for (const r of o.rawRows as Record<string, unknown>[]) {
    for (const k of FIELDS) if (!(k in r)) return '원문 행에 필수 열이 없습니다.';
  }
  return null;
}
