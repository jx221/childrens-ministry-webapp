import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export type Group = 'little-kids' | 'big-kids';

export interface InventoryEntry {
  id: string;
  group: Group;
  type: string;
  icon: string;
  quantity: number;
  hot: boolean;
  amazonUrl: string;
  order: number;
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

const DEFAULT_HOT = new Set(['Snacks', 'Cups', 'Name Tags', 'Hand Sanitizer', 'Tissues']);

function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    onSnapshot(collection(db, 'inventory'), snapshot => {
      const entries: InventoryEntry[] = snapshot.docs
        .filter(d => !d.id.startsWith('_'))
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            group: data['group'],
            type: data['type'],
            icon: data['icon'],
            quantity: data['quantity'] ?? 0,
            hot: data['hot'] !== undefined ? data['hot'] : DEFAULT_HOT.has(data['type']),
            amazonUrl: data['amazonUrl'] ?? '',
            order: data['order'] ?? 0,
            lastUpdated: data['lastUpdated'] ?? localDateString(),
          };
        });
      this.zone.run(() => this._entries.set(entries));
    }, error => {
      console.error('[InventoryService] Firestore error:', error.code, error.message);
    });
  }

  async updateQuantity(entryId: string, quantity: number): Promise<void> {
    await updateDoc(doc(db, 'inventory', entryId), { quantity, lastUpdated: localDateString() });
  }

  async setHot(entryId: string, hot: boolean): Promise<void> {
    await updateDoc(doc(db, 'inventory', entryId), { hot });
  }

  async setAmazonUrl(entryId: string, amazonUrl: string): Promise<void> {
    await updateDoc(doc(db, 'inventory', entryId), { amazonUrl });
  }

  async deleteItem(entryId: string): Promise<void> {
    await deleteDoc(doc(db, 'inventory', entryId));
  }

  async reorderSection(updates: { id: string; order: number; hot: boolean }[]): Promise<void> {
    const batch = writeBatch(db);
    for (const { id, order, hot } of updates) {
      batch.update(doc(db, 'inventory', id), { order, hot });
    }
    await batch.commit();
  }
}
