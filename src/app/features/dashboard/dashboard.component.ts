import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      <p>Welcome to the Children's Ministry App</p>
      
      <div class="widgets-grid">
        <div class="widget-card">
          <h2>📋 Inventory Management</h2>
          <p>Manage supplies and materials for your ministry.</p>
          <a routerLink="/inventory" class="widget-link">Go to Inventory</a>
        </div>

        <div class="widget-card">
          <h2>⚠️ Incident Reports</h2>
          <p>Document and track any incidents that occur during activities.</p>
          <a routerLink="/incident-report" class="widget-link">File a Report</a>
        </div>

        <div class="widget-card">
          <h2>✅ Check-In Sheet</h2>
          <p>Track children and families. Secure PIN-based pickup verification.</p>
          <a routerLink="/check-in-sheet" class="widget-link">Open Sheet</a>
        </div>
      </div>

      <div class="quick-links">
        <h3>Quick Actions</h3>
        <ul>
          <li><a routerLink="/inventory">View Supplies</a></li>
          <li><a routerLink="/incident-report">Recent Incidents</a></li>
          <li><a routerLink="/check-in-sheet">Check-In Sheet</a></li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    > p {
      color: #666;
      margin-bottom: 2rem;
    }

    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .widget-card {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .widget-card h2 {
      color: #333;
      margin: 0;
      font-size: 1.25rem;
    }

    .widget-card p {
      color: #666;
      margin: 0;
      flex: 1;
    }

    .widget-link {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: background 0.3s;

      &:hover {
        background: #5568d3;
      }
    }

    .quick-links {
      background: #f9f9f9;
      padding: 2rem;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .quick-links h3 {
      color: #333;
      margin-top: 0;
    }

    .quick-links ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-links a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
  `]
})
export class DashboardComponent {}
