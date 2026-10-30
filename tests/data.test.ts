import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { aggregate, inspectionRanking, statusFromGapT, toTenths } from '@/lib/calc';
import { aggregateFor, normalizeFilters, rowsForMonth, sitesInScope, trendFor } from '@/lib/filter';
import { fixed1, pct, pp } from '@/lib/format';
import { parseCsv, parseJson } from '@/lib/parse';
import { validate } from '@/lib/validate';
import { buildCsv, EXPORT_HEADERS } from '@/lib/exportCsv';
import { buildPayload, checkPayloadShape, isTrendQuestion } from '@/lib/aiPayload';
import type { Filters, SiteRow } from '@/lib/types';
import Papa from 'papaparse';

const dataDir = path.resolve(__dirname, '..', 'data');
const read = (...p: string[]) => readFileSync(path.join(dataDir, ...p), 'utf8');

const csvResult = validate(parseCsv(read('현장공정기성.csv')));
const all: SiteRow[] = csvResult.rows;
const F = (over: Partial<Filters> = {}): Filters => ({ month: '2026-09', region: '', type: '', siteId: '', ...over });

describe('가져오기: 정상 자료', () => {
  it('CSV는 오류 0건, 144행·15열·12현장', () => {
    expect(csvResult.errors).toEqual([]);
    expect(csvResult.ok).toBe(true);
    expect(csvResult.rows).toHaveLength(144);
    expect(csvResult.columnCount).toBe(15);
    expect(csvResult.siteCount).toBe(12);
    expect(csvResult.warnings).toEqual([]);
  });
  it('JSON도 오류 0건, 144행이고 CSV와 같은 값', () => {
    const j = validate(parseJson(read('현장공정기성.json')));
    expect(j.errors).toEqual([]);
    expect(j.rows).toHaveLength(144);
    expect(j.rows).toEqual(csvResult.rows);
  });
  it('JSON 정보(metadata)가 틀리면 거부', () => {
    const obj = JSON.parse(read('현장공정기성.json'));
    obj.metadata.moneyUnit = '억원';
    const r = validate(parseJson(JSON.stringify(obj)));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.field === 'moneyUnit')).toBe(true);
  });
});

describe('가져오기: 오류 파일 3종은 모두 거부', () => {
  it('공정률 101 → 134행 actualProgress 범위 오류', () => {
    const r = validate(parseCsv(read('검증용_오류데이터', '오류_공정률101.csv')));
    expect(r.ok).toBe(false);
    expect(r.rows).toEqual([]);
    expect(r.errors).toContainEqual(expect.objectContaining({ where: '134행', field: 'actualProgress' }));
  });
  it('공정률 빈값 → 134행 actualProgress 필수값 오류(0으로 바꾸지 않음)', () => {
    const r = validate(parseCsv(read('검증용_오류데이터', '오류_공정률빈값.csv')));
    expect(r.ok).toBe(false);
    const e = r.errors.find((x) => x.where === '134행' && x.field === 'actualProgress');
    expect(e?.message).toContain('비어 있습니다');
  });
  it('중복키 → 146행 중복 오류', () => {
    const r = validate(parseCsv(read('검증용_오류데이터', '오류_중복키.csv')));
    expect(r.ok).toBe(false);
    expect(r.errors).toContainEqual(expect.objectContaining({ where: '146행', field: 'month,siteId' }));
  });
  it('계약금액 0, 필수 열 없음, 줄어드는 누적값, 월 누락 경고', () => {
    const lines = read('현장공정기성.csv').split(/\r?\n/);
    const edit = (row: number, col: number, v: string) => {
      const cp = [...lines];
      const cells = Papa.parse<string[]>(cp[row]).data[0];
      cells[col] = v;
      cp[row] = Papa.unparse([cells]);
      return cp.join('\n');
    };
    const zero = validate(parseCsv(edit(1, 3, '0')));
    expect(zero.errors.some((e) => e.field === 'contractAmount')).toBe(true);
    const noCol = validate(parseCsv(read('현장공정기성.csv').replace('actionPlan', 'xx')));
    expect(noCol.ok).toBe(false);
    expect(noCol.errors[0].message).toContain("필수 열 'actionPlan'");
    // J의 8월(131행 → 인덱스 130) 누적기성액을 전월보다 작게
    const dec = validate(parseCsv(edit(130, 6, '100')));
    expect(dec.errors.some((e) => e.field === 'cumulativeEarned')).toBe(true);
    // 한 행을 빼면 경고만(오류 아님)
    const miss = [...lines];
    miss.splice(60, 1);
    const w = validate(parseCsv(miss.join('\n')));
    expect(w.ok).toBe(true);
    expect(w.warnings.length).toBe(1);
  });
});

