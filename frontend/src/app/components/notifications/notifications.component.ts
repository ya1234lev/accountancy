import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TransactionService, NotificationMessage } from '../../services/transaction.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div *ngFor="let notification of notifications" 
           class="notification" 
           [class]="'notification--' + notification.type"
           [class.notification--visible]="notification.visible"
           (click)="removeNotification(notification.id)">
        <div class="notification-content">
          <svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path *ngIf="notification.type === 'success'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            <path *ngIf="notification.type === 'error'" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            <path *ngIf="notification.type === 'info'" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10A1,1 0 0,1 11,9V7A1,1 0 0,1 12,6A1,1 0 0,1 13,7V9A1,1 0 0,1 12,10Z"/>
          </svg>
          <span class="notification-message">{{notification.message}}</span>
          <button class="notification-close" (click)="removeNotification(notification.id); $event.stopPropagation()">
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
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }

    .notification {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
      cursor: pointer;
      overflow: hidden;
    }

    .notification--visible {
      opacity: 1;
      transform: translateX(0);
    }

    .notification--success {
      border-right: 4px solid var(--success-color);
    }

    .notification--error {
      border-right: 4px solid var(--danger-color);
    }

    .notification--info {
      border-right: 4px solid var(--accent-color);
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
        right: 0.5rem;
        left: 0.5rem;
        top: 0.5rem;
        max-width: none;
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

  constructor(private transactionService: TransactionService) {}

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
}
