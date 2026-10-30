'use client';

import { useRouter } from 'next/navigation';
import { inspectionRanking, type Aggregate } from '@/lib/calc';
import { pct, pp } from '@/lib/format';
import { useStore } from '@/state/store';

export function InspectionRank({ agg }: { agg: Aggregate }) {
  const router = useRouter();
  const { openSite } = useStore();
  const rank = inspectionRanking(agg);

  const go = (siteId: string) => {
    openSite(siteId);
    router.push('/compare');
  };

  return (
    <section className="card p-4" aria-label="점검 현장 순위">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-navy">점검이 필요한 현장 순위</h2>
          <p className="text-xs text-slate-500">공정차이가 작은 순서(같으면 현장 ID 순). −5.0pp 이하가 점검입니다.</p>
        </div>
        <span className="rounded bg-inspect-bg px-2 py-1 text-xs font-semibold text-inspect">점검 기준 ≤ −5.0pp</span>
      </div>

      {rank.length === 0 ? (
        <div className="rounded border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600" role="status">
          <div className="font-semibold text-navy">점검 대상 없음</div>
          <div className="mt-1">고른 범위에는 점검이 필요한 현장(−5.0pp 이하)이 없습니다. 주의 현장은 현장별 비교표에서 확인하세요.</div>
        </div>
      ) : (
        <ol className="space-y-2">
          {rank.map((s, i) => (
            <li key={s.row.siteId}>
              <button
                type="button"
                onClick={() => go(s.row.siteId)}
                className="w-full rounded border border-inspect-border border-l-4 border-l-inspect bg-white p-3 text-left hover:bg-inspect-bg/40"
                data-testid={`rank-${s.row.siteId}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-inspect text-xs font-bold text-white">{i + 1}</span>
                    <span className="text-sm font-semibold text-navy">
                      {s.row.siteId} 현장 <span className="font-normal text-slate-500">{s.row.siteName.replace('[가상] ', '')}</span>
                    </span>
                  </div>
                  <span className="rounded bg-inspect-bg px-2 py-0.5 text-xs font-bold text-inspect">{pp(s.gapT)} 지연</span>
                </div>
                <dl className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <dt className="text-slate-500">계획 공정률</dt>
                    <dd className="text-sm font-semibold text-navy">{s.row.plannedProgress.toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">실제 공정률</dt>
                    <dd className="text-sm font-semibold text-inspect">{s.row.actualProgress.toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">공정차이</dt>
                    <dd className="text-sm font-semibold text-inspect">{pp(s.gapT)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">기성률</dt>
                    <dd className="text-sm font-semibold text-navy">{pct(s.rateT)}</dd>
                  </div>
                </dl>
                <div className="mt-2 text-right text-xs font-medium text-accent">비교표에서 기록 펼쳐보기 →</div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