describe('계산: 월별 전체 (검산표)', () => {
  const expectMonth = (month: string, earned: string, rate: string, plan?: string, actual?: string, gap?: string, monthly?: string) => {
    const a = aggregateFor(all, F({ month }))!;
    expect(fixed1(a.earnedT)).toBe(earned);
    expect(pct(a.rateT)).toBe(rate);
    if (plan) expect(pct(a.plannedT)).toBe(plan);
    if (actual) expect(pct(a.actualT)).toBe(actual);
    if (gap) expect(pp(a.gapT)).toBe(gap);
    if (monthly) expect(fixed1(a.monthlyT)).toBe(monthly);
  };
  it('2026-09', () => {
    const a = aggregateFor(all, F())!;
    expect(fixed1(a.contractT)).toBe('630,700.0');
    expectMonth('2026-09', '424,063.4', '67.2%', '73.2%', '71.2%', '-2.0pp', '28,878.7');
    expect([a.normal, a.caution, a.inspect]).toEqual([6, 3, 3]);
  });
  it('2026-08, 2026-07, 그 밖의 달', () => {
    expectMonth('2026-08', '395,184.7', '62.7%', '69.9%', '67.6%', '-2.3pp', '30,466.2');
    expectMonth('2026-07', '364,718.5', '57.8%', '65.8%', '63.2%', '-2.6pp', '29,373.6');
    expectMonth('2025-11', '125,857.8', '20.0%', '22.8%', '23.2%', '+0.3pp', '20,408.1');
    expectMonth('2026-03', '233,981.1', '37.1%', '42.4%', '41.6%', '-0.8pp', '31,132.2');
  });
  it('모든 달의 상태 곳 수가 검산표와 같다', () => {
    const exp: Record<string, [number, number, number]> = {
      '2025-10': [10, 2, 0], '2025-11': [10, 2, 0], '2025-12': [9, 3, 0], '2026-01': [9, 3, 0],
      '2026-02': [8, 4, 0], '2026-03': [8, 3, 1], '2026-04': [8, 2, 2], '2026-05': [8, 1, 3],
      '2026-06': [7, 2, 3], '2026-07': [6, 2, 4], '2026-08': [6, 2, 4], '2026-09': [6, 3, 3],
    };
    for (const [m, e] of Object.entries(exp)) {
      const a = aggregateFor(all, F({ month: m }))!;
      expect([a.normal, a.caution, a.inspect]).toEqual(e);
    }
  });
  it('2025-10은 당월기성액 계산 불가, 누적 지표는 표시', () => {
    const a = aggregateFor(all, F({ month: '2025-10' }))!;
    expect(a.monthlyT).toBeNull();
    expect(fixed1(a.monthlyT)).toBe('계산 불가');
    expect(fixed1(a.earnedT)).toBe('105,449.7');
    expect(pct(a.rateT)).toBe('16.7%');
    a.sites.forEach((s) => expect(s.monthlyT).toBeNull());
  });
  it('전체 공정차이는 반올림된 두 공정률을 다시 빼지 않는다(반올림 전 값끼리)', () => {
    const a = aggregateFor(all, F())!;
    expect(pp(a.gapT)).toBe('-2.0pp');
  });
});

