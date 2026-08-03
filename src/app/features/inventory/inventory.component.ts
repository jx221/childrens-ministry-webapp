import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryEntry, Group, AMAZON_URLS } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Inventory</h1>
        <button class="btn-add-item" (click)="toggleAddForm()">
          {{ showAddForm() ? 'Cancel' : '+ Add Item' }}
        </button>
      </div>

      @if (showAddForm()) {
        <div class="add-form">
          <div class="add-form-fields">
            <div class="add-field">
              <label>Icon</label>
              <input type="text" [(ngModel)]="newIcon" placeholder="Paste emoji" maxlength="2" class="icon-input" />
            </div>
            <div class="add-field add-field-name">
              <label>Item Name</label>
              <input type="text" [(ngModel)]="newName" placeholder="e.g. Paper Towels" />
            </div>
          </div>
          @if (addError()) {
            <p class="add-error">{{ addError() }}</p>
          }
          <div class="add-form-actions">
            <button class="btn-cancel-add" (click)="toggleAddForm()">Cancel</button>
            <button class="btn-save-add" (click)="submitNewItem()">
              Add to {{ activeGroup() === 'little-kids' ? 'Little Kids' : 'Big Kids' }}
            </button>
          </div>
        </div>
      }

      <!-- SNACKS CART -->
      @if (cartItems().length > 0) {
        <div class="cart-section">
          <div class="cart-header">
            <span>🛒 Snacks Cart</span>
            <span class="cart-count">{{ cartItems().length }} item{{ cartItems().length !== 1 ? 's' : '' }} to order</span>
          </div>
          <div class="cart-list">
            @for (entry of cartItems(); track entry.id) {
              <div class="cart-row">
                <span class="cart-icon">{{ entry.icon }}</span>
                <span class="cart-name">{{ entry.type }}</span>
                <span class="cart-qty">Qty on hand: {{ entry.quantity }}</span>
                <div class="cart-actions">
                  <a [href]="amazonUrl(entry.type)" target="_blank" rel="noopener" class="btn-order">View on Amazon</a>
                  <button class="btn-ordered" (click)="svc.setInCart(entry.id, false)">Mark as Ordered</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="tabs">
        <button class="tab-btn" [class.active]="activeGroup() === 'little-kids'" (click)="setGroup('little-kids')">Little Kids</button>
        <button class="tab-btn" [class.active]="activeGroup() === 'big-kids'" (click)="setGroup('big-kids')">Big Kids</button>
      </div>

      <!-- HOT LIST -->
      <div class="section-label">
        <span>🔥 Hot List</span>
        <span class="section-hint">Drag items here or use the pin button</span>
      </div>
      <div
        class="grid drop-zone"
        [class.drop-active]="hotDropActive()"
        (dragover)="onSectionDragOver($event, 'hot')"
        (dragleave)="onDragLeave($event, 'hot')"
        (drop)="onSectionDrop($event, 'hot')"
      >
        @for (entry of hotItems(); track entry.id) {
          <div
            class="card"
            draggable="true"
            [class.dragging]="draggedId() === entry.id"
            [class.in-cart]="entry.inCart"
            [class.drag-over]="dragOverId() === entry.id"
            (dragstart)="onDragStart(entry)"
            (dragend)="onDragEnd()"
            (dragover)="onCardDragOver($event, entry)"
            (dragleave)="dragOverId.set(null)"
            (drop)="onCardDrop($event, entry)"
          >
            <div class="card-top-row">
              <button class="btn-pin pinned" (click)="svc.setHot(entry.id, false)" title="Remove from hot list">📌</button>
              @if (amazonUrl(entry.type)) {
                <button
                  class="btn-add-to-cart"
                  [class.in-cart]="entry.inCart"
                  (click)="svc.setInCart(entry.id, !entry.inCart)"
                  [title]="entry.inCart ? 'Remove from order list' : 'Add to order list'"
                >🛒</button>
              }
            </div>
            <div class="card-icon">{{ entry.icon }}</div>
            <div class="card-name">{{ entry.type }}</div>
            <div class="counter">
              <button class="counter-btn" (click)="decrement(entry)" [disabled]="entry.quantity <= 0">−</button>
              <span class="counter-value" [class.zero]="entry.quantity === 0">{{ entry.quantity }}</span>
              <button class="counter-btn" (click)="increment(entry)">+</button>
            </div>
            <button class="btn-reset-item" (click)="resetItem(entry)" [disabled]="entry.quantity === 0">Reset</button>
            <div class="updated">Updated {{ formatDate(entry.lastUpdated) }}</div>
            <button class="btn-delete-item" (click)="deleteItem(entry.id)" title="Delete item">✕</button>
          </div>
        }
        @if (hotItems().length === 0) {
          <div class="drop-hint">Drop items here to add to hot list</div>
        }
      </div>

      <!-- MORE ITEMS -->
      <button class="more-header" (click)="moreExpanded.update(v => !v)">
        <span>More Items ({{ moreItems().length }})</span>
        <span class="chevron" [class.open]="moreExpanded()">▼</span>
      </button>

      @if (moreExpanded()) {
        <div
          class="grid drop-zone more-zone"
          [class.drop-active]="moreDropActive()"
          (dragover)="onSectionDragOver($event, 'more')"
          (dragleave)="onDragLeave($event, 'more')"
          (drop)="onSectionDrop($event, 'more')"
        >
          @for (entry of moreItems(); track entry.id) {
            <div
              class="card"
              draggable="true"
              [class.dragging]="draggedId() === entry.id"
              [class.in-cart]="entry.inCart"
              [class.drag-over]="dragOverId() === entry.id"
              (dragstart)="onDragStart(entry)"
              (dragend)="onDragEnd()"
              (dragover)="onCardDragOver($event, entry)"
              (dragleave)="dragOverId.set(null)"
              (drop)="onCardDrop($event, entry)"
            >
              <div class="card-top-row">
                <button class="btn-pin" (click)="svc.setHot(entry.id, true)" title="Add to hot list">📌</button>
                @if (amazonUrl(entry.type)) {
                  <button
                    class="btn-add-to-cart"
                    [class.in-cart]="entry.inCart"
                    (click)="svc.setInCart(entry.id, !entry.inCart)"
                    [title]="entry.inCart ? 'Remove from order list' : 'Add to order list'"
                  >🛒</button>
                }
              </div>
              <div class="card-icon">{{ entry.icon }}</div>
              <div class="card-name">{{ entry.type }}</div>
              <div class="counter">
                <button class="counter-btn" (click)="decrement(entry)" [disabled]="entry.quantity <= 0">−</button>
                <span class="counter-value" [class.zero]="entry.quantity === 0">{{ entry.quantity }}</span>
                <button class="counter-btn" (click)="increment(entry)">+</button>
              </div>
              <button class="btn-reset-item" (click)="resetItem(entry)" [disabled]="entry.quantity === 0">Reset</button>
              <div class="updated">Updated {{ formatDate(entry.lastUpdated) }}</div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0;
    }

    .page-header h1 {
      margin: 0 0 1.5rem;
      color: #1e293b;
      font-size: 1.75rem;
    }

    .btn-add-item {
      padding: 0.6rem 1.25rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 1.5rem;

      &:hover { background: #5568d3; }
    }

    /* ── ADD FORM ── */
    .add-form {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .add-form-fields {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .add-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .add-field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .add-field input {
      padding: 0.6rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      color: #1e293b;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
      }
    }

    .add-field-name { flex: 1; }
    .icon-input { width: 80px; text-align: center; font-size: 1.25rem; }

    .add-error { color: #dc2626; font-size: 0.82rem; margin: 0 0 0.75rem; }

    .add-form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn-save-add {
      padding: 0.5rem 1.25rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #5568d3; }
    }

    .btn-cancel-add {
      padding: 0.5rem 1rem;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #f9fafb; }
    }

    /* ── TABS ── */
    .tabs {
      display: flex;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 2rem;
    }

    .tab-btn {
      padding: 0.75rem 2rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      font-size: 1rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;

      &:hover { color: #334155; }
      &.active { color: #667eea; border-bottom-color: #667eea; }
    }

    /* ── SNACKS CART ── */
    .cart-section {
      background: #fffbeb;
      border: 1.5px solid #fcd34d;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.875rem;
      font-weight: 700;
      font-size: 1rem;
      color: #92400e;
    }

    .cart-count {
      font-size: 0.82rem;
      font-weight: 500;
      color: #b45309;
    }

    .cart-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .cart-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: white;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      flex-wrap: wrap;
    }

    .cart-icon { font-size: 1.25rem; }

    .cart-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
      flex: 1;
    }

    .cart-qty {
      font-size: 0.82rem;
      color: #64748b;
    }

    .cart-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-order {
      padding: 0.4rem 0.875rem;
      background: #1a1a1a;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s;

      &:hover { background: #333; }
    }

    .btn-ordered {
      padding: 0.4rem 0.875rem;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: #bbf7d0; }
    }

    /* ── CART TOGGLE ON CARD ── */
    .btn-add-to-cart {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0;
      opacity: 0.25;
      transition: opacity 0.15s, transform 0.15s;
      line-height: 1;

      &:hover { opacity: 1; transform: scale(1.2); }
      &.in-cart { opacity: 1; }
    }

    .card.in-cart {
      border-color: #fcd34d;
      box-shadow: 0 0 0 2px #fef3c7;
    }

    /* ── SECTION LABELS ── */
    .section-label {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      font-weight: 700;
      font-size: 1rem;
      color: #1e293b;
    }

    .section-hint {
      font-size: 0.78rem;
      font-weight: 400;
      color: #94a3b8;
    }

    /* ── MORE HEADER ── */
    .more-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.875rem 1rem;
      margin: 1.5rem 0 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;

      &:hover { background: #f8fafc; }
    }

    .chevron {
      font-size: 0.75rem;
      color: #94a3b8;
      transition: transform 0.2s;
    }

    .chevron.open { transform: rotate(180deg); }

    /* ── GRID & DROP ZONES ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1.25rem;
    }

    .more-zone { margin-top: 1rem; }

    .drop-zone {
      min-height: 120px;
      border-radius: 12px;
      padding: 0.5rem;
      transition: background 0.15s, border-color 0.15s;
      border: 2px dashed transparent;
    }

    .drop-zone.drop-active {
      background: #eef2ff;
      border-color: #667eea;
    }

    .drop-hint {
      grid-column: 1 / -1;
      text-align: center;
      padding: 2.5rem;
      color: #cbd5e1;
      font-size: 0.9rem;
      font-style: italic;
    }

    /* ── CARD ── */
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1rem 0.875rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.4rem;
      cursor: grab;
      transition: box-shadow 0.2s, opacity 0.2s;

      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      &.dragging { opacity: 0.4; cursor: grabbing; }
      &.drag-over { border-top: 3px solid #667eea; transform: translateY(2px); }
    }

    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      min-height: 24px;
    }

    /* ── PIN BUTTON ── */
    .btn-pin {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0;
      opacity: 0.25;
      transition: opacity 0.15s, transform 0.15s;
      line-height: 1;

      &:hover { opacity: 1; transform: scale(1.2); }
      &.pinned { opacity: 1; }
    }

    /* ── AMAZON BUTTON ── */
    .btn-amazon {
      font-size: 1rem;
      text-decoration: none;
      opacity: 0.6;
      transition: opacity 0.15s, transform 0.15s;
      line-height: 1;

      &:hover { opacity: 1; transform: scale(1.2); }
    }

    .card-icon { font-size: 2rem; line-height: 1; }

    .card-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.88rem;
      line-height: 1.3;
    }

    /* ── COUNTER ── */
    .counter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.25rem 0;
    }

    .counter-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1.5px solid #d1d5db;
      background: #f8fafc;
      color: #334155;
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s;

      &:hover:not(:disabled) {
        background: #e0e7ff;
        border-color: #667eea;
        color: #667eea;
      }

      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }

    .counter-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      min-width: 2rem;
      text-align: center;

      &.zero { color: #cbd5e1; }
    }

    .btn-reset-item {
      padding: 0.25rem 0.75rem;
      background: none;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;

      &:hover:not(:disabled) { color: #dc2626; border-color: #fca5a5; }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }

    .updated { font-size: 0.72rem; color: #94a3b8; }

    .btn-delete-item {
      background: none;
      border: none;
      color: #cbd5e1;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      transition: color 0.15s;

      &:hover { color: #ef4444; }
    }
  `]
})
export class InventoryComponent {
  readonly svc = inject(InventoryService);

  readonly activeGroup = signal<Group>('little-kids');
  readonly showAddForm = signal(false);
  readonly addError = signal('');
  readonly moreExpanded = signal(false);
  readonly draggedId = signal<string | null>(null);
  readonly dragOverId = signal<string | null>(null);
  readonly hotDropActive = signal(false);
  readonly moreDropActive = signal(false);

  newName = '';
  newIcon = '';

  readonly visibleItems = computed(() =>
    this.svc.entries().filter(e => e.group === this.activeGroup())
  );

  readonly hotItems = computed(() =>
    this.visibleItems().filter(e => e.hot).slice().sort((a, b) => a.order - b.order)
  );
  readonly moreItems = computed(() =>
    this.visibleItems().filter(e => !e.hot).slice().sort((a, b) => a.order - b.order)
  );
  readonly cartItems = computed(() =>
    this.svc.entries().filter(e => e.inCart && !!AMAZON_URLS[e.type])
  );

  amazonUrl(type: string): string | undefined {
    return AMAZON_URLS[type];
  }

  setGroup(group: Group) {
    this.activeGroup.set(group);
    this.draggedId.set(null);
  }

  increment(entry: InventoryEntry) {
    this.svc.updateQuantity(entry.id, entry.quantity + 1);
  }

  decrement(entry: InventoryEntry) {
    if (entry.quantity <= 0) return;
    this.svc.updateQuantity(entry.id, entry.quantity - 1);
  }

  resetItem(entry: InventoryEntry) {
    this.svc.updateQuantity(entry.id, 0);
  }

  deleteItem(id: string) {
    if (confirm('Delete this item?')) {
      this.svc.deleteItem(id);
    }
  }

  // ── Drag and drop ──

  onDragStart(entry: InventoryEntry) {
    this.draggedId.set(entry.id);
  }

  onDragEnd() {
    this.draggedId.set(null);
    this.dragOverId.set(null);
    this.hotDropActive.set(false);
    this.moreDropActive.set(false);
  }

  onCardDragOver(event: DragEvent, entry: InventoryEntry) {
    event.preventDefault();
    event.stopPropagation();
    if (this.draggedId() !== entry.id) {
      this.dragOverId.set(entry.id);
      this.hotDropActive.set(false);
      this.moreDropActive.set(false);
    }
  }

  onCardDrop(event: DragEvent, targetEntry: InventoryEntry) {
    event.preventDefault();
    event.stopPropagation();
    const fromId = this.draggedId();
    if (!fromId || fromId === targetEntry.id) {
      this.onDragEnd();
      return;
    }
    const fromEntry = this.svc.entries().find(e => e.id === fromId);
    if (!fromEntry) { this.onDragEnd(); return; }

    const isHot = targetEntry.hot;
    const list = (isHot ? this.hotItems() : this.moreItems()).filter(e => e.id !== fromId);
    const insertIdx = list.findIndex(e => e.id === targetEntry.id);
    list.splice(insertIdx, 0, fromEntry);
    this.svc.reorderSection(list.map((e, i) => ({ id: e.id, order: i, hot: isHot })));
    this.onDragEnd();
  }

  onSectionDragOver(event: DragEvent, section: 'hot' | 'more') {
    event.preventDefault();
    this.dragOverId.set(null);
    if (section === 'hot') this.hotDropActive.set(true);
    else this.moreDropActive.set(true);
  }

  onDragLeave(event: DragEvent, section: 'hot' | 'more') {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const outside =
      event.clientX < rect.left || event.clientX >= rect.right ||
      event.clientY < rect.top  || event.clientY >= rect.bottom;
    if (outside) {
      if (section === 'hot') this.hotDropActive.set(false);
      else this.moreDropActive.set(false);
    }
  }

  onSectionDrop(event: DragEvent, section: 'hot' | 'more') {
    event.preventDefault();
    const fromId = this.draggedId();
    if (!fromId) { this.onDragEnd(); return; }
    const fromEntry = this.svc.entries().find(e => e.id === fromId);
    if (!fromEntry) { this.onDragEnd(); return; }

    const isHot = section === 'hot';
    const list = (isHot ? this.hotItems() : this.moreItems()).filter(e => e.id !== fromId);
    list.push(fromEntry);
    this.svc.reorderSection(list.map((e, i) => ({ id: e.id, order: i, hot: isHot })));
    if (isHot) this.moreExpanded.set(true);
    this.onDragEnd();
  }

  // ── Add form ──

  toggleAddForm() {
    this.showAddForm.update(v => !v);
    this.newName = '';
    this.newIcon = '';
    this.addError.set('');
  }

  async submitNewItem() {
    if (!this.newName.trim()) { this.addError.set('Please enter an item name.'); return; }
    if (!this.newIcon.trim()) { this.addError.set('Please enter an emoji icon.'); return; }
    const { addDoc, collection } = await import('firebase/firestore');
    const { db } = await import('../../firebase');
    await addDoc(collection(db, 'inventory'), {
      group: this.activeGroup(),
      type: this.newName.trim(),
      icon: this.newIcon.trim(),
      quantity: 0,
      hot: false,
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
    this.newName = '';
    this.newIcon = '';
    this.showAddForm.set(false);
    this.addError.set('');
  }

  formatDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
