export const FIELDS = [
  'month',
  'siteId',
  'siteName',
  'contractAmount',
  'plannedProgress',
  'actualProgress',
  'cumulativeEarned',
  'region',
  'projectType',
  'startDate',
  'contractEndDate',
  'currentWork',
  'issueCategory',
  'issueSummary',
  'actionPlan',
] as const;

export type FieldName = (typeof FIELDS)[number];

export const REGIONS = ['인천', '경기', '충남', '충북', '세종', '강원', '대전'] as const;
export const PROJECT_TYPES = ['공동주택', '물류시설', '업무시설', '상업시설', '생산시설'] as const;

export const MONTH_MIN = '2025-10';
export const MONTH_MAX = '2026-09';

export interface SiteRow {
  month: string;
  siteId: string;
  siteName: string;
  contractAmount: number;
  plannedProgress: number;
  actualProgress: number;
  cumulativeEarned: number;
  region: string;
  projectType: string;
  startDate: string;
  contractEndDate: string;
  currentWork: string;
  issueCategory: string;
  issueSummary: string;
  actionPlan: string;
}

export type Status = '정상' | '주의' | '점검';

export interface Filters {
  month: string;
  region: string; // '' = 전체
  type: string; // '' = 전체
  siteId: string; // '' = 전체
}

export interface Issue {
  where: string; // 예: "134행", "3번째 항목", "파일"
  field?: string;
  message: string;
}
