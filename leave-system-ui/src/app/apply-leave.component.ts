import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LeaveApiService } from './leave-api.service';
import { LeaveTypeResponseDto, LeaveBalanceDto } from './models';

const DRAFT_KEY = 'leave-draft';

@Component({
  selector: 'app-apply-leave',
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
      <a routerLink="/" style="color:#d1d5db;text-decoration:none;">Dashboard</a>
      <a routerLink="/apply-leave" style="color:white;text-decoration:none;font-weight:bold;">Apply Leave</a>
      <a routerLink="/approvals" style="color:#d1d5db;text-decoration:none;">Approvals</a>
      <a routerLink="/leave-types" style="color:#d1d5db;text-decoration:none;">Leave Types</a>
      <a routerLink="/settlements" style="color:#d1d5db;text-decoration:none;">Settlements</a>
    </nav>

    <div style="padding:24px;font-family:Arial,sans-serif;background:#f3f4f6;min-height:100vh;">
      <h1 style="margin-top:0;">Apply for Leave</h1>

      <div style="display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start;">

        <!-- Form -->
        <div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <div *ngIf="hasDraft"
            style="background:#fef3c7;border:1px solid #fcd34d;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:13px;display:flex;justify-content:space-between;align-items:center;">
            <span>Draft restored from last session.</span>
            <button (click)="resetForm()" style="background:none;border:none;color:#92400e;cursor:pointer;font-weight:600;">Clear Draft</button>
          </div>

          <!-- Leave Type -->
          <div style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">Leave Type *</label>
            <select [(ngModel)]="form.leaveTypeId" (ngModelChange)="onFieldChange()"
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;">
              <option [ngValue]="null">-- Select leave type --</option>
              <option *ngFor="let t of leaveTypes" [ngValue]="t.id">{{ t.name }}</option>
            </select>
          </div>

          <!-- Dates -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
            <div>
              <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">Start Date *</label>
              <input [(ngModel)]="form.startDate" type="date" (ngModelChange)="onDateChange()"
                style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
            </div>
            <div>
              <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">End Date *</label>
              <input [(ngModel)]="form.endDate" type="date" (ngModelChange)="onDateChange()"
                style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
            </div>
          </div>

          <!-- Day estimate -->
          <div *ngIf="estimatedDays > 0"
            style="background:#eff6ff;border:1px solid #bfdbfe;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:13px;color:#1e40af;">
            Estimated working days: <strong>{{ estimatedDays }}</strong>
          </div>

          <!-- Balance warning -->
          <div *ngIf="balanceWarning"
            style="background:#fff7ed;border:1px solid #fed7aa;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:13px;color:#c2410c;">
            ⚠ Insufficient balance. You have <strong>{{ selectedBalance?.remainingDays }}</strong> day(s) remaining for this leave type.
          </div>

          <!-- Reason -->
          <div style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">Reason *</label>
            <textarea [(ngModel)]="form.reason" (ngModelChange)="onFieldChange()" rows="4"
              placeholder="Describe the reason for your leave..."
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;resize:vertical;font-family:Arial,sans-serif;"></textarea>
          </div>

          <!-- Error -->
          <div *ngIf="formError"
            style="background:#fee2e2;color:#991b1b;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:13px;">
            {{ formError }}
          </div>

          <!-- Buttons -->
          <div style="display:flex;gap:10px;">
            <button (click)="submit()" [disabled]="submitting"
              style="background:#2563eb;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;"
              [style.opacity]="submitting ? '0.6' : '1'">
              {{ submitting ? 'Submitting...' : 'Submit Request' }}
            </button>
            <button (click)="resetForm()" [disabled]="submitting"
              style="background:#e5e7eb;color:#374151;border:none;padding:12px 18px;border-radius:8px;cursor:pointer;font-size:14px;">
              Clear
            </button>
          </div>
        </div>

        <!-- Balance Sidebar -->
        <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <h3 style="margin-top:0;font-size:15px;">Your Leave Balances</h3>
          <div *ngIf="balances.length === 0" style="color:#6b7280;font-size:13px;">Loading balances...</div>
          <div *ngFor="let b of balances" style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:600;">{{ b.leaveTypeName }}</span>
              <span [style.color]="b.remainingDays <= 2 ? '#dc2626' : '#2563eb'"
                style="font-size:13px;font-weight:700;">{{ b.remainingDays }} / {{ b.totalDays }}</span>
            </div>
            <div style="background:#e5e7eb;border-radius:999px;height:5px;">
              <div [style.width]="pct(b) + '%'"
                [style.background]="b.remainingDays <= 2 ? '#dc2626' : '#2563eb'"
                style="height:5px;border-radius:999px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApplyLeaveComponent implements OnInit {
  private api = inject(LeaveApiService);

  leaveTypes: LeaveTypeResponseDto[] = [];
  balances: LeaveBalanceDto[] = [];
  submitting = false;
  formError = '';
  hasDraft = false;
  estimatedDays = 0;
  toast = { show: false, message: '', type: 'success' };

  form: { leaveTypeId: number | null; startDate: string; endDate: string; reason: string } =
    { leaveTypeId: null, startDate: '', endDate: '', reason: '' };

  get selectedBalance() {
    return this.balances.find(b => b.leaveTypeId === this.form.leaveTypeId) ?? null;
  }

  get balanceWarning() {
    return this.selectedBalance !== null
      && this.estimatedDays > 0
      && this.estimatedDays > this.selectedBalance.remainingDays;
  }

  ngOnInit() {
    this.api.getLeaveTypes().subscribe({
      next: d => this.leaveTypes = d.filter(t => t.isActive),
      error: () => {}
    });
    this.api.getLeaveBalances(1).subscribe({
      next: d => this.balances = d.balances,
      error: () => {}
    });
    this.restoreDraft();
  }

  onFieldChange() { this.saveDraft(); }

  onDateChange() {
    this.estimatedDays = this.calcBusinessDays(this.form.startDate, this.form.endDate);
    this.saveDraft();
  }

  calcBusinessDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    if (s > e) return 0;
    let count = 0;
    const d = new Date(s);
    while (d <= e) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(this.form));
  }

  restoreDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.reason || parsed.startDate) {
          this.form = parsed;
          this.hasDraft = true;
          this.estimatedDays = this.calcBusinessDays(this.form.startDate, this.form.endDate);
        }
      } catch {}
    }
  }

  resetForm() {
    localStorage.removeItem(DRAFT_KEY);
    this.form = { leaveTypeId: null, startDate: '', endDate: '', reason: '' };
    this.hasDraft = false;
    this.estimatedDays = 0;
    this.formError = '';
  }

  submit() {
    if (!this.form.leaveTypeId) { this.formError = 'Please select a leave type.'; return; }
    if (!this.form.startDate) { this.formError = 'Start date is required.'; return; }
    if (!this.form.endDate) { this.formError = 'End date is required.'; return; }
    if (this.form.startDate > this.form.endDate) { this.formError = 'Start date must be before end date.'; return; }
    if (!this.form.reason.trim()) { this.formError = 'Reason is required.'; return; }
    this.formError = '';
    this.submitting = true;

    this.api.createLeaveRequest({
      employeeId: 1,
      leaveTypeId: this.form.leaveTypeId,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      reason: this.form.reason
    }).pipe(
      finalize(() => this.submitting = false)
    ).subscribe({
      next: () => {
        this.showToast('Leave request submitted successfully.');
        this.resetForm();
        this.api.getLeaveBalances(1).subscribe({ next: d => this.balances = d.balances, error: () => {} });
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Submission failed. Please try again.';
      }
    });
  }

  pct(b: LeaveBalanceDto) {
    return b.totalDays > 0 ? Math.min(100, Math.round((b.remainingDays / b.totalDays) * 100)) : 0;
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { show: true, message, type };
    setTimeout(() => this.toast.show = false, 3500);
  }
}
