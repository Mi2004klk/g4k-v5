# Design System Revision: Charcoal Primary + Vibrant Accents

**Decision Record:** DR-DS1
**Status:** Approved
**Date:** 2026-08-09

## Context & Problem Statement

The initial design system leaned heavily on the exact Games4King brand colors (violet/pink/gold gradient) for primary UI surfaces and buttons. While highly brand-aligned, using intense gradients on primary interactive elements creates visual fatigue and clashes with the extensive use of semantic colors (success green, danger red) required for a dense data-heavy OS. The UI needed to feel "vibrant but professional" and more akin to ClickUp or Adobe products — a clean canvas that uses color deliberately for organization and state.

## Decision (DR-DS1)

We will adopt a **Charcoal Primary (`#1A1A2E`)** as the baseline anchor color for the application, combined with a **vibrant multi-color accent rotation**. 

1. **Primary Surfaces & Buttons:** 
   The default primary button will use the solid charcoal color. 
   To maintain the Games4King brand's playful identity, primary buttons will feature an **animated rainbow conic-gradient border on hover**. 
   This ensures the UI remains extremely clean at rest, but "wows" on interaction. No AI-slop strokes or gradients will be used statically.

2. **Accent Rotation:**
   The original brand colors (violet, pink, gold) will be repositioned into a broader 12-color accent palette (violet, orange, coral, red, pink, magenta, blue, indigo, cyan, teal, green, lime, gray). 

3. **Module Color Mapping:**
   Every major module in the system will be assigned a distinct accent color from the rotation (e.g., Dashboard=blue, Attendance=green, Leave=amber) to aid in wayfinding and cognitive chunking.

## Consequences

- All UI primitives in `packages/ui` must be updated to support the charcoal default and rainbow-hover spec.
- `DESIGN-SYSTEM.md` must be updated to formally define the accent rotation, the module-to-color mapping, and the primary button interaction states.
- The rainbow hover animation requires a `reduced-motion` fallback to comply with accessibility standards.
