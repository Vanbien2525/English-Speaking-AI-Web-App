---
description: "Quy chuẩn kỹ thuật và kiến trúc Front-end bất biến"
globs:
  - "src/components/**/*.tsx"
  - "src/app/**/*.tsx"
---

# Frontend Core Architecture & Safety Directives

## 1. Component Modularity & Hygiene
- Keep files under 200 lines. Split UI logic into sub-components when exceeding this limit.
- Separate business logic (custom hooks/API queries) from pure presentation components.
- Zero `any` in TypeScript. All props, events, and API payloads must have explicit interfaces.
- Use Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`) instead of nested `<div>` wrappers.

## 2. Performance & Hardware Boundaries
- Do NOT add `transform-gpu` globally. Restrict hardware acceleration only to actively animated elements.
- Clean up all event listeners, intervals, and observers inside `useEffect` return blocks to prevent memory leaks.
- Maintain CLS = 0: Pre-define dimensions or aspect ratios for all dynamic visual containers.
- Optimize images using framework-native wrappers (`next/image`) with proper responsive sizing.
- Zero unintended horizontal scroll: Ensure strictly responsive layouts without `overflow-x` leaks on mobile devices.

## 3. Motion & Accessibility (A11y)
- Always respect user system preferences: wrap complex animations in `prefers-reduced-motion`.
- Provide accessible focus indicators using `focus-visible` styling for keyboard navigation.
- Interactive custom elements must include appropriate ARIA roles, `aria-expanded`, and keyboard handlers (`onKeyDown`).
- Minimum touch target: Ensure all interactive elements on touch screens are at least 44x44px.

## 4. Resilience & State Handling
- Every data-fetching view must handle complete states: Idle, Loading (Skeleton), Error (Fallback), Empty (No data CTA), and Success.
- Wrap major dynamic features with React Error Boundaries to isolate runtime exceptions.
- Form inputs must validate data with immediate visual feedback and accessible error messages.

## 5. Strict Anti-Patterns (NEVER DO)
- NEVER use inline CSS `style={{ ... }}` for static properties; use configured utility classes.
- NEVER manipulate DOM directly via `document.querySelector` or native browser nodes.
- NEVER bundle API fetching logic directly inside presenting leaf components.
