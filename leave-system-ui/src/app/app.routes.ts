import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { ApplyLeaveComponent } from './apply-leave.component';
import { ApprovalsComponent } from './approvals.component';
import { LeaveTypesComponent } from './leave-types.component';
import { LeaveSettlementsComponent } from './leave-settlements.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'apply-leave', component: ApplyLeaveComponent },
  { path: 'approvals', component: ApprovalsComponent },
  { path: 'leave-types', component: LeaveTypesComponent },
  { path: 'settlements', component: LeaveSettlementsComponent },
];
