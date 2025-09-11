import { Component, OnInit } from &#39;@angular/core&#39;;
import { CommonModule } from &#39;@angular/common&#39;;
import { FormsModule } from &#39;@angular/forms&#39;;
import { Router } from &#39;@angular/router&#39;;
import jsPDF from &#39;jspdf&#39;;
import html2canvas from &#39;html2canvas&#39;;

interface Client {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    created: string;
}

interface Receipt {
    id: string;
    receiptNumber: string;
    date: string;
    clientId: string;
    clientName: string;
    amount: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    paymentMethod: &#39;cash&#39; | &#39;credit&#39; | &#39;check&#39; | &#39;transfer&#39;;

    details: string;
    printDate: string;

    // פרטי תשלום לפי סוג
    cashDetails?: {
        amount: number;
    };
    creditDetails?: {
        lastFourDigits: string;
        amount: number;
        installments: number;
    };
    checkDetails?: {
        checkNumber: string;
        accountNumber: string;
        bankNumber: string;
        amount: number;
        dueDate: string;
    };
    transferDetails?: {
        accountNumber: string;
        bankNumber: string;
        amount: number;
        transferDate: string;
    };
}

interface Notification {
    id: string;
    message: string;
    type: &#39;success&#39; | &#39;error&#39; | &#39;info&#39;;
    visible: boolean;
}

