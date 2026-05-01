import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Incident {
  id: string;
  title: string;
  description: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  reportedBy: string;
}

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private _incidents = signal<Incident[]>([]);
  readonly incidents = this._incidents.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.subscribe();
    }
  }

  private subscribe() {
    const q = query(collection(db, 'incidents'), orderBy('date', 'desc'));
    onSnapshot(q, snapshot => {
      const incidents: Incident[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Incident, 'id'>),
      }));
      this.zone.run(() => this._incidents.set(incidents));
    });
  }

  async addIncident(data: Omit<Incident, 'id'>): Promise<void> {
    await addDoc(collection(db, 'incidents'), data);
  }

  async deleteIncident(id: string): Promise<void> {
    await deleteDoc(doc(db, 'incidents', id));
  }
}