describe('계산: 현장별·상태·순서', () => {
  it('9월 현장별 값', () => {
    const a = aggregateFor(all, F())!;
    const by = Object.fromEntries(a.sites.map((s) => [s.row.siteId, s]));
    expect(pct(by.D.rateT)).toBe('69.4%');
    expect(pp(by.D.gapT)).toBe('-10.7pp');
    expect(by.D.status).toBe('점검');
    expect(fixed1(by.D.monthlyT)).toBe('3,339.6');
    expect(pp(by.A.gapT)).toBe('+1.7pp');
    expect(by.F.status).toBe('주의');
    expect(by.J.status).toBe('주의');
    expect(by.L.status).toBe('정상');
    expect(by.E.status).toBe('정상');
  });
  it('경계값: 70/70 정상, 65.1 주의, 65 점검', () => {
    expect(statusFromGapT(toTenths(70) - toTenths(70))).toBe('정상');
    expect(statusFromGapT(toTenths(65.1) - toTenths(70))).toBe('주의');
    expect(statusFromGapT(toTenths(65) - toTenths(70))).toBe('점검');
  });
  it('점검 순서 D → I → K, 동점이면 ID 순', () => {
    const rank = inspectionRanking(aggregateFor(all, F())!);
    expect(rank.map((s) => s.row.siteId)).toEqual(['D', 'I', 'K']);
    expect(rank.map((s) => pp(s.gapT))).toEqual(['-10.7pp', '-7.6pp', '-5.4pp']);
    const mk = (id: string): SiteRow => ({ ...all.find((r) => r.siteId === 'A')!, siteId: id, plannedProgress: 70, actualProgress: 60 });
    const tie = aggregate([mk('C'), mk('B')], []);
    expect(inspectionRanking(tie).map((s) => s.row.siteId)).toEqual(['B', 'C']);
  });
  it('J의 7월 당월기성액은 0.0(정상값)이고 계산 불가와 구별된다', () => {
    const a = aggregateFor(all, F({ month: '2026-07' }))!;
    const j = a.sites.find((s) => s.row.siteId === 'J')!;
    expect(j.monthlyT).toBe(0);
    expect(fixed1(j.monthlyT)).toBe('0.0');
  });
  it('D의 최근 공정차이 8월 -11.2pp → 9월 -10.7pp', () => {
    const d = (m: string) => aggregateFor(all, F({ month: m, siteId: 'D' }))!.sites[0];
    expect(pp(d('2026-08').gapT)).toBe('-11.2pp');
    expect(pp(d('2026-09').gapT)).toBe('-10.7pp');
  });
  it('분모가 없으면 null(0%로 대체하지 않음)', () => {
    expect(aggregateFor(all, F({ region: '인천', type: '업무시설' }))).toBeNull();
  });
});

describe('필터', () => {
  it('인천·공동주택은 A·G 2곳', () => {
    const rows = rowsForMonth(all, F({ region: '인천', type: '공동주택' }), '2026-09');
    expect(rows.map((r) => r.siteId)).toEqual(['A', 'G']);
  });
  it('지역별 9월 집계가 검산표와 같다', () => {
    const exp: Record<string, [number, string, string]> = {
      인천: [2, '113,211.9', '61.2%'], 경기: [4, '144,189.2', '68.5%'], 충남: [2, '40,717.9', '73.5%'],
      충북: [1, '34,963.2', '60.7%'], 세종: [1, '30,034.8', '92.7%'], 강원: [1, '39,446.0', '60.5%'], 대전: [1, '21,500.4', '87.4%'],
    };
    for (const [region, [n, earned, rate]] of Object.entries(exp)) {
      const a = aggregateFor(all, F({ region }))!;
      expect(a.count).toBe(n);
      expect(fixed1(a.earnedT)).toBe(earned);
      expect(pct(a.rateT)).toBe(rate);
    }
  });
  it('지역을 바꿔 선택 현장이 빠지면 현장을 전체로 되돌린다', () => {
    const r = normalizeFilters(all, F({ siteId: 'D', region: '인천' }));
    expect(r.siteReset).toBe(true);
    expect(r.filters.siteId).toBe('');
    expect(normalizeFilters(all, F({ siteId: 'A', region: '인천' })).siteReset).toBe(false);
    expect(sitesInScope(all, F({ region: '인천' })).map((s) => s.siteId)).toEqual(['A', 'G']);
  });
  it('추이: 9월 전체는 12개월, 3월은 6개월', () => {
    expect(trendFor(all, F())).toHaveLength(12);
    expect(trendFor(all, F({ month: '2026-03' }))).toHaveLength(6);
    expect(trendFor(all, F())[0].agg!.monthlyT).toBeNull();
    expect(trendFor(all, F())[1].agg!.monthlyT).not.toBeNull();
  });
  it('9월 전체 비교표는 12행', () => {
    expect(rowsForMonth(all, F(), '2026-09')).toHaveLength(12);
  });
});

