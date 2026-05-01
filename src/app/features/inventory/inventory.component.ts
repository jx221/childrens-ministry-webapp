import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryEntry, Group } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Inventory</h1>
      </div>

      <div class="tabs">
        <button
          class="tab-btn"
          [class.active]="activeGroup() === 'little-kids'"
          (click)="setGroup('little-kids')"
        >
          Little Kids
        </button>
        <button
          class="tab-btn"
          [class.active]="activeGroup() === 'big-kids'"
          (click)="setGroup('big-kids')"
        >
          Big Kids
        </button>
      </div>

      <div class="grid">
        @for (entry of visibleItems(); track entry.type) {
          <div class="card" [class.card-editing]="editingType() === entry.type">
            <div class="card-icon">{{ entry.icon }}</div>
            <div class="card-name">{{ entry.type }}</div>

            @if (editingType() === entry.type) {
              <div class="edit-body">
                <label class="qty-label">Quantity</label>
                <input
                  class="qty-input"
                  type="number"
                  [(ngModel)]="editQty"
                  name="qty-{{ entry.type }}"
                  min="0"
                  autofocus
                />
                <div class="edit-actions">
                  <button class="btn-cancel" (click)="cancelEdit()">Cancel</button>
                  <button class="btn-save" (click)="saveEdit(entry.type)">Save</button>
                </div>
              </div>
            } @else {
              <div class="qty-display" [class.qty-zero]="entry.quantity === 0" [class.qty-low]="entry.quantity > 0 && entry.quantity <= 5">
                {{ entry.quantity }}
              </div>
              <div class="updated">Updated {{ formatDate(entry.lastUpdated) }}</div>
              <button class="btn-edit" (click)="startEdit(entry)">Edit</button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header h1 {
      margin: 0 0 1.5rem;
      color: #1e293b;
      font-size: 1.75rem;
    }

    /* ── TABS ── */
    .tabs {
      display: flex;
      gap: 0;
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

      &:hover {
        color: #334155;
      }

      &.active {
        color: #667eea;
        border-bottom-color: #667eea;
      }
    }

    /* ── GRID ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.25rem;
    }

    /* ── CARD ── */
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      &.card-editing {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
      }
    }

    .card-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .card-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
    }

    .qty-display {
      font-size: 2.25rem;
      font-weight: 700;
      color: #22c55e;
      line-height: 1;
      margin: 0.25rem 0;
    }

    .qty-zero {
      color: #94a3b8;
    }

    .qty-low {
      color: #f59e0b;
    }

    .updated {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .btn-edit {
      margin-top: 0.25rem;
      width: 100%;
      padding: 0.45rem;
      background: #f1f5f9;
      color: #374151;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: #e2e8f0;
      }
    }

    /* ── EDIT MODE ── */
    .edit-body {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .qty-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      text-align: left;
    }

    .qty-input {
      width: 100%;
      padding: 0.5rem 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1.1rem;
      font-weight: 700;
      text-align: center;
      box-sizing: border-box;
      color: #1e293b;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
      }
    }

    .edit-actions {
      display: flex;
      gap: 0.4rem;
    }

    .btn-save {
      flex: 1;
      padding: 0.45rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: #5568d3;
      }
    }

    .btn-cancel {
      flex: 1;
      padding: 0.45rem;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: #f9fafb;
      }
    }
  `]
})
export class InventoryComponent {
  private svc = inject(InventoryService);

  readonly activeGroup = signal<Group>('little-kids');
  readonly editingType = signal<string | null>(null);
  editQty = 0;

  readonly visibleItems = computed(() =>
    this.svc.entries().filter(e => e.group === this.activeGroup())
  );

  setGroup(group: Group) {
    this.activeGroup.set(group);
    this.editingType.set(null);
  }

  startEdit(entry: InventoryEntry) {
    this.editQty = entry.quantity;
    this.editingType.set(entry.type);
  }

  async saveEdit(type: string) {
    if (this.editQty < 0) return;
    const entry = this.visibleItems().find(e => e.type === type);
    if (!entry) return;
    await this.svc.updateQuantity(entry.id, this.editQty);
    this.editingType.set(null);
  }

  cancelEdit() {
    this.editingType.set(null);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
