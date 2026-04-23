export interface CreateLeaveRequestDto {
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveRequestResponseDto {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: string;
  rejectionComment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface LeaveActionDto {
  comment?: string | null;
}

export interface BulkLeaveActionDto {
  requestIds: number[];
  comment?: string | null;
}

export interface LeaveTypeDto {
  name: string;
  defaultDays: number;
  isAccrued: boolean;
  accrualPerMonth: number;
  isActive: boolean;
}

export interface LeaveTypeResponseDto {
  id: number;
  name: string;
  defaultDays: number;
  isAccrued: boolean;
  accrualPerMonth: number;
  isActive: boolean;
}

// Each balance item returned inside LeaveBalanceResponse.balances
export interface LeaveBalanceDto {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

// Wrapper returned by GET /api/LeaveBalances/{employeeId}
export interface LeaveBalanceResponse {
  employeeId: number;
  employeeName: string;
  balances: LeaveBalanceDto[];
  totalRemaining: number;
}

// Balance items inside the Dashboard response (no id/employeeId)
export interface DashboardBalanceItem {
  leaveTypeId: number;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

// Leave request items inside the Dashboard response (subset of fields)
export interface DashboardLeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: string;
  rejectionComment?: string | null;
  leaveTypeName: string;
  createdAt: string;
}

// GET /api/Dashboard/{employeeId}
export interface DashboardDto {
  employeeId: number;
  employeeName: string;
  totalLeaveBalance: number;
  leaveBalances: DashboardBalanceItem[];
  leaveRequests: DashboardLeaveRequest[];
}

export interface CreateLeaveSettlementDto {
  employeeId: number;
  leaveTypeId: number;
  adjustmentDays: number;
  adjustmentType: string;
  notes?: string | null;
}

// Nested objects returned inside LeaveSettlement entity response
export interface SettlementEmployee {
  id: number;
  fullName: string;
  email: string;
}

export interface SettlementLeaveType {
  id: number;
  name: string;
}

// GET /api/LeaveSettlements/{employeeId} — backend returns entities with navigation props
export interface LeaveSettlementResponseDto {
  id: number;
  employeeId: number;
  employee?: SettlementEmployee | null;
  leaveTypeId: number;
  leaveType?: SettlementLeaveType | null;
  adjustmentDays: number;
  adjustmentType: string;
  notes?: string | null;
  createdAt: string;
}

export interface LeaveRequestFilters {
  status?: string;
  leaveTypeId?: number;
  fromDate?: string;
  toDate?: string;
}
