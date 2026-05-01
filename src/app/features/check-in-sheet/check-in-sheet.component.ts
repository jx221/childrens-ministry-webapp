import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckInService, CheckInRecord } from '../../services/check-in.service';

type View = 'sheet' | 'check-in' | 'checkout-pin' | 'success';

@Component({
  selector: 'app-check-in-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- SHEET VIEW -->
    @if (view() === 'sheet') {
      <div class="sheet-container">
        <div class="sheet-header">
          <div class="header-info">
            <h1>Check-In Sheet</h1>
            <span class="today">{{ today }}</span>
          </div>
          <div class="header-actions">
            <span class="stat-badge">{{ checkedInCount() }} checked in</span>
            <button class="btn-primary" (click)="goToCheckIn()">+ Check In Child</button>
          </div>
        </div>

        @if (records().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">👧👦</div>
            <p>No children have been checked in yet.</p>
            <button class="btn-primary" (click)="goToCheckIn()">Check In First Child</button>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="records-table">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Parent / Guardian</th>
                  <th>Group</th>
                  <th>Checked In</th>
                  <th>Checked Out</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (record of records(); track record.id) {
                  <tr [class.row-out]="record.status === 'checked-out'">
                    <td class="child-name">{{ record.childName }}</td>
                    <td>{{ record.parentName }}</td>
                    <td>{{ record.grade }}</td>
                    <td>{{ formatTime(record.checkInTime) }}</td>
                    <td>{{ record.checkOutTime ? formatTime(record.checkOutTime) : '—' }}</td>
                    <td>
                      <span
                        class="status-badge"
                        [class.status-in]="record.status === 'checked-in'"
                        [class.status-out]="record.status === 'checked-out'"
                      >
                        {{ record.status === 'checked-in' ? 'Here' : 'Picked Up' }}
                      </span>
                    </td>
                    <td>
                      @if (record.status === 'checked-in') {
                        <button class="btn-checkout" (click)="startCheckOut(record)">
                          Check Out
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- CHECK-IN FORM VIEW -->
    @if (view() === 'check-in') {
      <div class="form-page">
        <div class="form-card">
          <div class="form-header">
            <button class="btn-back" (click)="view.set('sheet')">← Back</button>
            <h2>Check In Child</h2>
          </div>

          <div class="form-group">
            <label>Child's Name <span class="req">*</span></label>
            <input type="text" [(ngModel)]="form.childName" placeholder="Full name" autocomplete="off" />
          </div>

          <div class="form-group">
            <label>Parent / Guardian Name <span class="req">*</span></label>
            <input type="text" [(ngModel)]="form.parentName" placeholder="Full name" autocomplete="off" />
          </div>

          <div class="form-group">
            <label>Group <span class="req">*</span></label>
            <select [(ngModel)]="form.grade">
              <option value="">Select group</option>
              <option>Little Kids</option>
              <option>Big Kids</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>4-Digit Pickup PIN <span class="req">*</span></label>
              <input
                type="password"
                [(ngModel)]="form.pin"
                placeholder="••••"
                maxlength="4"
                inputmode="numeric"
                autocomplete="new-password"
              />
            </div>
            <div class="form-group">
              <label>Confirm PIN <span class="req">*</span></label>
              <input
                type="password"
                [(ngModel)]="form.confirmPin"
                placeholder="••••"
                maxlength="4"
                inputmode="numeric"
                autocomplete="new-password"
              />
            </div>
          </div>

          <p class="pin-hint">The guardian will enter this PIN when picking up the child.</p>

          @if (formError()) {
            <div class="form-error">{{ formError() }}</div>
          }

          <div class="form-actions">
            <button class="btn-secondary" (click)="view.set('sheet')">Cancel</button>
            <button class="btn-primary" (click)="submitCheckIn()">Check In</button>
          </div>
        </div>
      </div>
    }

    <!-- CHECKOUT PIN VIEW -->
    @if (view() === 'checkout-pin') {
      <div class="pin-page">
        <div class="pin-card">
          <button class="btn-back" (click)="returnToSheet()">← Cancel</button>
          <h2>Pickup Verification</h2>
          <p class="child-label">Checking out: <strong>{{ selectedChild()?.childName }}</strong></p>

          <div class="pin-dots">
            @for (i of pinDots; track i) {
              <div class="pin-dot" [class.filled]="enteredPin().length > i"></div>
            }
          </div>

          @if (pinError()) {
            <div class="pin-error">{{ pinError() }}</div>
          }

          <div class="keypad">
            @for (key of keypadKeys; track key) {
              <button class="key-btn" (click)="pressKey(key)">{{ key }}</button>
            }
            <button class="key-btn key-clear" (click)="clearPin()">C</button>
            <button class="key-btn" (click)="pressKey('0')">0</button>
            <button class="key-btn key-back" (click)="backspace()">⌫</button>
          </div>
        </div>
      </div>
    }

    <!-- SUCCESS VIEW -->
    @if (view() === 'success') {
      <div class="success-screen">
        <div class="success-content">
          <div class="checkmark">✓</div>
          <h1>Approved!</h1>
          <p class="success-name">{{ selectedChild()?.childName }}</p>
          <p class="success-sub">has been checked out</p>
          <p class="success-timer">Returning to sheet in a moment...</p>
          <button class="btn-white" (click)="returnToSheet()">Return Now</button>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── SHARED ── */
    :host {
      display: block;
      min-height: 100vh;
      background: #f0f2f8;
      font-family: inherit;
    }

    /* ── SHEET ── */
    .sheet-container {
      padding: 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .header-info h1 {
      margin: 0 0 0.25rem;
      color: #1e293b;
      font-size: 1.75rem;
    }

    .today {
      color: #64748b;
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-badge {
      background: #e0e7ff;
      color: #4338ca;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .table-wrapper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .records-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .records-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .records-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    .records-table tr:last-child td {
      border-bottom: none;
    }

    .row-out td {
      color: #94a3b8;
    }

    .child-name {
      font-weight: 600;
      color: #1e293b;
    }

    .row-out .child-name {
      color: #94a3b8;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-in {
      background: #dcfce7;
      color: #15803d;
    }

    .status-out {
      background: #f1f5f9;
      color: #64748b;
    }

    .btn-checkout {
      padding: 0.4rem 0.875rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #5568d3;
      }
    }

    .empty-state {
      text-align: center;
      padding: 5rem 2rem;
      color: #64748b;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state p {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
    }

    /* ── FORM ── */
    .form-page {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 2rem;
    }

    .form-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      padding: 2rem;
      width: 100%;
      max-width: 520px;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .form-header h2 {
      margin: 0;
      color: #1e293b;
      font-size: 1.4rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
    }

    .req {
      color: #ef4444;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.7rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
      color: #1e293b;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .pin-hint {
      font-size: 0.82rem;
      color: #64748b;
      margin: -0.5rem 0 1.25rem;
    }

    .form-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }

    /* ── SHARED BUTTONS ── */
    .btn-primary {
      padding: 0.7rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #5568d3;
      }
    }

    .btn-secondary {
      padding: 0.7rem 1.5rem;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #f9fafb;
      }
    }

    .btn-back {
      background: none;
      border: none;
      color: #667eea;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;

      &:hover {
        text-decoration: underline;
      }
    }

    /* ── PIN / KEYPAD ── */
    .pin-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
    }

    .pin-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      padding: 2rem;
      width: 100%;
      max-width: 360px;
      text-align: center;
    }

    .pin-card .btn-back {
      display: block;
      text-align: left;
      margin-bottom: 1rem;
    }

    .pin-card h2 {
      margin: 0 0 0.25rem;
      color: #1e293b;
      font-size: 1.4rem;
    }

    .child-label {
      color: #64748b;
      font-size: 0.95rem;
      margin: 0 0 1.5rem;
    }

    .pin-dots {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .pin-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      background: transparent;
      transition: background 0.15s, border-color 0.15s;
    }

    .pin-dot.filled {
      background: #1e293b;
      border-color: #1e293b;
    }

    .pin-error {
      color: #dc2626;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      min-height: 1.2em;
    }

    .keypad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
      margin-top: 1.25rem;
    }

    .key-btn {
      height: 72px;
      font-size: 1.5rem;
      font-weight: 600;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      color: #1e293b;
      transition: background 0.15s, transform 0.1s;
      user-select: none;

      &:hover {
        background: #e0e7ff;
      }

      &:active {
        transform: scale(0.95);
        background: #c7d2fe;
      }
    }

    .key-clear {
      color: #64748b;
      font-size: 1rem;
    }

    .key-back {
      color: #64748b;
      font-size: 1.25rem;
    }

    /* ── SUCCESS ── */
    .success-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #16a34a;
    }

    .success-content {
      text-align: center;
      color: white;
      padding: 2rem;
    }

    .checkmark {
      font-size: 6rem;
      line-height: 1;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .success-content h1 {
      font-size: 3rem;
      margin: 0 0 0.5rem;
      font-weight: 700;
    }

    .success-name {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
    }

    .success-sub {
      font-size: 1.1rem;
      opacity: 0.85;
      margin: 0 0 2rem;
    }

    .success-timer {
      font-size: 0.9rem;
      opacity: 0.7;
      margin: 0 0 1.5rem;
    }

    .btn-white {
      padding: 0.75rem 2rem;
      background: white;
      color: #16a34a;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.9;
      }
    }
  `]
})
export class CheckInSheetComponent {
  private svc = inject(CheckInService);

  readonly view = signal<View>('sheet');
  readonly selectedChild = signal<CheckInRecord | null>(null);
  readonly enteredPin = signal('');
  readonly pinError = signal('');
  readonly formError = signal('');

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  readonly records = this.svc.records;
  readonly checkedInCount = this.svc.checkedInCount;

  readonly keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  readonly pinDots = [0, 1, 2, 3];

  form = { childName: '', parentName: '', grade: '', pin: '', confirmPin: '' };

  private successTimer: ReturnType<typeof setTimeout> | null = null;

  goToCheckIn() {
    this.form = { childName: '', parentName: '', grade: '', pin: '', confirmPin: '' };
    this.formError.set('');
    this.view.set('check-in');
  }

  async submitCheckIn() {
    const { childName, parentName, grade, pin, confirmPin } = this.form;
    if (!childName.trim() || !parentName.trim() || !grade) {
      this.formError.set('Please fill in all required fields.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      this.formError.set('PIN must be exactly 4 digits (numbers only).');
      return;
    }
    if (pin !== confirmPin) {
      this.formError.set('PINs do not match.');
      return;
    }
    await this.svc.checkIn({ childName: childName.trim(), parentName: parentName.trim(), grade, pin });
    this.view.set('sheet');
  }

  startCheckOut(child: CheckInRecord) {
    this.selectedChild.set(child);
    this.enteredPin.set('');
    this.pinError.set('');
    this.view.set('checkout-pin');
  }

  pressKey(key: string) {
    if (this.enteredPin().length >= 4) return;
    this.enteredPin.update(p => p + key);
    this.pinError.set('');
    if (this.enteredPin().length === 4) {
      this.validatePin();
    }
  }

  backspace() {
    this.enteredPin.update(p => p.slice(0, -1));
    this.pinError.set('');
  }

  clearPin() {
    this.enteredPin.set('');
    this.pinError.set('');
  }

  async validatePin() {
    const child = this.selectedChild();
    if (!child) return;
    if (this.svc.validatePin(child.id, this.enteredPin())) {
      await this.svc.checkOut(child.id);
      this.view.set('success');
      this.successTimer = setTimeout(() => this.returnToSheet(), 4000);
    } else {
      this.pinError.set('Incorrect PIN. Please try again.');
      this.enteredPin.set('');
    }
  }

  returnToSheet() {
    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
    this.view.set('sheet');
    this.selectedChild.set(null);
    this.enteredPin.set('');
    this.pinError.set('');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
