import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);

  readonly user = signal<any | null | undefined>(undefined); // undefined = still loading
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = new Promise(resolve => {
      if (!isPlatformBrowser(this.platformId)) {
        this.user.set(null);
        resolve();
        return;
      }
      let resolved = false;
      import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
        import('../firebase').then(({ app }) => {
          const auth = getAuth(app);
          onAuthStateChanged(auth, user => {
            this.user.set(user);
            if (!resolved) { resolved = true; resolve(); }
          });
        });
      });
    });
  }

  waitForInit(): Promise<void> {
    return this.initPromise;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    const { app } = await import('../firebase');
    await signInWithEmailAndPassword(getAuth(app), email, password);
  }

  async signOut(): Promise<void> {
    const { getAuth, signOut } = await import('firebase/auth');
    const { app } = await import('../firebase');
    await signOut(getAuth(app));
  }
}