describe('CSV 내보내기', () => {
  const parse = (s: string) => Papa.parse<string[]>(s.replace(/^﻿/, ''), { skipEmptyLines: true }).data;
  it('BOM·CRLF·19개 열', () => {
    const csv = buildCsv(all, F())!;
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('\r\n');
    const rows = parse(csv);
    expect(rows[0]).toEqual([...EXPORT_HEADERS]);
    expect(rows[0]).toHaveLength(19);
    expect(rows).toHaveLength(13);
  });
  it('D만 → 데이터 1행, 계산 열 값', () => {
    const rows = parse(buildCsv(all, F({ siteId: 'D' }))!);
    expect(rows).toHaveLength(2);
    const r = Object.fromEntries(rows[0].map((h, i) => [h, rows[1][i]]));
    expect(r.siteId).toBe('D');
    expect(r.earnedRate).toBe('69.4');
    expect(r.progressGap).toBe('-10.7');
    expect(r.status).toBe('점검');
    expect(r.monthlyEarned).toBe('3339.6');
    expect(r.issueSummary).toContain('골조 자재 공급 정상화');
  });
  it('인천·공동주택 → 데이터 2행', () => {
    expect(parse(buildCsv(all, F({ region: '인천', type: '공동주택' }))!)).toHaveLength(3);
  });
  it('2025-10의 당월기성액은 빈 칸(0이 아님)', () => {
    const rows = parse(buildCsv(all, F({ month: '2025-10', siteId: 'A' }))!);
    expect(rows[1][18]).toBe('');
  });
  it('범위에 자료가 없으면 null', () => {
    expect(buildCsv(all, F({ region: '인천', type: '업무시설' }))).toBeNull();
  });
  it('내보낸 CSV를 다시 가져오면 원본 15개 열이 그대로 통과한다', () => {
    const csv = buildCsv(all, F({ month: '2026-09' }))!;
    const back = validate(parseCsv(csv));
    expect(back.errors).toEqual([]);
    expect(back.rows).toHaveLength(12);
  });
});

describe('AI 자료 고르기', () => {
  it('추이 질문 판단', () => {
    expect(isTrendQuestion('D는 회복 중인가요?')).toBe(true);
    expect(isTrendQuestion('7월 기성이 왜 늘지 않았나요?')).toBe(true);
    expect(isTrendQuestion('점검 현장은 어디인가요?')).toBe(false);
    expect(isTrendQuestion('D 현장의 기성률은?')).toBe(false);
  });
  it('추이 질문이 아니면 월별 요약을 보내지 않는다', () => {
    const p = buildPayload(all, F({ siteId: 'D' }), 'D가 늦어진 원인과 대응은?')!;
    expect(p.monthlySummary).toBeUndefined();
    expect(p.siteMonthlyRecords).toBeUndefined();
    expect(p.rawRows).toHaveLength(1);
    expect(p.rawRows[0].issueSummary).toContain('지연이 남아 있음');
    expect(p.computed.sites[0].기성률).toBe('69.4%');
  });
  it('D 회복 질문은 8·9월 요약과 한 현장 월별 기록을 함께 보낸다', () => {
    const p = buildPayload(all, F({ siteId: 'D' }), 'D는 회복 중인가요?')!;
    const m = Object.fromEntries(p.monthlySummary!.map((s) => [s.month, s.공정차이]));
    expect(m['2026-08']).toBe('-11.2pp');
    expect(m['2026-09']).toBe('-10.7pp');
    expect(p.siteMonthlyRecords).toHaveLength(12);
  });
  it('J 7월 질문은 7월 원문 기록(기성 확인 서류 보완)이 포함된다', () => {
    const p = buildPayload(all, F({ siteId: 'J' }), '7월 기성이 왜 늘지 않았나?')!;
    const jul = p.siteMonthlyRecords!.find((r) => r.month === '2026-07')!;
    expect(jul.issueSummary).toContain('기성 확인 서류 보완');
  });
  it('전체 범위 점검 질문: 9월 12행 + 계산 지표', () => {
    const p = buildPayload(all, F(), '점검 현장은?')!;
    expect(p.rawRows).toHaveLength(12);
    expect(p.computed.sites.filter((s) => s.상태 === '점검').map((s) => s.siteId)).toEqual(['D', 'I', 'K']);
    expect(checkPayloadShape(p)).toBeNull();
  });
  it('모양이 틀린 요청은 서버 확인에서 거절', () => {
    expect(checkPayloadShape(null)).not.toBeNull();
    expect(checkPayloadShape({ scope: {}, computed: { sites: [] }, rawRows: [] })).not.toBeNull();
  });
});
