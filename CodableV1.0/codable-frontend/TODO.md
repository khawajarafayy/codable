# Convert UI Components from TSX to JSX

## Overview
Convert all .jsx files in `src/pages/Student/LandingDashboard/components/ui/` that contain TypeScript syntax to pure JSX by removing type annotations, interfaces, and TS-specific constructs.

## Files to Convert
- [x] drawer.jsx - Converted
- [x] card.jsx - Converted
- [x] carousel.jsx - Converted
- [ ] alert-dialog.jsx
- [ ] alert.jsx
- [ ] aspect-ratio.jsx
- [ ] avatar.jsx
- [ ] badge.jsx
- [ ] breadcrumb.jsx
- [ ] calendar.jsx
- [x] chart.jsx - Converted
- [ ] checkbox.jsx
- [ ] collapsible.jsx
- [ ] command.jsx
- [ ] context-menu.jsx
- [ ] dialog.jsx
- [ ] dropdown-menu.jsx
- [ ] form.jsx
- [ ] hover-card.jsx
- [ ] input-otp.jsx
- [ ] input.jsx
- [ ] label.jsx
- [ ] menubar.jsx
- [ ] navigation-menu.jsx
- [ ] pagination.jsx
- [ ] popover.jsx
- [ ] progress.jsx
- [ ] radio-group.jsx
- [ ] resizable.jsx
- [ ] scroll-area.jsx
- [ ] select.jsx
- [ ] separator.jsx
- [ ] sheet.jsx
- [ ] sidebar.jsx
- [ ] skeleton.jsx
- [ ] slider.jsx
- [ ] sonner.jsx
- [ ] switch.jsx
- [ ] table.jsx
- [ ] tabs.jsx
- [ ] textarea.jsx
- [ ] toggle-group.jsx
- [ ] toggle.jsx
- [ ] tooltip.sx (rename to tooltip.jsx if needed)
- [ ] use-mobile.ts (rename to use-mobile.js if needed)
- [ ] utils.ts (rename to utils.js if needed)

## Conversion Steps
For each file:
1. Remove type annotations from function parameters (e.g., `: React.ComponentProps<...>`)
2. Remove interface and type definitions
3. Remove any TS-specific imports or syntax
4. Ensure the code remains valid JavaScript/JSX

## Verification
- After conversion, run the project to check for any syntax errors
- Ensure components still function correctly
