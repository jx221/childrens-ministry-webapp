import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, writeBatch, setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export type ContactGroup = 'families' | 'visitors';

export interface Contact {
  id: string;
  parent: string;
  children: string;
  phone: string;
  group: ContactGroup;
  order: number;
}

const SEED_CONTACTS: Omit<Contact, 'id'>[] = [
  { parent: 'Rebecca Attia',        children: 'Grace & Nora',          phone: '978-518-0228',      group: 'families', order: 0  },
  { parent: 'Lauren Miller',        children: 'Phoebe & Evan',         phone: '978-473-0985',      group: 'families', order: 1  },
  { parent: 'Hanna Woo',           children: 'Ina',                   phone: '617-683-6684',      group: 'families', order: 2  },
  { parent: 'Justin Kunz',         children: 'Constance',             phone: '405-314-7266',      group: 'families', order: 3  },
  { parent: 'Janine Kunz',         children: 'Autumn',                phone: '413-454-4761',      group: 'families', order: 4  },
  { parent: 'Jun Kim',             children: 'Noel',                  phone: '617-470-9118',      group: 'families', order: 5  },
  { parent: 'Jungwon Bae',        children: 'Yulia Kim',              phone: '617-642-2786',      group: 'families', order: 6  },
  { parent: 'Brittany Born',       children: 'Zion & River',          phone: '301-385-2755',      group: 'families', order: 7  },
  { parent: 'Minna Buckley',       children: 'Benjamin',              phone: '978-502-3959',      group: 'families', order: 8  },
  { parent: 'John Buckley',        children: 'Benjamin',              phone: '978-457-3941',      group: 'families', order: 9  },
  { parent: 'Darby & Scott Bennett', children: 'Waverly & Carlisle',  phone: '+1 (936) 828-0472', group: 'families', order: 10 },
  { parent: 'Christine Kang',      children: 'Theo',                  phone: '(845) 337-1421',    group: 'families', order: 11 },
  { parent: 'Jordan Reed',         children: 'Eli (mom: Grace)',       phone: '734-874-1087',      group: 'families', order: 12 },
  { parent: 'Eric Tang & Rebecca', children: 'Priscilla',             phone: '919-475-8931',      group: 'families', order: 13 },
  { parent: 'Mengyi',              children: 'Yutong & Yihong Zhao',  phone: '617-806-6318',      group: 'families', order: 14 },
  { parent: 'Sandy Lee',           children: 'Aedyn',                 phone: '617-592-7567',      group: 'families', order: 15 },
  { parent: 'Jackie Corbaci',      children: 'Uzay',                  phone: '617-987-1390',      group: 'visitors', order: 0  },
  { parent: 'Esther',              children: 'Evan & Abby Lee',       phone: '574-360-4908',      group: 'visitors', order: 1  },
  { parent: 'Amalia',              children: 'Tatevik Yolyan',        phone: '(323) 420-9559',    group: 'visitors', order: 2  },
  { parent: 'Joyce Le',            children: 'Eliana',                phone: '858-774-4933',      group: 'visitors', order: 3  },
  { parent: 'Tania Wu',            children: 'Asher',                 phone: '617-233-9604',      group: 'visitors', order: 4  },
  { parent: 'Mika Meredith',       children: 'Gwynn',                 phone: '612-670-1308',      group: 'visitors', order: 5  },
];

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private _contacts = signal<Contact[]>([]);
  readonly contacts = this._contacts.asReadonly();

  private _pdfUrl = signal<string>('');
  readonly pdfUrl = this._pdfUrl.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.subscribe();
    }
  }

  private subscribe() {
    onSnapshot(collection(db, 'contacts'), async snapshot => {
      if (snapshot.empty) {
        await this.seed();
        return;
      }
      const contacts: Contact[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Contact, 'id'>),
      }));
      this.zone.run(() => this._contacts.set(contacts));
    });

    onSnapshot(doc(db, 'config', 'resources'), snapshot => {
      const data = snapshot.data();
      this.zone.run(() => this._pdfUrl.set(data?.['pdfUrl'] ?? ''));
    });
  }

  private async seed() {
    const batch = writeBatch(db);
    for (const c of SEED_CONTACTS) {
      batch.set(doc(collection(db, 'contacts')), c);
    }
    await batch.commit();
  }

  async addContact(contact: Omit<Contact, 'id'>): Promise<void> {
    await addDoc(collection(db, 'contacts'), contact);
  }

  async updateContact(id: string, changes: Partial<Omit<Contact, 'id'>>): Promise<void> {
    await updateDoc(doc(db, 'contacts', id), changes);
  }

  async deleteContact(id: string): Promise<void> {
    await deleteDoc(doc(db, 'contacts', id));
  }

  async setPdfUrl(url: string): Promise<void> {
    await setDoc(doc(db, 'config', 'resources'), { pdfUrl: url }, { merge: true });
  }
}
