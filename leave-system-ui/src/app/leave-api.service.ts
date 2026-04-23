import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import {
  CreateLeaveRequestDto,
  LeaveRequestResponseDto,
  LeaveActionDto,
  BulkLeaveActionDto,
  LeaveTypeDto,
  LeaveTypeResponseDto,
  LeaveBalanceResponse,
  DashboardDto,
  CreateLeaveSettlementDto,
  LeaveSettlementResponseDto,
  LeaveRequestFilters,
} from './models';

@Injectable({ providedIn: 'root' })
export class LeaveApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://localhost:7277/api';

  // Cached once per app session — leave types rarely change
  private leaveTypes$: Observable<LeaveTypeResponseDto[]> | null = null;

  getDashboard(employeeId: number): Observable<DashboardDto> {
    return this.http.get<DashboardDto>(`${this.base}/Dashboard/${employeeId}`);
  }

  getLeaveTypes(): Observable<LeaveTypeResponseDto[]> {
    if (!this.leaveTypes$) {
      this.leaveTypes$ = this.http
        .get<LeaveTypeResponseDto[]>(`${this.base}/LeaveTypes`)
        .pipe(shareReplay(1));
    }
    return this.leaveTypes$;
  }

  createLeaveType(dto: LeaveTypeDto): Observable<LeaveTypeResponseDto> {
    this.leaveTypes$ = null; // invalidate cache
    return this.http.post<LeaveTypeResponseDto>(`${this.base}/LeaveTypes`, dto);
  }

  updateLeaveType(id: number, dto: LeaveTypeDto): Observable<LeaveTypeResponseDto> {
    this.leaveTypes$ = null; // invalidate cache
    return this.http.put<LeaveTypeResponseDto>(`${this.base}/LeaveTypes/${id}`, dto);
  }

  getLeaveBalances(employeeId: number): Observable<LeaveBalanceResponse> {
    return this.http.get<LeaveBalanceResponse>(`${this.base}/LeaveBalances/${employeeId}`);
  }

  getLeaveRequests(filters?: LeaveRequestFilters): Observable<LeaveRequestResponseDto[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.leaveTypeId) params = params.set('leaveTypeId', String(filters.leaveTypeId));
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    return this.http.get<LeaveRequestResponseDto[]>(`${this.base}/LeaveRequests`, { params });
  }

  getPendingRequests(): Observable<LeaveRequestResponseDto[]> {
    return this.http.get<LeaveRequestResponseDto[]>(`${this.base}/LeaveRequests/pending`);
  }

  createLeaveRequest(dto: CreateLeaveRequestDto): Observable<LeaveRequestResponseDto> {
    return this.http.post<LeaveRequestResponseDto>(`${this.base}/LeaveRequests`, dto);
  }

  approveRequest(id: number): Observable<unknown> {
    return this.http.put(`${this.base}/LeaveRequests/${id}/approve`, {});
  }

  rejectRequest(id: number, dto: LeaveActionDto): Observable<unknown> {
    return this.http.put(`${this.base}/LeaveRequests/${id}/reject`, dto);
  }

  cancelRequest(id: number): Observable<unknown> {
    return this.http.put(`${this.base}/LeaveRequests/${id}/cancel`, {});
  }

  bulkApprove(dto: BulkLeaveActionDto): Observable<unknown> {
    return this.http.put(`${this.base}/LeaveRequests/bulk-approve`, dto);
  }

  bulkReject(dto: BulkLeaveActionDto): Observable<unknown> {
    return this.http.put(`${this.base}/LeaveRequests/bulk-reject`, dto);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.base}/LeaveRequests/export/csv`, { responseType: 'blob' });
  }

  getSettlements(employeeId: number): Observable<LeaveSettlementResponseDto[]> {
    return this.http.get<LeaveSettlementResponseDto[]>(`${this.base}/LeaveSettlements/${employeeId}`);
  }

  createSettlement(dto: CreateLeaveSettlementDto): Observable<LeaveSettlementResponseDto> {
    return this.http.post<LeaveSettlementResponseDto>(`${this.base}/LeaveSettlements`, dto);
  }
}
