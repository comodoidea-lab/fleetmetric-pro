# Design System Strategy: Fleet Authority

## 1. Overview & Creative North Star
**Creative North Star: The Architectural Command**

This design system moves beyond the "basic dashboard" trope. Instead of a flat, grid-based layout, we adopt an **Architectural Command** aesthetic. Think of the interface not as a web page, but as a high-end physical console—stable, authoritative, and sophisticated. We achieve this through "The Layered Depth" approach: breaking the rigid 1px border habit in favor of soft, stacked elevations and an editorial typography scale that makes dense fleet data feel curated rather than cluttered.

By prioritizing tonal shifts over structural lines, the UI gains a sense of "visual silence," allowing critical alerts (Red/Yellow/Green) to command immediate attention without competing with the container's skeleton.

---

## 2. Colors & Surface Logic

The palette is anchored in Navy Blue (`primary`), providing a foundation of corporate reliability, while using a sophisticated range of light grays to define hierarchy.

### The "No-Line" Rule
Explicitly prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. To separate a sidebar from a main content area, place a `surface-container-low` section against a `surface` background. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create "nested" depth:
*   **Base Layer:** `surface` (#f7fafc) for the overall application background.
*   **Secondary Zones:** `surface-container-low` (#f1f4f6) for sidebar navigation or secondary utility panels.
*   **Actionable Cards:** `surface-container-lowest` (#ffffff) for the primary content cards, creating a "lifted" effect.
*   **Active Overlays:** `surface-container-high` (#e5e9eb) for hover states or active selection indicators.

### The "Glass & Gradient" Rule
To elevate the fleet management experience from "utilitarian" to "premium," use **Glassmorphism** for floating elements like navigation bars or detail flyouts. Use semi-transparent `surface` colors with a `backdrop-blur` of 12px-20px. 
*   **Signature Textures:** Apply a subtle linear gradient from `primary` (#002045) to `primary_container` (#1a365d) for main CTAs or high-level summary headers. This adds "soul" and depth that flat hex codes lack.

---

## 3. Typography: The Editorial Engine

We utilize a dual-font system to balance authority with data precision.

*   **Display & Headlines (Manrope):** Used for large data points and section titles. Manrope’s geometric qualities provide a modern, technical feel. Use `headline-lg` (2rem) for fleet totals to give them a "hero" presence.
*   **Body & Labels (Inter):** Inter is the workhorse for data tables and status updates. Its high x-height ensures readability at small scales (`label-sm` 0.6875rem) in dense vehicle logs.
*   **The Power Ratio:** High-contrast typography is key. Pair a `display-sm` (2.25rem) vehicle count with a `label-md` (0.75rem) uppercase descriptor to create an editorial, high-end look.

---

## 4. Elevation & Depth

We eschew traditional "drop shadows" in favor of **Tonal Layering**.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` card (White) on top of a `surface-container-low` section (Light Blue-Gray). This creates a soft, natural lift that feels integrated into the environment.

### Ambient Shadows
When a "floating" element (like a modal or dropdown) is required, use **Ambient Shadows**:
*   **Blur:** 24px - 40px.
*   **Opacity:** 4% - 6%.
*   **Color:** Tint the shadow with `on_surface` (#181c1e) rather than pure black to keep the light feeling natural.

### The "Ghost Border" Fallback
If a border is absolutely necessary for accessibility (e.g., input fields), use a **Ghost Border**: the `outline_variant` token at **20% opacity**. Never use 100% opaque, high-contrast borders.

---

## 5. Components & Interface Patterns

### Buttons
*   **Primary:** Solid `primary` background with `on_primary` text. Use `rounded-md` (0.375rem) for a robust feel.
*   **Secondary:** `surface-container-high` background with `primary` text. No border.
*   **States:** On hover, shift the background color by one tier (e.g., from `surface-container-low` to `surface-container-high`).

### Cards & Data Lists
*   **Forbid Dividers:** Do not use horizontal lines between list items. Use vertical white space (Spacing `4` or `5`) and subtle background alternates (`surface` vs `surface-container-lowest`) to distinguish rows.
*   **Visual Hierarchy:** Vehicle status (Red/Yellow/Green) should be represented by a **vertical accent bar** (4px width) on the left edge of a card, rather than coloring the whole card. This maintains the clean, "professional" navy/gray aesthetic.

### Status Chips
*   Use `error_container` for Urgent Alerts and `tertiary_fixed` (Green) for Healthy Status. 
*   Text should always use the "On" token (e.g., `on_error_container`) to ensure a 4.5:1 contrast ratio.

### Input Fields
*   Use `surface-container-lowest` as the field background to make it "pop" against the `surface` background.
*   Focus state: A 2px "Ghost Border" using the `surface_tint` color.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical spacing (e.g., wider left margins for headlines) to create an editorial feel.
*   **Do** use `primary_fixed_dim` for subtle icons within cards to keep the navy theme consistent.
*   **Do** leverage "Breathing Room"—use Spacing Scale `10` (2.25rem) between major dashboard modules.

### Don’t:
*   **Don’t** use pure black (#000000) for text. Use `on_surface` (#181c1e) for a softer, premium contrast.
*   **Don’t** use "Alert Red" for anything other than critical vehicle failures. Use `secondary` for neutral actions.
*   **Don’t** use 1px dividers. If you feel the need to separate, increase the spacing scale or shift the background tone.