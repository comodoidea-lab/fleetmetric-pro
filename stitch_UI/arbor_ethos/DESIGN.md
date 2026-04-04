# Design System Document: Eco-Management Implementation

## 1. Overview & Creative North Star

### Creative North Star: "The Living Sanctuary"
The objective of this design system is to move away from the sterile, "dashboard-generic" look of modern SaaS and toward an editorial, organic experience that feels as much like a premium lifestyle magazine as it does a management tool. We are building "The Living Sanctuary"—a digital space that feels grounded, breathable, and hyper-intentional.

We reject the rigid, boxed-in layouts of the past decade. Instead, we embrace **Organic Asymmetry**. This means using generous, purposeful white space and overlapping elements to create a sense of movement and growth. By utilizing a sophisticated "Forest Green" palette and Inter's clean legibility, we communicate safety through clarity and sustainability through tonal depth.

---

## 2. Colors & Surface Philosophy

### The Tonal Palette
Our palette is rooted in the earth. We use `#0f5238` (Primary) as our anchor of authority and safety, while the lighter `surface` and `secondary` tiers provide the "oxygen" the layout needs to feel fresh.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders (`#CCCCCC` or similar) are strictly prohibited for sectioning. 
Structure is defined solely through background color shifts. To separate a sidebar from a main feed, place a `surface-container-low` (#f2f4f0) element against the `background` (#f8faf6). This creates a sophisticated, "borderless" look that feels integrated rather than partitioned.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, high-quality paper sheets. 
- **Base Layer:** `surface` (#f8faf6)
- **Secondary Sections:** `surface-container` (#eceeea)
- **Elevated Interactive Elements:** `surface-container-lowest` (#ffffff)
By nesting a "Lowest" (brightest) card inside a "Low" or "Mid" container, we create a natural focal point without needing heavy-handed UI metaphors.

### The "Glass & Gradient" Rule
To add visual "soul," use subtle linear gradients for primary actions. Transition from `primary` (#0f5238) to `primary_container` (#2d6a4f) at a 135-degree angle. For floating overlays (like mobile navigations or pop-overs), use **Glassmorphism**: apply `surface` colors at 80% opacity with a `24px` backdrop-blur to allow the "forest" tones to bleed through softly.

---

## 3. Typography

The typography system leverages **Inter** not as a utility font, but as a brand voice. We utilize extreme scale shifts to create an editorial hierarchy.

*   **Display (lg/md/sm):** These are your "Hero" moments. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to anchor pages. It should feel authoritative and calm.
*   **Headlines & Titles:** Used for section headers. Always pair `headline-sm` (1.5rem) with generous top-margin spacing to allow the content to "breathe."
*   **Body (lg/md/sm):** Use `body-lg` (1rem) for primary descriptions to maintain high readability and a premium "active" feel. 
*   **Labels:** `label-md` (0.75rem) should be used for metadata and overlines. Consider using `on-surface-variant` (#404943) in all-caps for a "technical" safety-oriented aesthetic.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering** rather than shadows. 
- Place a `surface-container-highest` element to represent a "pressed" or "nested" state.
- Place a `surface-container-lowest` element to represent a "lifted" or "active" state.

### Ambient Shadows
Where floating depth is mandatory (e.g., a floating action button), use an **Ambient Shadow**:
- `box-shadow: 0 12px 32px -4px rgba(15, 82, 56, 0.08);`
The shadow must be tinted with our primary green (`#0f5238`) at a very low opacity. Never use pure black or grey shadows.

### The "Ghost Border" Fallback
If an element requires a container for accessibility (like a text input), use the **Ghost Border**: `outline-variant` (#bfc9c1) at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`). `xl` (1.5rem) roundedness. No border. White text.
- **Secondary:** `secondary_container` (#cce6d0) fill with `on_secondary_container` (#506856) text. This should feel "approachable."
- **Tertiary:** Purely typographic with a subtle `primary` underline on hover.

### Input Fields
Forgo the traditional box. Use a `surface-container-low` background with a `sm` (0.25rem) rounded bottom edge and a 2px `primary` accent line that appears only on focus.

### Cards & Lists
**Strict Rule:** No dividers. Use `md` (0.75rem) spacing increments to separate list items. Use a subtle `surface-variant` (#e1e3df) background on hover to indicate interactivity. Cards should use `lg` (1rem) roundedness to lean into the "approachable" vibe.

### Signature Component: The "Growth" Progress Bar
Instead of a flat bar, use a segmented track where each segment uses a different shade from `primary_fixed` to `primary`. This reinforces the "Eco/Sustainable" theme of progress and growth.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. For example, give a header more padding on the left than the right to create an editorial flow.
*   **Do** use `tertiary` (#713638) sparingly for "Warning" or "High Energy" moments—it provides a sophisticated, earthy contrast to the green.
*   **Do** prioritize "Breathing Room." If you think there is enough white space, add 16px more.

### Don’t:
*   **Don’t** use 100% opaque black for text. Always use `on_surface` (#191c1a) for better eye comfort and a "premium paper" feel.
*   **Don’t** use sharp corners. Everything in nature has a radius; adhere strictly to the `Roundedness Scale`.
*   **Don’t** use "Alert Red." Use our `error` (#ba1a1a) and `error_container` (#ffdad6) tokens, which are tuned to be legible but not jarring, maintaining the "safety-oriented" vibe.