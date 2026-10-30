'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { siteMetrics, prevMonth } from '@/lib/calc';
import { plain1 } from '@/lib/format';
import { parseByName } from '@/lib/parse';
import { validate, type ValidationResult } from '@/lib/validate';
import { FIELDS, type SiteRow } from '@/lib/types';
import { useStore } from '@/state/store';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ISSUES_SHOWN = 10;

type Stage = 'pick' | 'checked' | 'done';

function Steps({ stage }: { stage: Stage }) {
  const items = [
    { n: 1, label: '파일 선택' },
    { n: 2, label: '검사 결과·미리보기' },
    { n: 3, label: '완료' },
  ];
  const cur = stage === 'pick' ? 1 : stage === 'checked' ? 2 : 3;
  return (
    <ol className="mb-4 flex items-center gap-3" aria-label="진행 단계">
      {items.map((it) => (
        <li
          key={it.n}
          aria-current={it.n === cur ? 'step' : undefined}
          className={`flex flex-1 items-center gap-2 rounded border p-3 text-sm ${
            it.n === cur ? 'border-accent bg-blue-50 font-semibold text-accent' : it.n < cur ? 'border-frame bg-white text-slate-600' : 'border-frame bg-white text-slate-400'
          }`}
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${it.n <= cur ? 'bg-accent text-white' : 'bg-slate-200 text-slate-500'}`}>
            {it.n < cur ? '✓' : it.n}
          </span>
          STEP {it.n} · {it.label}
        </li>
      ))}
    </ol>
  );
}

function Preview({ rows }: { rows: SiteRow[] }) {
  const [tab, setTab] = useState<'latest' | 'all'>('latest');
  const latest = rows.reduce((m, r) => (r.month > m ? r.month : m), '');
  const shown = tab === 'latest' ? rows.filter((r) => r.month === latest) : rows;
  const byKey = new Map(rows.map((r) => [`${r.month}|${r.siteId}`, r]));
  const head = [...FIELDS, 'earnedRate', 'progressGap', 'status', 'monthlyEarned'];
  const trunc = (s: string) => (s.length > 18 ? `${s.slice(0, 18)}…` : s);

  return (
    <section className="card mt-4 p-4" aria-label="미리보기">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="mr-auto text-base font-semibold text-navy">미리보기 (원본 15개 열 + 계산 4개 열 = 19개 열)</h2>
        <button
          type="button"
          onClick={() => setTab('latest')}
          className={`rounded border px-3 py-1 text-xs ${tab === 'latest' ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white'}`}
        >
          {latest} 기준 {rows.filter((r) => r.month === latest).length}개 현장
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`rounded border px-3 py-1 text-xs ${tab === 'all' ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white'}`}
        >
          전체 {rows.length}행
        </button>
      </div>
      <div className="max-h-96 overflow-auto border border-frame">
        <table className="min-w-full text-xs" data-testid="preview-table">
          <thead className="sticky top-0 bg-slate-100">
            <tr>
              {head.map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const m = siteMetrics(r, byKey.get(`${prevMonth(r.month)}|${r.siteId}`));
              return (
                <tr key={`${r.month}|${r.siteId}`} className="border-t border-frame">
                  {FIELDS.map((f) => (
                    <td key={f} className="whitespace-nowrap px-2 py-1" title={String(r[f])}>
                      {typeof r[f] === 'string' ? trunc(r[f] as string) : r[f]}
                    </td>
                  ))}
                  <td className="px-2 py-1">{plain1(m.rateT)}</td>
                  <td className="px-2 py-1">{plain1(m.gapT)}</td>
                  <td className="px-2 py-1">{m.status}</td>
                  <td className="px-2 py-1">{m.monthlyT === null ? '(계산 불가)' : plain1(m.monthlyT)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ImportPage() {
  const { rows, setRows } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('pick');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);

  const reset = () => {
    setStage('pick');
    setFileName('');
    setResult(null);
    setRejected(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setResult(null);
    setRejected(null);
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.json')) {
      setStage('pick');
      setRejected('CSV 또는 JSON 파일만 가져올 수 있습니다.');
      return;
    }
    if (file.size === 0) {
      setStage('pick');
      setRejected('비어 있는 파일입니다.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setStage('pick');
      setRejected('파일이 5MB를 넘어 가져올 수 없습니다.');
      return;
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    } catch {
      setStage('pick');
      setRejected('글자를 읽을 수 없습니다. UTF-8로 저장한 파일을 가져오세요.');
      return;
    }
    setResult(validate(parseByName(file.name, text)));
    setStage('checked');
  };

  const apply = () => {
    if (!result?.ok) return;
    setRows(result.rows);
    setAppliedCount(result.rows.length);
    setStage('done');
  };

  const hasErrors = !!result && !result.ok;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-navy">자료 가져오기</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        CSV 또는 JSON 파일을 검사하고 미리 본 뒤 지금 자료 전체를 바꿉니다. 오류가 있거나 취소하면 지금 자료를 그대로 둡니다.
      </p>
      <Steps stage={stage} />

      <section className="card p-4" aria-label="지금 자료">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span data-testid="current-data">
            지금 자료: <b>{rows ? `${rows.length}행` : '없음'}</b>
          </span>
          {stage !== 'done' && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                data-testid="file-input"
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {stage === 'pick' ? '파일 고르기' : '다른 파일 선택'}
              </button>
            </>
          )}
        </div>
      </section>

      {rejected && (
        <section className="mt-4 rounded border border-inspect-border bg-inspect-bg p-4 text-sm text-inspect" role="alert" data-testid="import-rejected">
          <b>가져오기 오류</b> · {fileName}
          <p className="mt-1">{rejected}</p>
          <p className="mt-1 font-medium">지금 자료는 유지됩니다.</p>
        </section>
      )}

      {stage === 'checked' && result && (
        <>
          <section className="card mt-4 p-4" aria-label="검사 결과">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-base font-semibold text-navy">검사 결과 · {fileName}</h2>
              <span className={`rounded px-2 py-1 text-xs font-semibold ${hasErrors ? 'bg-inspect-bg text-inspect' : 'bg-normal-bg text-normal'}`} data-testid="import-verdict">
                {hasErrors ? '검증 실패: 반영할 수 없음' : '검증 합격: 반영 가능'}
              </span>
            </div>
            <dl className="grid grid-cols-5 gap-3 text-center text-sm" data-testid="import-summary">
              <div className="rounded border border-frame p-2">
                <dt className="text-xs text-slate-500">행 수</dt>
                <dd className="text-lg font-semibold text-navy">{result.recordCount}행</dd>
              </div>
              <div className="rounded border border-frame p-2">
                <dt className="text-xs text-slate-500">열 수</dt>
                <dd className="text-lg font-semibold text-navy">{result.columnCount}개 열</dd>
              </div>
              <div className="rounded border border-frame p-2">
                <dt className="text-xs text-slate-500">월 범위</dt>
                <dd className="text-lg font-semibold text-navy">{result.months.length ? `${result.months[0]} ~ ${result.months[result.months.length - 1]}` : '-'}</dd>
              </div>
              <div className="rounded border border-frame p-2">
                <dt className="text-xs text-slate-500">현장 수</dt>
                <dd className="text-lg font-semibold text-navy">{result.siteCount}개 현장</dd>
              </div>
              <div className="rounded border border-frame p-2">
                <dt className="text-xs text-slate-500">오류 · 경고</dt>
                <dd className="text-lg font-semibold text-navy">
                  오류 {result.errors.length}건 · 경고 {result.warnings.length}건
                </dd>
              </div>
            </dl>
            {result.notes.map((n) => (
              <p key={n} className="mt-2 text-xs text-slate-500">
                {n}
              </p>
            ))}

            {hasErrors && (
              <div className="mt-4" role="alert" data-testid="import-errors">
                <p className="mb-2 text-sm font-semibold text-inspect">어느 행의 무엇이 문제인지 확인하세요. 지금 자료는 유지됩니다.</p>
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-xs text-slate-600">
                    <tr>
                      <th className="px-2 py-1 text-left">위치</th>
                      <th className="px-2 py-1 text-left">열</th>
                      <th className="px-2 py-1 text-left">문제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.slice(0, MAX_ISSUES_SHOWN).map((e, i) => (
                      <tr key={i} className="border-t border-frame">
                        <td className="whitespace-nowrap px-2 py-1 font-semibold">{e.where}</td>
                        <td className="whitespace-nowrap px-2 py-1">{e.field ?? '-'}</td>
                        <td className="px-2 py-1">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.errors.length > MAX_ISSUES_SHOWN && (
                  <p className="mt-1 text-xs text-slate-500">외 {result.errors.length - MAX_ISSUES_SHOWN}건</p>
                )}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="mt-4 rounded bg-caution-bg p-3 text-xs text-caution" data-testid="import-warnings">
                {result.warnings.map((w, i) => (
                  <p key={i}>경고 · {w.message}</p>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={reset} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">
                취소하고 기존 자료 유지
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={!result.ok}
                data-testid="apply-button"
                className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                반영하기 ({result.ok ? `${result.rows.length}행 교체` : '불가'})
              </button>
            </div>
          </section>

          {result.ok && <Preview rows={result.rows} />}
        </>
      )}

      {stage === 'done' && (
        <section className="card mt-4 p-6 text-center" role="status" data-testid="import-done">
          <div className="text-lg font-semibold text-normal">완료</div>
          <p className="mt-1 text-sm text-slate-700">
            <b>{appliedCount}행</b>으로 교체했습니다. (누적하지 않고 전체를 바꿨습니다.)
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/" className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              현황 요약 보기
            </Link>
            <button type="button" onClick={reset} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">
              다른 파일 가져오기
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
