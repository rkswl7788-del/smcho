'use client';

import { useState } from 'react';
import { fixed1, monthLabel, NA, pct } from '@/lib/format';
import type { TrendPoint } from '@/lib/filter';

const W = 760;
const H = 300;
const PAD = { l: 44, r: 60, t: 14, b: 34 };

function shortMonth(m: string, i: number): string {
  const [y, mm] = m.split('-');
  return i === 0 || mm === '01' ? `${y.slice(2)}.${mm}` : `${Number(mm)}월`;
}

export function TrendChart({ points, selectedMonth }: { points: TrendPoint[]; selectedMonth: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const slot = plotW / Math.max(n, 1);
  const cx = (i: number) => PAD.l + slot * (i + 0.5);
  const yPct = (t: number) => PAD.t + plotH - (t / 1000) * plotH; // t: 0.1% 단위, 100% = 1000
  const maxMonthly = Math.max(0, ...points.map((p) => p.agg?.monthlyT ?? 0));
  const barH = (t: number) => (maxMonthly > 0 ? (t / maxMonthly) * plotH * 0.92 : 0);

  const activeIdx = hover ?? Math.max(0, points.findIndex((p) => p.month === selectedMonth));
  const active = points[activeIdx];
  const line = (key: 'plannedT' | 'actualT') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${yPct(p.agg![key]).toFixed(1)}`).join(' ');

  return (
    <div>
      {active?.agg && (
        <div
          className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded bg-navy px-3 py-2 text-xs text-white"
          role="status"
          aria-live="polite"
          data-testid="trend-callout"
        >
          <span className="font-semibold">{monthLabel(active.month)}</span>
          <span>
            당월기성액 <b>{active.agg.monthlyT === null ? NA : `${fixed1(active.agg.monthlyT)}백만원`}</b>
          </span>
          <span>
            누적기성액 <b>{fixed1(active.agg.earnedT)}백만원</b>
          </span>
          <span>
            계획 <b>{pct(active.agg.plannedT)}</b>
          </span>
          <span>
            실제 <b>{pct(active.agg.actualT)}</b>
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="월별 계획·실제 공정률 선과 당월기성액 막대">
        {[0, 250, 500, 750, 1000].map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yPct(t)} y2={yPct(t)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PAD.l - 6} y={yPct(t) + 3} textAnchor="end" fontSize={10} fill="#64748b">
              {t / 10}%
            </text>
          </g>
        ))}
        <text x={W - PAD.r + 6} y={PAD.t + 8} fontSize={10} fill="#64748b">
          {fixed1(maxMonthly)}
        </text>
        <text x={W - PAD.r + 6} y={PAD.t + 20} fontSize={9} fill="#94a3b8">
          (막대 최대, 백만원)
        </text>

        {points.map((p, i) => {
          const m = p.agg!.monthlyT;
          const isSel = p.month === selectedMonth;
          const bw = Math.min(slot * 0.55, 34);
          const base = PAD.t + plotH;
          return (
            <g key={p.month}>
              {m === null ? (
                <g data-testid="bar-na">
                  <rect x={cx(i) - bw / 2} y={base - 16} width={bw} height={16} fill="none" stroke="#94a3b8" strokeDasharray="3 2" />
                  <text x={cx(i)} y={base - 20} textAnchor="middle" fontSize={9} fill="#64748b">
                    {NA}
                  </text>
                </g>
              ) : (
                <rect
                  x={cx(i) - bw / 2}
                  y={base - barH(m)}
                  width={bw}
                  height={barH(m)}
                  fill={isSel ? '#2563eb' : '#bfdbfe'}
                  data-testid="bar"
                />
              )}
              <text x={cx(i)} y={H - 14} textAnchor="middle" fontSize={10} fill={isSel ? '#2563eb' : '#64748b'} fontWeight={isSel ? 700 : 400}>
                {shortMonth(p.month, i)}
              </text>
            </g>
          );
        })}

        {n > 0 && (
          <>
            <path d={line('plannedT')} fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" />
            <path d={line('actualT')} fill="none" stroke="#1d4ed8" strokeWidth={2.5} />
            {points.map((p, i) => (
              <circle key={p.month} cx={cx(i)} cy={yPct(p.agg!.actualT)} r={p.month === selectedMonth ? 4 : 2.5} fill="#1d4ed8" />
            ))}
          </>
        )}

        {points.map((p, i) => (
          <rect
            key={`h-${p.month}`}
            x={PAD.l + slot * i}
            y={PAD.t}
            width={slot}
            height={plotH + PAD.b}
            fill="transparent"
            tabIndex={0}
            aria-label={`${monthLabel(p.month)} 자세히 보기`}
            data-testid={`hover-${p.month}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 bg-blue-200" /> 당월기성액(막대)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-slate-500" /> 계획 공정률
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0 w-5 border-t-2 border-blue-700" /> 실제 공정률
        </span>
      </div>
      {points.length > 0 && points[0].agg?.monthlyT === null && (
        <p className="mt-1 text-xs text-slate-500">
          {monthLabel(points[0].month)}은 전월 자료가 없어 당월기성액을 "{NA}"로 표시합니다. 누적기성액으로 대신하지 않습니다.
        </p>
      )}
    </div>
  );
}
