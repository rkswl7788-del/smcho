'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { buildCsv, csvFileName } from '@/lib/exportCsv';
import { monthLabel } from '@/lib/format';
import { StoreProvider, useStore } from '@/state/store';

const NAV = [
  { href: '/', label: '현황 요약' },
  { href: '/compare', label: '현장별 비교표' },
  { href: '/import', label: '자료 가져오기' },
  { href: '/ask', label: 'AI에게 묻기' },
];

function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { rows, filters, agg } = useStore();
  const [msg, setMsg] = useState<string | null>(null);

  const exportCsv = () => {
    if (!rows) return;
    const csv = buildCsv(rows, filters);
    if (!csv) {
      setMsg('내보낼 자료가 없습니다.');
      return;
    }
    setMsg(null);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFileName(rows, filters);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-frame bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-6">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-navy">건설본부 공무팀</span>
            <span className="text-xs text-slate-500">공정·기성 통합 대시보드</span>
          </div>
          <nav className="flex items-center gap-1" aria-label="페이지 이동">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${active ? 'bg-blue-50 text-accent' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {rows && filters.month && (
              <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">기준월: {monthLabel(filters.month)}</span>
            )}
            <button
              type="button"
              onClick={exportCsv}
              disabled={!rows || !agg}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              CSV 내보내기
            </button>
            {agg && (
              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${agg.inspect > 0 ? 'bg-inspect-bg text-inspect' : 'bg-normal-bg text-normal'}`}
              >
                점검 현장 {agg.inspect}곳
              </span>
            )}
          </div>
        </div>
        {msg && <div className="bg-caution-bg px-6 py-1 text-center text-xs text-caution">{msg}</div>}
      </header>
      <main className="mx-auto max-w-[1600px] px-6 py-5">{children}</main>
      <footer className="mx-auto max-w-[1600px] px-6 pb-8 text-xs text-slate-500">
        교육용 가상 자료입니다. 실제 회사의 계약·현장·청구 자료가 아닙니다. 새로고침하면 자료가 사라지므로 파일을 다시 가져옵니다.
      </footer>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
