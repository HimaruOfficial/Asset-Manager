---
name: Expo JSX Babel quirks
description: Known Babel/JSX parsing pitfalls in this Expo React Native project.
---

## Rule 1 — No template literal types in JSX
Template literal types like `` `${number}%` `` as a TypeScript type assertion inside JSX break Babel's parser with a misleading "Expected corresponding JSX closing tag" error.

**Why:** Babel's JSX parser misreads the backtick as JSX content.

**How to apply:** Use `as any` instead of `` as `${number}%` `` in JSX attributes.

## Rule 2 — No module-level process.env reads
Reading `process.env["EXPO_PUBLIC_*"]` at module top-level (outside any function) causes ESM hoisting issues.

**Why:** Expo/Metro bundles modules before env injection completes.

**How to apply:** Always read `process.env` values inside component bodies or function calls, never as module-level constants.
