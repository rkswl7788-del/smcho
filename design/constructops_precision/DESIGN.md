---
name: ConstructOps Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f1500'
  on-tertiary-container: '#c76c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: IBM Plex Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
  num-display:
    fontFamily: IBM Plex Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.03em
  num-metric:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  num-table:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system is engineered specifically for corporate headquarters construction management (본사 공무팀), site directors, and executive project controllers. It addresses high-stakes monitoring of physical job site progress rates against monetary billing milestones (공정률 vs 기성률).

The operational tone is **authoritative, analytical, vigilant, and dense**. The interface avoids decorative fluff, prioritizing immediate scannability, deterministic status indicators, and micro-precision data alignment. By combining a deep slate architectural palette with high-contrast signal alerts, the UI delivers an operational cockpit experience capable of surfacing multi-billion-won delay risks and cash-flow mismatches within seconds.

The aesthetic philosophy is **Engineered Modern Utilitarianism**:
- High information density optimized for desktop viewports (1440px to 1920px+).
- Rigid spatial rhythm and tabular structural alignment.
- Low visual fatigue through balanced neutral gray foundations paired with targeted status color hits.
- Zero ambiguity: strict semantic signaling, visible numeric delta badges (pp), and monetary volume denominators (백만원/억원).

## Colors

The color architecture is built around operational clarity, strict risk triage, and enterprise-grade contrast compliance (WCAG AA/AAA).

### Surface & Frame Tokens
- **Canvas Base**: Slate-50 (`#f8fafc`) serves as the anti-glare canvas for desktop viewing.
- **Card/Table Surface**: Pure White (`#ffffff`) for elevated container clarity.
- **Frame & Divider**: Slate-200 (`#e2e8f0`) for subtle structural partitioning, and Slate-300 (`#cbd5e1`) for active borders and input strokes.
- **Primary Navy / Accent**: Slate-900 (`#0f172a`) as deep structural primary anchor; Brand Accent Blue (`#2563eb`) reserved for primary action states, interactive focus, and chart tracking baselines.

### PRD Status Signal Framework (Strict Triage)
Status indicators enforce rapid site risk categorization based on progress variance ($\Delta pp$):
- **점검 (Inspection Required / Severe Alert, $\le -5\text{pp}$ delay)**:
  - Text & Icon: Crimson Red (`#dc2626`)
  - Background Tint: Soft Red (`#fef2f2`)
  - Border: Alert Outline (`#fecaca`)
- **주의 (Caution / Moderate Variance, $-5\text{pp} < \Delta < 0\text{pp}$)**:
  - Text & Icon: Amber Gold (`#d97706`)
  - Background Tint: Soft Amber (`#fffbeb`)
  - Border: Caution Outline (`#fde68a`)
- **정상 (Normal / On-track or Ahead, $\ge 0\text{pp}$)**:
  - Text & Icon: Emerald Green (`#059669`)
  - Background Tint: Soft Emerald (`#ecfdf5`)
  - Border: Stable Outline (`#a7f3d0`)

### Text Hierarchy
- **Title & KPI Numeric**: Slate-900 (`#0f172a`)
- **Body & Table Data**: Slate-700 (`#334155`)
- **Meta, Secondary Data & Unit Labels**: Slate-500 (`#64748b`)
- **Muted / Disabled**: Slate-400 (`#94a3b8`)

## Typography

The type system utilizes **IBM Plex Sans** for its exceptional technical legibility, geometric discipline, and robust Korean/Latin glyph pairing. 

### Mandatory Numeric Rules
- All numeric output (monetary values, percentage rates, dates, variance metrics) **must** utilize `font-variant-numeric: tabular-nums` (monospaced numbers). This prevents layout shifts across dynamic polling and keeps vertical table comparisons strictly column-aligned.
- Explicit unit formatting is mandatory: Every monetary data node must suffix its financial denomination (`백만원` or `억원`), variances must display explicit plus/minus signs with `pp` (`-5.2pp`, `+1.4pp`), and date criteria anchors must follow `YYYY-MM 기준` syntax (e.g., `2026-09 기준`).
- Number and unit pairings require optical balance: the unit token sits in `body-sm` or `label-sm` with Slate-500 coloring, visually docked to the larger numeric glyphs.

