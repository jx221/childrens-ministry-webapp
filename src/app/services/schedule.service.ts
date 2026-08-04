import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { collection, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type ScheduleRole = 'helper' | 'lead-teacher';
export type ScheduleGroup = 'bigs' | 'littles';
export type EntryType = 'serving' | 'event';

export interface ScheduleEntry {
  id: string;
  type: EntryType;
  name: string;
  date: string; // YYYY-MM-DD
  role?: ScheduleRole;
  group?: ScheduleGroup;
  color?: string;
}

export const EVENT_COLORS = [
  { label: 'Purple',  value: '#7c3aed' },
  { label: 'Blue',    value: '#2563eb' },
  { label: 'Teal',    value: '#0891b2' },
  { label: 'Green',   value: '#16a34a' },
  { label: 'Yellow',  value: '#ca8a04' },
  { label: 'Orange',  value: '#ea580c' },
  { label: 'Red',     value: '#dc2626' },
  { label: 'Pink',    value: '#db2777' },
];

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private _entries = signal<ScheduleEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.subscribe();
    }
  }

  private subscribe() {
    onSnapshot(collection(db, 'schedule'), snapshot => {
      const entries: ScheduleEntry[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          type: data['type'] ?? 'serving',
          name: data['name'],
          date: data['date'],
          role: data['role'],
          group: data['group'],
          color: data['color'],
        };
      });
      this.zone.run(() => this._entries.set(entries));
    }, error => {
      console.error('[ScheduleService] Firestore error:', error.code, error.message);
    });
  }

  async addEntry(entry: Omit<ScheduleEntry, 'id'>): Promise<void> {
    await addDoc(collection(db, 'schedule'), entry);
  }

  async deleteEntry(id: string): Promise<void> {
    await deleteDoc(doc(db, 'schedule', id));
  }
}
