import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService } from '../../services/incident.service';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="incident-container">
      <div class="incident-header">
        <h1>Incident Reports</h1>
        <button class="btn-new" (click)="toggleReportForm()">
          {{ showReportForm() ? 'Cancel' : 'New Report' }}
        </button>
      </div>

      @if (showReportForm()) {
        <div class="report-form-card">
          <h2>Submit New Incident Report</h2>
          <form (ngSubmit)="submitReport()">
            <div class="form-group">
              <label for="title">Incident Title:</label>
              <input
                id="title"
                type="text"
                [(ngModel)]="newReport.title"
                name="title"
                placeholder="Brief title of the incident"
                required
              />
            </div>
            <div class="form-group">
              <label for="description">Description:</label>
              <textarea
                id="description"
                [(ngModel)]="newReport.description"
                name="description"
                placeholder="Detailed description of what happened"
                rows="5"
                required
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="severity">Severity:</label>
                <select [(ngModel)]="newReport.severity" name="severity">
                  <option value="">Select Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div class="form-group">
                <label for="reportedBy">Reported By:</label>
                <input
                  id="reportedBy"
                  type="text"
                  [(ngModel)]="newReport.reportedBy"
                  name="reportedBy"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>
            <button type="submit" class="btn-submit">Submit Report</button>
          </form>
        </div>
      }

      <div class="reports-section">
        <h2>Recent Reports</h2>
        @if (incidents().length === 0) {
          <p class="no-reports">No incident reports filed</p>
        } @else {
          <div class="reports-list">
            @for (incident of incidents(); track incident.id) {
              <div class="report-card" [class]="'severity-' + incident.severity">
                <div class="report-header">
                  <h3>{{ incident.title }}</h3>
                  <span class="severity-badge" [class]="'badge-' + incident.severity">
                    {{ incident.severity | uppercase }}
                  </span>
                </div>
                <p class="report-description">{{ incident.description }}</p>
                <div class="report-meta">
                  <p><strong>Date:</strong> {{ incident.date }}</p>
                  <p><strong>Reported By:</strong> {{ incident.reportedBy }}</p>
                </div>
                <button class="btn-delete" (click)="deleteIncident(incident.id)" title="Delete report">
                  Delete
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .incident-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .incident-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      color: #333;
      margin: 0;
    }

    .btn-new {
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;

      &:hover {
        background: #5568d3;
      }
    }

    .report-form-card {
      background: #f9f9f9;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      border: 1px solid #e0e0e0;
    }

    .report-form-card h2 {
      color: #333;
      margin-top: 0;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #555;
      font-weight: 500;
    }

    input, select, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    textarea {
      resize: vertical;
    }

    .btn-submit {
      padding: 0.75rem 2rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;

      &:hover {
        background: #5568d3;
      }
    }

    .reports-section h2 {
      color: #333;
      margin-top: 2rem;
    }

    .no-reports {
      color: #999;
      text-align: center;
      padding: 2rem;
    }

    .reports-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .report-card {
      background: white;
      border-left: 4px solid #ddd;
      border-radius: 4px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &.severity-low {
        border-left-color: #4caf50;
      }

      &.severity-medium {
        border-left-color: #ff9800;
      }

      &.severity-high {
        border-left-color: #f44336;
      }
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }

    .report-header h3 {
      color: #333;
      margin: 0;
      flex: 1;
    }

    .severity-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;

      &.badge-low {
        background: #e8f5e9;
        color: #2e7d32;
      }

      &.badge-medium {
        background: #fff3e0;
        color: #e65100;
      }

      &.badge-high {
        background: #ffebee;
        color: #c62828;
      }
    }

    .report-description {
      color: #666;
      margin: 1rem 0;
      line-height: 1.5;
    }

    .report-meta {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .report-meta p {
      margin: 0.25rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .btn-delete {
      padding: 0.5rem 1rem;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;

      &:hover {
        background: #cc0000;
      }
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .report-header {
        flex-direction: column;
        gap: 0.5rem;
      }

      .severity-badge {
        align-self: flex-start;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncidentReportComponent {
  private svc = inject(IncidentService);

  readonly incidents = this.svc.incidents;
  readonly showReportForm = signal(false);

  newReport = {
    title: '',
    description: '',
    severity: '' as 'low' | 'medium' | 'high',
    reportedBy: '',
  };

  toggleReportForm() {
    this.showReportForm.update(v => !v);
  }

  async submitReport() {
    if (!this.newReport.title || !this.newReport.description || !this.newReport.severity || !this.newReport.reportedBy) {
      alert('Please fill in all fields');
      return;
    }
    await this.svc.addIncident({
      title: this.newReport.title,
      description: this.newReport.description,
      severity: this.newReport.severity,
      reportedBy: this.newReport.reportedBy,
      date: new Date().toISOString().split('T')[0],
    });
    this.newReport = { title: '', description: '', severity: '' as 'low' | 'medium' | 'high', reportedBy: '' };
    this.showReportForm.set(false);
  }

  async deleteIncident(id: string) {
    await this.svc.deleteIncident(id);
  }
}
