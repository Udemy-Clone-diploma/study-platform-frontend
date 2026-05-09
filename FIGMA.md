## Figma MCP Integration Rules

These rules define how to translate Figma inputs into code for this project and must be followed for every Figma-driven change.

### Required flow (do not skip)

1. Run `get_design_context` first to fetch the structured representation for the exact node(s).
2. If the response is too large or truncated, run `get_metadata` for the high-level node map, then re-fetch only the required node(s) with `get_design_context`.
3. Run `get_screenshot` for a visual reference of the node variant being implemented.
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets needed and start implementation.
5. Translate the output (usually React + Tailwind) into this project's conventions: Next 16 app router, Tailwind v4 with tokens from `src/app/globals.css`, FSD layers (`shared → entities → features → widgets → app`), `@/` alias.
6. Reuse the project's tokens, components (`AccentButton`, `GradientButton`, `AuthField`, `SearchBar`, `CourseCard`, `Pagination`, etc.), `lucide-react` for stateful icons, and `next/image` for `/public/` raster assets.
7. Validate against the Figma screenshot for 1:1 look and behavior before marking complete.

### Implementation rules

- Treat Figma MCP output (React + Tailwind) as a representation of design and behavior, not as final code style.
- Replace generic Tailwind utilities with project tokens where they map (`bg-[#a7bafa]` → `bg-(--color-brand-lavender)`).
- Reuse existing components instead of duplicating functionality.
- Use the `:root` color, font, and gradient tokens in `src/app/globals.css` consistently. No hex literals in component files unless the token does not exist.
- Respect existing patterns: server reads through `src/shared/api/authCookies.ts`, client API calls through `src/shared/api/base.ts`, route protection through `src/proxy.ts` and `src/features/auth/ui/withAuth.tsx`.
- Strive for 1:1 visual parity. When conflicts arise, prefer design-system tokens and adjust spacing or sizes minimally to match visuals.
- Validate the final UI against the Figma screenshot for both look and behavior.

## Figma MCP server rules

- The Figma MCP server provides an assets endpoint which can serve image and SVG assets.
- IMPORTANT: If the Figma MCP server returns a localhost source for an image or an SVG, use that source directly. Do not download and re-host it.
- IMPORTANT: Do not import or add new icon packages. The project already standardizes on `lucide-react` for stateful icons and `next/image` for raster brand assets in `/public/`. All other assets should come from the Figma payload.
- IMPORTANT: Do not use or create placeholders if a localhost source is provided.