import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeaveApiService } from './leave-api.service';
import { LeaveTypeResponseDto, LeaveTypeDto } from './models';

const NAV = `
  <nav style="background:#111827;color:#fff;padding:16px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
    <strong style="margin-right:12px;font-size:16px;">Leave Management</strong>
    <a routerLink="/" style="color:#d1d5db;text-decoration:none;">Dashboard</a>
    <a routerLink="/apply-leave" style="color:#d1d5db;text-decoration:none;">Apply Leave</a>
    <a routerLink="/approvals" style="color:#d1d5db;text-decoration:none;">Approvals</a>
    <a routerLink="/leave-types" style="color:white;text-decoration:none;font-weight:bold;">Leave Types</a>
    <a routerLink="/settlements" style="color:#d1d5db;text-decoration:none;">Settlements</a>
  </nav>
`;

@Component({
  selector: 'app-leave-types',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    ${NAV}

    <div *ngIf="toast.show"
      [style.background]="toast.type === 'success' ? '#16a34a' : '#dc2626'"
      style="position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:white;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.25);">
      {{ toast.message }}
    </div>

    <div style="padding:24px;font-family:Arial,sans-serif;background:#f3f4f6;min-height:100vh;">
      <h1 style="margin-top:0;">Leave Types Management</h1>

      <!-- Add / Edit Form -->
      <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:24px;max-width:700px;">
        <h2 style="margin-top:0;">{{ editingId ? 'Edit Leave Type' : 'Add New Leave Type' }}</h2>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div>
            <label style="font-weight:600;font-size:13px;">Name *</label>
            <input [(ngModel)]="form.name" placeholder="e.g. Annual Leave"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-weight:600;font-size:13px;">Default Days *</label>
            <input [(ngModel)]="form.defaultDays" type="number" min="0"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-top:20px;">
            <input [(ngModel)]="form.isAccrued" type="checkbox" id="isAccrued"
              style="width:16px;height:16px;cursor:pointer;" />
            <label for="isAccrued" style="font-weight:600;font-size:13px;cursor:pointer;">Is Accrued</label>
          </div>
          <div *ngIf="form.isAccrued">
            <label style="font-weight:600;font-size:13px;">Accrual Per Month</label>
            <input [(ngModel)]="form.accrualPerMonth" type="number" min="0" step="0.25"
              style="width:100%;padding:10px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px;box-sizing:border-box;" />
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-top:20px;">
            <input [(ngModel)]="form.isActive" type="checkbox" id="isActive"
              style="width:16px;height:16px;cursor:pointer;" />
            <label for="isActive" style="font-weight:600;font-size:13px;cursor:pointer;">Is Active</label>
          </div>
        </div>

        <div *ngIf="formError" style="margin-top:12px;color:#dc2626;font-size:13px;">{{ formError }}</div>

        <div style="margin-top:16px;display:flex;gap:10px;">
          <button (click)="save()" [disabled]="saving"
            style="background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">
            {{ saving ? 'Saving...' : (editingId ? 'Update' : 'Add Leave Type') }}
          </button>
          <button *ngIf="editingId" (click)="cancelEdit()"
            style="background:#6b7280;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">
            Cancel
          </button>
        </div>
      </div>

      <!-- Table -->
      <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <h2 style="margin-top:0;">All Leave Types</h2>

        <div *ngIf="loading" style="text-align:center;padding:40px;color:#6b7280;">Loading...</div>
        <div *ngIf="error" style="color:#dc2626;padding:16px;">{{ error }}</div>

        <div *ngIf="!loading" style="overflow:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Name</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Default Days</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Is Accrued</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Accrual/Month</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Status</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of types" style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:12px;font-weight:500;">{{ t.name }}</td>
                <td style="padding:12px;">{{ t.defaultDays }}</td>
                <td style="padding:12px;">
                  <span [style.background]="t.isAccrued ? '#dcfce7' : '#f3f4f6'"
                    [style.color]="t.isAccrued ? '#166534' : '#6b7280'"
                    style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;">
                    {{ t.isAccrued ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td style="padding:12px;">{{ t.isAccrued ? t.accrualPerMonth : '—' }}</td>
                <td style="padding:12px;">
                  <span [style.background]="t.isActive ? '#dcfce7' : '#fee2e2'"
                    [style.color]="t.isActive ? '#166534' : '#991b1b'"
                    style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;">
                    {{ t.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td style="padding:12px;">
                  <button (click)="startEdit(t)"
                    style="background:#2563eb;color:white;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;">
                    Edit
                  </button>
                </td>
              </tr>
              <tr *ngIf="types.length === 0">
                <td colspan="6" style="padding:24px;text-align:center;color:#6b7280;">No leave types found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class LeaveTypesComponent implements OnInit {
  private api = inject(LeaveApiService);

  types: LeaveTypeResponseDto[] = [];
  loading = false;
  error = '';
  saving = false;
  formError = '';
  editingId: number | null = null;
  toast = { show: false, message: '', type: 'success' };

  form: LeaveTypeDto = { name: '', defaultDays: 0, isAccrued: false, accrualPerMonth: 0, isActive: true };

  ngOnInit() {
    this.loadTypes();
  }

  loadTypes() {
    this.loading = true;
    this.api.getLeaveTypes().subscribe({
      next: data => { this.types = data; this.loading = false; },
      error: () => { this.error = 'Failed to load leave types.'; this.loading = false; }
    });
  }

  startEdit(t: LeaveTypeResponseDto) {
    this.editingId = t.id;
    this.form = { name: t.name, defaultDays: t.defaultDays, isAccrued: t.isAccrued, accrualPerMonth: t.accrualPerMonth, isActive: t.isActive };
    this.formError = '';
  }

  cancelEdit() {
    this.editingId = null;
    this.form = { name: '', defaultDays: 0, isAccrued: false, accrualPerMonth: 0, isActive: true };
    this.formError = '';
  }

  save() {
    if (!this.form.name.trim()) { this.formError = 'Name is required.'; return; }
    if (this.form.defaultDays < 0) { this.formError = 'Default days cannot be negative.'; return; }
    this.formError = '';
    this.saving = true;

    const obs = this.editingId
      ? this.api.updateLeaveType(this.editingId, this.form)
      : this.api.createLeaveType(this.form);

    obs.subscribe({
      next: () => {
        this.showToast(this.editingId ? 'Leave type updated.' : 'Leave type created.');
        this.cancelEdit();
        this.loadTypes();
        this.saving = false;
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Operation failed.';
        this.saving = false;
      }
    });
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { show: true, message, type };
    setTimeout(() => this.toast.show = false, 3000);
  }
}
