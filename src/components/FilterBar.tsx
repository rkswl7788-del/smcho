'use client';

import { monthLabel } from '@/lib/format';
import { monthsOf, regionsOf, sitesInScope, typesOf } from '@/lib/filter';
import { useStore } from '@/state/store';
import type { SiteRow } from '@/lib/types';

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-navy"
      >
        {children}
      </select>
    </label>
  );
}

export function FilterBar({ rows }: { rows: SiteRow[] }) {
  const { filters, patchFilters, resetFilters, notice } = useStore();
  const months = monthsOf(rows).slice().reverse();
  const sites = sitesInScope(rows, filters);

  return (
    <section className="card mb-4 p-3" aria-label="필터">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Select label="기준월" value={filters.month} onChange={(v) => patchFilters({ month: v })}>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
        <Select label="지역" value={filters.region} onChange={(v) => patchFilters({ region: v })}>
          <option value="">전체 지역</option>
          {regionsOf(rows).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select label="공사 유형" value={filters.type} onChange={(v) => patchFilters({ type: v })}>
          <option value="">전체 유형</option>
          {typesOf(rows).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select label="현장" value={filters.siteId} onChange={(v) => patchFilters({ siteId: v })}>
          <option value="">전체 현장 ({sites.length}개)</option>
          {sites.map((s) => (
            <option key={s.siteId} value={s.siteId}>
              {s.siteId} · {s.siteName.replace('[가상] ', '')}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={resetFilters}
          className="ml-auto rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          필터 초기화
        </button>
      </div>
      {notice && (
        <p className="mt-2 text-xs text-accent" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
