import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MenuPermission } from './menu-permission.model';
import { PermissionsService, PERM_USERS } from './permissions.service';
import { LookupComponent } from '../../../shared/components/lookup/lookup.component';
import { LookupConfig } from '../../../shared/components/lookup/lookup.config';

type PermKey = keyof Pick<MenuPermission, 'read' | 'create' | 'update' | 'visible'>;

@Component({
  selector: 'app-permissions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    LookupComponent,
  ],
  templateUrl: './permissions.html',
  styleUrl:    './permissions.scss',
})
export class Permissions {
  private readonly svc = inject(PermissionsService);

  readonly mode            = signal<'group' | 'user'>('group');
  readonly selectedGroupId = signal<number | null>(null);
  readonly selectedUserId  = signal<number | null>(null);
  readonly filterValue     = signal('');
  readonly expandedRowId   = signal<string | null>(null);
  readonly permissions     = signal<MenuPermission[]>([]);

  readonly userLookupConfig: LookupConfig<{ id: number; name: string }> = {
    title: 'Select User',
    displayedColumns: ['id', 'name'],
    columnLabels: { id: 'ID', name: 'Full Name' },
    data: PERM_USERS.map(u => ({ id: u.id, name: u.fullName })),
  };

  readonly displayedColumns = ['select', 'menuItem', 'expand'];

  readonly filteredPermissions = computed<MenuPermission[]>(() => {
    const filter = this.filterValue().toLowerCase().trim();
    const perms  = this.permissions();
    return filter ? perms.filter(p => p.menuItem.toLowerCase().includes(filter)) : perms;
  });

  setMode(mode: 'group' | 'user'): void {
    this.saveCurrent();
    this.mode.set(mode);
    this.selectedGroupId.set(null);
    this.selectedUserId.set(null);
    this.permissions.set([]);
    this.filterValue.set('');
    this.expandedRowId.set(null);
  }

  selectGroup(id: number): void {
    this.saveCurrent();
    this.selectedGroupId.set(id);
    this.permissions.set(this.svc.forGroup(id).map(p => ({ ...p })));
    this.expandedRowId.set(null);
  }

  selectUser(id: number): void {
    this.saveCurrent();
    this.selectedUserId.set(id);
    this.permissions.set(this.svc.forUser(id).map(p => ({ ...p })));
    this.expandedRowId.set(null);
  }

  toggleExpand(row: MenuPermission): void {
    this.expandedRowId.set(this.expandedRowId() === row.id ? null : row.id);
  }

  isAllChecked(row: MenuPermission): boolean {
    return row.read && row.create && row.update && row.visible;
  }

  isIndeterminate(row: MenuPermission): boolean {
    const n = +row.read + +row.create + +row.update + +row.visible;
    return n > 0 && n < 4;
  }

  toggleAll(row: MenuPermission, checked: boolean): void {
    this.permissions.update(perms =>
      perms.map(p => p.id === row.id
        ? { ...p, read: checked, create: checked, update: checked, visible: checked }
        : p)
    );
  }

  togglePerm(row: MenuPermission, perm: PermKey, value: boolean): void {
    this.permissions.update(perms =>
      perms.map(p => p.id === row.id ? { ...p, [perm]: value } : p)
    );
  }

  save(): void {
    this.saveCurrent();
  }

  private saveCurrent(): void {
    const perms = this.permissions();
    if (!perms.length) return;
    const gid = this.selectedGroupId();
    const uid = this.selectedUserId();
    if (this.mode() === 'group' && gid != null) this.svc.save('group', gid, [...perms]);
    else if (this.mode() === 'user'  && uid != null) this.svc.save('user',  uid, [...perms]);
  }
}
