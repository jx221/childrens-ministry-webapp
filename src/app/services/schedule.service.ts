import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { collection, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type ScheduleRole = 'helper' | 'lead-teacher';
export type ScheduleGroup = 'bigs' | 'littles';

export interface ScheduleEntry {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  role: ScheduleRole;
  group: ScheduleGroup;
}

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
          name: data['name'],
          date: data['date'],
          role: data['role'],
          group: data['group'],
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
