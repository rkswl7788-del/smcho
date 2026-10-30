'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Status } from '@/lib/types';

export function StatusBadge({ status }: { status: Status }) {
  const cls =
    status === '점검'
      ? 'bg-inspect-bg text-inspect border-inspect-border'
      : status === '주의'
        ? 'bg-caution-bg text-caution border-caution-border'
        : 'bg-normal-bg text-normal border-normal-border';
  return <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

export function NoData() {
  return (
    <div className="card mx-auto mt-10 max-w-xl p-8 text-center" role="status">
      <h2 className="text-lg font-semibold text-navy">자료 없음</h2>
      <p className="mt-2 text-sm text-slate-600">
        아직 가져온 자료가 없습니다. 자료 가져오기에서 CSV 또는 JSON 파일을 가져오세요.
      </p>
      <Link
        href="/import"
        className="mt-5 inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        자료 가져오기로 이동
      </Link>
    </div>
  );
}

export function EmptyScope({ children }: { children?: ReactNode }) {
  return (
    <div className="card p-6 text-center text-sm text-slate-600" role="status">
      <div className="font-semibold text-navy">자료 없음</div>
      <div className="mt-1">{children ?? '고른 범위에 해당하는 자료가 없습니다. 숫자를 0%로 채우지 않습니다.'}</div>
    </div>
  );
}

export function Unit({ children }: { children: ReactNode }) {
  return <span className="ml-1 text-xs font-normal text-slate-500">{children}</span>;
}
