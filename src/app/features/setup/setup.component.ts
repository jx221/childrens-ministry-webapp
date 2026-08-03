import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChecklistItem {
  id: string;
  label: string;
  sub?: string[];
}

interface Section {
  title: string;
  emoji: string;
  items: ChecklistItem[];
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
})
export class SetupComponent {
  readonly sections: Section[] = [
    {
      title: 'Sunday Set Up',
      emoji: '👋',
      items: [
        {
          id: 'su1',
          label: 'Move 1 rectangle table (from the front) to the hallway outside the gym and wipe down',
          sub: ['Set name tags up on this table; keep some blank ones out'],
        },
        {
          id: 'su2',
          label: 'Move 2 round tables to the back half of the gym (keep 1 up front)',
          sub: ["If there aren't enough tables, find the custodial staff to move them in"],
        },
        { id: 'su3', label: 'Wipe down each of the tables and seats with clorox wipes' },
        { id: 'su4', label: 'Set up play mats in the front of the gym' },
        { id: 'su5', label: 'Cursory check and wipedown of the play mats (check for food debris, dirt, etc.)' },
        { id: 'su6', label: 'Unload teaching materials from bins and set up ahead of time' },
        {
          id: 'su7',
          label: 'Move objects toward the gaps of the divider to divert littles from exploring',
          sub: [
            'Can use the benches, an AV cart, the round table',
            'Big Kids teachers — keep an eye out for littles wandering',
          ],
        },
        { id: 'su8', label: 'Wear name tags' },
      ],
    },
    {
      title: 'Tear Down',
      emoji: '📦',
      items: [
        { id: 'td1', label: 'Pack the bins neatly with lesson materials' },
        { id: 'td2', label: 'Disinfect noticeably dirty toys' },
        { id: 'td3', label: 'Pick up name tags — any unused ones go back in current week envelope' },
        { id: 'td4', label: 'Take inventory of supplies and update the inventory sheet' },
        {
          id: 'td5',
          label: 'Move bins and play mats to the front of the gym for setup team to grab',
          sub: ['Make sure bins are on the cart'],
        },
      ],
    },
    {
      title: 'Drop-Off Reminders',
      emoji: '',
      items: [
        { id: 'dr1', label: 'Get new parent contact info and update the Canvas on Slack (ask last names as well)' },
        { id: 'dr2', label: 'Connect to Public Wifi' },
        { id: 'dr3', label: 'Remind parents that during pick-up they will wait outside the door and their children will be brought out' },
      ],
    },
  ];

  get checklistSections() { return this.sections.slice(0, 2); }
  get reminders() { return this.sections[2]; }

  private readonly _checked = signal<Set<string>>(new Set());

  isChecked(id: string): boolean {
    return this._checked().has(id);
  }

  toggle(id: string) {
    this._checked.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  sectionProgress(section: Section): { done: number; total: number } {
    const total = section.items.length;
    const done = section.items.filter(i => this._checked().has(i.id)).length;
    return { done, total };
  }

  reset() {
    this._checked.set(new Set());
  }
}
