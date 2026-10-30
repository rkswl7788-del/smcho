import { toTenths } from './calc';
import type { RawParse } from './parse';
import {
  FIELDS,
  MONTH_MAX,
  MONTH_MIN,
  PROJECT_TYPES,
  REGIONS,
  type FieldName,
  type Issue,
  type SiteRow,
} from './types';

export interface ValidationResult {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  notes: string[];
  rows: SiteRow[];
  recordCount: number;
  columnCount: number;
  months: string[];
  siteCount: number;
}

const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const NUM_RE = /^-?\d+(\.\d+)?$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && NUM_RE.test(v.trim())) return Number(v.trim());
  return null;
}

function validDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function lastDayOf(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(d).padStart(2, '0')}`;
}

function nextMonth(m: string): string {
  const [y, mm] = m.split('-').map(Number);
  const d = new Date(Date.UTC(y, mm, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const NUMERIC_FIELDS: FieldName[] = ['contractAmount', 'plannedProgress', 'actualProgress', 'cumulativeEarned'];

export function validate(raw: RawParse): ValidationResult {
  const errors: Issue[] = [...raw.issues];
  const warnings: Issue[] = [];
  const notes: string[] = [];
  const where = (i: number) => (raw.origin === 'csv' ? `${i + 2}행` : `${i + 1}번째 항목`);

  const fail = (): ValidationResult => ({
    ok: false,
    errors,
    warnings,
    notes,
    rows: [],
    recordCount: raw.records.length,
    columnCount: raw.header?.length ?? 0,
    months: [],
    siteCount: 0,
  });

  // 1) 메타데이터·머리글
  if (raw.origin === 'csv') {
    notes.push('CSV에는 단위 정보가 없어 데이터설명.md의 기준(금액 백만원, 공정률 %)을 적용했습니다.');
    const header = raw.header ?? [];
    for (const f of FIELDS) {
      if (!header.includes(f)) errors.push({ where: '파일', field: f, message: `필수 열 '${f}'가 없습니다.` });
    }
  } else {
    const md = raw.metadata;
    if (!md) {
      errors.push({ where: '파일', message: 'JSON metadata가 없습니다.' });
    } else {
      if (md.schemaVersion !== '2.0') errors.push({ where: '파일', field: 'schemaVersion', message: "schemaVersion이 '2.0'이 아닙니다." });
      if (md.moneyUnit !== '백만원') errors.push({ where: '파일', field: 'moneyUnit', message: "JSON 정보의 금액 단위가 '백만원'이 아닙니다." });
      if (md.progressUnit !== 'percent_0_100')
        errors.push({ where: '파일', field: 'progressUnit', message: "JSON 정보의 공정률 단위가 'percent_0_100'이 아닙니다." });
      const rf = md.requiredFields;
      if (!Array.isArray(rf) || !FIELDS.every((f) => rf.includes(f)))
        errors.push({ where: '파일', field: 'requiredFields', message: 'JSON 정보의 requiredFields가 15개 필수 열과 다릅니다.' });
    }
  }
  if (errors.some((e) => e.where === '파일' && e.field && raw.origin === 'csv')) return fail(); // 열이 없으면 행 검사를 건너뜀

  if (raw.records.length === 0) {
    errors.push({ where: '파일', message: '자료 행이 없습니다.' });
    return fail();
  }

  // 2) 행 단위 검사
  const valid: { row: SiteRow; at: string }[] = [];
  raw.records.forEach((rec, i) => {
    const at = where(i);
    const before = errors.length;
    const bad = (field: string, message: string) => errors.push({ where: at, field, message });

    const str: Partial<Record<FieldName, string>> = {};
    const num: Partial<Record<FieldName, number>> = {};
    for (const f of FIELDS) {
      const v = rec[f];
      if (isBlank(v)) {
        bad(f, '값이 비어 있습니다. 0으로 바꾸지 않습니다.');
        continue;
      }
      if (NUMERIC_FIELDS.includes(f)) {
        const n = toNumber(v);
        if (n === null) bad(f, `'${String(v)}'은(는) 숫자가 아닙니다.`);
        else num[f] = n;
      } else {
        str[f] = String(v).trim();
      }
    }

    const month = str.month;
    if (month !== undefined) {
      if (!MONTH_RE.test(month)) bad('month', `'${month}'은(는) 올바른 월(YYYY-MM)이 아닙니다.`);
      else if (month < MONTH_MIN || month > MONTH_MAX) bad('month', `${month}은(는) ${MONTH_MIN}~${MONTH_MAX} 범위를 벗어납니다.`);
    }
    if (str.siteId !== undefined && !/^[A-L]$/.test(str.siteId)) bad('siteId', `'${str.siteId}'은(는) A~L 현장 ID가 아닙니다.`);
    if (str.siteName !== undefined && !str.siteName.includes('[가상]')) bad('siteName', "현장명에 '[가상]' 표시가 없습니다.");
    if (str.region !== undefined && !(REGIONS as readonly string[]).includes(str.region)) bad('region', `'${str.region}'은(는) 허용된 지역이 아닙니다.`);
    if (str.projectType !== undefined && !(PROJECT_TYPES as readonly string[]).includes(str.projectType))
      bad('projectType', `'${str.projectType}'은(는) 허용된 공사 유형이 아닙니다.`);

    const { contractAmount: ca, plannedProgress: pp, actualProgress: ap, cumulativeEarned: ce } = num;
    if (ca !== undefined && !(ca > 0)) bad('contractAmount', `${ca}은(는) 0보다 커야 합니다.`);
    if (pp !== undefined && (pp < 0 || pp > 100)) bad('plannedProgress', `${pp}은(는) 0~100 범위를 벗어납니다.`);
    if (ap !== undefined && (ap < 0 || ap > 100)) bad('actualProgress', `${ap}은(는) 0~100 범위를 벗어납니다.`);
    if (ce !== undefined) {
      if (ce < 0) bad('cumulativeEarned', `${ce}은(는) 0 이상이어야 합니다.`);
      else if (ca !== undefined && ce > ca) bad('cumulativeEarned', `누적기성액 ${ce}이(가) 계약금액 ${ca}보다 큽니다.`);
    }

    const sd = str.startDate;
    const ed = str.contractEndDate;
    if (sd !== undefined && !validDate(sd)) bad('startDate', `'${sd}'은(는) 올바른 날짜(YYYY-MM-DD)가 아닙니다.`);
    if (ed !== undefined && !validDate(ed)) bad('contractEndDate', `'${ed}'은(는) 올바른 날짜(YYYY-MM-DD)가 아닙니다.`);
    if (sd && ed && validDate(sd) && validDate(ed)) {
      if (sd >= ed) bad('startDate', '착공일이 계약상 준공일보다 늦거나 같습니다.');
      if (month && MONTH_RE.test(month) && lastDayOf(month) < sd) bad('month', `기준 월말(${lastDayOf(month)})이 착공일(${sd})보다 이릅니다.`);
    }

    if (errors.length === before) valid.push({ at, row: { ...(str as Record<string, string>), ...(num as Record<string, number>) } as unknown as SiteRow });
  });

  // 3) 전체 일관성 검사 (오류 없는 행끼리)
  const seen = new Map<string, string>();
  const first = new Map<string, SiteRow>();
  for (const { row, at } of valid) {
    const key = `${row.month}|${row.siteId}`;
    if (seen.has(key)) {
      errors.push({ where: at, field: 'month,siteId', message: `${row.month} / ${row.siteId} 행이 ${seen.get(key)}과 중복됩니다.` });
      continue;
    }
    seen.set(key, at);
    const base = first.get(row.siteId);
    if (!base) {
      first.set(row.siteId, row);
    } else {
      const fixed: FieldName[] = ['siteName', 'region', 'projectType', 'contractAmount', 'startDate', 'contractEndDate'];
      for (const f of fixed) {
        if (base[f] !== row[f]) errors.push({ where: at, field: f, message: `${row.siteId} 현장의 ${f}이(가) 다른 행(${base[f]})과 다릅니다(${row[f]}).` });
      }
    }
  }

  // 월별로 줄어드는 값 검사
  const bySite = new Map<string, { row: SiteRow; at: string }[]>();
  for (const v of valid) {
    if (!bySite.has(v.row.siteId)) bySite.set(v.row.siteId, []);
    bySite.get(v.row.siteId)!.push(v);
  }
  for (const [siteId, list] of bySite) {
    list.sort((a, b) => a.row.month.localeCompare(b.row.month));
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1].row;
      const b = list[i].row;
      if (a.month === b.month) continue;
      const dec: [FieldName, number, number][] = [
        ['plannedProgress', a.plannedProgress, b.plannedProgress],
        ['actualProgress', a.actualProgress, b.actualProgress],
        ['cumulativeEarned', a.cumulativeEarned, b.cumulativeEarned],
      ];
      for (const [f, x, y] of dec) {
        if (toTenths(y) < toTenths(x)) errors.push({ where: list[i].at, field: f, message: `${siteId}의 ${b.month} ${f}이(가) 전월(${a.month})보다 줄었습니다.` });
      }
    }
  }

  // 4) 경고: 월 누락
  const months = Array.from(new Set(valid.map((v) => v.row.month))).sort();
  if (months.length > 0) {
    const expected: string[] = [];
    for (let m = months[0]; m <= months[months.length - 1]; m = nextMonth(m)) expected.push(m);
    for (const [siteId, list] of bySite) {
      const have = new Set(list.map((l) => l.row.month));
      const missing = expected.filter((m) => !have.has(m));
      if (missing.length > 0)
        warnings.push({ where: siteId, message: `${siteId} 현장의 ${missing.join(', ')} 행이 없습니다. 확인 가능한 행만 집계하며, 전월이 없는 값은 계산 불가입니다.` });
    }
  }

  const rows = valid
    .map((v) => v.row)
    .sort((a, b) => a.month.localeCompare(b.month) || a.siteId.localeCompare(b.siteId));
  const ok = errors.length === 0 && rows.length > 0;
  return {
    ok,
    errors,
    warnings,
    notes,
    rows: ok ? rows : [],
    recordCount: raw.records.length,
    columnCount: raw.origin === 'csv' ? (raw.header?.length ?? 0) : FIELDS.length,
    months,
    siteCount: first.size,
  };
}
