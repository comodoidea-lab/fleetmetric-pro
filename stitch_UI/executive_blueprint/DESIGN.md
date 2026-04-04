# Design System Document: The Architectural Authority

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Architect"
This design system rejects the "template" aesthetic of generic enterprise software. Instead, it adopts the persona of a high-end architectural firm: authoritative, structural, and meticulously curated. We move beyond "trustworthy blue boxes" to create a signature experience characterized by **Monolithic Layering** and **Editorial Precision**.

By utilizing intentional asymmetry and high-contrast typography, we transform data into a narrative. The interface should feel like a physical desk of premium materials—polished stone, heavy paper, and frosted glass—where hierarchy is communicated through depth and tonal shifts rather than lines.

---

## 2. Colors & Surface Logic
The palette is anchored in a deep, commanding Navy (`primary`) and supported by a sophisticated range of cool grays.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be defined exclusively through background color shifts. 
- Use a `surface-container-low` (#f2f4f6) section sitting on a `surface` (#f7f9fb) background to create a clean, modern break.

### Surface Hierarchy & Nesting
Think of the UI as a series of nested physical layers. 
- **The Base:** All pages start at `surface` (#f7f9fb).
- **The Inset:** Use `surface-container-low` (#f2f4f6) for recessed areas like sidebars or secondary content.
- **The Lift:** Place `surface-container-lowest` (#ffffff) cards on top of lower-tier surfaces to create a natural, "paper-on-desk" lift.
- **The Focal Point:** Use `primary-container` (#1a365d) for high-impact zones, ensuring text is strictly `on-primary` (#ffffff).

### The "Glass & Gradient" Rule
To prevent the "flat enterprise" look, floating elements (modals, dropdowns) should utilize **Glassmorphism**:
- **Background:** `surface-container-lowest` (#ffffff) at 80% opacity.
- **Effect:** 20px - 40px Backdrop Blur.
- **Visual Soul:** Apply a subtle linear gradient to main CTAs (from `primary` #002045 to `primary-container` #1a365d) at a 135-degree angle. This adds a "weighted" feel that flat hex codes cannot replicate.

---

## 3. Typography: Editorial Authority
The choice of **Manrope** is a commitment to modern geometric clarity. It must be used to create an editorial rhythm.

- **Display Scales (`display-lg` to `display-sm`):** Reserved for hero moments and data highlights. Use these sparingly to create "breathing room" through large-scale type.
- **Headline & Title:** Use `headline-lg` (2rem) for section entries. The contrast between a `headline-lg` in `primary` (#002045) and `body-md` in `on-surface-variant` (#43474e) creates an immediate sense of professional hierarchy.
- **Labeling:** `label-md` and `label-sm` should be used for metadata. Always use 0.05rem letter-spacing for uppercase labels to enhance readability and "premium" feel.

---

## 4. Elevation & Depth
Traditional drop shadows are too "digital." We utilize **Tonal Layering** to create a sophisticated sense of space.

- **The Layering Principle:** Depth is achieved by stacking. A `surface-container-highest` (#e0e3e5) element on a `surface` (#f7f9fb) base creates a "recessed" look, perfect for data tables or input zones.
- **Ambient Shadows:** When an element must float (e.g., a primary action menu), use an extra-diffused shadow:
  - `Y: 12px, Blur: 32px, Spread: -4px`
  - `Color: #191c1e (on-surface) at 6% opacity`
- **The "Ghost Border" Fallback:** If a container requires a boundary for accessibility, use the `outline-variant` (#c4c6cf) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components
### Buttons
- **Primary:** `primary` (#002045) background with `on-primary` (#ffffff) text. Corner radius: `md` (0.375rem). Apply the "Visual Soul" gradient.
- **Secondary:** `secondary-container` (#dde3eb) background. No border.
- **Tertiary:** Ghost style. `on-surface` text with no background until hover.

### Cards & Lists
- **Rule:** **No Divider Lines.** 
- Separate list items using 12px of vertical white space or by alternating the background between `surface-container-low` and `surface-container-lowest`.
- Cards should use a "Soft Lift": `surface-container-lowest` background with an `xl` (0.75rem) corner radius.

### Input Fields
- **Default State:** `surface-container-highest` (#e0e3e5) background, `none` border.
- **Active State:** Add a 1px "Ghost Border" using `primary` (#002045) at 40% opacity.
- **Corner Radius:** `sm` (0.125rem) to maintain a formal, business-focused aesthetic.

### Additional Component: The "Data Monolith"
For enterprise dashboards, use large, `display-sm` metrics housed in `surface-container-low` modules. The number should be `primary`, while the label is `on-surface-variant` in all-caps `label-sm`.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical layouts. Push content to the right and leave a wide `surface` margin on the left for a high-end editorial feel.
- **Do** use `primary-fixed-dim` (#adc7f7) for subtle interaction states like hover-fills on dark backgrounds.
- **Do** prioritize "Over-spacing." When in doubt, add 16px of extra margin.

### Don’t:
- **Don’t** use pure black (#000000). Use `on-background` (#191c1e) for all text to maintain tonal softness.
- **Don’t** use standard "Material Design" shadows. They are too aggressive for this formal aesthetic.
- **Don’t** use icons as the primary source of navigation. This system is "Type-First"; icons are secondary accents only.