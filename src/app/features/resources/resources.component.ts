import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourcesService, Contact, ContactGroup } from '../../services/resources.service';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.css',
})
export class ResourcesComponent {
  readonly svc = inject(ResourcesService);

  readonly editMode = signal(false);
  readonly addingGroup = signal<ContactGroup | null>(null);

  newParent = '';
  newChildren = '';
  newPhone = '';

  readonly familyContacts = computed(() =>
    this.svc.contacts().filter(c => c.group === 'families').sort((a, b) => a.order - b.order)
  );

  readonly visitorContacts = computed(() =>
    this.svc.contacts().filter(c => c.group === 'visitors').sort((a, b) => a.order - b.order)
  );

  toggleEdit() {
    this.editMode.update(v => !v);
    this.addingGroup.set(null);
  }

  save(contact: Contact, field: 'parent' | 'children' | 'phone', value: string) {
    const trimmed = value.trim();
    if (trimmed === (contact[field] as string)) return;
    this.svc.updateContact(contact.id, { [field]: trimmed });
  }

  delete(id: string) {
    if (confirm('Remove this contact?')) this.svc.deleteContact(id);
  }

  openAdd(group: ContactGroup) {
    this.addingGroup.set(group);
    this.newParent = '';
    this.newChildren = '';
    this.newPhone = '';
  }

  async submitAdd() {
    const group = this.addingGroup();
    if (!group || !this.newParent.trim()) return;
    const list = group === 'families' ? this.familyContacts() : this.visitorContacts();
    await this.svc.addContact({
      parent: this.newParent.trim(),
      children: this.newChildren.trim(),
      phone: this.newPhone.trim(),
      group,
      order: list.length,
    });
    this.addingGroup.set(null);
  }

  cancelAdd() {
    this.addingGroup.set(null);
  }

  promptPdfUrl() {
    const url = prompt('Enter PDF URL (Google Drive share link, etc.):', this.svc.pdfUrl());
    if (url === null) return;
    this.svc.setPdfUrl(url.trim());
  }

  phoneHref(phone: string): string {
    return 'tel:' + phone.replace(/\D/g, '');
  }
}