## Layout & Spacing

The layout is built for **1440px+ enterprise displays** with dense screen space utilization:

- **Grid Architecture**: 12-column fluid grid configured with an outer horizontal margin of `1.5rem` (`24px`) and column gutters of `1rem` (`16px`).
- **Vertical Rhythm**: Compact vertical paddings (`space-sm` and `space-md`) prevent vertical scrolling while maintaining 6-8 key metric groups visible above the fold.
- **Header & Control Stack**:
  - Sticky Top Bar: 56px height containing tenant/division branding, standard reporting epoch badge (`2026-09 기준`), sync status, and global action controls.
  - Multi-dimensional Filter Bar: Single-row sticky horizontal strip (48px height) housing chained drop-downs (`기준월`, `권역/지역`, `공종/공사유형`, `현장명 검색`), toggle groups, and reset states.
- **Responsive Adaptations**:
  - Screens $\ge 1440\text{px}$: Full 12-column analytical layout with pinned KPI summary row, split chart & inspection alert cards, and comprehensive data grid.
  - Screens $1024\text{px} - 1439\text{px}$: KPI cards wrap to 2x2 grid; side AI panel docks to a slide-over modal; data table enables sticky left-column pinning with horizontal track scrolling.

## Elevation & Depth

To preserve sharp lineation in data-dense tables and avoid the mud of floating drop shadows, this design system operates primarily on **tactile tonal borders and low-profile structural layering**:

- **Level 0 (Canvas)**: Background tone `Slate-50` (`#f8fafc`).
- **Level 1 (Cards, Panel Blocks, Tables)**: Pure White (`#ffffff`) bounded by a clean `1px solid #e2e8f0` stroke. Zero drop shadow in neutral state; transitions to `0 4px 12px rgba(15, 23, 42, 0.05)` on hover.
- **Level 2 (Dropdowns, Filter Flyouts, Popovers)**: Pure White with `1px solid #cbd5e1` stroke and a focused utility shadow: `0 8px 20px -4px rgba(15, 23, 42, 0.10)`.
- **Level 3 (AI Side Drawer / Inspection Countermeasure Modal)**: Pure White with an elevated directional edge shadow: `-8px 0 24px rgba(15, 23, 42, 0.12)`, overlaid on a backdrop scrim of `rgba(15, 23, 42, 0.40)` with `backdrop-filter: blur(2px)`.
- **Active Row Highlight**: Soft blue wash `rgba(37, 99, 235, 0.04)` flanked by an active left accent border (`3px solid #2563eb`).

## Shapes

To project engineering precision and structural discipline, the design utilizes **Soft (Level 1)** corner rounding:

- **Cards & Data Tables**: `rounded-md` (`6px` / `0.375rem`) for rigid, modular enterprise containers.
- **Input Fields, Filter Chips & Buttons**: `rounded` (`4px` / `0.25rem`), providing clean click targets that sit tightly in multi-item filter bars.
- **Status Badges & Delta Tags**: `rounded` (`3px` / `0.1875rem`) to remain sharp and legible inside condensed table cells.
- **Pill Exceptions**: Circular indicators (`rounded-full`) are strictly reserved for unread notification dots and numerical step trackers.

## Components

### 1. KPI Summary Metric Cards
- **Structure**: 4-card horizontal flex-grid (전체 관리 현장수, 공정 지연 현장, 총 누적 기성액, 평균 기성 진도율).
- **Styling**: White background, `1px solid #e2e8f0`, `16px` inner padding.
- **Visuals**: Top label (`label-sm`, Slate-500) paired with an inline status tag; large numerical figure (`num-display`, Slate-900) flanked by a small unit label (`label-md`, Slate-500); bottom delta track with a sub-label comparing target vs. actual with clear `+` / `-` pp indicators.

