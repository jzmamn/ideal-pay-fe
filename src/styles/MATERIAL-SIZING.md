# Material Sizing — `material-sizing.scss`

A Bootstrap-style `sm / md / lg` sizing utility for Angular Material v21+ (Material 3 / MDC-based components). All sizing is driven by CSS custom properties, so classes cascade naturally to child components without `::ng-deep`.

---

## Quick Start

Apply a size class to any wrapper or directly on a Material component:

```html
<div class="mat-size-sm">
  <mat-form-field appearance="outline">
    <mat-label>Search</mat-label>
    <input matInput>
  </mat-form-field>
  <button mat-flat-button>Go</button>
</div>
```

That is all — every Material component inside the wrapper inherits the size.

---

## Size Reference

| Token | `sm` | `md` (default) | `lg` |
|---|---|---|---|
| Font size | 12px | 16px | 18px |
| Floating label | 10px | 12px | 14px |
| Form field height | 40px | 56px | 64px |
| Vertical padding | 4px | 16px | 20px |
| Button height | 28px | 40px | 48px |
| Button font | 12px | 14px | 16px |
| Icon button size | 32px | 40px | 48px |
| Icon size | 18px | 24px | 28px |
| Touch target | 32px | 40px | 48px |
| Border radius | 4px | 4px | 6px |

`md` mirrors Angular Material's `density(0)` defaults — applying `.mat-size-md` is a no-op on a freshly themed application.

---

## Components Covered

| Angular Material Component | What changes |
|---|---|
| `mat-form-field` (outline / fill / standard) | Height, vertical padding, font size, floating label size, border-radius |
| `input[matInput]` | Font size (inherited from form-field variables) |
| `mat-textarea` | Font size, line-height, min-height |
| `mat-select` trigger | Trigger font size |
| `mat-select` panel | Font size via `panelClass` (see below) |
| `mat-button` | Height, font size |
| `mat-flat-button` | Height, font size |
| `mat-stroked-button` | Height, font size |
| `mat-raised-button` | Height, font size |
| `mat-icon-button` | Icon size, state-layer size |
| `mat-checkbox` | Touch-target size, label font size and line-height |
| `mat-radio-button` | Touch-target size, label font size and line-height |

---

## Usage

### 1. Wrapper class

Wrap any block of Material components in a `mat-size-{size}` div. The CSS custom properties cascade to all descendants automatically.

```html
<!-- Compact filter bar -->
<div class="mat-size-sm">
  <mat-form-field appearance="outline">
    <mat-label>Department</mat-label>
    <mat-select>
      <mat-option value="it">IT</mat-option>
    </mat-select>
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Name</mat-label>
    <input matInput>
  </mat-form-field>

  <button mat-flat-button>Search</button>
</div>
```

### 2. Directly on a component

The class can be placed on the Material component host element itself when you only want to size one control:

```html
<mat-form-field appearance="outline" class="mat-size-lg">
  <mat-label>Basic Salary</mat-label>
  <span matTextPrefix>$&nbsp;</span>
  <input matInput type="number">
</mat-form-field>

<button mat-raised-button class="mat-size-sm">Cancel</button>
```

### 3. Sass mixin

Import the file and `@include` the mixin inside any selector. Useful when size must be applied programmatically rather than via a template class:

```scss
@use 'src/styles/material-sizing' as sizing;

// All form controls inside .filter-bar become compact
.filter-bar {
  @include sizing.mat-size(sm);
}

// Mix sizes in the same component
.dialog-footer {
  @include sizing.mat-size(sm);

  .confirm-btn {
    @include sizing.mat-size(lg);
  }
}
```

### 4. Select panel (`panelClass`)

The `mat-select` dropdown panel teleports into the CDK overlay container, which sits outside the component tree. CSS custom properties set on a wrapper **cannot cascade** into the panel. Use `[panelClass]` to opt in:

```html
<!-- sm panel -->
<mat-select panelClass="mat-select-panel-sm" formControlName="role">
  <mat-option value="admin">Admin</mat-option>
</mat-select>

<!-- lg panel -->
<mat-select [panelClass]="'mat-select-panel-lg'" formControlName="dept">
  <mat-option value="hr">Human Resources</mat-option>
</mat-select>
```