@Component({
    selector: &#39;app-income&#39;,
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    &lt;!-- מערכת הודעות --&gt;
    &lt;div class=&quot;notifications-container&quot;&gt;
      &lt;div *ngFor=&quot;let notification of notifications&quot;
           class=&quot;notification&quot;
           [class]=&quot;&#39;notification--&#39; + notification.type&quot;
           [class.notification--visible]=&quot;notification.visible&quot;
           (click)=&quot;removeNotification(notification.id)&quot;&gt;
        &lt;div class=&quot;notification-content&quot;&gt;
          &lt;svg class=&quot;notification-icon&quot; width=&quot;20&quot; height=&quot;20&quot; viewBox=&quot;0 0 24 24&quot;
fill=&quot;currentColor&quot;&gt;
            &lt;path *ngIf=&quot;notification.type === &#39;success&#39;&quot; d=&quot;M12 2C6.48 2 2 6.48 2
12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10
14.17l7.59-7.59L19 8l-9 9z&quot;/&gt;
            &lt;path *ngIf=&quot;notification.type === &#39;error&#39;&quot; d=&quot;M12 2C6.47 2 2 6.47 2
12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41
17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17
15.59z&quot;/&gt;

            &lt;path *ngIf=&quot;notification.type === &#39;info&#39;&quot; d=&quot;M12,2A10,10 0 0,0
2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0
0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1
12,17M12,10A1,1 0 0,1 11,9V7A1,1 0 0,1 12,6A1,1 0 0,1 13,7V9A1,1 0 0,1
12,10Z&quot;/&gt;
          &lt;/svg&gt;
          &lt;span class=&quot;notification-message&quot;&gt;{{notification.message}}&lt;/span&gt;
          &lt;button class=&quot;notification-close&quot;
(click)=&quot;removeNotification(notification.id); $event.stopPropagation()&quot;&gt;
            &lt;svg width=&quot;16&quot; height=&quot;16&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;currentColor&quot;&gt;
              &lt;path
d=&quot;M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13
.41L17.59,19L19,17.59L13.41,12L19,6.41Z&quot;/&gt;
            &lt;/svg&gt;
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;

    &lt;div class=&quot;app-layout&quot;&gt;
      &lt;!-- כפתור חזרה קבוע --&gt;
      &lt;button class=&quot;back-button-fixed&quot; (click)=&quot;navigateToHome()&quot; title=&quot;חזרה
לעמוד הראשי&quot;&gt;
        &lt;svg width=&quot;20&quot; height=&quot;20&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;currentColor&quot;&gt;
          &lt;path
d=&quot;M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20
Z&quot;/&gt;
        &lt;/svg&gt;
      &lt;/button&gt;

      &lt;!-- Header --&gt;
      &lt;header class=&quot;app-header&quot;&gt;
        &lt;div class=&quot;container&quot;&gt;
          &lt;div class=&quot;header-content&quot;&gt;
            &lt;h1 class=&quot;app-title&quot;&gt;
              &lt;svg class=&quot;app-icon&quot; width=&quot;32&quot; height=&quot;32&quot; viewBox=&quot;0 0 24 24&quot;
fill=&quot;currentColor&quot;&gt;
                &lt;path d=&quot;M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1
2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0
20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6
0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0
12,8Z&quot;/&gt;
              &lt;/svg&gt;
              מערכת הכנסות - הנהלת חשבונות
            &lt;/h1&gt;
            &lt;nav class=&quot;nav-menu&quot;&gt;
              &lt;button class=&quot;nav-button&quot; [class.active]=&quot;currentTab === &#39;newReceipt&#39;&quot;
(click)=&quot;currentTab = &#39;newReceipt&#39;&quot;&gt;
                קבלה חדשה
              &lt;/button&gt;
              &lt;button class=&quot;nav-button&quot; [class.active]=&quot;currentTab === &#39;receipts&#39;&quot;
(click)=&quot;currentTab = &#39;receipts&#39;&quot;&gt;
                רשימת קבלות
              &lt;/button&gt;
              &lt;button class=&quot;nav-button&quot; [class.active]=&quot;currentTab === &#39;clients&#39;&quot;
(click)=&quot;currentTab = &#39;clients&#39;&quot;&gt;
                לקוחות
              &lt;/button&gt;
              &lt;button class=&quot;nav-button&quot; [class.active]=&quot;currentTab === &#39;settings&#39;&quot;
(click)=&quot;currentTab = &#39;settings&#39;&quot;&gt;

                הגדרות
              &lt;/button&gt;
            &lt;/nav&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/header&gt;

      &lt;!-- Main Content --&gt;
      &lt;main class=&quot;main-content&quot;&gt;
        &lt;div class=&quot;container&quot;&gt;
         
          &lt;!-- קבלה חדשה --&gt;
          &lt;div *ngIf=&quot;currentTab === &#39;newReceipt&#39;&quot; class=&quot;tab-content&quot;&gt;
            &lt;div class=&quot;card&quot;&gt;
              &lt;div class=&quot;card-header&quot;&gt;
                &lt;h2 class=&quot;card-title&quot;&gt;קבלה חדשה&lt;/h2&gt;
              &lt;/div&gt;
              &lt;div class=&quot;card-body&quot;&gt;
                &lt;form (ngSubmit)=&quot;saveReceipt()&quot; #receiptForm=&quot;ngForm&quot;&gt;
                  &lt;div class=&quot;form-grid&quot;&gt;
                   
                    &lt;!-- מספר קבלה --&gt;
                    &lt;div class=&quot;form-group&quot;&gt;
                      &lt;label for=&quot;receiptNumber&quot;&gt;מספר קבלה&lt;/label&gt;
                      &lt;input type=&quot;text&quot; id=&quot;receiptNumber&quot;
                             [(ngModel)]=&quot;newReceipt.receiptNumber&quot;
                             name=&quot;receiptNumber&quot; required&gt;

                    &lt;/div&gt;

                    &lt;!-- תאריך --&gt;
                    &lt;div class=&quot;form-group&quot;&gt;
                      &lt;label for=&quot;date&quot;&gt;תאריך&lt;/label&gt;
                      &lt;input type=&quot;date&quot; id=&quot;date&quot;
                             [(ngModel)]=&quot;newReceipt.date&quot;
                             name=&quot;date&quot; required&gt;
                    &lt;/div&gt;

                    &lt;!-- לקוח --&gt;
                    &lt;div class=&quot;form-group&quot;&gt;
                      &lt;label for=&quot;client&quot;&gt;לקוח&lt;/label&gt;
                      &lt;div class=&quot;client-select-wrapper&quot;&gt;
                        &lt;select id=&quot;client&quot; [(ngModel)]=&quot;newReceipt.clientId&quot;
                                name=&quot;client&quot; required (change)=&quot;onClientChange()&quot;&gt;
                          &lt;option value=&quot;&quot;&gt;בחר לקוח&lt;/option&gt;
                          &lt;option *ngFor=&quot;let client of clients&quot; [value]=&quot;client.id&quot;&gt;
                            {{client.name}}
                          &lt;/option&gt;
                          &lt;option value=&quot;new&quot;&gt;+ לקוח חדש&lt;/option&gt;
                        &lt;/select&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;!-- סכום --&gt;
                    &lt;div class=&quot;form-group&quot;&gt;

                      &lt;label for=&quot;amount&quot;&gt;סכום (ללא מע&quot;מ)&lt;/label&gt;
                      &lt;input type=&quot;number&quot; id=&quot;amount&quot;
                             [(ngModel)]=&quot;newReceipt.amount&quot;
                             name=&quot;amount&quot; step=&quot;0.01&quot; required
                             (input)=&quot;calculateTotal()&quot;&gt;
                    &lt;/div&gt;

                    &lt;!-- מע&quot;מ --&gt;
                    &lt;div class=&quot;form-group&quot;&gt;
                      &lt;label for=&quot;vatRate&quot;&gt;מע&quot;מ&lt;/label&gt;
                      &lt;select id=&quot;vatRate&quot;
                              [(ngModel)]=&quot;newReceipt.vatRate&quot;
                              name=&quot;vatRate&quot; (change)=&quot;calculateTotal()&quot;&gt;
                        &lt;option value=&quot;0&quot;&gt;ללא מע&quot;מ&lt;/option&gt;
                        &lt;option value=&quot;17&quot;&gt;17%&lt;/option&gt;
                      &lt;/select&gt;
                    &lt;/div&gt;

                    &lt;!-- סך הכל --&gt;
                    &lt;div class=&quot;form-group&quot;&gt;
                      &lt;label for=&quot;totalAmount&quot;&gt;סך הכל&lt;/label&gt;
                      &lt;input type=&quot;number&quot; id=&quot;totalAmount&quot;
                             [value]=&quot;newReceipt.totalAmount&quot;
                             readonly class=&quot;readonly-input&quot;&gt;
                    &lt;/div&gt;

                    &lt;!-- אופן תשלום --&gt;

                    &lt;div class=&quot;form-group full-width&quot;&gt;
                      &lt;label&gt;אופן תשלום&lt;/label&gt;
                      &lt;div class=&quot;payment-methods&quot;&gt;
                        &lt;label class=&quot;radio-option&quot;&gt;
                          &lt;input type=&quot;radio&quot; [(ngModel)]=&quot;newReceipt.paymentMethod&quot;
                                 name=&quot;paymentMethod&quot; value=&quot;cash&quot;
(change)=&quot;updatePaymentDetails()&quot;&gt;
                          &lt;span&gt;מזומן&lt;/span&gt;
                        &lt;/label&gt;
                        &lt;label class=&quot;radio-option&quot;&gt;
                          &lt;input type=&quot;radio&quot; [(ngModel)]=&quot;newReceipt.paymentMethod&quot;
                                 name=&quot;paymentMethod&quot; value=&quot;credit&quot;
(change)=&quot;updatePaymentDetails()&quot;&gt;
                          &lt;span&gt;אשראי&lt;/span&gt;
                        &lt;/label&gt;
                        &lt;label class=&quot;radio-option&quot;&gt;
                          &lt;input type=&quot;radio&quot; [(ngModel)]=&quot;newReceipt.paymentMethod&quot;
                                 name=&quot;paymentMethod&quot; value=&quot;check&quot;
(change)=&quot;updatePaymentDetails()&quot;&gt;
                          &lt;span&gt;צ&#39;ק&lt;/span&gt;
                        &lt;/label&gt;
                        &lt;label class=&quot;radio-option&quot;&gt;
                          &lt;input type=&quot;radio&quot; [(ngModel)]=&quot;newReceipt.paymentMethod&quot;
                                 name=&quot;paymentMethod&quot; value=&quot;transfer&quot;
(change)=&quot;updatePaymentDetails()&quot;&gt;
                          &lt;span&gt;העברה בנקאית&lt;/span&gt;
                        &lt;/label&gt;
                      &lt;/div&gt;

                    &lt;/div&gt;

                    &lt;!-- פרטי תשלום - מזומן --&gt;
                    &lt;div *ngIf=&quot;newReceipt.paymentMethod === &#39;cash&#39;&quot;
class=&quot;payment-details full-width&quot;&gt;
                      &lt;h4&gt;פרטי תשלום במזומן&lt;/h4&gt;
                      &lt;div class=&quot;form-group&quot;&gt;
                        &lt;label for=&quot;cashAmount&quot;&gt;סכום&lt;/label&gt;
                        &lt;input type=&quot;number&quot; id=&quot;cashAmount&quot;
                               [(ngModel)]=&quot;cashDetails.amount&quot;
                               name=&quot;cashAmount&quot; step=&quot;0.01&quot;&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;!-- פרטי תשלום - אשראי --&gt;
                    &lt;div *ngIf=&quot;newReceipt.paymentMethod === &#39;credit&#39;&quot;
class=&quot;payment-details full-width&quot;&gt;
                      &lt;h4&gt;פרטי תשלום באשראי&lt;/h4&gt;
                      &lt;div class=&quot;payment-grid&quot;&gt;
                       &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;creditAmount&quot;&gt;סכום&lt;/label&gt;
                          &lt;input type=&quot;number&quot; id=&quot;creditAmount&quot;
                                 [(ngModel)]=&quot;creditDetails.amount&quot;
                                 name=&quot;creditAmount&quot; step=&quot;0.01&quot;&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;lastFourDigits&quot;&gt;4 ספרות אחרונות&lt;/label&gt;
                          &lt;input type=&quot;text&quot; id=&quot;lastFourDigits&quot;

                                 [(ngModel)]=&quot;creditDetails.lastFourDigits&quot;
                                 name=&quot;lastFourDigits&quot; maxlength=&quot;4&quot; pattern=&quot;[0-9]{4}&quot;&gt;
                        &lt;/div&gt;
                       
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;installments&quot;&gt;מספר תשלומים&lt;/label&gt;
                          &lt;input type=&quot;number&quot; id=&quot;installments&quot;
                                 [(ngModel)]=&quot;creditDetails.installments&quot;
                                 name=&quot;installments&quot; min=&quot;1&quot;&gt;
                        &lt;/div&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;!-- פרטי תשלום - צ&#39;ק --&gt;
                    &lt;div *ngIf=&quot;newReceipt.paymentMethod === &#39;check&#39;&quot;
class=&quot;payment-details full-width&quot;&gt;
                      &lt;h4&gt;פרטי תשלום בצ&#39;ק&lt;/h4&gt;
                      &lt;div class=&quot;payment-grid&quot;&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;checkAmount&quot;&gt;סכום&lt;/label&gt;
                          &lt;input type=&quot;number&quot; id=&quot;checkAmount&quot;
                                 [(ngModel)]=&quot;checkDetails.amount&quot;
                                 name=&quot;checkAmount&quot; step=&quot;0.01&quot;&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;checkNumber&quot;&gt;מספר צ&#39;ק&lt;/label&gt;
                          &lt;input type=&quot;text&quot; id=&quot;checkNumber&quot;

                                 [(ngModel)]=&quot;checkDetails.checkNumber&quot;
                                 name=&quot;checkNumber&quot;&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;accountNumber&quot;&gt;מספר חשבון&lt;/label&gt;
                          &lt;input type=&quot;text&quot; id=&quot;accountNumber&quot;
                                 [(ngModel)]=&quot;checkDetails.accountNumber&quot;
                                 name=&quot;accountNumber&quot;&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;bankNumber&quot;&gt;מספר בנק&lt;/label&gt;
                          &lt;input type=&quot;text&quot; id=&quot;bankNumber&quot;
                                 [(ngModel)]=&quot;checkDetails.bankNumber&quot;
                                 name=&quot;bankNumber&quot;&gt;
                        &lt;/div&gt;
                       
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;dueDate&quot;&gt;תאריך פירעון&lt;/label&gt;
                          &lt;input type=&quot;date&quot; id=&quot;dueDate&quot;
                                 [(ngModel)]=&quot;checkDetails.dueDate&quot;
                                 name=&quot;dueDate&quot;&gt;
                        &lt;/div&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;!-- פרטי תשלום - העברה בנקאית --&gt;

                    &lt;div *ngIf=&quot;newReceipt.paymentMethod === &#39;transfer&#39;&quot;
class=&quot;payment-details full-width&quot;&gt;
                      &lt;h4&gt;פרטי העברה בנקאית&lt;/h4&gt;
                      &lt;div class=&quot;payment-grid&quot;&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;transferAmount&quot;&gt;סכום&lt;/label&gt;
                          &lt;input type=&quot;number&quot; id=&quot;transferAmount&quot;
                                 [(ngModel)]=&quot;transferDetails.amount&quot;
                                 name=&quot;transferAmount&quot; step=&quot;0.01&quot;&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;transferAccountNumber&quot;&gt;מספר חשבון&lt;/label&gt;
                          &lt;input type=&quot;text&quot; id=&quot;transferAccountNumber&quot;
                                 [(ngModel)]=&quot;transferDetails.accountNumber&quot;
                                 name=&quot;transferAccountNumber&quot;&gt;
                        &lt;/div&gt;
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;transferBankNumber&quot;&gt;מספר בנק&lt;/label&gt;
                          &lt;input type=&quot;text&quot; id=&quot;transferBankNumber&quot;
                                 [(ngModel)]=&quot;transferDetails.bankNumber&quot;
                                 name=&quot;transferBankNumber&quot;&gt;
                        &lt;/div&gt;
                       
                        &lt;div class=&quot;form-group&quot;&gt;
                          &lt;label for=&quot;transferDate&quot;&gt;תאריך העברה&lt;/label&gt;
                          &lt;input type=&quot;date&quot; id=&quot;transferDate&quot;
                                 [(ngModel)]=&quot;transferDetails.transferDate&quot;

                                 name=&quot;transferDate&quot;&gt;
                        &lt;/div&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;!-- פרטים --&gt;
                    &lt;div class=&quot;form-group full-width&quot;&gt;
                      &lt;label for=&quot;details&quot;&gt;פרטים&lt;/label&gt;
                      &lt;textarea id=&quot;details&quot; [(ngModel)]=&quot;newReceipt.details&quot;
                                name=&quot;details&quot; rows=&quot;3&quot;&gt;&lt;/textarea&gt;
                    &lt;/div&gt;

                  &lt;/div&gt;

                  &lt;!-- כפתורים --&gt;
                  &lt;div class=&quot;form-actions&quot;&gt;
                    &lt;button type=&quot;submit&quot; class=&quot;btn btn-primary&quot;
[disabled]=&quot;!receiptForm.form.valid&quot;&gt;
                      שמור קבלה
                    &lt;/button&gt;
                    &lt;button type=&quot;button&quot; class=&quot;btn btn-secondary&quot;
(click)=&quot;generatePDF()&quot;&gt;
                      הדפסה
                    &lt;/button&gt;
                    &lt;button type=&quot;button&quot; class=&quot;btn btn-outline&quot; (click)=&quot;resetForm()&quot;&gt;
                      נקה טופס
                    &lt;/button&gt;
                  &lt;/div&gt;

                &lt;/form&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;!-- רשימת קבלות --&gt;
          &lt;div *ngIf=&quot;currentTab === &#39;receipts&#39;&quot; class=&quot;tab-content&quot;&gt;
            &lt;div class=&quot;card&quot;&gt;
              &lt;div class=&quot;card-header&quot;&gt;
                &lt;h2 class=&quot;card-title&quot;&gt;רשימת קבלות&lt;/h2&gt;
                &lt;div class=&quot;header-actions&quot;&gt;
                  &lt;input type=&quot;text&quot; placeholder=&quot;חיפוש&quot;
                         [(ngModel)]=&quot;searchTerm&quot; class=&quot;search-input&quot;&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div class=&quot;card-body&quot;&gt;
                &lt;div class=&quot;table-container&quot;&gt;
                  &lt;table class=&quot;data-table&quot;&gt;
                    &lt;thead&gt;
                      &lt;tr&gt;
                        &lt;th&gt;מספר קבלה&lt;/th&gt;
                        &lt;th&gt;תאריך&lt;/th&gt;
                        &lt;th&gt;לקוח&lt;/th&gt;
                        &lt;th&gt;סכום&lt;/th&gt;
                        &lt;th&gt;אופן תשלום&lt;/th&gt;
                        &lt;th&gt;פעולות&lt;/th&gt;
                      &lt;/tr&gt;

                    &lt;/thead&gt;
                    &lt;tbody&gt;
                      &lt;tr *ngFor=&quot;let receipt of filteredReceipts&quot;&gt;
                        &lt;td&gt;{{receipt.receiptNumber}}&lt;/td&gt;
                        &lt;td&gt;{{receipt.date | date:&#39;dd/MM/yyyy&#39;}}&lt;/td&gt;
                        &lt;td&gt;{{receipt.clientName}}&lt;/td&gt;
                        &lt;td&gt;₪{{receipt.totalAmount | number:&#39;1.2-2&#39;}}&lt;/td&gt;
                        &lt;td&gt;
                          {{getPaymentMethodName(receipt.paymentMethod)}}
                        &lt;/td&gt;
                        &lt;td&gt;
                          &lt;div class=&quot;action-buttons&quot;&gt;
                            &lt;button class=&quot;btn btn-sm btn-outline&quot;
(click)=&quot;editReceipt(receipt)&quot;&gt;
                              עריכה
                            &lt;/button&gt;
                            &lt;button class=&quot;btn btn-sm btn-primary&quot;
(click)=&quot;downloadReceiptPDF(receipt)&quot;&gt;
                              הדפסה
                            &lt;/button&gt;
                          &lt;/div&gt;
                        &lt;/td&gt;
                      &lt;/tr&gt;
                    &lt;/tbody&gt;
                  &lt;/table&gt;
                  &lt;div *ngIf=&quot;filteredReceipts.length === 0&quot; class=&quot;no-data&quot;&gt;
                    אין קבלות להצגה
                  &lt;/div&gt;

                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;!-- לקוחות --&gt;
          &lt;div *ngIf=&quot;currentTab === &#39;clients&#39;&quot; class=&quot;tab-content&quot;&gt;
            &lt;div class=&quot;card&quot;&gt;
              &lt;div class=&quot;card-header&quot;&gt;
                &lt;h2 class=&quot;card-title&quot;&gt;מאגר לקוחות&lt;/h2&gt;
                &lt;button class=&quot;btn btn-primary&quot; (click)=&quot;showNewClientForm = true&quot;&gt;
                  + לקוח חדש
                &lt;/button&gt;
              &lt;/div&gt;
              &lt;div class=&quot;card-body&quot;&gt;
               
                &lt;!-- טופס לקוח חדש --&gt;
                &lt;div *ngIf=&quot;showNewClientForm&quot; class=&quot;new-client-form&quot;&gt;
                  &lt;h3&gt;לקוח חדש&lt;/h3&gt;
                  &lt;form (ngSubmit)=&quot;saveClient()&quot; #clientForm=&quot;ngForm&quot;&gt;
                    &lt;div class=&quot;form-grid&quot;&gt;
                      &lt;div class=&quot;form-group&quot;&gt;
                        &lt;label for=&quot;clientName&quot;&gt;שם לקוח&lt;/label&gt;
                        &lt;input type=&quot;text&quot; id=&quot;clientName&quot;
                               [(ngModel)]=&quot;newClient.name&quot;
                               name=&quot;clientName&quot; required&gt;
                      &lt;/div&gt;

                      &lt;div class=&quot;form-group&quot;&gt;
                        &lt;label for=&quot;clientPhone&quot;&gt;טלפון&lt;/label&gt;
                        &lt;input type=&quot;tel&quot; id=&quot;clientPhone&quot;
                               [(ngModel)]=&quot;newClient.phone&quot;
                               name=&quot;clientPhone&quot;&gt;
                      &lt;/div&gt;
                      &lt;div class=&quot;form-group&quot;&gt;
                        &lt;label for=&quot;clientEmail&quot;&gt;אימייל&lt;/label&gt;
                        &lt;input type=&quot;email&quot; id=&quot;clientEmail&quot;
                               [(ngModel)]=&quot;newClient.email&quot;
                               name=&quot;clientEmail&quot;&gt;
                      &lt;/div&gt;
                      &lt;div class=&quot;form-group full-width&quot;&gt;
                        &lt;label for=&quot;clientAddress&quot;&gt;כתובת&lt;/label&gt;
                        &lt;textarea id=&quot;clientAddress&quot; [(ngModel)]=&quot;newClient.address&quot;
                                  name=&quot;clientAddress&quot; rows=&quot;2&quot;&gt;&lt;/textarea&gt;
                      &lt;/div&gt;
                    &lt;/div&gt;
                    &lt;div class=&quot;form-actions&quot;&gt;
                      &lt;button type=&quot;submit&quot; class=&quot;btn btn-primary&quot;
[disabled]=&quot;!clientForm.form.valid&quot;&gt;
                        שמור לקוח
                      &lt;/button&gt;
                      &lt;button type=&quot;button&quot; class=&quot;btn btn-outline&quot;
(click)=&quot;showNewClientForm = false&quot;&gt;
                        ביטול
                      &lt;/button&gt;
                    &lt;/div&gt;

                  &lt;/form&gt;
                &lt;/div&gt;

                &lt;!-- רשימת לקוחות --&gt;
                &lt;div class=&quot;table-container&quot;&gt;
                  &lt;table class=&quot;data-table&quot;&gt;
                    &lt;thead&gt;
                      &lt;tr&gt;
                        &lt;th&gt;שם&lt;/th&gt;
                        &lt;th&gt;טלפון&lt;/th&gt;
                        &lt;th&gt;אימייל&lt;/th&gt;
                        &lt;th&gt;כתובת&lt;/th&gt;
                        &lt;th&gt;פעולות&lt;/th&gt;
                      &lt;/tr&gt;
                    &lt;/thead&gt;
                    &lt;tbody&gt;
                      &lt;tr *ngFor=&quot;let client of clients&quot;&gt;
                        &lt;td&gt;{{client.name}}&lt;/td&gt;
                        &lt;td&gt;{{client.phone}}&lt;/td&gt;
                        &lt;td&gt;{{client.email}}&lt;/td&gt;
                        &lt;td&gt;{{client.address}}&lt;/td&gt;
                        &lt;td&gt;
                          &lt;button class=&quot;btn btn-sm btn-outline&quot;
(click)=&quot;editClient(client)&quot;&gt;
                            עריכה
                          &lt;/button&gt;
                        &lt;/td&gt;

                      &lt;/tr&gt;
                    &lt;/tbody&gt;
                  &lt;/table&gt;
                  &lt;div *ngIf=&quot;clients.length === 0&quot; class=&quot;no-data&quot;&gt;
                    אין לקוחות במאגר
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;!-- הגדרות --&gt;
          &lt;div *ngIf=&quot;currentTab === &#39;settings&#39;&quot; class=&quot;tab-content&quot;&gt;
            &lt;div class=&quot;card&quot;&gt;
              &lt;div class=&quot;card-header&quot;&gt;
                &lt;h2 class=&quot;card-title&quot;&gt;הגדרות מערכת&lt;/h2&gt;
              &lt;/div&gt;
              &lt;div class=&quot;card-body&quot;&gt;
                &lt;div class=&quot;settings-section&quot;&gt;
                  &lt;h3&gt;הגדרות מע&quot;מ&lt;/h3&gt;
                  &lt;div class=&quot;form-group&quot;&gt;
                    &lt;label for=&quot;defaultVatRate&quot;&gt;אחוז מע&quot;מ ברירת מחדל&lt;/label&gt;
                    &lt;input type=&quot;number&quot; id=&quot;defaultVatRate&quot;
                           [(ngModel)]=&quot;settings.defaultVatRate&quot;
                           step=&quot;0.01&quot; (change)=&quot;saveSettings()&quot;&gt;
                  &lt;/div&gt;
                &lt;/div&gt;

                &lt;div class=&quot;settings-section&quot;&gt;
                  &lt;h3&gt;הגדרות קבלות&lt;/h3&gt;
                  &lt;div class=&quot;form-group&quot;&gt;
                    &lt;label for=&quot;receiptPrefix&quot;&gt;קידומת מספר קבלה&lt;/label&gt;
                    &lt;input type=&quot;text&quot; id=&quot;receiptPrefix&quot;
                           [(ngModel)]=&quot;settings.receiptPrefix&quot;
                           (change)=&quot;saveSettings()&quot;&gt;
                  &lt;/div&gt;
                  &lt;div class=&quot;form-group&quot;&gt;
                    &lt;label for=&quot;nextReceiptNumber&quot;&gt;מספר קבלה הבא&lt;/label&gt;
                    &lt;input type=&quot;number&quot; id=&quot;nextReceiptNumber&quot;
                           [(ngModel)]=&quot;settings.nextReceiptNumber&quot;
                           (change)=&quot;saveSettings()&quot;&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

        &lt;/div&gt;
      &lt;/main&gt;
    &lt;/div&gt;

    &lt;!-- מודל לקוח חדש --&gt;
    &lt;div *ngIf=&quot;showNewClientModal&quot; class=&quot;modal-overlay&quot;
(click)=&quot;closeNewClientModal()&quot;&gt;

      &lt;div class=&quot;modal&quot; (click)=&quot;$event.stopPropagation()&quot;&gt;
        &lt;div class=&quot;modal-header&quot;&gt;
          &lt;h3&gt;לקוח חדש&lt;/h3&gt;
          &lt;button class=&quot;modal-close&quot; (click)=&quot;closeNewClientModal()&quot;&gt;×&lt;/button&gt;
        &lt;/div&gt;
        &lt;div class=&quot;modal-body&quot;&gt;
          &lt;form (ngSubmit)=&quot;saveNewClientFromModal()&quot;
#modalClientForm=&quot;ngForm&quot;&gt;
            &lt;div class=&quot;form-group&quot;&gt;
              &lt;label for=&quot;modalClientName&quot;&gt;שם לקוח&lt;/label&gt;
              &lt;input type=&quot;text&quot; id=&quot;modalClientName&quot;
                     [(ngModel)]=&quot;modalNewClient.name&quot;
                     name=&quot;modalClientName&quot; required&gt;
            &lt;/div&gt;
            &lt;div class=&quot;form-group&quot;&gt;
              &lt;label for=&quot;modalClientPhone&quot;&gt;טלפון&lt;/label&gt;
              &lt;input type=&quot;tel&quot; id=&quot;modalClientPhone&quot;
                     [(ngModel)]=&quot;modalNewClient.phone&quot;
                     name=&quot;modalClientPhone&quot;&gt;
            &lt;/div&gt;
            &lt;div class=&quot;form-group&quot;&gt;
              &lt;label for=&quot;modalClientEmail&quot;&gt;אימייל&lt;/label&gt;
              &lt;input type=&quot;email&quot; id=&quot;modalClientEmail&quot;
                     [(ngModel)]=&quot;modalNewClient.email&quot;
                     name=&quot;modalClientEmail&quot;&gt;
            &lt;/div&gt;
            &lt;div class=&quot;form-group&quot;&gt;

              &lt;label for=&quot;modalClientAddress&quot;&gt;כתובת&lt;/label&gt;
              &lt;textarea id=&quot;modalClientAddress&quot;
[(ngModel)]=&quot;modalNewClient.address&quot;
                        name=&quot;modalClientAddress&quot; rows=&quot;2&quot;&gt;&lt;/textarea&gt;
            &lt;/div&gt;
            &lt;div class=&quot;form-actions&quot;&gt;
              &lt;button type=&quot;submit&quot; class=&quot;btn btn-primary&quot;
[disabled]=&quot;!modalClientForm.form.valid&quot;&gt;
                שמור לקוח
              &lt;/button&gt;
              &lt;button type=&quot;button&quot; class=&quot;btn btn-outline&quot;
(click)=&quot;closeNewClientModal()&quot;&gt;
                ביטול
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/form&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;

    &lt;!-- תבנית PDF מוסתרת --&gt;
    &lt;div id=&quot;receipt-template&quot; class=&quot;receipt-template&quot; style=&quot;display: none;&quot;&gt;
      &lt;div class=&quot;receipt-content&quot;&gt;
        &lt;div class=&quot;receipt-header&quot;&gt;
          &lt;h1&gt;קבלה&lt;/h1&gt;
          &lt;div class=&quot;receipt-number&quot;&gt;מספר:
{{currentReceiptForPDF?.receiptNumber}}&lt;/div&gt;
        &lt;/div&gt;

       
        &lt;div class=&quot;receipt-details&quot;&gt;
          &lt;div class=&quot;detail-row&quot;&gt;
            &lt;span class=&quot;label&quot;&gt;תאריך:&lt;/span&gt;
            &lt;span class=&quot;value&quot;&gt;{{currentReceiptForPDF?.date |
date:&#39;dd/MM/yyyy&#39;}}&lt;/span&gt;
          &lt;/div&gt;
          &lt;div class=&quot;detail-row&quot;&gt;
            &lt;span class=&quot;label&quot;&gt;לקוח:&lt;/span&gt;
            &lt;span class=&quot;value&quot;&gt;{{currentReceiptForPDF?.clientName}}&lt;/span&gt;
          &lt;/div&gt;
          &lt;div class=&quot;detail-row&quot;&gt;
            &lt;span class=&quot;label&quot;&gt;סכום:&lt;/span&gt;
            &lt;span class=&quot;value&quot;&gt;₪{{currentReceiptForPDF?.amount | number:&#39;1.2-
2&#39;}}&lt;/span&gt;
          &lt;/div&gt;
          &lt;div class=&quot;detail-row&quot;&gt;
            &lt;span class=&quot;label&quot;&gt;מע&quot;מ
({{currentReceiptForPDF?.vatRate}}%):&lt;/span&gt;
            &lt;span class=&quot;value&quot;&gt;₪{{currentReceiptForPDF?.vatAmount |
number:&#39;1.2-2&#39;}}&lt;/span&gt;
          &lt;/div&gt;
          &lt;div class=&quot;detail-row total-row&quot;&gt;
            &lt;span class=&quot;label&quot;&gt;סך הכל:&lt;/span&gt;
            &lt;span class=&quot;value&quot;&gt;₪{{currentReceiptForPDF?.totalAmount |
number:&#39;1.2-2&#39;}}&lt;/span&gt;
          &lt;/div&gt;
          &lt;div class=&quot;detail-row&quot;&gt;
            &lt;span class=&quot;label&quot;&gt;אופן תשלום:&lt;/span&gt;

            &lt;span
class=&quot;value&quot;&gt;{{getPaymentMethodName(currentReceiptForPDF?.paymentMeth
od || &#39;&#39;)}}&lt;/span&gt;
          &lt;/div&gt;
         
          &lt;!-- פרטי תשלום נוספים --&gt;
          &lt;div *ngIf=&quot;currentReceiptForPDF?.paymentMethod === &#39;credit&#39; &amp;&amp;
currentReceiptForPDF?.creditDetails&quot; class=&quot;payment-details-section&quot;&gt;
            &lt;h4&gt;פרטי אשראי&lt;/h4&gt;
            &lt;div class=&quot;detail-row&quot;&gt;
              &lt;span class=&quot;label&quot;&gt;4 ספרות אחרונות:&lt;/span&gt;
              &lt;span
class=&quot;value&quot;&gt;****{{currentReceiptForPDF?.creditDetails?.lastFourDigits}}&lt;/span
&gt;
            &lt;/div&gt;
            &lt;div class=&quot;detail-row&quot;&gt;
              &lt;span class=&quot;label&quot;&gt;מספר תשלומים:&lt;/span&gt;
              &lt;span
class=&quot;value&quot;&gt;{{currentReceiptForPDF?.creditDetails?.installments}}&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
         
          &lt;div *ngIf=&quot;currentReceiptForPDF?.paymentMethod === &#39;check&#39; &amp;&amp;
currentReceiptForPDF?.checkDetails&quot; class=&quot;payment-details-section&quot;&gt;
            &lt;h4&gt;פרטי צ&#39;ק&lt;/h4&gt;
            &lt;div class=&quot;detail-row&quot;&gt;
              &lt;span class=&quot;label&quot;&gt;מספר צ&#39;ק:&lt;/span&gt;
              &lt;span
class=&quot;value&quot;&gt;{{currentReceiptForPDF?.checkDetails?.checkNumber}}&lt;/span&gt;
            &lt;/div&gt;

            &lt;div class=&quot;detail-row&quot;&gt;
              &lt;span class=&quot;label&quot;&gt;בנק:&lt;/span&gt;
              &lt;span
class=&quot;value&quot;&gt;{{currentReceiptForPDF?.checkDetails?.bankNumber}}&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class=&quot;detail-row&quot;&gt;
              &lt;span class=&quot;label&quot;&gt;תאריך פירעון:&lt;/span&gt;
              &lt;span class=&quot;value&quot;&gt;{{currentReceiptForPDF?.checkDetails?.dueDate |
date:&#39;dd/MM/yyyy&#39;}}&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
         
          &lt;div *ngIf=&quot;currentReceiptForPDF?.paymentMethod === &#39;transfer&#39; &amp;&amp;
currentReceiptForPDF?.transferDetails&quot; class=&quot;payment-details-section&quot;&gt;
            &lt;h4&gt;פרטי העברה בנקאית&lt;/h4&gt;
            &lt;div class=&quot;detail-row&quot;&gt;
              &lt;span class=&quot;label&quot;&gt;בנק:&lt;/span&gt;
              &lt;span
class=&quot;value&quot;&gt;{{currentReceiptForPDF?.transferDetails?.bankNumber}}&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class=&quot;detail-row&quot;&gt;
              &lt;span class=&quot;label&quot;&gt;תאריך העברה:&lt;/span&gt;
              &lt;span
class=&quot;value&quot;&gt;{{currentReceiptForPDF?.transferDetails?.transferDate |
date:&#39;dd/MM/yyyy&#39;}}&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
         
          &lt;div *ngIf=&quot;currentReceiptForPDF?.details&quot; class=&quot;detail-row&quot;&gt;

            &lt;span class=&quot;label&quot;&gt;פרטים:&lt;/span&gt;
            &lt;span class=&quot;value&quot;&gt;{{currentReceiptForPDF?.details}}&lt;/span&gt;
          &lt;/div&gt;
        &lt;/div&gt;
       
        &lt;div class=&quot;receipt-footer&quot;&gt;
          &lt;div class=&quot;print-date&quot;&gt;תאריך הדפסה: {{currentReceiptForPDF?.printDate |
date:&#39;dd/MM/yyyy HH:mm&#39;}}&lt;/div&gt;
          &lt;div class=&quot;company-info&quot;&gt;
            &lt;div&gt;מערכת הנהלת חשבונות&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  `,
    styles: [`
    .app-layout {
      min-height: 100vh;
      background: var(--gray-50);
    }

    .app-header {
      background: var(--white);
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
    }

    .back-button-fixed {
      position: fixed;
      top: 2rem;
      left: 2rem;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      color: var(--text-color);

      box-shadow: 0 3px 10px rgba(17, 54, 156, 0.3);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .back-button-fixed:hover {
      background: var(--primary-color);
      color: var(--white);
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(15, 43, 119, 0.4);
    }

    .app-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
    }

    .app-icon {
      color: var(--primary-color);
    }

    .nav-menu {

      display: flex;
      gap: 0.5rem;
    }

    .nav-button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      background: var(--white);
      color: var(--gray-700);
      border-radius: var(--border-radius);
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);
    }

    .nav-button:hover {
      background: var(--gray-50);
      border-color: var(--primary-color);
    }

    .nav-button.active {
      background: var(--primary-color);
      color: var(--white);
      border-color: var(--primary-color);
    }

    .main-content {

      padding: 2rem 0;
    }

    .tab-content {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card {
      background: var(--white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0;
    }

    .card-body {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--gray-700);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: 1rem;
      transition: var(--transition);
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(15, 43, 119, 0.1);
    }

    .readonly-input {
      background: var(--gray-100);
      cursor: not-allowed;

    }

    .payment-methods {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .radio-option input[type=&quot;radio&quot;] {
      margin: 0;
    }

    .payment-details {
      background: var(--gray-50);
      padding: 1rem;
      border-radius: var(--border-radius);
      margin-top: 1rem;
    }

    .payment-details h4 {

      margin: 0 0 1rem 0;
      color: var(--gray-800);
    }

    .payment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      gap: 0.5rem;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--white);
      border-color: var(--primary-color);
    }

    .btn-primary:hover {
      background: var(--accent-color);
      border-color: var(--accent-color);
    }

    .btn-primary:disabled {
      background: var(--gray-400);
      border-color: var(--gray-400);
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--gray-600);
      color: var(--white);
      border-color: var(--gray-600);
    }

    .btn-secondary:hover {
      background: var(--gray-700);
      border-color: var(--gray-700);
    }

    .btn-outline {
      background: transparent;
      color: var(--gray-700);
      border-color: var(--border-color);
    }

    .btn-outline:hover {
      background: var(--gray-50);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .search-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: 0.875rem;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem;
      text-align: right;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      background: var(--gray-50);

      font-weight: 600;
      color: var(--gray-800);
    }

    .data-table tbody tr:hover {
      background: var(--gray-50);
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .payment-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .payment-cash {
      background: var(--success-color);
      color: var(--white);
    }

    .payment-credit {
      background: var(--primary-color);

      color: var(--white);
    }

    .payment-check {
      background: var(--warning-color);
      color: var(--white);
    }

    .payment-transfer {
      background: var(--gray-600);
      color: var(--white);
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: var(--gray-500);
    }

    .new-client-form {
      background: var(--gray-50);
      padding: 1.5rem;
      border-radius: var(--border-radius);
      margin-bottom: 2rem;
    }

    .new-client-form h3 {

      margin: 0 0 1rem 0;
      color: var(--gray-800);
    }

    .settings-section {
      margin-bottom: 2rem;
    }

    .settings-section h3 {
      margin: 0 0 1rem 0;
      color: var(--gray-800);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {

      background: var(--white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-xl);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h3 {
      margin: 0;
      color: var(--gray-800);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;

      color: var(--gray-500);
    }

    .modal-close:hover {
      color: var(--gray-800);
    }

    .modal-body {
      padding: 1.5rem;
    }

    /* מערכת הודעות */
    .notifications-container {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .notification {
      background: var(--white);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);

      border-right: 4px solid;
      transform: translateX(-100%);
      opacity: 0;
      transition: all 0.3s ease-in-out;
      cursor: pointer;
    }

    .notification--visible {
      transform: translateX(0);
      opacity: 1;
    }

    .notification--success {
      border-color: var(--success-color);
    }

    .notification--error {
      border-color: var(--danger-color);
    }

    .notification--info {
      border-color: var(--primary-color);
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
      color: var(--primary-color);
    }

    .notification-message {
      flex: 1;
      font-weight: 500;
      color: var(--gray-800);
    }

    .notification-close {

      background: none;
      border: none;
      cursor: pointer;
      color: var(--gray-500);
      padding: 0.25rem;
      border-radius: var(--border-radius);
      transition: var(--transition);
    }

    .notification-close:hover {
      background: var(--gray-100);
      color: var(--gray-800);
    }

    /* סטיילים לקבלה PDF */
    .receipt-template {
      direction: rtl;
      font-family: &#39;Arial&#39;, sans-serif;
    }

    .receipt-content {
      width: 600px;
      margin: 0 auto;
      padding: 40px;
      background: white;
      color: black;
    }

    .receipt-header {
      text-align: center;
      border-bottom: 2px solid #0f2b77;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .receipt-header h1 {
      font-size: 32px;
      margin: 0 0 10px 0;
      color: #0f2b77;
      font-weight: bold;
    }

    .receipt-number {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .receipt-details {
      margin-bottom: 30px;
    }

    .detail-row {
      display: flex;

      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .detail-row .label {
      font-weight: bold;
      color: #333;
      flex: 1;
    }

    .detail-row .value {
      flex: 1;
      text-align: left;
      color: #666;
    }

    .total-row {
      border-top: 2px solid #0f2b77;
      border-bottom: 2px solid #0f2b77;
      background: #f8f9ff;
      padding: 12px 0;
      font-weight: bold;
      font-size: 18px;
    }

    .total-row .label,

    .total-row .value {
      color: #0f2b77;
    }

    .payment-details-section {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9ff;
      border-right: 4px solid #0f2b77;
    }

    .payment-details-section h4 {
      margin: 0 0 10px 0;
      color: #0f2b77;
      font-size: 16px;
    }

    .receipt-footer {
      border-top: 1px solid #ddd;
      padding-top: 20px;
      text-align: center;
    }

    .print-date {
      font-size: 12px;
      color: #999;
      margin-bottom: 10px;

    }

    .company-info {
      font-size: 14px;
      color: #666;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-menu {
        flex-wrap: wrap;
        justify-content: center;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .payment-methods {
        flex-direction: column;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class IncomeComponent implements OnInit {
    currentTab = &#39;newReceipt&#39;;

    // נתוני קבלה חדשה
    newReceipt: Partial&lt;Receipt&gt; = {
        receiptNumber: &#39;&#39;,
        date: new Date().toISOString().split(&#39;T&#39;)[0],
        clientId: &#39;&#39;,
        clientName: &#39;&#39;,
        amount: 0,
        vatRate: 17,
        vatAmount: 0,
        totalAmount: 0,
        paymentMethod: &#39;cash&#39;,
        details: &#39;&#39;,
        printDate: &#39;&#39;
    };

    // פרטי תשלום
    cashDetails = { amount: 0 };
    creditDetails = { lastFourDigits: &#39;&#39;, amount: 0, installments: 1 };
    checkDetails = { checkNumber: &#39;&#39;, accountNumber: &#39;&#39;, bankNumber: &#39;&#39;, amount:
0, dueDate: &#39;&#39; };
    transferDetails = { accountNumber: &#39;&#39;, bankNumber: &#39;&#39;, amount: 0, transferDate:
&#39;&#39; };

    // נתונים
    receipts: Receipt[] = [];
    clients: Client[] = [];
    notifications: Notification[] = [];

    // לקוח חדש
    newClient: Partial&lt;Client&gt; = { name: &#39;&#39;, phone: &#39;&#39;, email: &#39;&#39;, address: &#39;&#39; };
    showNewClientForm = false;

    // מודל לקוח חדש
    showNewClientModal = false;
    modalNewClient: Partial&lt;Client&gt; = { name: &#39;&#39;, phone: &#39;&#39;, email: &#39;&#39;, address: &#39;&#39; };

    // הגדרות
    settings = {
        defaultVatRate: 17,
        receiptPrefix: &#39;R-&#39;,
        nextReceiptNumber: 1001
    };

    // חיפוש וסינון
    searchTerm = &#39;&#39;;

    // קבלה נוכחית ל-PDF
    currentReceiptForPDF: Receipt | null = null;

    constructor(private router: Router) { }

    ngOnInit() {
        this.loadData();
        this.generateReceiptNumber();
    }

    // ניווט לעמוד הראשי
    navigateToHome() {
        this.router.navigate([&#39;/&#39;]);
    }

    // טעינת נתונים
    loadData() {
        // טעינת נתונים מ-localStorage
        const savedReceipts = localStorage.getItem(&#39;bookkeeping_receipts&#39;);
        if (savedReceipts) {
            this.receipts = JSON.parse(savedReceipts);
        }

        const savedClients = localStorage.getItem(&#39;bookkeeping_clients&#39;);
        if (savedClients) {
            this.clients = JSON.parse(savedClients);
        }

        const savedSettings = localStorage.getItem(&#39;bookkeeping_settings&#39;);
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }

        // עדכון שדה מע&quot;מ לפי הגדרות
        this.newReceipt.vatRate = this.settings.defaultVatRate;
    }

    // שמירת נתונים
    saveData() {
        localStorage.setItem(&#39;bookkeeping_receipts&#39;, JSON.stringify(this.receipts));
        localStorage.setItem(&#39;bookkeeping_clients&#39;, JSON.stringify(this.clients));
    }

    saveSettings() {
        localStorage.setItem(&#39;bookkeeping_settings&#39;, JSON.stringify(this.settings));
    }

    // יצירת מספר קבלה
    generateReceiptNumber() {

        this.newReceipt.receiptNumber = this.settings.receiptPrefix +
this.settings.nextReceiptNumber;
    }

    // חישוב סך הכל
    calculateTotal() {
        if (this.newReceipt.amount &amp;&amp; this.newReceipt.vatRate) {
            this.newReceipt.vatAmount = (this.newReceipt.amount *
this.newReceipt.vatRate) / 100;
            this.newReceipt.totalAmount = this.newReceipt.amount +
this.newReceipt.vatAmount;
        } else {
            this.newReceipt.vatAmount = 0;
            this.newReceipt.totalAmount = this.newReceipt.amount || 0;
        }

        // עדכון פרטי התשלום בהתאם לסכום הכולל
        this.updatePaymentDetails();
    }

    // עדכון פרטי התשלום
    updatePaymentDetails() {
        const totalAmount = this.newReceipt.totalAmount || 0;

        // עדכון סכום בכל פרטי התשלום
        this.cashDetails.amount = totalAmount;
        this.creditDetails.amount = totalAmount;
        this.checkDetails.amount = totalAmount;

        this.transferDetails.amount = totalAmount;
    }

    // בחירת לקוח
    onClientChange() {
        if (this.newReceipt.clientId === &#39;new&#39;) {
            this.showNewClientModal = true;
            this.newReceipt.clientId = &#39;&#39;;
        } else {
            const selectedClient = this.clients.find(c =&gt; c.id ===
this.newReceipt.clientId);
            if (selectedClient) {
                this.newReceipt.clientName = selectedClient.name;
            }
        }
    }

    // שמירת קבלה
    saveReceipt() {
        const receipt: Receipt = {
            id: this.generateId(),
            receiptNumber: this.newReceipt.receiptNumber!,
            date: this.newReceipt.date!,
            clientId: this.newReceipt.clientId!,
            clientName: this.newReceipt.clientName!,
            amount: this.newReceipt.amount!,
            vatRate: this.newReceipt.vatRate!,

            vatAmount: this.newReceipt.vatAmount!,
            totalAmount: this.newReceipt.totalAmount!,
            paymentMethod: this.newReceipt.paymentMethod!,
            details: this.newReceipt.details!,
            printDate: new Date().toISOString()
        };

        // הוספת פרטי תשלום לפי הסוג
        switch (receipt.paymentMethod) {
            case &#39;cash&#39;:
                receipt.cashDetails = { ...this.cashDetails };
                break;
            case &#39;credit&#39;:
                receipt.creditDetails = { ...this.creditDetails };
                break;
            case &#39;check&#39;:
                receipt.checkDetails = { ...this.checkDetails };
                break;
            case &#39;transfer&#39;:
                receipt.transferDetails = { ...this.transferDetails };
                break;
        }

        this.receipts.unshift(receipt);
        this.saveData();

        // עדכון מספר קבלה הבא

        this.settings.nextReceiptNumber++;
        this.saveSettings();

        this.showNotification(&#39;הקבלה נשמרה בהצלחה&#39;, &#39;success&#39;);
        this.resetForm();
    }

    // שמירת לקוח
    saveClient() {
        const client: Client = {
            id: this.generateId(),
            name: this.newClient.name!,
            phone: this.newClient.phone,
            email: this.newClient.email,
            address: this.newClient.address,
            created: new Date().toISOString()
        };

        this.clients.push(client);
        this.saveData();
        this.showNotification(&#39;הלקוח נוסף בהצלחה&#39;, &#39;success&#39;);

        this.newClient = { name: &#39;&#39;, phone: &#39;&#39;, email: &#39;&#39;, address: &#39;&#39; };
        this.showNewClientForm = false;
    }

    // שמירת לקוח מהמודל

    saveNewClientFromModal() {
        const client: Client = {
            id: this.generateId(),
            name: this.modalNewClient.name!,
            phone: this.modalNewClient.phone,
            email: this.modalNewClient.email,
            address: this.modalNewClient.address,
            created: new Date().toISOString()
        };

        this.clients.push(client);
        this.saveData();

        // בחירת הלקוח החדש
        this.newReceipt.clientId = client.id;
        this.newReceipt.clientName = client.name;

        this.showNotification(&#39;הלקוח נוסף בהצלחה&#39;, &#39;success&#39;);
        this.closeNewClientModal();
    }

    // סגירת מודל לקוח חדש
    closeNewClientModal() {
        this.showNewClientModal = false;
        this.modalNewClient = { name: &#39;&#39;, phone: &#39;&#39;, email: &#39;&#39;, address: &#39;&#39; };
    }

    // איפוס טופס
    resetForm() {
        this.newReceipt = {
            receiptNumber: &#39;&#39;,
            date: new Date().toISOString().split(&#39;T&#39;)[0],
            clientId: &#39;&#39;,
            clientName: &#39;&#39;,
            amount: 0,
            vatRate: this.settings.defaultVatRate,
            vatAmount: 0,
            totalAmount: 0,
            paymentMethod: &#39;cash&#39;,
            details: &#39;&#39;,
            printDate: &#39;&#39;
        };

        this.cashDetails = { amount: 0 };
        this.creditDetails = { lastFourDigits: &#39;&#39;, amount: 0, installments: 1 };
        this.checkDetails = { checkNumber: &#39;&#39;, accountNumber: &#39;&#39;, bankNumber: &#39;&#39;,
amount: 0, dueDate: &#39;&#39; };
        this.transferDetails = { accountNumber: &#39;&#39;, bankNumber: &#39;&#39;, amount: 0,
transferDate: &#39;&#39; };

        this.generateReceiptNumber();
        this.updatePaymentDetails();
    }

    // יצירת PDF

    generatePDF() {
        if (!this.newReceipt.receiptNumber) {
            this.showNotification(&#39;נא למלא את פרטי הקבלה תחילה&#39;, &#39;error&#39;);
            return;
        }

        // יצירת קבלה זמנית למטרת PDF
        const tempReceipt: Receipt = {
            id: this.generateId(),
            receiptNumber: this.newReceipt.receiptNumber!,
            date: this.newReceipt.date!,
            clientId: this.newReceipt.clientId!,
            clientName: this.newReceipt.clientName!,
            amount: this.newReceipt.amount!,
            vatRate: this.newReceipt.vatRate!,
            vatAmount: this.newReceipt.vatAmount!,
            totalAmount: this.newReceipt.totalAmount!,
            paymentMethod: this.newReceipt.paymentMethod!,
            details: this.newReceipt.details!,
            printDate: new Date().toISOString()
        };

        // הוספת פרטי תשלום
        switch (tempReceipt.paymentMethod) {
            case &#39;cash&#39;:
                tempReceipt.cashDetails = { ...this.cashDetails };
                break;

            case &#39;credit&#39;:
                tempReceipt.creditDetails = { ...this.creditDetails };
                break;
            case &#39;check&#39;:
                tempReceipt.checkDetails = { ...this.checkDetails };
                break;
            case &#39;transfer&#39;:
                tempReceipt.transferDetails = { ...this.transferDetails };
                break;
        }

        this.createPDF(tempReceipt);
    }

    // הורדת PDF לקבלה קיימת
    downloadReceiptPDF(receipt: Receipt) {
        this.createPDF(receipt);
    }

    // יצירת PDF
    private async createPDF(receipt: Receipt) {
        try {
            this.currentReceiptForPDF = receipt;

            // המתנה קצרה לעדכון הDOM
            await new Promise(resolve =&gt; setTimeout(resolve, 100));

            const element = document.getElementById(&#39;receipt-template&#39;);
            if (!element) {
                this.showNotification(&#39;שגיאה ביצירת הקבלה&#39;, &#39;error&#39;);
                return;
            }

            // הצגת האלמנט זמנית
            element.style.display = &#39;block&#39;;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });

            // הסתרת האלמנט בחזרה
            element.style.display = &#39;none&#39;;

            const imgData = canvas.toDataURL(&#39;image/png&#39;);
            const pdf = new jsPDF(&#39;p&#39;, &#39;mm&#39;, &#39;a4&#39;);

            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, &#39;PNG&#39;, 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft &gt;= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, &#39;PNG&#39;, 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `קבלה_${receipt.receiptNumber}_${receipt.date}.pdf`;
            pdf.save(fileName);

            this.showNotification(&#39;הקבלה הורדה בהצלחה&#39;, &#39;success&#39;);

        } catch (error) {
            console.error(&#39;שגיאה ביצירת PDF:&#39;, error);
            this.showNotification(&#39;שגיאה ביצירת הקבלה&#39;, &#39;error&#39;);
        } finally {
            this.currentReceiptForPDF = null;
        }
    }

    // עריכת קבלה
    editReceipt(receipt: Receipt) {
        this.showNotification(&#39; עריכה בפיתוח&#39;, &#39;info&#39;);

    }

    // עריכת לקוח
    editClient(client: Client) {
        this.showNotification(&#39; עריכה בפיתוח&#39;, &#39;info&#39;);
    }

    // קבלות מסוננות
    get filteredReceipts(): Receipt[] {
        if (!this.searchTerm) {
            return this.receipts;
        }

        const term = this.searchTerm.toLowerCase();
        return this.receipts.filter(receipt =&gt; {
            // חיפוש לפי מספר קבלה
            const receiptNumberMatch =
receipt.receiptNumber.toLowerCase().includes(term);
           
            // חיפוש לפי שם לקוח
            const clientNameMatch =
receipt.clientName.toLowerCase().includes(term);
           
            // חיפוש לפי תאריך (בפורמטים שונים)
            const receiptDate = new Date(receipt.date);
            const formattedDate1 = receiptDate.toLocaleDateString(&#39;he-IL&#39;); // פורמט
ישראלי

            const formattedDate2 = receiptDate.toLocaleDateString(&#39;en-GB&#39;); // פורמט
dd/mm/yyyy
            const formattedDate3 = receipt.date; // פורמט ISO (yyyy-mm-dd)
            const dateMatch = formattedDate1.includes(term) ||
                            formattedDate2.includes(term) ||
                            formattedDate3.includes(term);
           
            // חיפוש לפי פרטים
            const detailsMatch = receipt.details.toLowerCase().includes(term);
           
            return receiptNumberMatch || clientNameMatch || dateMatch ||
detailsMatch;
        });
    }

    // שם אופן תשלום
    getPaymentMethodName(method: string): string {
        const methods: { [key: string]: string } = {
            &#39;cash&#39;: &#39;מזומן&#39;,
            &#39;credit&#39;: &#39;אשראי&#39;,
            &#39;check&#39;: &#39;צ\&#39;ק&#39;,
            &#39;transfer&#39;: &#39;העברה&#39;
        };
        return methods[method] || method;
    }

    // יצירת ID ייחודי
    generateId(): string {

        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // הצגת הודעה
    showNotification(message: string, type: &#39;success&#39; | &#39;error&#39; | &#39;info&#39;) {
        const notification: Notification = {
            id: this.generateId(),
            message,
            type,
            visible: false
        };

        this.notifications.push(notification);

        // הצגת ההודעה עם עיכוב קטן
        setTimeout(() =&gt; {
            notification.visible = true;
        }, 100);

        // הסרת ההודעה אחרי 5 שניות
        setTimeout(() =&gt; {
            this.removeNotification(notification.id);
        }, 5000);
    }

    // הסרת הודעה
    removeNotification(id: string) {

        const index = this.notifications.findIndex(n =&gt; n.id === id);
        if (index &gt; -1) {
            this.notifications[index].visible = false;
            setTimeout(() =&gt; {
                this.notifications.splice(index, 1);
            }, 300);
        }
    }
}