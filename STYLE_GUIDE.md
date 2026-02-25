# Style Guide — Responsive Sizing

This project uses responsive tokens and scaling to keep layouts consistent across device sizes.

Rules:
1. Use `Spacing`, `Radius`, and `FontSize` for layout and typography.
2. If a numeric value is needed, use `r()` or `rf()` from `src/theme/responsive`.
3. Avoid raw numeric literals in styles for: `padding*`, `margin*`, `gap`, `borderRadius`, `fontSize`, `width`, `height`, `top/left/right/bottom`.
4. Proportional sizing is allowed for hero images and cards (e.g. `width * 0.32`) when it preserves layout balance.

Examples:
- `paddingHorizontal: Spacing['5']`
- `fontSize: FontSize.lg`
- `height: r(160)`
- `height: Math.round(width * 0.32)`

Linting:
- ESLint warns on raw numeric literals for the properties above. Follow the warnings to keep the UI responsive.
