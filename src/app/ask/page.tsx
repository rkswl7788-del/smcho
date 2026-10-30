'use client';

import { useState } from 'react';
import { FilterBar } from '@/components/FilterBar';
import { NoData } from '@/components/ui';
import { PAYLOAD_LIMITS, type AskPayload } from '@/lib/aiPayload';
import { monthLabel } from '@/lib/format';
import type { Filters } from '@/lib/types';
import { useStore } from '@/state/store';

const EXAMPLES: { label: string; patch?: Partial<Filters> }[] = [
  { label: 'D가 늦어진 원인과 대응은?', patch: { region: '', type: '', siteId: 'D' } },
  { label: '점검 현장은 어디인가요?' },
  { label: 'D는 회복 중인가요?', patch: { region: '', type: '', siteId: 'D' } },
];

/** AI가 마크다운 기호를 섞어 보내도 화면에는 기호 없이 보여 준다. */
function plainText(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .replace(/^\s*[*-]\s+/gm, '- ')
    .replace(/^#+\s*/gm, '');
}

function Basis({ payload }: { payload: AskPayload }) {
  return (
    <aside className="card p-4" aria-label="답변 근거" data-testid="ask-basis">
      <h2 className="text-base font-semibold text-navy">답변 근거 (프로그램이 AI에 보낸 값)</h2>
      <p className="mb-3 text-xs text-slate-500">AI가 쓴 글이 아니라, 프로그램이 계산해 보낸 값과 원문 기록을 그대로 보여 줍니다.</p>

      <dl className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-slate-50 p-2">
          <dt className="text-slate-500">기준 월</dt>
          <dd className="font-semibold text-navy" data-testid="basis-month">{payload.scope.month}</dd>
        </div>
        <div className="rounded bg-slate-50 p-2">
          <dt className="text-slate-500">범위</dt>
          <dd className="font-semibold text-navy">
            지역 {payload.scope.region} · 유형 {payload.scope.type} · 현장 {payload.scope.siteId}
          </dd>
        </div>
      </dl>

      <h3 className="mb-1 text-xs font-semibold text-slate-600">근거 숫자 (현장별)</h3>
      <div className="max-h-64 overflow-auto border border-frame">
        <table className="w-full text-xs" data-testid="basis-table">
          <thead className="sticky top-0 bg-slate-100 text-slate-600">
            <tr>
              <th className="px-2 py-1 text-left">현장</th>
              <th className="px-2 py-1 text-right">계획</th>
              <th className="px-2 py-1 text-right">실제</th>
              <th className="px-2 py-1 text-right">차이</th>
              <th className="px-2 py-1 text-right">기성률</th>
              <th className="px-2 py-1 text-left">상태</th>
            </tr>
          </thead>
          <tbody>
            {payload.computed.sites.map((s) => (
              <tr key={s.siteId} className="border-t border-frame">
                <td className="px-2 py-1 font-semibold">{s.siteId}</td>
                <td className="px-2 py-1 text-right">{s.계획공정률}</td>
                <td className="px-2 py-1 text-right">{s.실제공정률}</td>
                <td className="px-2 py-1 text-right">{s.공정차이}</td>
                <td className="px-2 py-1 text-right">{s.기성률}</td>
                <td className="px-2 py-1">{s.상태}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payload.computed.total && (
        <p className="mt-1 text-xs text-slate-600">
          전체: 기성률 {payload.computed.total.기성률} · 계획 {payload.computed.total.계획공정률} · 실제 {payload.computed.total.실제공정률} · 공정차이{' '}
          {payload.computed.total.공정차이} · 당월기성액 {payload.computed.total.당월기성액}
        </p>
      )}

      {payload.monthlySummary && (
        <>
          <h3 className="mb-1 mt-3 text-xs font-semibold text-slate-600">월별 요약 (시작 월 ~ 선택 월)</h3>
          <div className="max-h-48 overflow-auto border border-frame">
            <table className="w-full text-xs" data-testid="basis-monthly">
              <thead className="sticky top-0 bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-2 py-1 text-left">월</th>
                  <th className="px-2 py-1 text-right">공정차이</th>
                  <th className="px-2 py-1 text-right">기성률</th>
                  <th className="px-2 py-1 text-right">당월기성액</th>
                </tr>
              </thead>
              <tbody>
                {payload.monthlySummary.map((m) => (
                  <tr key={m.month} className="border-t border-frame">
                    <td className="px-2 py-1">{m.month}</td>
                    <td className="px-2 py-1 text-right">{m.공정차이}</td>
                    <td className="px-2 py-1 text-right">{m.기성률}</td>
                    <td className="px-2 py-1 text-right">{m.당월기성액}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 className="mb-1 mt-3 text-xs font-semibold text-slate-600">참고한 기록 필드</h3>
      <ul className="mb-2 flex flex-wrap gap-1 text-xs" data-testid="basis-fields">
        <li className="rounded bg-blue-50 px-2 py-0.5 text-accent">기록된 상황 (issueSummary)</li>
        <li className="rounded bg-blue-50 px-2 py-0.5 text-accent">계획된 대응 (actionPlan)</li>
        <li className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">당월 주요 공종 (currentWork)</li>
        <li className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">특이사항 분류 (issueCategory)</li>
      </ul>
      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-accent">
          원문 기록 보기 ({payload.rawRows.length}행{payload.siteMonthlyRecords ? ` + 월별 기록 ${payload.siteMonthlyRecords.length}행` : ''})
        </summary>
        <div className="mt-2 max-h-64 space-y-2 overflow-auto">
          {[...payload.rawRows, ...(payload.siteMonthlyRecords ?? [])].map((r, i) => (
            <div key={`${r.month}|${r.siteId}|${i}`} className="rounded border border-frame p-2">
              <div className="font-semibold text-navy">
                {r.month} · {r.siteId}
              </div>
              <p>
                <b>기록된 상황</b> {r.issueSummary}
              </p>
              <p>
                <b>계획된 대응</b> {r.actionPlan}
              </p>
            </div>
          ))}
        </div>
      </details>
    </aside>
  );
}

export default function AskPage() {
  const { rows, filters, ai, ask } = useStore();
  const [question, setQuestion] = useState('');
  if (!rows) return <NoData />;

  const loading = ai.status === 'loading';
  const send = (q: string, patch?: Partial<Filters>) => {
    const t = q.trim();
    if (!t || loading) return;
    setQuestion(t);
    void ask(t, patch);
  };

  return (
    <>
      <FilterBar rows={rows} />
      <section className="card mb-4 p-3 text-sm" aria-label="지금 적용 범위" data-testid="ask-scope">
        <b className="mr-2 text-navy">현재 적용 범위</b>
        기준월 {monthLabel(filters.month)} · 지역 {filters.region || '전체'} · 유형 {filters.type || '전체'} · 현장 {filters.siteId || '전체'}
        <span className="ml-2 text-xs text-slate-500">필터를 바꾸면 이전 답변을 지웁니다.</span>
        <p className="mt-1 text-xs text-slate-500">
          AI는 프로그램이 계산한 숫자와 기록된 상황·계획된 대응만 근거로 답합니다. 실제 준공일·미수금처럼 자료에 없는 내용은 "자료 없음"으로 답합니다.
        </p>
      </section>

      <section className="mb-4" aria-label="예시 질문">
        <h2 className="mb-2 text-xs font-semibold text-slate-600">예시 질문 (누르면 바로 질문합니다)</h2>
        <div className="grid grid-cols-3 gap-3">
          {EXAMPLES.map((e) => (
            <button
              key={e.label}
              type="button"
              disabled={loading}
              onClick={() => send(e.label, e.patch)}
              className="card p-3 text-left text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-50"
              data-testid="example-question"
            >
              “{e.label}”
              {e.patch?.siteId && <span className="mt-1 block text-xs font-normal text-slate-500">범위를 {e.patch.siteId} 현장으로 맞춥니다</span>}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-5 gap-4">
        <section className="card col-span-3 p-4" aria-label="질문과 답변">
          <h2 className="mb-2 text-base font-semibold text-navy">질문하기</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(question);
            }}
            className="mb-4"
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, PAYLOAD_LIMITS.question))}
              disabled={loading}
              rows={3}
              maxLength={PAYLOAD_LIMITS.question}
              placeholder="예: D 현장이 늦어진 원인과 기록된 대응 계획은 무엇인가요?"
              aria-label="질문 입력"
              data-testid="question-input"
              className="w-full rounded border border-slate-300 p-2 text-sm disabled:bg-slate-100"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>
                {question.length}/{PAYLOAD_LIMITS.question}자
              </span>
              <button
                type="submit"
                disabled={loading || question.trim() === ''}
                data-testid="send-button"
                className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                질문 전송
              </button>
            </div>
          </form>

          {ai.status === 'loading' && (
            <div className="rounded border border-frame bg-slate-50 p-4 text-sm text-slate-700" role="status" data-testid="ai-loading">
              답변을 기다리는 중… <span className="text-xs text-slate-500">(대시보드는 계속 쓸 수 있습니다)</span>
            </div>
          )}
          {ai.status === 'error' && (
            <div className="rounded border border-inspect-border bg-inspect-bg p-4 text-sm text-inspect" role="alert" data-testid="ai-error">
              <b>AI 연결 실패</b>
              <p className="mt-1">{ai.message}</p>
            </div>
          )}
          {ai.status === 'done' && (
            <div className="rounded border border-frame bg-white p-4" data-testid="ai-answer">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">질문: {ai.question}</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-accent">
                  기준 월 {ai.payload.scope.month} · 현장 {ai.payload.scope.siteId}
                </span>
                {ai.mock && (
                  <span className="rounded bg-caution-bg px-2 py-0.5 font-semibold text-caution" data-testid="mock-badge">
                    모의 응답
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{plainText(ai.answer)}</p>
            </div>
          )}
          {ai.status === 'idle' && <p className="text-sm text-slate-500">질문을 보내면 답변과 근거가 이곳에 표시됩니다.</p>}
        </section>

        <div className="col-span-2">
          {ai.status === 'done' ? (
            <Basis payload={ai.payload} />
          ) : (
            <aside className="card p-4 text-sm text-slate-500" aria-label="답변 근거">
              <h2 className="mb-1 text-base font-semibold text-navy">답변 근거</h2>
              답변이 나오면 기준 월·현장·근거 숫자·참고한 기록 필드가 여기에 표시됩니다.
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
