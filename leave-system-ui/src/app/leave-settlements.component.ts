import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeaveApiService } from './leave-api.service';
import { LeaveSettlementResponseDto, LeaveTypeResponseDto } from './models';

@Component({
  selector: 'app-leave-settlements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <nav style="background:#111827;color:#fff;padding:16px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
      <strong style="margin-right:12px;font-size:16px;">Leave Management</strong>
      <a routerLink="/" style="color:#d1d5db;text-decoration:none;">Dashboard</a>
      <a routerLink="/apply-leave" style="color:#d1d5db;text-decoration:none;">Apply Leave</a>
      <a routerLink="/approvals" style="color:#d1d5db;text-decoration:none;">Approvals</a>
      <a routerLink="/leave-types" style="color:#d1d5db;text-decoration:none;">Leave Types</a>
      <a routerLink="/settlements" style="color:white;text-decoration:none;font-weight:bold;">Settlements</a>
    </nav>

    <div *ngIf="toast.show"
      [style.background]="toast.type === 'success' ? '#16a34a' : '#dc2626'"
      style="position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:white;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.25);">
      {{ toast.message }}
    </div>

    <div style="padding:24px;font-family:Arial,sans-serif;background:#f3f4f6;min-height:100vh;">
      <h1 style="margin-top:0;">Leave Settlements</h1>

      <!-- Create Settlement Form -->
      <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:24px;max-width:700px;">
        <h2 style="margin-top:0;">Manual Balance Adjustment</h2>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div>
            <label style="font-weight:600;font-size:13px;">Leave Type *</label>
            <select [(ngModel)]="form.leaveTypeId"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;">
              <option [ngValue]="0" disabled>Select leave type</option>
              <option *ngFor="let t of leaveTypes" [ngValue]="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label style="font-weight:600;font-size:13px;">Adjustment Type *</label>
            <select [(ngModel)]="form.adjustmentType"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;">
              <option value="ManualCredit">Manual Credit</option>
              <option value="ManualDebit">Manual Debit</option>
              <option value="AnnualReset">Annual Reset</option>
            </select>
          </div>
          <div>
            <label style="font-weight:600;font-size:13px;">Adjustment Days *</label>
            <input [(ngModel)]="form.adjustmentDays" type="number" min="0" step="0.5"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-weight:600;font-size:13px;">Notes</label>
            <input [(ngModel)]="form.notes" placeholder="Optional notes"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
          </div>
        </div>

        <div *ngIf="formError" style="margin-top:12px;color:#dc2626;font-size:13px;">{{ formError }}</div>

        <button (click)="submitSettlement()" [disabled]="saving"
          style="margin-top:16px;background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">
          {{ saving ? 'Submitting...' : 'Submit Adjustment' }}
        </button>
      </div>

      <!-- Settlement History -->
      <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="margin-top:0;">Settlement History</h2>

        <div *ngIf="loading" style="text-align:center;padding:40px;color:#6b7280;">Loading...</div>
        <div *ngIf="error" style="color:#dc2626;padding:16px;">{{ error }}</div>

        <div *ngIf="!loading" style="overflow:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Leave Type</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Adjustment Type</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Days</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Notes</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of settlements" style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:12px;font-weight:500;">{{ s.leaveType?.name }}</td>
                <td style="padding:12px;">
                  <span [style.background]="adjBg(s.adjustmentType)"
                    [style.color]="adjColor(s.adjustmentType)"
                    style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;">
                    {{ s.adjustmentType }}
                  </span>
                </td>
                <td style="padding:12px;">{{ s.adjustmentDays }}</td>
                <td style="padding:12px;color:#6b7280;">{{ s.notes || '—' }}</td>
                <td style="padding:12px;color:#6b7280;">{{ s.createdAt | date:'mediumDate' }}</td>
              </tr>
              <tr *ngIf="settlements.length === 0">
                <td colspan="5" style="padding:24px;text-align:center;color:#6b7280;">No settlement history found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class LeaveSettlementsComponent implements OnInit {
  private api = inject(LeaveApiService);

  settlements: LeaveSettlementResponseDto[] = [];
  leaveTypes: LeaveTypeResponseDto[] = [];
  loading = false;
  error = '';
  saving = false;
  formError = '';
  toast = { show: false, message: '', type: 'success' };

  form = { employeeId: 1, leaveTypeId: 0, adjustmentDays: 0, adjustmentType: 'ManualCredit', notes: '' };

  ngOnInit() {
    this.loadHistory();
    this.api.getLeaveTypes().subscribe({ next: d => this.leaveTypes = d, error: () => {} });
  }

  loadHistory() {
    this.loading = true;
    this.api.getSettlements(1).subscribe({
      next: data => { this.settlements = data; this.loading = false; },
      error: () => { this.error = 'Failed to load settlement history.'; this.loading = false; }
    });
  }

  submitSettlement() {
    if (!this.form.leaveTypeId) { this.formError = 'Please select a leave type.'; return; }
    if (this.form.adjustmentDays <= 0) { this.formError = 'Adjustment days must be greater than 0.'; return; }
    this.formError = '';
    this.saving = true;

    const days = this.form.adjustmentType === 'ManualDebit'
      ? -Math.abs(this.form.adjustmentDays)
      : Math.abs(this.form.adjustmentDays);

    this.api.createSettlement({
      employeeId: this.form.employeeId,
      leaveTypeId: this.form.leaveTypeId,
      adjustmentDays: days,
      adjustmentType: this.form.adjustmentType,
      notes: this.form.notes || null
    }).subscribe({
      next: () => {
        this.showToast('Settlement recorded successfully.');
        this.form = { employeeId: 1, leaveTypeId: 0, adjustmentDays: 0, adjustmentType: 'ManualCredit', notes: '' };
        this.loadHistory();
        this.saving = false;
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Failed to submit settlement.';
        this.saving = false;
      }
    });
  }

  adjBg(type: string) {
    if (type === 'ManualCredit') return '#dcfce7';
    if (type === 'ManualDebit') return '#fee2e2';
    return '#e0f2fe';
  }

  adjColor(type: string) {
    if (type === 'ManualCredit') return '#166534';
    if (type === 'ManualDebit') return '#991b1b';
    return '#075985';
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { show: true, message, type };
    setTimeout(() => this.toast.show = false, 3000);
  }
}
