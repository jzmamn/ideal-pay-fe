import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-grid-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-wrap">
      @for (_ of rowArr(); track $index) {
        <div class="skeleton-row">
          <div class="skel skel-wide"></div>
          <div class="skel skel-mid"></div>
          <div class="skel skel-mid"></div>
          <div class="skel skel-narrow"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-wrap { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; }
    .skeleton-row  { display: flex; gap: 12px; align-items: center; }
    .skel {
      height: 20px; border-radius: 4px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .skel-wide   { flex: 2; }
    .skel-mid    { flex: 1; }
    .skel-narrow { width: 80px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `],
})
export class GridSkeletonComponent {
  readonly rows   = input<number>(10);
  readonly rowArr = computed(() => Array.from({ length: this.rows() }));
}
