import Papa from 'papaparse';
import type { Issue } from './types';

export interface RawParse {
  origin: 'csv' | 'json';
  header?: string[]; // CSV 머리글
  metadata?: Record<string, unknown>; // JSON metadata
  records: Record<string, unknown>[];
  issues: Issue[]; // 읽는 도중 발견한 문제
}

export const stripBom = (s: string) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);

export function parseCsv(text: string): RawParse {
  const parsed = Papa.parse<Record<string, unknown>>(stripBom(text), { header: true, skipEmptyLines: true });
  const issues: Issue[] = [];
  for (const e of parsed.errors) {
    if (e.type === 'FieldMismatch') {
      issues.push({
        where: typeof e.row === 'number' ? `${e.row + 2}행` : '파일',
        message: '열 개수가 머리글과 맞지 않습니다.',
      });
    } else if (e.type === 'Delimiter') {
      continue; // 한 줄짜리 파일 등에서 나오는 안내라 무시
    } else {
      issues.push({ where: typeof e.row === 'number' ? `${e.row + 2}행` : '파일', message: `읽기 오류: ${e.message}` });
    }
  }
  return { origin: 'csv', header: parsed.meta.fields ?? [], records: parsed.data, issues };
}

export function parseJson(text: string): RawParse {
  const issues: Issue[] = [];
  let data: unknown;
  try {
    data = JSON.parse(stripBom(text));
  } catch {
    return { origin: 'json', records: [], issues: [{ where: '파일', message: 'JSON 형식이 올바르지 않습니다.' }] };
  }
  let records: unknown = data;
  let metadata: Record<string, unknown> | undefined;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    records = obj.records;
    if (obj.metadata && typeof obj.metadata === 'object') metadata = obj.metadata as Record<string, unknown>;
  }
  if (!Array.isArray(records)) {
    return { origin: 'json', metadata, records: [], issues: [{ where: '파일', message: "'records' 목록이 없습니다." }] };
  }
  const clean: Record<string, unknown>[] = [];
  records.forEach((r, i) => {
    if (r && typeof r === 'object' && !Array.isArray(r)) clean.push(r as Record<string, unknown>);
    else issues.push({ where: `${i + 1}번째 항목`, message: '항목 형식이 올바르지 않습니다.' });
  });
  return { origin: 'json', metadata, records: clean, issues };
}

/** 파일 이름·내용으로 CSV/JSON을 구별해 읽는다. 확장자는 호출하는 쪽이 이미 확인한다. */
export function parseByName(fileName: string, text: string): RawParse {
  return fileName.toLowerCase().endsWith('.json') ? parseJson(text) : parseCsv(text);
}
