# Design System Strategy: Precision & Velocity

## 1. Overview & Creative North Star
**Creative North Star: The Orbital Cockpit**

This design system is not a collection of templates; it is a high-precision instrument. We are moving away from the "static website" feel toward a "Dynamic Performance" dashboard. The aesthetic philosophy revolves around **Orbital Layering**—the idea that information exists in a pressurized, dark-mode environment where depth is created through luminescence and tonal shifts rather than physical barriers.

To break the "template" look, we utilize **Intentional Asymmetry**. Dashboards should not be perfectly mirrored; use offset columns and overlapping "Glass" panels to create a sense of forward momentum. Large-scale typography (`display-lg`) should act as a structural anchor, often bleeding off the edge or sitting behind foreground elements to create a sense of scale and "Big Data" sophistication.

---

## 2. Colors & Tonal Architecture
The palette is rooted in the depth of `Deep Slate` (#0F172A), acting as the vacuum of space, while `Sky Blue` (#38BDF8) serves as the "hud" or laser-focused UI layer.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders for sectioning. 
Structure must be defined through **Background Color Shifts**. To separate a sidebar from a main feed, transition from `surface` to `surface-container-low`. To highlight a dashboard widget, place a `surface-container-high` card atop a `surface-container` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers. 
*   **Base:** `surface` (#0b1326)
*   **Deepest Recess:** `surface-container-lowest` (#060e20) for inactive or background zones.
*   **Primary Worksurface:** `surface-container` (#171f33).
*   **Active Overlays:** `surface-container-highest` (#2d3449) for modals and active tooltips.

### The "Glass & Gradient" Rule
To achieve a "Sleek/High-Tech" feel, primary actions should utilize **Signature Textures**. 
*   **CTA Gradient:** Linear gradient (135deg) from `primary` (#7bd0ff) to `on_primary_container` (#008abb).
*   **Orbital Glow:** Use a subtle radial gradient of `primary` at 5% opacity behind key metrics to simulate a glowing screen effect.

---

## 3. Typography: The Editorial Tech Scale
The typography balances the technical precision of **Space Grotesk** with the high-legibility of **Inter**.

*   **The Power Scale (Display & Headline):** Use `Space Grotesk` for all `display` and `headline` roles. This typeface conveys a "high-tech" aerospace aesthetic. For maximum impact, use `display-lg` with a tight `letter-spacing: -0.04em` to make the UI feel editorial and intentional.
*   **The Utility Scale (Title & Body):** `Inter` is our workhorse. It provides the "precise" feel required for data density. 
*   **Label Micro-Copy:** Use `label-md` in all-caps with `0.1em` letter-spacing for metadata and dashboard headers to mimic hardware interfaces.

---

## 4. Elevation & Depth: Tonal Layering
In this system, light is the architect. We do not use "drop shadows" in the traditional sense.

*   **The Layering Principle:** Stacking tiers is mandatory. A `surface-container-low` section should house `surface-container-high` cards. This creates a natural "lift" through luminance.
*   **Ambient Shadows:** If an element must "float" (e.g., a dropdown), use a shadow color tinted with the primary hue: `rgba(123, 208, 255, 0.08)` with a 32px blur. It should look like an ambient glow, not a shadow cast by a sun.
*   **The Ghost Border Fallback:** If a boundary is strictly required for accessibility, use `outline-variant` (#45464d) at **15% opacity**. It should be barely perceptible.
*   **Glassmorphism:** For top navigation or floating side-panels, use `surface_container` with a `backdrop-filter: blur(20px)` and 80% opacity. This allows the high-velocity data below to remain visible while maintaining focus.

---

## 5. Components

### Buttons & Interaction
*   **Primary:** High-gloss. Use the `primary` to `on_primary_container` gradient. Border-radius: `md` (0.375rem).
*   **Secondary:** Glass-style. `surface-variant` background with a `primary` "Ghost Border."
*   **Haptic Feedback:** On hover, buttons should not just change color—they should "glow" using a `primary` outer-glow box-shadow.

### Dashboard Cards
*   **No Dividers:** Forbid the use of line-dividers. Use `padding` (Spacing 6 or 8) and `surface-container` shifts to group data.
*   **Metric Display:** Use `display-sm` for hero numbers, paired with a `label-sm` Sky Blue accent for percentage changes.

### Input Fields
*   **States:** Dark-fill using `surface-container-lowest`. On focus, the border remains invisible, but a 1px `primary` bottom-glow appears, simulating a light-bar.

### Precision Chips
*   **Style:** Low-profile. Use `secondary_container` with `on_secondary_container` text. These should feel like small LED indicators on a panel.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use extreme vertical whitespace to separate major modules.
*   **Do** lean into "Deep Slate" for 90% of the UI, using "Sky Blue" only for critical data pathing and interactive cues.
*   **Do** use `Space Grotesk` as a layout element, not just a label. Large, low-contrast numbers can sit behind charts to indicate scale.

### Don’t:
*   **Don’t** use a 100% white (#FFFFFF) anywhere. Use `on_surface` (#dae2fd) for maximum readability without harsh "monitor bleed."
*   **Don’t** use standard 1px borders or grid lines. If you feel the need for a line, try a background color shift first.
*   **Don’t** use rounded corners larger than `xl` (0.75rem). The system must feel "precise" and "engineered," not "bubbly."

---

## 7. Accessibility & Motion
*   **Motion:** Elements should move with "Exponential Ease-Out." Transitions should feel fast but smooth—like a high-end digital gauge.
*   **Readability:** Ensure that all `on_surface_variant` text on `surface_container` backgrounds meets WCAG AA standards. When in doubt, increase the contrast using the `primary_fixed` token.