Available panel classes: `mat-select-panel-sm`, `mat-select-panel-md`, `mat-select-panel-lg`.

---

## Full Template Example

The snippet below shows all three sizes together with every major component type:

```html
<!-- ── Small ───────────────────────────── -->
<section class="mat-size-sm">
  <h3>Compact (sm)</h3>

  <mat-form-field appearance="outline">
    <mat-label>Employee No</mat-label>
    <input matInput formControlName="employeeNo">
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Department</mat-label>
    <mat-select panelClass="mat-select-panel-sm" formControlName="department">
      <mat-option value="it">IT</mat-option>
      <mat-option value="hr">HR</mat-option>
    </mat-select>
  </mat-form-field>

  <mat-checkbox formControlName="isActive">Active</mat-checkbox>
  <mat-radio-button value="full">Full-time</mat-radio-button>

  <button mat-flat-button>Save</button>
  <button mat-stroked-button>Cancel</button>
  <button mat-icon-button aria-label="Delete"><mat-icon>delete</mat-icon></button>
</section>

<!-- ── Default ─────────────────────────── -->
<section class="mat-size-md">
  <h3>Default (md)</h3>

  <mat-form-field appearance="outline">
    <mat-label>First Name</mat-label>
    <input matInput formControlName="firstName">
  </mat-form-field>

  <mat-form-field appearance="fill">
    <mat-label>Notes</mat-label>
    <textarea matInput rows="3" formControlName="notes"></textarea>
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Position</mat-label>
    <mat-select panelClass="mat-select-panel-md" formControlName="position">
      <mat-option value="dev">Developer</mat-option>
    </mat-select>
  </mat-form-field>

  <button mat-raised-button color="primary">Submit</button>
</section>

<!-- ── Large ────────────────────────────── -->
<section class="mat-size-lg">
  <h3>Comfortable (lg)</h3>

  <mat-form-field appearance="outline">
    <mat-label>Basic Salary</mat-label>
    <span matTextPrefix>$&nbsp;</span>
    <input matInput type="number" formControlName="basicSalary">
  </mat-form-field>

  <mat-form-field appearance="fill">
    <mat-label>Contract Type</mat-label>
    <mat-select panelClass="mat-select-panel-lg" formControlName="contract">
      <mat-option value="permanent">Permanent</mat-option>
      <mat-option value="contract">Contract</mat-option>
    </mat-select>
  </mat-form-field>

  <mat-checkbox formControlName="sendWelcome">Send welcome email</mat-checkbox>

  <button mat-flat-button color="primary">
    <mat-icon>save</mat-icon> Save Employee
  </button>
</section>
```

---

## Customising the Tokens

Override `$mat-sizes` before the `@use` import to adjust any value without editing the source file:

```scss
// In styles.scss — must appear BEFORE the @use
$mat-sizes: (
  sm: (font-size: 11px, button-height: 24px, /* … */),
  md: (font-size: 14px, button-height: 36px, /* … */),
  lg: (font-size: 17px, button-height: 44px, /* … */),
);

@use 'src/styles/material-sizing' with ($mat-sizes: $mat-sizes);
```

> All token keys must be present in every size map. See the `$mat-sizes` map in `material-sizing.scss` for the full list.

---

## How It Works

Angular Material v21 exposes its internal layout as CSS custom properties (`--mdc-*`, `--mat-*`). Because CSS custom properties cascade like any other inherited property, setting them on a parent element affects all Material components inside it — no `::ng-deep` required.

```
<div class="mat-size-sm">           ← sets --mdc-filled-button-container-height: 28px
  <mat-form-field>                  ← reads --mat-form-field-container-height: 40px
  <button mat-flat-button>          ← reads --mdc-filled-button-container-height: 28px
```

The select panel is the only exception: it renders in the CDK overlay outside the DOM tree, so it must be sized separately via `panelClass`.

---

## Files

| File | Purpose |
|---|---|
| `src/styles/material-sizing.scss` | Token maps, `mat-size()` mixin, utility classes, panel overrides |
| `src/styles.scss` | Imports `material-sizing` globally via `@use` |

No component stylesheets, theme files, or `angular.json` entries were modified.
