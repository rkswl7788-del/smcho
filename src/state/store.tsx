'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildPayload, type AskPayload } from '@/lib/aiPayload';
import { aggregateFor, monthsOf, normalizeFilters, scopeKey } from '@/lib/filter';
import type { Aggregate } from '@/lib/calc';
import type { Filters, SiteRow } from '@/lib/types';

export type AiState =
  | { status: 'idle' }
  | { status: 'loading'; question: string }
  | { status: 'error'; question: string; message: string }
  | { status: 'done'; question: string; answer: string; mock: boolean; scopeKey: string; payload: AskPayload };

interface Store {
  rows: SiteRow[] | null;
  filters: Filters;
  agg: Aggregate | null;
  notice: string | null;
  highlightSite: string | null;
  expanded: Set<string>;
  ai: AiState;
  setRows: (rows: SiteRow[]) => void;
  patchFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  openSite: (siteId: string) => void; // 점검 순위에서 누른 현장 강조 + 펼침
  toggleExpanded: (siteId: string) => void;
  ask: (question: string, patch?: Partial<Filters>) => Promise<void>;
  clearAi: () => void;
}

const EMPTY_FILTERS: Filters = { month: '', region: '', type: '', siteId: '' };
const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider 안에서만 쓸 수 있습니다.');
  return v;
}

const CLIENT_TIMEOUT_MS = 30_000;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rows, setRowsState] = useState<SiteRow[] | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [notice, setNotice] = useState<string | null>(null);
  const [highlightSite, setHighlight] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [ai, setAi] = useState<AiState>({ status: 'idle' });
  const reqId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const cancelAi = useCallback(() => {
    reqId.current += 1; // 이전 요청의 늦은 응답은 버린다
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const clearAi = useCallback(() => {
    cancelAi();
    setAi({ status: 'idle' });
  }, [cancelAi]);

  const latestMonth = (r: SiteRow[]) => {
    const m = monthsOf(r);
    return m[m.length - 1] ?? '';
  };

  const setRows = useCallback(
    (next: SiteRow[]) => {
      setRowsState(next);
      setFilters({ ...EMPTY_FILTERS, month: latestMonth(next) });
      setNotice(null);
      setHighlight(null);
      setExpanded(new Set());
      clearAi();
    },
    [clearAi],
  );

  /** 필터가 바뀌면 답변·강조·펼침을 모두 지운다. */
  const applyFilters = useCallback(
    (next: Filters, all: SiteRow[]): Filters => {
      const { filters: norm, siteReset } = normalizeFilters(all, next);
      setFilters(norm);
      setNotice(siteReset ? '선택한 현장이 새 범위에 없어 현장을 "전체"로 바꿨습니다.' : null);
      setHighlight(null);
      setExpanded(new Set());
      clearAi();
      return norm;
    },
    [clearAi],
  );

  const patchFilters = useCallback(
    (patch: Partial<Filters>) => {
      if (rows) applyFilters({ ...filters, ...patch }, rows);
    },
    [rows, filters, applyFilters],
  );

  const resetFilters = useCallback(() => {
    if (rows) {
      applyFilters({ ...EMPTY_FILTERS, month: latestMonth(rows) }, rows);
      setNotice(null);
    }
  }, [rows, applyFilters]);

  const openSite = useCallback((siteId: string) => {
    setHighlight(siteId);
    setExpanded(new Set([siteId]));
  }, []);

  const toggleExpanded = useCallback((siteId: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(siteId)) n.delete(siteId);
      else n.add(siteId);
      return n;
    });
  }, []);

  const ask = useCallback(
    async (question: string, patch?: Partial<Filters>) => {
      if (!rows) return;
      let f = filters;
      if (patch) {
        const merged = { ...filters, ...patch };
        if (JSON.stringify(merged) !== JSON.stringify(filters)) {
          f = applyFilters(merged, rows);
          if (patch.siteId) setNotice(`예시 질문에 맞춰 범위를 ${patch.siteId} 현장으로 바꿨습니다.`);
        }
      }
      const payload = buildPayload(rows, f, question);
      if (!payload) {
        setAi({ status: 'error', question, message: '지금 범위에 자료가 없어 질문할 수 없습니다. 대시보드와 CSV는 계속 쓸 수 있습니다.' });
        return;
      }
      cancelAi();
      const id = reqId.current;
      const ac = new AbortController();
      abortRef.current = ac;
      const key = scopeKey(f);
      setAi({ status: 'loading', question });
      const timer = setTimeout(() => ac.abort(), CLIENT_TIMEOUT_MS);
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, payload }),
          signal: ac.signal,
        });
        const json = (await res.json()) as { ok: boolean; answer?: string; mock?: boolean; message?: string };
        if (id !== reqId.current) return; // 범위가 바뀐 뒤 도착한 응답은 표시하지 않음
        if (json.ok && json.answer) {
          setAi({ status: 'done', question, answer: json.answer, mock: !!json.mock, scopeKey: key, payload });
        } else {
          setAi({ status: 'error', question, message: json.message ?? 'AI 답변을 받지 못했습니다.' });
        }
      } catch {
        if (id !== reqId.current) return;
        setAi({ status: 'error', question, message: 'AI 응답이 늦거나 연결하지 못했습니다.' });
      } finally {
        clearTimeout(timer);
      }
    },
    [rows, filters, applyFilters, cancelAi],
  );

  const agg = useMemo(() => (rows ? aggregateFor(rows, filters) : null), [rows, filters]);

  const value: Store = {
    rows,
    filters,
    agg,
    notice,
    highlightSite,
    expanded,
    ai,
    setRows,
    patchFilters,
    resetFilters,
    openSite,
    toggleExpanded,
    ask,
    clearAi,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
