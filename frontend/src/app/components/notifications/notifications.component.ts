import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CombinedTransactionService, NotificationMessage } from '../../services/combined-transaction.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div *ngFor="let notification of notifications" 
           class="notification" 
           [class]="'notification--' + notification.type"
           [class.notification--visible]="true"
           (click)="removeNotification(notification.id)">
        <div class="notification-content">
          <svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path *ngIf="notification.type === 'success'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            <path *ngIf="notification.type === 'error'" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            <path *ngIf="notification.type === 'info'" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10A1,1 0 0,1 11,9V7A1,1 0 0,1 12,6A1,1 0 0,1 13,7V9A1,1 0 0,1 12,10Z"/>
            <path *ngIf="notification.type === 'confirm'" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
          </svg>
          <span class="notification-message">{{notification.message}}</span>
          
          <!-- כפתורי אישור וביטול לסוג confirm -->
          <div *ngIf="notification.type === 'confirm'" class="notification-actions">
            <button class="notification-btn notification-btn--confirm" (click)="confirmAction(notification); $event.stopPropagation()">
              {{notification.confirmText || 'אישור'}}
            </button>
            <button class="notification-btn notification-btn--cancel" (click)="cancelAction(notification); $event.stopPropagation()">
              {{notification.cancelText || 'ביטול'}}
            </button>
          </div>
          
          <!-- כפתור סגירה רגיל לסוגים אחרים -->
          <button *ngIf="notification.type !== 'confirm'" class="notification-close" (click)="removeNotification(notification.id); $event.stopPropagation()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      bottom: 2rem !important; /* למטה במקום למעלה */
      left: 1rem !important; /* צד שמאל */
      right: auto !important; /* מבטל כל הגדרה של right */
      top: auto !important; /* מבטל כל הגדרה של top */
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }

    /* התראות אישור במרכז המסך */
    .notification--confirm {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      z-index: 10000;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(8px);
    }

    /* רקע כהה מאחורי התראת אישור */
    .notification--confirm::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: -1;
      backdrop-filter: blur(4px);
    }

    .notification {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transform: translateX(-100%); /* משנה כיוון האנימציה לשמאל */
      transition: all 0.3s ease-in-out;
      cursor: pointer;
      overflow: hidden;
    }

    .notification--visible {
      opacity: 1;
      transform: translateX(0);
    }

    .notification--success {
      border-left: 4px solid var(--success-color); /* שינוי מ-right ל-left */
    }

    .notification--error {
      border-left: 4px solid var(--danger-color); /* שינוי מ-right ל-left */
    }

    .notification--info {
      border-left: 4px solid var(--accent-color); /* שינוי מ-right ל-left */
    }

    .notification--confirm {
      border-left: 4px solid var(--warning-color); /* צבע כתום לאישור */
      background: var(--white);
      padding: 1.5rem;
    }

    .notification--confirm .notification-content {
      padding: 0;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .notification--confirm .notification-message {
      font-size: 1rem;
      line-height: 1.5;
      white-space: pre-line;
      margin-bottom: 0.5rem;
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
    }

    .notification-icon {
      flex-shrink: 0;
    }

    .notification--success .notification-icon {
      color: var(--success-color);
    }

    .notification--error .notification-icon {
      color: var(--danger-color);
    }

    .notification--info .notification-icon {
      color: var(--accent-color);
    }

    .notification--confirm .notification-icon {
      color: var(--warning-color);
    }

    .notification-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      width: 100%;
      margin-top: 0.5rem;
    }

    .notification-btn {
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      min-width: 80px;
    }

    .notification-btn--confirm {
      background: var(--danger-color);
      color: var(--white);
    }

    .notification-btn--confirm:hover {
      background: #c53030;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
    }

    .notification-btn--cancel {
      background: var(--gray-200);
      color: var(--gray-700);
    }

    .notification-btn--cancel:hover {
      background: var(--gray-300);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .notification-message {
      flex: 1;
      font-size: 0.875rem;
      color: var(--gray-700);
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      color: var(--gray-400);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: var(--transition);
      flex-shrink: 0;
    }

    .notification-close:hover {
      background: var(--gray-100);
      color: var(--gray-600);
    }

    .notification:hover {
      box-shadow: var(--shadow-xl);
    }

    @media (max-width: 768px) {
      .notifications-container {
        bottom: 2rem !important; /* למטה במובייל */
        left: 1rem !important; /* צד שמאל */
        right: auto !important; /* מבטל right */
        top: auto !important; /* מבטל top */
        max-width: calc(100vw - 1rem);
      }

      /* התראות אישור במובייל */
      .notification--confirm {
        width: 95% !important;
        max-width: 400px !important;
        padding: 1.25rem !important;
      }

      .notification-actions {
        flex-direction: column-reverse;
        gap: 0.5rem;
      }

      .notification-btn {
        width: 100%;
        padding: 0.75rem;
      }

      .notification-content {
        padding: 0.75rem;
      }

      .notification-message {
        font-size: 0.8125rem;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationMessage[] = [];
  private destroy$ = new Subject<void>();

  constructor(private transactionService: CombinedTransactionService) {}

  ngOnInit(): void {
    this.transactionService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications: NotificationMessage[]) => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeNotification(id: string): void {
    this.transactionService.removeNotification(id);
  }

  confirmAction(notification: any): void {
    if (notification.onConfirm) {
      notification.onConfirm();
    }
    this.removeNotification(notification.id);
  }

  cancelAction(notification: any): void {
    if (notification.onCancel) {
      notification.onCancel();
    }
    this.removeNotification(notification.id);
  }
}
