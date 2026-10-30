'use client';

import { FilterBar } from '@/components/FilterBar';
import { InspectionRank } from '@/components/InspectionRank';
import { TrendChart } from '@/components/TrendChart';
import { EmptyScope, NoData, Unit } from '@/components/ui';
import { NA, NO_DATA, fixed1, monthLabel, pct, pp } from '@/lib/format';
import { trendFor } from '@/lib/filter';
import { useStore } from '@/state/store';

export default function HomePage() {
  const { rows, filters, agg } = useStore();
  if (!rows) return <NoData />;

  const points = trendFor(rows, filters);
  const gapColor = !agg ? 'text-navy' : agg.gapT < 0 ? 'text-inspect' : 'text-normal';

  return (
    <>
      <FilterBar rows={rows} />

      <section aria-label="전체 숫자" className="mb-4 grid grid-cols-4 gap-4">
        <div className="card p-4" data-testid="kpi-rate">
          <div className="text-xs text-slate-500">전체 기성률 (누적, 금액 기준)</div>
          <div className="mt-1 text-3xl font-bold text-navy">{agg ? pct(agg.rateT) : NO_DATA}</div>
          {agg && (
            <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <dt>누적기성액</dt>
                <dd className="font-medium">
                  {fixed1(agg.earnedT)}
                  <Unit>백만원</Unit>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>계약금액</dt>
                <dd className="font-medium">
                  {fixed1(agg.contractT)}
                  <Unit>백만원</Unit>
                </dd>
              </div>
              <div className="flex justify-between border-t border-frame pt-0.5" data-testid="kpi-monthly">
                <dt>당월기성액 ({monthLabel(filters.month)})</dt>
                <dd className="font-semibold text-accent">
                  {agg.monthlyT === null ? NA : fixed1(agg.monthlyT)}
                  {agg.monthlyT !== null && <Unit>백만원</Unit>}
                </dd>
              </div>
            </dl>
          )}
        </div>
        <div className="card p-4" data-testid="kpi-planned">
          <div className="text-xs text-slate-500">전체 계획 공정률 (계약금액 가중평균)</div>
          <div className="mt-1 text-3xl font-bold text-navy">{agg ? pct(agg.plannedT) : NO_DATA}</div>
          <div className="mt-2 text-xs text-slate-600">월말 누적 계획 기준</div>
        </div>
        <div className="card p-4" data-testid="kpi-actual">
          <div className="text-xs text-slate-500">전체 실제 공정률 (계약금액 가중평균)</div>
          <div className="mt-1 text-3xl font-bold text-navy">{agg ? pct(agg.actualT) : NO_DATA}</div>
          <div className="mt-2 text-xs text-slate-600">월말 누적 실제 기준</div>
        </div>
        <div className="card p-4" data-testid="kpi-gap">
          <div className="text-xs text-slate-500">전체 공정차이 (실제 − 계획)</div>
          <div className={`mt-1 text-3xl font-bold ${gapColor}`}>{agg ? pp(agg.gapT) : NO_DATA}</div>
          {agg && (
            <div className="mt-2 flex gap-3 text-xs" data-testid="kpi-counts">
              <span className="font-semibold text-normal">정상 {agg.normal}곳</span>
              <span className="font-semibold text-caution">주의 {agg.caution}곳</span>
              <span className="font-semibold text-inspect">점검 {agg.inspect}곳</span>
            </div>
          )}
        </div>
      </section>

      {!agg ? (
        <EmptyScope>고른 범위·월에 해당하는 현장 자료가 없습니다. 필터를 바꾸거나 초기화하세요.</EmptyScope>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <InspectionRank agg={agg} />
          <section className="card p-4" aria-label="월별 추이">
            <h2 className="text-base font-semibold text-navy">월별 추이</h2>
            <p className="mb-2 text-xs text-slate-500">
              {points.length > 0 ? `${monthLabel(points[0].month)} ~ ${monthLabel(filters.month)}` : ''} · 같은 지역·유형·현장 범위로 매월 따로 집계
            </p>
            <TrendChart points={points} selectedMonth={filters.month} />
          </section>
        </div>
      )}
    </>
  );
}
