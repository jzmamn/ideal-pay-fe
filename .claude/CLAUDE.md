# Angular + TypeScript Expert

You write functional, maintainable, performant, and accessible Angular code.
Target: **Angular v20+ / TypeScript strict mode / Angular Material 21**.

---

## TypeScript

- Enable strict type checking
- Prefer type inference when the type is obvious
- Never use `any`; use `unknown` for uncertain types

---

## Angular

- **Standalone components only** — do NOT set `standalone: true` (it's the default in v20+)
- Use `inject()` for dependency injection, not constructor injection
- Use `providedIn: 'root'` for singleton services
- Implement lazy loading for all feature routes
- Use `NgOptimizedImage` for static images (not for inline base64)
- Do NOT use `@HostBinding` / `@HostListener` — use the `host` object in `@Component` / `@Directive` instead

---

## Angular Material 21

- Import components directly from `@angular/material/<component>` (e.g. `MatButtonModule`, `MatInputModule`)
- Use Material Design 3 (M3) tokens and theming — do NOT use legacy M2 styles
- Define the app theme using `mat.define-theme()` with `$color`, `$typography`, and `$density` maps
- Apply the theme via `mat.all-component-themes()` or scope with `mat.component-theme()` for lazy-loaded features
- Use CSS custom properties (`--mat-*`, `--mdc-*`) for component-level overrides; avoid overriding internal MDC classes directly
- Prefer Material components over custom equivalents (e.g. `mat-form-field`, `mat-button`, `mat-dialog`)
- Use `MatIconModule` with a registered icon font or SVG sprite; do NOT hardcode ligature strings without a fallback `aria-label`
- Use `mat-form-field` with `appearance="outline"` or `"fill"` — not the deprecated `legacy` or `standard`
- For dialogs, bottom sheets, and snackbars: inject `MatDialog` / `MatBottomSheet` / `MatSnackBar` via `inject()`, not the constructor
- Do NOT override `.mat-*` classes for theming; use the M3 token system instead

---

## Components

- Single responsibility per component; keep them small
- `changeDetection: ChangeDetectionStrategy.OnPush` always
- Use `input()` / `output()` functions, not decorators
- Use `computed()` for derived state
- Use `update()` or `set()` on signals — never `mutate()`
- Prefer Reactive Forms over Template-driven forms
- Prefer inline templates for small components
- Use paths relative to the component `.ts` file for external templates/styles

---

## Templates

- Use native control flow: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `class` bindings — not `ngClass`
- Use `style` bindings — not `ngStyle`
- Use the `async` pipe for observables
- Keep logic out of templates
- Do not assume globals (e.g. `new Date()`) are available in templates

---

## Accessibility

- All components must pass AXE checks
- Meet WCAG AA minimums: focus management, color contrast, ARIA attributes
- Use Material's built-in ARIA support; always supply `aria-label` or `aria-labelledby` on icon-only buttons and form fields without visible labels