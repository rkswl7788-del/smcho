export const NA = '계산 불가';
export const NO_DATA = '자료 없음';

/** 0.1 단위 정수 → "1,234.5" (금액·비율 공통). null이면 "계산 불가" */
export function fixed1(t: number | null | undefined, fallback: string = NA): string {
  if (t === null || t === undefined) return fallback;
  const neg = t < 0;
  const abs = Math.abs(t);
  const whole = Math.floor(abs / 10);
  const frac = abs % 10;
  return `${neg ? '-' : ''}${whole.toLocaleString('en-US')}.${frac}`;
}

/** 부호를 붙인 pp. 0이면 부호 없음. 예: +1.7pp, -10.7pp, 0.0pp */
export function pp(t: number | null | undefined, fallback: string = NA): string {
  if (t === null || t === undefined) return fallback;
  const s = fixed1(t);
  return `${t > 0 ? '+' : ''}${s}pp`;
}

export function pct(t: number | null | undefined, fallback: string = NA): string {
  return t === null || t === undefined ? fallback : `${fixed1(t)}%`;
}

/** CSV 등에 쓰는 쉼표 없는 숫자 문자열 */
export function plain1(t: number | null | undefined): string {
  if (t === null || t === undefined) return '';
  return fixed1(t).replace(/,/g, '');
}

export function monthLabel(m: string): string {
  const [y, mm] = m.split('-');
  return `${y}년 ${Number(mm)}월`;
}
