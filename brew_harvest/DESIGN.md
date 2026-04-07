# Design System Document: The Artisanal Interface

## 1. Overview & Creative North Star

**Creative North Star: "The Modern Alchemist"**
This design system moves away from the sterile, utilitarian "spreadsheet" look common in POS systems. Instead, it embraces an editorial, high-end café aesthetic that feels as curated as a craft brew. We treat the interface not as a rigid grid, but as a series of **layered, organic surfaces**. By utilizing intentional asymmetry—such as oversized typography headers offset against compact menu lists—we create a rhythm that guides the eye naturally through a fast-paced workflow. 

The goal is to provide a "breathable" experience where information is organized by depth and tone rather than lines and boxes. It is professional enough for high-volume operations but inviting enough to sit on a customer-facing tablet in a premium boutique.

---

## 2. Colors

The palette is a sophisticated blend of earthy roasted tones and botanical freshness, anchored by high-end neutrals.

### The Color Palette (Material Design Tokens)
*   **Primary (`#553722`) & Primary Container (`#6f4e37`):** The "Espresso" core. Used for high-action touchpoints.
*   **Secondary (`#4a6549`) & Secondary Container (`#ccebc7`):** The "Botanical" accent. Used for fresh juice categories, health-conscious options, or "Success" states.
*   **Surface Tiers:** 
    *   `surface`: `#f9f9f8` (The canvas)
    *   `surface_container_low`: `#f4f4f3` (Subtle sectioning)
    *   `surface_container_highest`: `#e2e2e2` (Prominent interactive zones)

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning content. To separate a menu category (e.g., "Café" vs "Nước Ép"), use a background shift. A list of items should sit on a `surface_container_low` background, while the active order sidebar sits on `surface_container_highest`. 

### Surface Hierarchy & Nesting
Treat the UI as physical layers. An order card (`surface_container_lowest`) should feel like it is "tucked into" a tray (`surface_container_low`). This nesting creates an intuitive sense of "inside vs outside" without cluttering the screen with lines.

### The Glass & Gradient Rule
For modal overlays or floating "Quick Action" buttons, utilize **Glassmorphism**. Use a semi-transparent `surface` color with a `backdrop-filter: blur(20px)`. Main call-to-action buttons should use a subtle linear gradient from `primary` to `primary_container` at a 135-degree angle to provide a tactile, "pressed" quality.

---

## 3. Typography

The typography strategy pairs the geometric authority of **Plus Jakarta Sans** with the rhythmic readability of **Manrope**.

*   **Display & Headlines (Plus Jakarta Sans):** These are your "Editorial" voices. Use `display-lg` for daily specials and `headline-md` for category titles. The wide aperture of Jakarta Sans ensures titles are legible even from a distance across a counter.
*   **Titles & Body (Manrope):** Manrope is used for the "Data." Use `title-md` for drink names and `body-lg` for prices and descriptions. Its modern, high-x-height design keeps the text crisp during rapid scrolling.
*   **Labels (Manrope):** Use `label-md` for status indicators (e.g., "In Progress," "Completed"). These should always be uppercase with a +5% letter-spacing to ensure they don't get lost in the visual hierarchy.

---

## 4. Elevation & Depth

We define hierarchy through **Tonal Layering** rather than traditional structural dividers.

### The Layering Principle
Instead of a shadow, move an element "up" by lightening its surface.
*   **Base:** `surface`
*   **Middle Layer:** `surface_container_low`
*   **Interactive Layer:** `surface_container_lowest` (appears "brightest" and most clickable).

### Ambient Shadows
When a floating element (like a checkout drawer) is required, use an ambient shadow:
*   **Shadow:** `0 20px 40px rgba(80, 69, 62, 0.08)`
*   This uses a tint of the `on_surface_variant` color rather than black, making the shadow feel like natural light passing through a warm environment.

### The "Ghost Border" Fallback
If an element requires a boundary for accessibility (e.g., an input field), use a **Ghost Border**: `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Rounded `full`, Gradient `primary` to `primary_container`, `on_primary` text.
*   **Secondary:** Rounded `full`, `secondary_container` background, `on_secondary_container` text.
*   **Tertiary:** No background, `primary` text, `md` rounded focus state.

### Input Fields
*   Never use a four-sided box. Use a `surface_container_low` background with a `sm` (0.5rem) rounded top and a `primary` 2px bottom stroke only upon focus. This keeps the form feeling light and modern.

### Cards & Lists (Artisanal Layout)
*   **Forbid Dividers:** The reference image shows a rigid table. This design system replaces those lines with vertical white space. Use a `1.5rem` (md) gap between items.
*   **The "Item Block":** Group an item name (`title-md`) and its price (`body-lg`) on a single line, but right-align the price using `tertiary` color to create a clear vertical scan-line for the eye.

### Category Chips
*   Use `lg` (2rem) roundedness. Use `secondary_fixed` for inactive and `secondary` for active states. These should feel like smooth, tumbled stones.

---

## 6. Do’s and Don'ts

### Do:
*   **DO** use whitespace as a functional tool. If two items feel cluttered, increase the margin rather than adding a line.
*   **DO** use `secondary` (soft greens) specifically for "Fresh" or "Healthy" categories to subconsciously cue the user.
*   **DO** use `xl` (3rem) roundedness on the outer corners of main containers to maintain the "friendly" brand promise.

### Don’t:
*   **DON'T** use pure black `#000000` for text. Use `on_surface` (`#1a1c1c`) to maintain a soft, premium look.
*   **DON'T** use "Standard" Material ripples. Use a gentle opacity shift (e.g., 10% overlay) for hover/tap states to keep the interaction sophisticated.
*   **DON'T** use high-contrast borders. If the background colors are too similar, use a subtle tonal shift from `surface_container_low` to `surface_container_high`.

### Accessibility Note
Ensure that all `primary` and `secondary` actions maintain a contrast ratio of at least 4.5:1 against their backgrounds. Use the `on_primary` and `on_secondary` tokens specifically designed for this purpose.