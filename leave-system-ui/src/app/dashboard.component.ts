import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LeaveApiService } from './leave-api.service';
import { LeaveRequestResponseDto, LeaveBalanceDto } from './models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div *ngIf="toast.show"
      [style.background]="toast.type === 'success' ? '#16a34a' : '#dc2626'"
      style="position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:white;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.25);">
      {{ toast.message }}
    </div>

    <nav style="background:#111827;color:#fff;padding:16px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
      <strong style="margin-right:12px;font-size:16px;">Leave Management</strong>
      <a routerLink="/" style="color:white;text-decoration:none;font-weight:bold;">Dashboard</a>
      <a routerLink="/apply-leave" style="color:#d1d5db;text-decoration:none;">Apply Leave</a>
      <a routerLink="/approvals" style="color:#d1d5db;text-decoration:none;">Approvals</a>
      <a routerLink="/leave-types" style="color:#d1d5db;text-decoration:none;">Leave Types</a>
      <a routerLink="/settlements" style="color:#d1d5db;text-decoration:none;">Settlements</a>
    </nav>

    <div style="padding:24px;font-family:Arial,sans-serif;background:#f3f4f6;min-height:100vh;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <h1 style="margin:0;">Employee Dashboard</h1>
        <button (click)="exportCsv()" [disabled]="exporting"
          style="background:#0f766e;color:white;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:14px;opacity:1;"
          [style.opacity]="exporting ? '0.6' : '1'">
          {{ exporting ? 'Exporting...' : 'Export CSV' }}
        </button>
      </div>

      <!-- Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
        <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <p style="margin:0;font-size:13px;color:#6b7280;font-weight:600;">TOTAL BALANCE</p>
          <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#111827;">{{ totalBalance }}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Days remaining</p>
        </div>
        <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <p style="margin:0;font-size:13px;color:#6b7280;font-weight:600;">PENDING</p>
          <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#d97706;">{{ pendingCount }}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Requests</p>
        </div>
        <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <p style="margin:0;font-size:13px;color:#16a34a;font-weight:600;">APPROVED</p>
          <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#16a34a;">{{ approvedCount }}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Requests</p>
        </div>
      </div>

      <!-- Leave Balance Per Type -->
      <div *ngIf="balances.length > 0"
        style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:24px;">
        <h2 style="margin-top:0;">Leave Balance Summary</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">
          <div *ngFor="let b of balances"
            style="border:1px solid #e5e7eb;padding:16px;border-radius:10px;background:#fafafa;">
            <p style="margin:0;font-weight:700;font-size:15px;">{{ b.leaveTypeName }}</p>
            <p style="margin:10px 0 4px;font-size:28px;font-weight:700;color:#2563eb;">{{ b.remainingDays }}</p>
            <p style="margin:0;font-size:12px;color:#6b7280;">of {{ b.totalDays }} days total</p>
            <div style="background:#e5e7eb;border-radius:999px;height:6px;margin-top:10px;">
              <div [style.width]="balancePct(b) + '%'"
                style="background:#2563eb;height:6px;border-radius:999px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:24px;">
        <h2 style="margin-top:0;">Filters</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;">
          <div>
            <label style="font-size:13px;font-weight:600;">Status</label>
            <select [(ngModel)]="selectedStatus"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;">
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;">Leave Type</label>
            <select [(ngModel)]="selectedType"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;">
              <option value="">All</option>
              <option *ngFor="let name of leaveTypeNames" [value]="name">{{ name }}</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;">From Date</label>
            <input [(ngModel)]="fromDate" type="date"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;">To Date</label>
            <input [(ngModel)]="toDate" type="date"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
          </div>
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;">
          <button (click)="applyFilters()" [disabled]="loading"
            style="background:#2563eb;color:white;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:13px;">
            Apply Filters
          </button>
          <button (click)="clearFilters()" [disabled]="loading"
            style="background:#6b7280;color:white;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:13px;">
            Clear
          </button>
        </div>
      </div>

      <!-- Requests Table -->
      <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
          <h2 style="margin:0;">Leave Requests</h2>
          <span *ngIf="!loading"
            style="background:#eef2ff;color:#4338ca;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;">
            {{ filteredRequests.length }} records
          </span>
        </div>

        <div *ngIf="loading" style="text-align:center;padding:40px;color:#6b7280;">Loading requests...</div>
        <div *ngIf="error && !loading" style="background:#fee2e2;color:#991b1b;padding:14px 16px;border-radius:8px;margin-bottom:12px;">
          {{ error }} &nbsp;<button (click)="loadRequests()" style="background:none;border:none;color:#991b1b;cursor:pointer;text-decoration:underline;">Retry</button>
        </div>

        <div *ngIf="!loading" style="overflow:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Employee</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Leave Type</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Start Date</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">End Date</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Days</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Status</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filteredRequests" style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:12px;">{{ r.employeeName }}</td>
                <td style="padding:12px;">{{ r.leaveTypeName }}</td>
                <td style="padding:12px;white-space:nowrap;">{{ r.startDate | date:'mediumDate' }}</td>
                <td style="padding:12px;white-space:nowrap;">{{ r.endDate | date:'mediumDate' }}</td>
                <td style="padding:12px;">{{ r.daysRequested }}</td>
                <td style="padding:12px;">
                  <span [style.background]="statusBg(r.status)" [style.color]="statusColor(r.status)"
                    style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;">
                    {{ r.status }}
                  </span>
                </td>
                <td style="padding:12px;color:#6b7280;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                  [title]="r.reason">{{ r.reason }}</td>
              </tr>
              <tr *ngIf="filteredRequests.length === 0">
                <td colspan="7" style="padding:32px;text-align:center;color:#6b7280;">No leave requests found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(LeaveApiService);

  requests: LeaveRequestResponseDto[] = [];
  balances: LeaveBalanceDto[] = [];
  loading = false;
  exporting = false;
  error = '';
  selectedStatus = '';
  selectedType = '';
  fromDate = '';
  toDate = '';
  toast = { show: false, message: '', type: 'success' };

  get pendingCount() { return this.requests.filter(r => r.status === 'Pending').length; }
  get approvedCount() { return this.requests.filter(r => r.status === 'Approved').length; }
  get totalBalance() { return this.balances.reduce((s, b) => s + (b.remainingDays ?? 0), 0); }
  get leaveTypeNames() { return [...new Set(this.requests.map(r => r.leaveTypeName))]; }

  get filteredRequests() {
    return this.requests.filter(r => {
      const statusOk = !this.selectedStatus || r.status === this.selectedStatus;
      const typeOk = !this.selectedType || r.leaveTypeName === this.selectedType;
      const fromOk = !this.fromDate || r.startDate >= this.fromDate;
      const toOk = !this.toDate || r.endDate <= this.toDate;
      return statusOk && typeOk && fromOk && toOk;
    });
  }

  ngOnInit() {
    this.loadRequests();
    this.api.getLeaveBalances(1).subscribe({
      next: d => this.balances = d.balances,
      error: () => {}
    });
  }

  loadRequests(filters?: { status?: string; fromDate?: string; toDate?: string }) {
    this.loading = true;
    this.error = '';
    this.api.getLeaveRequests(filters).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: data => this.requests = data,
      error: (err) => this.error = err?.error?.message || 'Could not load requests. Check your connection.'
    });
  }

  applyFilters() {
    this.loadRequests({
      status: this.selectedStatus || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
    });
  }

  clearFilters() {
    this.selectedStatus = '';
    this.selectedType = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadRequests();
  }

  exportCsv() {
    this.exporting = true;
    this.api.exportCsv().pipe(
      finalize(() => this.exporting = false)
    ).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'leave-requests.csv'; a.click();
        URL.revokeObjectURL(url);
        this.showToast('CSV exported successfully.');
      },
      error: () => this.showToast('Export failed.', 'error')
    });
  }

  balancePct(b: LeaveBalanceDto) {
    return b.totalDays > 0 ? Math.min(100, Math.round((b.remainingDays / b.totalDays) * 100)) : 0;
  }

  statusBg(s: string) {
    return s === 'Approved' ? '#dcfce7' : s === 'Pending' ? '#fef3c7' : s === 'Rejected' ? '#fee2e2' : '#e5e7eb';
  }
  statusColor(s: string) {
    return s === 'Approved' ? '#166534' : s === 'Pending' ? '#92400e' : s === 'Rejected' ? '#991b1b' : '#374151';
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { show: true, message, type };
    setTimeout(() => this.toast.show = false, 3000);
  }
}
