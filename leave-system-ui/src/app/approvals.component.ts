import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LeaveApiService } from './leave-api.service';
import { LeaveRequestResponseDto } from './models';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    @if (toast.show) {
      <div [style.background]="toast.type === 'success' ? '#16a34a' : '#dc2626'"
        style="position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:white;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.25);">
        {{ toast.message }}
      </div>
    }

    <nav style="background:#111827;color:#fff;padding:16px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
      <strong style="margin-right:12px;font-size:16px;">Leave Management</strong>
      <a routerLink="/" style="color:#d1d5db;text-decoration:none;">Dashboard</a>
      <a routerLink="/apply-leave" style="color:#d1d5db;text-decoration:none;">Apply Leave</a>
      <a routerLink="/approvals" style="color:white;text-decoration:none;font-weight:bold;">Approvals</a>
      <a routerLink="/leave-types" style="color:#d1d5db;text-decoration:none;">Leave Types</a>
      <a routerLink="/settlements" style="color:#d1d5db;text-decoration:none;">Settlements</a>
    </nav>

    <div style="padding:24px;font-family:Arial,sans-serif;background:#f3f4f6;min-height:100vh;">
      <h1 style="margin-top:0;">Leave Approvals</h1>

      <div style="margin-bottom:10px;font-size:14px;color:#374151;">
        loading: {{ loading }} | requests: {{ requests.length }} | error: {{ error }}
      </div>

      @if (selectedIds.length > 0) {
        <div style="background:#1e40af;color:white;padding:14px 20px;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <span style="font-weight:600;">{{ selectedIds.length }} selected</span>
          <button (click)="bulkApprove()" [disabled]="bulkLoading"
            style="background:#16a34a;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;"
            [style.opacity]="bulkLoading ? '0.6' : '1'">
            {{ bulkLoading ? '...' : 'Approve All' }}
          </button>
          <div style="display:flex;gap:8px;align-items:center;">
            <input [(ngModel)]="bulkRejectComment" placeholder="Rejection comment (optional)"
              style="padding:8px 12px;border-radius:6px;border:none;font-size:13px;width:220px;" />
            <button (click)="bulkReject()" [disabled]="bulkLoading"
              style="background:#dc2626;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;"
              [style.opacity]="bulkLoading ? '0.6' : '1'">
              {{ bulkLoading ? '...' : 'Reject All' }}
            </button>
          </div>
          <button (click)="clearSelection()"
            style="background:transparent;color:white;border:1px solid rgba(255,255,255,.4);padding:8px 14px;border-radius:6px;cursor:pointer;font-size:13px;">
            Clear
          </button>
        </div>
      }

      <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <h2 style="margin:0;">Pending Requests</h2>
          @if (!loading) {
            <span style="background:#fef3c7;color:#92400e;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;">
              {{ requests.length }} pending
            </span>
          }
        </div>

        @if (loading) {
          <div style="text-align:center;padding:40px;color:#6b7280;">Loading...</div>
        }

        @if (error && !loading) {
          <div style="background:#fee2e2;color:#991b1b;padding:14px 16px;border-radius:8px;margin-bottom:12px;">
            {{ error }}
            &nbsp;
            <button (click)="loadRequests()" style="background:none;border:none;color:#991b1b;cursor:pointer;text-decoration:underline;">
              Retry
            </button>
          </div>
        }

        @if (!loading) {
          <div style="overflow:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:12px;border-bottom:1px solid #e5e7eb;width:40px;">
                    <input
                      type="checkbox"
                      [checked]="allSelected"
                      (change)="toggleAll($event)"
                      style="width:16px;height:16px;cursor:pointer;" />
                  </th>
                  <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Employee</th>
                  <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Leave Type</th>
                  <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Dates</th>
                  <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Days</th>
                  <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Reason</th>
                  <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (r of requests; track r.id) {
                  <tr [style.background]="isSelected(r.id) ? '#eff6ff' : 'white'">
                    <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:center;">
                      <input
                        type="checkbox"
                        [checked]="isSelected(r.id)"
                        (change)="toggleSelect(r.id)"
                        style="width:16px;height:16px;cursor:pointer;" />
                    </td>
                    <td style="padding:12px;border-bottom:1px solid #f3f4f6;font-weight:500;">{{ r.employeeName }}</td>
                    <td style="padding:12px;border-bottom:1px solid #f3f4f6;">{{ r.leaveTypeName }}</td>
                    <td style="padding:12px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">
                      {{ r.startDate | date:'mediumDate' }} – {{ r.endDate | date:'mediumDate' }}
                    </td>
                    <td style="padding:12px;border-bottom:1px solid #f3f4f6;">{{ r.daysRequested }}</td>
                    <td
                      style="padding:12px;border-bottom:1px solid #f3f4f6;color:#6b7280;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                      [title]="r.reason">
                      {{ r.reason }}
                    </td>
                    <td style="padding:12px;border-bottom:1px solid #f3f4f6;">
                      <div style="display:flex;gap:6px;">
                        <button
                          (click)="approve(r.id)"
                          [disabled]="processingId === r.id"
                          style="background:#16a34a;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;min-width:68px;"
                          [style.opacity]="processingId === r.id ? '0.5' : '1'">
                          {{ processingId === r.id ? '...' : 'Approve' }}
                        </button>
                        <button
                          (click)="startReject(r.id)"
                          [disabled]="processingId === r.id"
                          style="background:#dc2626;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;min-width:60px;"
                          [style.opacity]="processingId === r.id ? '0.5' : '1'">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>

                  @if (rejectingId === r.id) {
                    <tr style="background:#fff5f5;">
                      <td colspan="7" style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
                        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                          <input
                            [(ngModel)]="rejectComment"
                            placeholder="Rejection comment (optional)"
                            style="padding:8px 12px;border:1px solid #fca5a5;border-radius:6px;flex:1;min-width:220px;font-size:13px;" />
                          <button
                            (click)="confirmReject(r.id)"
                            [disabled]="processingId === r.id"
                            style="background:#dc2626;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;"
                            [style.opacity]="processingId === r.id ? '0.5' : '1'">
                            {{ processingId === r.id ? 'Rejecting...' : 'Confirm Reject' }}
                          </button>
                          <button
                            (click)="cancelReject()"
                            style="background:#e5e7eb;color:#374151;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:13px;">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                } @empty {
                  <tr>
                    <td colspan="7" style="padding:32px;text-align:center;color:#6b7280;">No pending requests.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class ApprovalsComponent implements OnInit {
  private api = inject(LeaveApiService);
  private cdr = inject(ChangeDetectorRef);

  requests: LeaveRequestResponseDto[] = [];
  loading = false;
  bulkLoading = false;
  error = '';
  selectedIds: number[] = [];
  processingId: number | null = null;
  rejectingId: number | null = null;
  rejectComment = '';
  bulkRejectComment = '';
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };

  get allSelected() {
    return this.requests.length > 0 && this.selectedIds.length === this.requests.length;
  }

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api.getPendingRequests().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: data => {
        this.requests = Array.isArray(data) ? data : [];
        this.selectedIds = [];
        this.processingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not load requests.';
        this.cdr.detectChanges();
      }
    });
  }

  isSelected(id: number) {
    return this.selectedIds.includes(id);
  }

  toggleSelect(id: number) {
    this.selectedIds = this.isSelected(id)
      ? this.selectedIds.filter(x => x !== id)
      : [...this.selectedIds, id];
  }

  toggleAll(event: Event) {
    this.selectedIds = (event.target as HTMLInputElement).checked
      ? this.requests.map(r => r.id)
      : [];
  }

  clearSelection() {
    this.selectedIds = [];
  }

  approve(id: number) {
    this.processingId = id;
    this.api.approveRequest(id).pipe(
      finalize(() => {
        this.processingId = null;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.showToast('Request approved.');
        this.loadRequests();
      },
      error: (err) => this.showToast(err?.error?.message || 'Approval failed.', 'error')
    });
  }

  startReject(id: number) {
    this.rejectingId = id;
    this.rejectComment = '';
  }

  cancelReject() {
    this.rejectingId = null;
    this.rejectComment = '';
  }

  confirmReject(id: number) {
    this.processingId = id;
    this.api.rejectRequest(id, { comment: this.rejectComment || null }).pipe(
      finalize(() => {
        this.processingId = null;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.showToast('Request rejected.');
        this.rejectingId = null;
        this.loadRequests();
      },
      error: (err) => this.showToast(err?.error?.message || 'Rejection failed.', 'error')
    });
  }

  bulkApprove() {
    this.bulkLoading = true;
    const count = this.selectedIds.length;

    this.api.bulkApprove({ requestIds: [...this.selectedIds] }).pipe(
      finalize(() => {
        this.bulkLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.showToast(`${count} request(s) approved.`);
        this.loadRequests();
      },
      error: (err) => this.showToast(err?.error?.message || 'Bulk approve failed.', 'error')
    });
  }

  bulkReject() {
    this.bulkLoading = true;
    const count = this.selectedIds.length;

    this.api.bulkReject({
      requestIds: [...this.selectedIds],
      comment: this.bulkRejectComment || null
    }).pipe(
      finalize(() => {
        this.bulkLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.showToast(`${count} request(s) rejected.`);
        this.bulkRejectComment = '';
        this.loadRequests();
      },
      error: (err) => this.showToast(err?.error?.message || 'Bulk reject failed.', 'error')
    });
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { show: true, message, type };
    this.cdr.detectChanges();

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 3500);
  }
}