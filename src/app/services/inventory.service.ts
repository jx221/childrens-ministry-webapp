import { Injectable, signal, computed, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection, onSnapshot, doc, setDoc, updateDoc,
  Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export type Group = 'little-kids' | 'big-kids';

export interface InventoryEntry {
  id: string;
  group: Group;
  type: string;
  icon: string;
  quantity: number;
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
  { type: 'Clorox Wipes',       icon: '🧹' },
];

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
      const today = new Date().toISOString().split('T')[0];
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
              quantity: 0,
              lastUpdated: today,
            });
            needsBatch = true;
          }
        }
      }

      if (needsBatch) {
        await batch.commit();
        return;
      }

      const entries: InventoryEntry[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<InventoryEntry, 'id'>),
      }));

      this.zone.run(() => this._entries.set(entries));
    });
  }

  async updateQuantity(entryId: string, quantity: number): Promise<void> {
    await updateDoc(doc(db, 'inventory', entryId), {
      quantity,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  }
}
