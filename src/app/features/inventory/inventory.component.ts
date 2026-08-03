import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryEntry, Group } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent {
  readonly svc = inject(InventoryService);
  private cdr = inject(ChangeDetectorRef);

  readonly activeGroup = signal<Group>('little-kids');
  readonly showAddForm = signal(false);
  readonly addError = signal('');
  readonly moreExpanded = signal(false);
  readonly draggedId = signal<string | null>(null);
  readonly dragOverId = signal<string | null>(null);
  readonly hotDropActive = signal(false);
  readonly moreDropActive = signal(false);
  readonly iconUploading = signal(false);

  newName = '';
  newIcon = '';
  newAmazonUrl = '';

  readonly visibleItems = computed(() =>
    this.svc.entries().filter(e => e.group === this.activeGroup())
  );

  readonly hotItems = computed(() =>
    this.visibleItems().filter(e => e.hot).slice().sort((a, b) => a.order - b.order)
  );
  readonly moreItems = computed(() =>
    this.visibleItems().filter(e => !e.hot).slice().sort((a, b) => a.order - b.order)
  );

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

  promptAmazonUrl(entry: InventoryEntry) {
    const current = entry.amazonUrl || '';
    const url = prompt('Enter Amazon product URL:', current);
    if (url === null) return;
    this.svc.setAmazonUrl(entry.id, url.trim());
  }

  isImage(icon: string): boolean {
    return icon.startsWith('data:image') || icon.startsWith('https://');
  }

  onIconPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        this.iconUploading.set(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const size = 128;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            const ratio = Math.min(size / img.width, size / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            const dataUrl = canvas.toDataURL('image/png', 0.8);
            this.newIcon = dataUrl;
            this.cdr.markForCheck();
            try {
              const url = await this.uploadIcon(dataUrl);
              this.newIcon = url;
            } catch (err) {
              console.error('Icon upload failed:', err);
            } finally {
              this.iconUploading.set(false);
              this.cdr.markForCheck();
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }

  private async uploadIcon(dataUrl: string): Promise<string> {
    const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../../firebase');
    const iconRef = ref(storage, `inventory-icons/${Date.now()}.png`);
    await uploadString(iconRef, dataUrl, 'data_url');
    return getDownloadURL(iconRef);
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
    if (!fromId || fromId === targetEntry.id) { this.onDragEnd(); return; }
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
    this.newAmazonUrl = '';
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
      amazonUrl: this.newAmazonUrl.trim(),
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
    this.newName = '';
    this.newIcon = '';
    this.newAmazonUrl = '';
    this.showAddForm.set(false);
    this.addError.set('');
  }

  formatDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
