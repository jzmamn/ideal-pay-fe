import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { animate, group, query, style, transition, trigger } from '@angular/animations';

const ENTER_EASE = '400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const LEAVE_EASE = '350ms cubic-bezier(0.55, 0, 1, 0.45)';

const slideAnimation = trigger('slide', [
  transition(':increment', [
    query(':enter, :leave', style({ position: 'absolute', top: 0, left: 0, width: '100%' }), { optional: true }),
    query(':enter', style({ transform: 'translateX(40px)', opacity: 0 }), { optional: true }),
    group([
      query(':leave', animate(LEAVE_EASE, style({ transform: 'translateX(-40px)', opacity: 0 })), { optional: true }),
      query(':enter', animate(ENTER_EASE, style({ transform: 'translateX(0)', opacity: 1 })), { optional: true }),
    ]),
  ]),
  transition(':decrement', [
    query(':enter, :leave', style({ position: 'absolute', top: 0, left: 0, width: '100%' }), { optional: true }),
    query(':enter', style({ transform: 'translateX(-40px)', opacity: 0 }), { optional: true }),
    group([
      query(':leave', animate(LEAVE_EASE, style({ transform: 'translateX(40px)', opacity: 0 })), { optional: true }),
      query(':enter', animate(ENTER_EASE, style({ transform: 'translateX(0)', opacity: 1 })), { optional: true }),
    ]),
  ]),
]);

@Component({
  selector: 'app-employee',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  animations: [slideAnimation],
  template: `
    <div class="slide-host" [@slide]="getState(outlet)">
      <router-outlet #outlet="outlet" />
    </div>
  `,
  styles: [`
    .slide-host {
      position: relative;
      overflow: hidden;
    }
  `],
})
export class Employee {
  getState(outlet: RouterOutlet): number | undefined {
    return outlet.activatedRouteData['animation'];
  }
}
