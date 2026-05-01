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
        <button class="btn-add-item" (click)="toggleAddForm()">
          {{ showAddForm() ? 'Cancel' : '+ Add Item' }}
        </button>
      </div>

      @if (showAddForm()) {
        <div class="add-form">
          <div class="add-form-fields">
            <div class="add-field">
              <label>Icon</label>
              <input type="text" [(ngModel)]="newIcon" placeholder="Paste emoji e.g. 🎯" maxlength="2" class="icon-input" />
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
            <button class="btn-save-add" (click)="submitNewItem()">Add to {{ activeGroup() === 'little-kids' ? 'Little Kids' : 'Big Kids' }}</button>
          </div>
        </div>
      }

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
                <label class="notes-label">Notes</label>
                <textarea
                  class="notes-textarea"
                  [(ngModel)]="editNotes"
                  name="notes-{{ entry.type }}"
                  placeholder="e.g. Running low, need 2 boxes..."
                  rows="3"
                ></textarea>
                <div class="edit-actions">
                  <button class="btn-cancel" (click)="cancelEdit()">Cancel</button>
                  <button class="btn-save" (click)="saveEdit(entry.type)">Save</button>
                </div>
              </div>
            } @else {
              <div class="notes-display" [class.notes-empty]="!entry.notes">
                {{ entry.notes || 'No notes yet' }}
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

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
      height: fit-content;
      margin-bottom: 1.5rem;

      &:hover { background: #5568d3; }
    }

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

    .add-error {
      color: #dc2626;
      font-size: 0.82rem;
      margin: 0 0 0.75rem;
    }

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

    .notes-display {
      font-size: 0.82rem;
      color: #374151;
      line-height: 1.4;
      text-align: left;
      width: 100%;
      min-height: 3rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .notes-empty {
      color: #94a3b8;
      font-style: italic;
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

    .notes-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      text-align: left;
    }

    .notes-textarea {
      width: 100%;
      padding: 0.5rem 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.82rem;
      font-family: inherit;
      box-sizing: border-box;
      color: #1e293b;
      resize: vertical;

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
  readonly showAddForm = signal(false);
  readonly addError = signal('');
  editNotes = '';
  newName = '';
  newIcon = '';

  readonly visibleItems = computed(() =>
    this.svc.entries().filter(e => e.group === this.activeGroup())
  );

  setGroup(group: Group) {
    this.activeGroup.set(group);
    this.editingType.set(null);
  }

  startEdit(entry: InventoryEntry) {
    this.editNotes = entry.notes;
    this.editingType.set(entry.type);
  }

  async saveEdit(type: string) {
    const entry = this.visibleItems().find(e => e.type === type);
    if (!entry) return;
    await this.svc.updateNotes(entry.id, this.editNotes);
    this.editingType.set(null);
  }

  cancelEdit() {
    this.editingType.set(null);
  }

  toggleAddForm() {
    this.showAddForm.update(v => !v);
    this.newName = '';
    this.newIcon = '';
    this.addError.set('');
  }

  async submitNewItem() {
    if (!this.newName.trim()) {
      this.addError.set('Please enter an item name.');
      return;
    }
    if (!this.newIcon.trim()) {
      this.addError.set('Please enter an emoji icon.');
      return;
    }
    await this.svc.addItem(this.activeGroup(), this.newName.trim(), this.newIcon.trim());
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
