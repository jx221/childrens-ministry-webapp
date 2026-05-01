import { Injectable, signal, computed, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  Timestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface CheckInRecord {
  id: string;
  childName: string;
  parentName: string;
  grade: string;
  pin: string;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'checked-in' | 'checked-out';
}

@Injectable({ providedIn: 'root' })
export class CheckInService {
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private _records = signal<CheckInRecord[]>([]);
  readonly records = this._records.asReadonly();
  readonly checkedInCount = computed(() =>
    this._records().filter(r => r.status === 'checked-in').length
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.subscribe();
    }
  }

  private subscribe() {
    const q = query(collection(db, 'checkins'), orderBy('checkInTime', 'desc'));
    onSnapshot(q, snapshot => {
      const records: CheckInRecord[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          childName: data['childName'],
          parentName: data['parentName'],
          grade: data['grade'],
          pin: data['pin'],
          checkInTime: (data['checkInTime'] as Timestamp).toDate(),
          checkOutTime: data['checkOutTime']
            ? (data['checkOutTime'] as Timestamp).toDate()
            : undefined,
          status: data['status'],
        };
      });
      this.zone.run(() => this._records.set(records));
    });
  }

  async checkIn(data: { childName: string; parentName: string; grade: string; pin: string }): Promise<void> {
    await addDoc(collection(db, 'checkins'), {
      ...data,
      checkInTime: Timestamp.now(),
      status: 'checked-in',
    });
  }

  validatePin(childId: string, pin: string): boolean {
    return this._records().find(r => r.id === childId)?.pin === pin;
  }

  async checkOut(childId: string): Promise<void> {
    await updateDoc(doc(db, 'checkins', childId), {
      status: 'checked-out',
      checkOutTime: Timestamp.now(),
    });
  }
}