### 2. Multi-Dimensional Filter Bar
- **Controls**: Inline layout including `기준년월 (2026-09)`, `사업본부/권역`, `공사유형 (토목/건축/플랜트)`, and `현장명 텍스트 검색`.
- **Active State**: Selected badges receive a subtle navy outline (`#0f172a`) and slate fill (`#f1f5f9`), accompanied by a clear button (`×`).
- **Global Actions**: Right-aligned buttons for "필터 초기화" (Ghost) and "엑셀 내보내기 (.xlsx)" (Outline with icon).

### 3. Inspection Priority Ranked Alert Cards (점검 현장 긴급 카드)
- **Visuals**: Left structural indicator border (`4px solid #dc2626`).
- **Hierarchy**: 현장 코드 및 명칭 (e.g., `[건축] 세종 2-4 생활권 주상복합`), 지연율 태그 (`-7.8pp 지연`), 공정률 (계획 68.4% / 실적 60.6%), 미기성액 (`4,820 백만원`).
- **Quick Action**: Secondary button linking directly to the specific incident and countermeasure detail drawer ("대책서 보기").

### 4. High-Density Enterprise Data Table (현장별 공정·기성 상세)
- **Cell Density**: Vertical row height fixed at `40px` (or `48px` for expanded view).
- **Headers**: Slate-100 background (`#f1f5f9`), `label-md` uppercase text, explicit sort icons (▲/▼).
- **Columns**: 현장코드 | 현장명 | 공종 | 계획공정률 | 실적공정률 | 공정대비(pp) | 당월기성액 | 누적기성액 | 상태 (점검/주의/정상) | 관리.
- **Status Cells**: Full colored pill chip matching Section 2 tokens:
  - `점검`: Text `#dc2626`, Bg `#fef2f2`, Border `#fecaca`.
  - `주의`: Text `#d97706`, Bg `#fffbeb`, Border `#fde68a`.
  - `정상`: Text `#059669`, Bg `#ecfdf5`, Border `#a7f3d0`.
- **Interactive Rows**: Hover row fill `#f8fafc`. Clicking a row opens the accordion inspection drawer without reloading the table state.

### 5. Accordion Incident & Countermeasure Drawer (공정지연 분석 및 만회대책 서랍)
- **Content**: Deep breakdown embedded below the row or via slide-out drawer:
  - 지연 원인 분류 (자재 수급, 기상 악화, 인허가 지연, 전공정 지연).
  - 현장 소장 보고 의견 및 본사 기술팀 피드백.
  - 공정 만회 실행 계획 (장비 추가 투입, 패스트트랙 공법 적용 등).
- **Audit Stamp**: 작성자, 검토자, 최종 업데이트 일시 (`2026-09-18 14:20`).

### 6. AI Assistant Conversational Side Panel (본사 공무 AI 비서)
- **Trigger**: Persistent floating docked trigger or Top Bar action button ("AI 공정 분석").
- **Layout**: 380px fixed-width right panel.
- **Interaction**: Natural language project querying (e.g., "지연 5pp 이상 현장 중 철근 기성 집행률이 80% 미만인 곳 요약해줘").
- **Output**: Structured bullet points with linked deep-links to table rows and instant chart comparisons.

### 7. Safeguard Notices & Data Integrity Callouts
- **Safeguard Banner**: Displayed prominently during server background re-indexing, offline caching, or API timeouts:
  - Message: *"네트워크 상태가 불안정하거나 갱신 중입니다. **지금 자료는 유지됩니다.**"*
  - Token: Soft blue or slate banner (`bg: #f8fafc, border: #cbd5e1, text: #334155`) with an active cache timestamp to assure operational engineers that local table changes, draft countermeasure memos, and filtered views remain intact.