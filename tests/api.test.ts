import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPayload } from '@/lib/aiPayload';
import { parseCsv } from '@/lib/parse';
import { validate } from '@/lib/validate';

const gen = vi.hoisted(() => ({ impl: async (): Promise<{ text: string }> => ({ text: '기록된 상황을 설명합니다.' }) }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: () => gen.impl() };
  },
}));

import { POST } from '@/app/api/ask/route';

const rows = validate(parseCsv(readFileSync(path.resolve(__dirname, '..', 'data', '현장공정기성.csv'), 'utf8'))).rows;
const payload = buildPayload(rows, { month: '2026-09', region: '', type: '', siteId: 'D' }, 'D가 늦어진 원인과 대응은?');

let ipSeq = 0;
const call = (body: unknown) =>
  POST(
    new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ipSeq}` },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
const ok = { question: 'D가 늦어진 원인과 대응은?', payload };
const FAKE_KEY = 'AIzaFAKE-KEY-VALUE-1234567890';

beforeEach(() => {
  delete process.env.AI_MOCK;
  delete process.env.GEMINI_API_KEY;
  gen.impl = async () => ({ text: '기록된 상황을 설명합니다.' });
});
afterEach(() => vi.restoreAllMocks());

describe('/api/ask (AI 서버)', () => {
  it('키가 없으면 "연결 설정 없음" 오류, 대시보드·CSV 계속 사용 안내', async () => {
    const res = await call(ok);
    const j = await res.json();
    expect(res.status).toBe(503);
    expect(j.ok).toBe(false);
    expect(j.code).toBe('no_key');
    expect(j.message).toContain('대시보드와 CSV는 계속 쓸 수 있습니다');
  });

  it('모의 응답은 mock=true로 표시된다', async () => {
    process.env.AI_MOCK = '1';
    const j = await (await call(ok)).json();
    expect(j.ok).toBe(true);
    expect(j.mock).toBe(true);
    expect(j.answer).toContain('모의 응답');
  });

  it('키가 있으면 호출 성공 응답(mock=false)이고 응답에 키가 없다', async () => {
    process.env.GEMINI_API_KEY = FAKE_KEY;
    const res = await call(ok);
    const text = await res.text();
    expect(JSON.parse(text)).toMatchObject({ ok: true, mock: false, answer: '기록된 상황을 설명합니다.' });
    expect(text).not.toContain(FAKE_KEY);
  });

  it('한도 초과(429)·키 오류(403)·모델 없음(404)·기타 오류를 서로 다른 안내로 바꾸고 키를 노출하지 않는다', async () => {
    process.env.GEMINI_API_KEY = FAKE_KEY;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const cases: [object, number, string][] = [
      [{ status: 429, message: `quota ${FAKE_KEY}` }, 429, 'quota'],
      [{ status: 403, message: `denied ${FAKE_KEY}` }, 502, 'bad_key'],
      [{ status: 404, message: 'model not found' }, 502, 'model'],
      [{ status: 500, message: `boom ${FAKE_KEY}` }, 502, 'server'],
    ];
    for (const [err, status, code] of cases) {
      gen.impl = async () => {
        throw Object.assign(new Error((err as { message: string }).message), err);
      };
      const res = await call(ok);
      const text = await res.text();
      expect(res.status).toBe(status);
      expect(JSON.parse(text).code).toBe(code);
      expect(text).not.toContain(FAKE_KEY);
    }
  });

  it('빈 답변은 오류로 처리', async () => {
    process.env.GEMINI_API_KEY = FAKE_KEY;
    gen.impl = async () => ({ text: '  ' });
    expect((await (await call(ok)).json()).code).toBe('empty');
  });

  it('20초 안에 응답이 없으면 시간 초과', async () => {
    process.env.GEMINI_API_KEY = FAKE_KEY;
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gen.impl = () => new Promise(() => {});
    const p = call(ok);
    await vi.advanceTimersByTimeAsync(20_001);
    const res = await p;
    vi.useRealTimers();
    expect(res.status).toBe(504);
    expect((await res.json()).code).toBe('timeout');
  });

  it('잘못된 요청(빈 질문·501자·깨진 JSON·모양 틀린 자료)은 400', async () => {
    expect((await call({ question: '', payload })).status).toBe(400);
    expect((await call({ question: 'a'.repeat(501), payload })).status).toBe(400);
    expect((await call('{not json')).status).toBe(400);
    expect((await call({ question: '질문', payload: { scope: {} } })).status).toBe(400);
  });

  it('같은 접속자가 1분에 10번을 넘기면 429(사용량 보호)', async () => {
    process.env.AI_MOCK = '1';
    const same = () =>
      POST(
        new Request('http://localhost/api/ask', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.168.9.9' },
          body: JSON.stringify(ok),
        }),
      );
    for (let i = 0; i < 10; i++) expect((await same()).status).toBe(200);
    const res = await same();
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('rate');
  });
});
