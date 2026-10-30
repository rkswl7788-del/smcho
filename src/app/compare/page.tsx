'use client';

import { Fragment, useEffect } from 'react';
import { FilterBar } from '@/components/FilterBar';
import { EmptyScope, NoData, StatusBadge } from '@/components/ui';
import { NA, fixed1, monthLabel, pct, pp } from '@/lib/format';
import { useStore } from '@/state/store';

const COLS = 14;

export default function ComparePage() {
  const { rows, filters, agg, highlightSite, expanded, toggleExpanded } = useStore();

  useEffect(() => {
    if (highlightSite) document.getElementById(`row-${highlightSite}`)?.scrollIntoView({ block: 'center' });
  }, [highlightSite]);

  if (!rows) return <NoData />;

  const th = 'whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-600';
  const td = 'px-3 py-2 text-sm';
  const num = `${td} text-right`;

  return (
    <>
      <FilterBar rows={rows} />
      {!agg ? (
        <EmptyScope>고른 범위·월에 해당하는 현장 자료가 없습니다. 필터를 바꾸거나 초기화하세요.</EmptyScope>
      ) : (
        <section className="card overflow-x-auto" aria-label="현장별 비교표">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-base font-semibold text-navy">
              {monthLabel(filters.month)} 현장별 공정·기성 ({agg.count}개 현장)
            </h2>
            <span className="text-xs text-slate-500">금액: 백만원 · 비율: % · 공정차이: pp · 누적기성액은 월말까지 쌓인 금액, 당월기성액은 전월 대비 증가분</span>
          </div>
          <table className="w-full min-w-[1180px] border-t border-frame" data-testid="compare-table">
            <thead className="bg-slate-100">
              <tr>
                <th className={th}>현장</th>
                <th className={th}>지역</th>
                <th className={th}>공사 유형</th>
                <th className={th}>당월 주요 공종</th>
                <th className={`${th} text-right`}>계약금액</th>
                <th className={`${th} text-right`}>누적기성액</th>
                <th className={`${th} text-right`}>당월기성액</th>
                <th className={`${th} text-right`}>기성률</th>
                <th className={`${th} text-right`}>계획</th>
                <th className={`${th} text-right`}>실제</th>
                <th className={`${th} text-right`}>공정차이</th>
                <th className={th}>상태</th>
                <th className={th}>기록 보기</th>
              </tr>
            </thead>
            <tbody>
              {agg.sites.map((s) => {
                const r = s.row;
                const open = expanded.has(r.siteId);
                const hl = highlightSite === r.siteId;
                const rowBg = s.status === '점검' ? 'bg-inspect-bg/40' : '';
                return (
                  <Fragment key={r.siteId}>
                    <tr
                      id={`row-${r.siteId}`}
                      data-testid={`row-${r.siteId}`}
                      data-highlight={hl ? 'true' : 'false'}
                      className={`border-t border-frame ${rowBg} ${hl ? 'border-l-4 border-l-accent bg-blue-50' : ''}`}
                    >
                      <td className={td}>
                        <div className="font-semibold text-navy">
                          {r.siteId} <span className="font-normal">{r.siteName.replace('[가상] ', '')}</span>
                        </div>
                      </td>
                      <td className={td}>{r.region}</td>
                      <td className={td}>{r.projectType}</td>
                      <td className={td}>{r.currentWork}</td>
                      <td className={num}>{fixed1(Math.round(r.contractAmount * 10))}</td>
                      <td className={num}>{fixed1(Math.round(r.cumulativeEarned * 10))}</td>
                      <td className={`${num} ${s.monthlyT === null ? 'text-slate-500' : ''}`} data-testid={`monthly-${r.siteId}`}>
                        {s.monthlyT === null ? NA : fixed1(s.monthlyT)}
                      </td>
                      <td className={num}>{pct(s.rateT)}</td>
                      <td className={num}>{r.plannedProgress.toFixed(1)}%</td>
                      <td className={num}>{r.actualProgress.toFixed(1)}%</td>
                      <td className={`${num} font-semibold ${s.gapT < 0 ? (s.status === '점검' ? 'text-inspect' : 'text-caution') : 'text-normal'}`}>
                        {pp(s.gapT)}
                      </td>
                      <td className={td}>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className={td}>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(r.siteId)}
                          aria-expanded={open}
                          aria-label={`${r.siteId} 기록 ${open ? '접기' : '펼치기'}`}
                          data-testid={`toggle-${r.siteId}`}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          {open ? '접기 ▲' : '펼치기 ▼'}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-50" data-testid={`detail-${r.siteId}`}>
                        <td colSpan={COLS - 1} className="px-4 py-4">
                          <div className="mb-3 grid grid-cols-3 gap-3 text-sm">
                            <div className="rounded border border-frame bg-white p-3">
                              <div className="text-xs text-slate-500">공사기간 (착공일 ~ 계약상 준공일)</div>
                              <div className="mt-1 font-semibold text-navy">
                                {r.startDate} ~ {r.contractEndDate}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">계약상 준공일은 예정 일정이며 실제 완료일이 아닙니다.</div>
                            </div>
                            <div className="rounded border border-frame bg-white p-3">
                              <div className="text-xs text-slate-500">당월 주요 공종 ({r.month} 기준)</div>
                              <div className="mt-1 font-semibold text-navy">{r.currentWork}</div>
                            </div>
                            <div className="rounded border border-frame bg-white p-3">
                              <div className="text-xs text-slate-500">특이사항 분류 (상태 판정과 별개)</div>
                              <div className="mt-1 font-semibold text-navy">{r.issueCategory}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded border border-frame bg-white p-3">
                              <div className="text-xs font-semibold text-slate-600">기록된 상황</div>
                              <p className="mt-1 text-slate-800">{r.issueSummary}</p>
                            </div>
                            <div className="rounded border border-frame bg-white p-3">
                              <div className="text-xs font-semibold text-slate-600">기록된 대응 계획</div>
                              <p className="mt-1 text-slate-800">{r.actionPlan}</p>
                              <p className="mt-2 text-xs text-slate-500">예정된 대응이며 완료·효과를 뜻하지 않습니다.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-blue-50 font-semibold text-navy">
              <tr data-testid="compare-total">
                <td className={td} colSpan={4}>
                  Σ 합계 / 가중평균 ({agg.count}개 현장)
                </td>
                <td className={num}>{fixed1(agg.contractT)}</td>
                <td className={num}>{fixed1(agg.earnedT)}</td>
                <td className={num}>{agg.monthlyT === null ? NA : fixed1(agg.monthlyT)}</td>
                <td className={num}>{pct(agg.rateT)}</td>
                <td className={num}>{pct(agg.plannedT)}</td>
                <td className={num}>{pct(agg.actualT)}</td>
                <td className={num}>{pp(agg.gapT)}</td>
                <td className={td} colSpan={2}>
                  정상 {agg.normal} · 주의 {agg.caution} · 점검 {agg.inspect}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}
    </>
  );
}
