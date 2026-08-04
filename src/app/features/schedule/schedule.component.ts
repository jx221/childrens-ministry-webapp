import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService, ScheduleEntry, ScheduleRole, ScheduleGroup, EntryType, EVENT_COLORS } from '../../services/schedule.service';

interface CalendarDay {
  date: number | null;
  dateStr: string | null;
  isToday: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css',
})
export class ScheduleComponent {
  readonly svc = inject(ScheduleService);
  readonly eventColors = EVENT_COLORS;

  readonly currentDate = signal(new Date());
  readonly showAddForm = signal(false);
  readonly searchQuery = signal('');

  newType: EntryType = 'serving';
  newName = '';
  newDate = '';
  newRole: ScheduleRole = 'helper';
  newGroup: ScheduleGroup = 'littles';
  newColor = EVENT_COLORS[0].value;
  addError = '';

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly monthLabel = computed(() =>
    this.currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  readonly calendarDays = computed((): CalendarDay[] => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, dateStr: null, isToday: false, isPast: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      days.push({
        date: d,
        dateStr,
        isToday: dayDate.getTime() === today.getTime(),
        isPast: dayDate < today,
      });
    }

    return days;
  });

  readonly searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.svc.entries()
      .filter(e => e.type === 'serving' && e.name.toLowerCase().includes(q))
      .sort((a, b) => a.date.localeCompare(b.date));
  });

  readonly isSearching = computed(() => this.searchQuery().trim().length > 0);

  entriesForDate(dateStr: string): ScheduleEntry[] {
    const all = this.svc.entries().filter(e => e.date === dateStr);
    const events = all.filter(e => e.type === 'event');
    const serving = all.filter(e => e.type !== 'event').sort((a, b) => a.name.localeCompare(b.name));
    return [...events, ...serving];
  }

  prevMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  openAddForm(dateStr?: string) {
    this.newDate = dateStr ?? '';
    this.newType = 'serving';
    this.newName = '';
    this.newRole = 'helper';
    this.newGroup = 'littles';
    this.newColor = EVENT_COLORS[0].value;
    this.addError = '';
    this.showAddForm.set(true);
  }

  async submitEntry() {
    if (!this.newName.trim()) { this.addError = 'Please enter a name.'; return; }
    if (!this.newDate) { this.addError = 'Please select a date.'; return; }

    if (this.newType === 'event') {
      await this.svc.addEntry({
        type: 'event',
        name: this.newName.trim(),
        date: this.newDate,
        color: this.newColor,
      });
    } else {
      await this.svc.addEntry({
        type: 'serving',
        name: this.newName.trim(),
        date: this.newDate,
        role: this.newRole,
        group: this.newGroup,
        ...(this.newColor ? { color: this.newColor } : {}),
      });
    }
    this.showAddForm.set(false);
  }

  deleteEntry(id: string) {
    this.svc.deleteEntry(id);
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  roleLabel(role: ScheduleRole): string {
    return role === 'lead-teacher' ? 'Lead' : 'Helper';
  }

  groupLabel(group: ScheduleGroup): string {
    return group === 'bigs' ? 'Bigs' : 'Littles';
  }

  eventBg(color: string): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.15)`;
  }
}
