import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection, onSnapshot, doc, addDoc, updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export type Group = 'little-kids' | 'big-kids';

export interface InventoryEntry {
  id: string;
  group: Group;
  type: string;
  icon: string;
  notes: string;
  lastUpdated: string;
}

export const ITEM_TYPES: { type: string; icon: string }[] = [
  { type: 'Snacks',             icon: '🍪' },
  { type: 'Cups',               icon: '🥤' },
  { type: 'Construction Paper', icon: '📄' },
  { type: 'Craft Supplies',     icon: '🎨' },
  { type: 'Coloring Utensils',  icon: '✏️' },
  { type: 'Hand Sanitizer',     icon: '🧴' },
  { type: 'Disposable Gloves',  icon: '🧤' },
  { type: 'Name Tags',          icon: '🏷️' },
  { type: 'Tissues',            icon: '🤧' },
  { type: 'Clorox Wipes',       icon: '🧽' },
  { type: 'First Aid Kit',      icon: '🩹' },
  { type: 'Cold Packs',         icon: '🧊' },
  { type: 'Storybook Bible',    icon: '📖' },
  { type: 'Books',              icon: '📚' },
  { type: 'Baby Wipes',         icon: '🤱' },
  { type: 'Paper Towels',       icon: '🧻' },
  { type: 'Other',              icon: '📦' },
];

function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function entryDocId(group: Group, type: string): string {
  return `${group}__${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private _entries = signal<InventoryEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.subscribe();
    }
  }

  private subscribe() {
    onSnapshot(collection(db, 'inventory'), async snapshot => {
      const existingIds = new Set(snapshot.docs.map(d => d.id));
      const batch = writeBatch(db);
      let needsBatch = false;

      for (const group of ['little-kids', 'big-kids'] as Group[]) {
        for (const item of ITEM_TYPES) {
          const id = entryDocId(group, item.type);
          if (!existingIds.has(id)) {
            batch.set(doc(db, 'inventory', id), {
              group,
              type: item.type,
              icon: item.icon,
              notes: '',
              lastUpdated: localDateString(),
            });
            needsBatch = true;
          }
        }
      }

      if (needsBatch) {
        await batch.commit();
        return;
      }

      const entries: InventoryEntry[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          group: data['group'],
          type: data['type'],
          icon: data['icon'],
          notes: data['notes'] ?? '',
          lastUpdated: data['lastUpdated'] ?? localDateString(),
        };
      });

      this.zone.run(() => this._entries.set(entries));
    });
  }

  async updateNotes(entryId: string, notes: string): Promise<void> {
    await updateDoc(doc(db, 'inventory', entryId), {
      notes,
      lastUpdated: localDateString(),
    });
  }

  async addItem(group: Group, type: string, icon: string): Promise<void> {
    await addDoc(collection(db, 'inventory'), {
      group,
      type,
      icon,
      notes: '',
      lastUpdated: localDateString(),
    });
  }
}
