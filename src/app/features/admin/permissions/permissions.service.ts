import { Injectable } from '@angular/core';
import { MenuPermission, MENU_ITEMS } from './menu-permission.model';

export const PERM_GROUPS: { id: number; name: string }[] = [
  { id: 1, name: 'Finance' },
  { id: 2, name: 'Human Resources' },
  { id: 3, name: 'Operations' },
  { id: 4, name: 'Administration' },
  { id: 5, name: 'Management' },
  { id: 6, name: 'IT' },
];

export const PERM_USERS: { id: number; fullName: string }[] = [
  { id: 1, fullName: 'Admin User' },
  { id: 2, fullName: 'John Smith' },
  { id: 3, fullName: 'Mary Jones' },
  { id: 4, fullName: 'Robert Wilson' },
  { id: 5, fullName: 'Lisa Brown' },
];

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly groupPerms = new Map<number, MenuPermission[]>();
  private readonly userPerms  = new Map<number, MenuPermission[]>();

  forGroup(id: number): MenuPermission[] {
    if (!this.groupPerms.has(id)) this.groupPerms.set(id, this.defaults());
    return this.groupPerms.get(id)!;
  }

  forUser(id: number): MenuPermission[] {
    if (!this.userPerms.has(id)) this.userPerms.set(id, this.defaults());
    return this.userPerms.get(id)!;
  }

  save(mode: 'group' | 'user', id: number, perms: MenuPermission[]): void {
    if (mode === 'group') this.groupPerms.set(id, perms);
    else                  this.userPerms.set(id, perms);
  }

  private defaults(): MenuPermission[] {
    return MENU_ITEMS.map(item => ({
      id:       item.toLowerCase().replace(/\s+/g, '_'),
      menuItem: item,
      read:    false,
      create:  false,
      update:  false,
      visible: false,
    }));
  }
}
