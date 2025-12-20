# Veilo UI Theme & Design System

This guide outlines the design system, visual language, and technical implementation details for the Veilo brand. Use this document to ensure consistency across all Veilo-related projects.

## 1. Design Philosophy
**"The Void & The Signal"**
The Veilo aesthetic is rooted in **Cyberpunk Minimalism**. It combines the darkness of the void (privacy/anonymity) with the sharp, piercing signal of high-frequency trading (neon green).
-   **Keywords**: Privacy, Encryption, Speed, Technical, Industrial, Dark, Neon.
-   **Vibe**: "High-tech terminal meets luxury dark mode."

## 2. Color Palette

| Role | Color | Hex | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | Pure Black | `#000000` | `bg-black` | Main page background, section backgrounds. |
| **Foreground** | Pure White | `#ffffff` | `text-white` | Primary headings, high-contrast text. |
| **Accent** | Neon Green | `#00FF00` | `text-[#00FF00]` | Active states, cursors, success, "hacker" elements. |
| **Muted** | Zinc 400/500 | `#a1a1aa` | `text-zinc-400` | Secondary text, descriptions, inactive labels. |
| **Borders** | White Alpha | `rgba(255,255,255,0.1)` | `border-white/10` | Subtle dividers, card outlines. |
| **Glass** | Black Alpha | `rgba(0,0,0,0.4)` | `bg-black/40` | HUD backgrounds, Navbar (with `backdrop-blur`). |

## 3. Typography

### Primary Font: **Nohemi** (Sans-Serif)
Used for headings, body text, and general UI.
-   **Weights**: Variable. Often uses `font-light` (300) for large display text or `font-medium` (500) for labels.
-   **Tracking**: Tight (`tracking-tight`) for large headings, Wide (`tracking-widest`) for small uppercase labels.

### Secondary Font: **Geist Mono** (Monospace)
Used for technical data, logs, statistics, and "system" text.
-   **Usage**: `font-mono`.
-   **Context**: HUD elements, code snippets, status indicators (e.g., "SYSTEM OPERATIONAL").

## 4. UI Components

### Buttons (`CyberButton`)
-   **Shape**: Rectangular, sharp corners.
-   **Primary Style**: White background, Black text.
-   **Secondary Style**: Transparent background, White/20 border, White text.
-   **Hover Effect**:
    -   Green scanline (`bg-[#00FF00]/20`) slides up from bottom.
    -   Corner accents (L-shapes) appear.
-   **Disabled State**: Opacity 70%, `cursor-not-allowed`, no hover effects.

### Cards (`CyberCard`)
-   **Background**: `bg-zinc-900/40` (Dark, semi-transparent).
-   **Border**: `border-white/10` (Idle) -> `border-white/40` (Hover).
-   **Decorations**:
    -   **Corner Brackets**: SVG paths at all 4 corners.
    -   **Noise Texture**: `bg-[url('/noise.png')]` with `mix-blend-overlay`.
    -   **Scanning Beam**: Green horizontal line scanning vertically on hover.

### HUD (Heads-Up Display)
-   **Container**: `bg-black/80`, `backdrop-blur-md`, `border-white/10`, `rounded-lg`.
-   **Shadow**: Green glow `shadow-[0_0_10px_#00FF00]/5`.
-   **Elements**:
    -   **Blinking Dots**: `w-2 h-2 rounded-full bg-[#00FF00] animate-pulse`.
    -   **Scramble Text**: Text that cycles through random characters before settling.
    -   **Live Logs**: Scrolling list of "system events" in monospace.

## 5. Animations (Framer Motion)

### Entrance Animations
-   **Masked Reveal**: Text slides up from `110%` y-offset within an `overflow-hidden` container.
    -   **Transition**: `duration: 1.2`, `ease: [0.16, 1, 0.3, 1]`.
-   **Fade Up**: `initial={{ opacity: 0, y: 20 }}` -> `animate={{ opacity: 1, y: 0 }}`.

### Interactive Elements
-   **Interactive Grid**: HTML5 Canvas grid that repels points based on mouse position ("The Void" effect).
-   **Grid Beams**: Glowing green lines moving along grid paths (`motion.div` with gradient backgrounds).

### Text Effects
-   **Typewriter**: Characters appear one by one with a blinking green cursor (`_`).
-   **Scramble**: Random characters (`A-Z, 0-9`) cycling rapidly before revealing the final text.

## 6. Visual Effects & Assets

-   **Glows**: Use `shadow-[0_0_10px_#00FF00]` for neon elements.
-   **Gradients**:
    -   **Radial Overlay**: `radial-gradient(circle at 50% 0%, rgba(25,25,25,1) 0%, rgba(0,0,0,1) 80%)`.
    -   **Mouse Spotlight**: `radial-gradient(650px circle at ${x}px ${y}px, rgba(0,255,0,0.1), transparent 80%)`.
-   **Grid Pattern**:
    ```css
    .bg-grid {
      background-size: 50px 50px;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    }
    ```

## 7. Implementation Checklist for Agents
1.  [ ] Install **Tailwind CSS** and **Framer Motion**.
2.  [ ] Set background to **Black** (`#000000`).
3.  [ ] Import **Nohemi** (or Inter) and a **Monospace** font.
4.  [ ] Implement the **MaskedReveal** component for all major headings.
5.  [ ] Use **Neon Green** (`#00FF00`) *sparingly* for accents only.
6.  [ ] Ensure all containers have subtle **white borders** (`border-white/10`).
7.  [ ] Add **noise texture** overlays to cards/sections for texture.
