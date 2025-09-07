import { Component, OnInit } from '@angular/core';
import { CustomerService } from '../../services/customers';
import { Income, IncomeService } from '../../services/income.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    paymentMethod: 'cash' | 'credit' | 'check' | 'transfer';
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
    type: 'success' | 'error' | 'info';
    visible: boolean;
}

@Component({
    selector: 'app-income',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './income.component.html',
    styleUrls: ['./income.component.css']
})
export class IncomeComponent implements OnInit {
    currentTab = 'newReceipt';

    // נתוני קבלה חדשה
    newReceipt: Partial<Receipt> = {
        receiptNumber: '', //
        date: new Date().toISOString().split('T')[0],
        clientId: '',
        clientName: '',
        amount: 0,// סכום סופי
        vatRate: 17, //מע"מ
        vatAmount: 0,//חישוב המע"מ מתוך ה 
        totalAmount: 0,//סכום כולל מע"מ
        paymentMethod: 'cash',
        details: '',
        printDate: ''
    };

    // פרטי תשלום
    cashDetails = { amount: 0 };
    creditDetails = { lastFourDigits: '', amount: 0, installments: 1 };
    checkDetails = { checkNumber: '', accountNumber: '', bankNumber: '', amount: 0, dueDate: '' };
    transferDetails = { accountNumber: '', bankNumber: '', amount: 0, transferDate: '' };

    // נתונים
    receipts: Receipt[] = [];
    clients: Client[] = [];
    notifications: Notification[] = [];

    // לקוח חדש
    newClient: Partial<Client> = { name: '', phone: '', email: '', address: '' };
    showNewClientForm = false;

    // מודל לקוח חדש
    showNewClientModal = false;
    modalNewClient: Partial<Client> = { name: '', phone: '', email: '', address: '' };

    // הגדרות
    settings = {
        defaultVatRate: 17,
        receiptPrefix: 'R-',
        nextReceiptNumber: 1001
    };

    // חיפוש וסינון
    searchTerm = '';

    // קבלה נוכחית ל-PDF
    currentReceiptForPDF: Receipt | null = null;

    constructor(private router: Router, private customerService: CustomerService, private incomeService: IncomeService) { }

    ngOnInit() {
        this.loadData();
        this.generateReceiptNumber();
    }

    // ניווט לעמוד הראשי
    navigateToHome() {
        this.router.navigate(['/']);
    }

    // עדכון כרטיסיה נוכחית
    setCurrentTab(tab: string) {
        this.currentTab = tab;
    }

    // טעינת נתונים
    loadData() {
        // טעינת לקוחות מהשרת תחילה, ואז קבלות
        this.customerService.getCustomers().subscribe({
            next: (data) => {
                this.clients = data;
                // this.showNotification('טעינת לקוחות מהשרת עברה בהצלחה', 'success');

                // רק אחרי שהלקוחות נטענו, טען קבלות
                this.incomeService.getIncomes().subscribe({
                    next: (data) => {
                        this.receipts = data.map((income: any) => {
                            let clientId = income.customer?.id || income.customer || '';
                            let clientName = '';
                            if (typeof clientId === 'number' || (!isNaN(Number(clientId)) && clientId !== '')) {
                                const foundClient = this.clients.find(c => String(c.id) === String(clientId));
                                clientName = foundClient ? foundClient.name : '';
                            } else {
                                clientName = income.customer?.name || '';
                            }
                            return {
                                id: income.id || income._id || '',
                                receiptNumber: income.receiptNumber || '',
                                date: income.date || '',
                                clientId,
                                clientName,
                                amount: income.amount || 0,
                                vatRate: income.vatRate || 17,
                                vatAmount: income.vat || 0,
                                totalAmount: (income.amount || 0) + (income.vat || 0),
                                paymentMethod: income.payment?.method || 'cash',
                                details: income.details || '',
                                printDate: income.receiptPrintedDate || '',
                            };
                        });
                        // עדכון nextReceiptNumber לפי receiptNumber האחרון
                        if (this.receipts && this.receipts.length > 0) {
                            const lastReceipt = this.receipts.reduce((prev, curr) => {
                                const prevNum = Number((prev.receiptNumber || '').replace(/\D/g, ''));
                                const currNum = Number((curr.receiptNumber || '').replace(/\D/g, ''));
                                return currNum > prevNum ? curr : prev;
                            });
                            const lastNum = Number((lastReceipt.receiptNumber || '').replace(/\D/g, ''));
                            this.settings.nextReceiptNumber = lastNum + 1;
                        } else {
                            this.settings.nextReceiptNumber = 1001;
                        }
                        this.generateReceiptNumber();
                        // this.showNotification('טעינת קבלות מהשרת עברה בהצלחה', 'success');
                    },
                    error: () => {
                        console.log('שגיאה בטעינת קבלות מהשרת');
                        this.receipts = [];
                        this.settings.nextReceiptNumber = 1001;
                        this.generateReceiptNumber();
                    }
                });
            },
            error: (err) => {
                console.log('שגיאה בטעינת לקוחות מהשרת', err);
                this.clients = [];
            }
        });

        // טעינת הגדרות מה-localStorage (אם עדיין נדרש)
        const savedSettings = localStorage.getItem('bookkeeping_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }


        // עדכון שדה מע"מ לפי הגדרות
        this.newReceipt.vatRate = this.settings.defaultVatRate;
    }


    saveSettings() {
        localStorage.setItem('bookkeeping_income_settings', JSON.stringify(this.settings));
        // עדכון שדה מע"מ בטופס ההכנסה בכל שינוי הגדרה
        this.newReceipt.vatRate = this.settings.defaultVatRate;
        this.calculateTotal();
    }

    // יצירת מספר קבלה
    generateReceiptNumber() {
        this.newReceipt.receiptNumber = this.settings.receiptPrefix + this.settings.nextReceiptNumber;
    }
 // חישוב סך הכל
    calculateTotal() {
        if (this.newReceipt.totalAmount && this.newReceipt.vatRate) {
            // אם יש מע"מ - חישוב הסכום הבסיסי מתוך הסכום הכולל
            this.newReceipt.amount = this.newReceipt.totalAmount / (1 + this.newReceipt.vatRate / 100);
            this.newReceipt.vatAmount = this.newReceipt.totalAmount - this.newReceipt.amount;
        } else {
            // אם אין מע"מ - הסכום הבסיסי שווה לסכום הכולל
            this.newReceipt.amount = this.newReceipt.totalAmount || 0;
            this.newReceipt.vatAmount = 0;
        }

        // עדכון פרטי התשלום בהתאם לסכום הכולל
        this.updatePaymentDetails();
    }

    // פונקציה לחישוב הסכום המוצג בשדה "סך הכל"
    getCalculatedAmount(): number {
        if (!this.newReceipt.totalAmount) return 0;
        
        if ((this.newReceipt.vatRate || 0) > 0) {
            // אם יש מע"מ - מציג את הסכום הכולל
            return this.newReceipt.totalAmount;
        } else {
            // אם אין מע"מ - מחשב את הסכום ללא מע"מ
            return this.newReceipt.totalAmount / (1 + (this.settings.defaultVatRate || 0) / 100);
        }
    }

    // עדכון פרטי התשלום
    updatePaymentDetails() {
        const calculatedAmount = this.getCalculatedAmount();

        // עדכון סכום בכל פרטי התשלום לפי הסכום החישובי
        this.cashDetails.amount = calculatedAmount;
        this.creditDetails.amount = calculatedAmount;
        this.checkDetails.amount = calculatedAmount;
        this.transferDetails.amount = calculatedAmount;
    }

    // בדיקת תקינות תאריך פירעון
    isValidDueDate(): boolean {
        if (this.newReceipt.paymentMethod !== 'check' || !this.checkDetails.dueDate || !this.newReceipt.date) {
            return true; // אם לא צ'ק או אין תאריך פירעון או תאריך קבלה, הבדיקה עוברת
        }
        
        const receiptDate = new Date(this.newReceipt.date);
        const dueDate = new Date(this.checkDetails.dueDate);
        
        return dueDate > receiptDate;
    }

    // בחירת לקוח
    onClientChange() {
        if (this.newReceipt.clientId === 'new') {
            this.showNewClientModal = true;
            this.newReceipt.clientId = '';
        } else {
            const selectedClient = this.clients.find(c => c.id == this.newReceipt.clientId);
            if (selectedClient) {
                this.newReceipt.clientName = selectedClient.name;
                // הדפסת כל האובייקט לקונסול
                console.log('selectedClient:', selectedClient);
                // הדפסת מזהה הלקוח לקונסול (גם אם הוא מספר או מחרוזת)
                console.log('נבחר לקוח עם מזהה:', selectedClient.id, 'typeof:', typeof selectedClient.id);
                this.newReceipt.clientId = selectedClient.id;
            } else {

                console.log('לא נמצא לקוח מתאים עבור clientId:', this.newReceipt.clientId);
            }
        }
    }


    // שמירת קבלה
    saveReceipt() {
        // בדיקת תקינות תאריך פירעון
        if (!this.isValidDueDate()) {
            this.showNotification('תאריך הפירעון חייב להיות לאחר תאריך הקבלה', 'error');
            return;
        }

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
            case 'cash':
                receipt.cashDetails = { ...this.cashDetails };
                break;
            case 'credit':
                receipt.creditDetails = { ...this.creditDetails };
                break;
            case 'check':
                receipt.checkDetails = { ...this.checkDetails };
                break;
            case 'transfer':
                receipt.transferDetails = { ...this.transferDetails };
                break;
        }

        this.receipts.unshift(receipt);

        // עדכון מספר קבלה הבא
        this.settings.nextReceiptNumber++;
        this.saveSettings();
        this.addIncome(receipt)
        this.resetForm();
    }

    // שמירת לקוח
    saveClient() {
        // הוספת id ייחודי ללקוח אם אין (מספר עולה)
        if (!this.newClient.id) {
            this.newClient.id = String(this.generateClientId());
        }
        this.customerService.addCustomer(this.newClient).subscribe({
            next: (createdClient) => {
                console.log('הלקוח נוסף בהצלחה');
                this.newClient = { name: '', phone: '', email: '', address: '' };
                this.showNewClientForm = false;
                this.loadData(); // רענון רשימת הלקוחות
            },
            error: (err) => {
                console.log('שגיאה בהוספת לקוח', err);
            }
        });
    }

    // שמירת לקוח מהמודל
    saveNewClientFromModal() {
        // הוספת id ייחודי ללקוח אם אין (מספר עולה)
        if (!this.modalNewClient.id) {
            this.modalNewClient.id = String(this.generateClientId());
        }
        this.customerService.addCustomer(this.modalNewClient).subscribe({
            next: (createdClient) => {
                this.showNotification('הלקוח נוסף בהצלחה', 'success');
                this.closeNewClientModal();
                this.loadData(); // רענון רשימת הלקוחות
                // בחירת הלקוח החדש בטופס
                if (createdClient && createdClient.id) {
                    this.newReceipt.clientId = createdClient.id;
                    this.newReceipt.clientName = createdClient.name;
                }
            },
            error: (err) => {
                this.showNotification('שגיאה בהוספת לקוח', 'error');
            }
        });
    }

    // סגירת מודל לקוח חדש
    closeNewClientModal() {
        this.showNewClientModal = false;
        this.modalNewClient = { name: '', phone: '', email: '', address: '' };
    }

    // איפוס טופס
    resetForm() {
        this.newReceipt = {
            receiptNumber: '',
            date: new Date().toISOString().split('T')[0],
            clientId: '',
            clientName: '',
            amount: 0,
            vatRate: this.settings.defaultVatRate,
            vatAmount: 0,
            totalAmount: 0,
            paymentMethod: 'cash',
            details: '',
            printDate: ''
        };

        this.cashDetails = { amount: 0 };
        this.creditDetails = { lastFourDigits: '', amount: 0, installments: 1 };
        this.checkDetails = { checkNumber: '', accountNumber: '', bankNumber: '', amount: 0, dueDate: '' };
        this.transferDetails = { accountNumber: '', bankNumber: '', amount: 0, transferDate: '' };

        this.generateReceiptNumber();
        this.updatePaymentDetails();
    }

    // יצירת PDF
    generatePDF() {
        if (!this.newReceipt.receiptNumber) {
            this.showNotification('נא למלא את פרטי הקבלה תחילה', 'error');
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
            case 'cash':
                tempReceipt.cashDetails = { ...this.cashDetails };
                break;
            case 'credit':
                tempReceipt.creditDetails = { ...this.creditDetails };
                break;
            case 'check':
                tempReceipt.checkDetails = { ...this.checkDetails };
                break;
            case 'transfer':
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
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = document.getElementById('receipt-template');
            if (!element) {
                this.showNotification('שגיאה ביצירת הקבלה', 'error');
                return;
            }

            // הצגת האלמנט זמנית
            element.style.display = 'block';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });

            // הסתרת האלמנט בחזרה
            element.style.display = 'none';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `קבלה_${receipt.receiptNumber}_${receipt.date}.pdf`;
            pdf.save(fileName);

            this.showNotification('הקבלה הורדה בהצלחה', 'success');

        } catch (error) {
            console.error('שגיאה ביצירת PDF:', error);
            this.showNotification('שגיאה ביצירת הקבלה', 'error');
        } finally {
            this.currentReceiptForPDF = null;
        }
    }


    // המרת Receipt לאובייקט Income בפורמט השרת
    // פונקציה לחישוב סכום מחושב עבור קבלה כלשהי
    private getCalculatedAmountForReceipt(receipt: Receipt): number {
        if (!receipt.totalAmount) return 0;
        
        if ((receipt.vatRate || 0) > 0) {
            // אם יש מע"מ - מציג את הסכום הכולל
            return receipt.totalAmount;
        } else {
            // אם אין מע"מ - מחשב את הסכום ללא מע"מ
            return receipt.totalAmount / (1 + (this.settings.defaultVatRate || 0) / 100);
        }
    }

    private mapReceiptToIncome(receipt: Receipt): any {
        // המרת clientId למספר מזהה (אם אפשרי)
        let customerId: Number | null = null;
        if (receipt.clientId) {
            const client = this.clients.find(c => c.id === receipt.clientId);
            if (client && !isNaN(Number(client.id))) {
                customerId = Number(client.id);

            }
        }

        // בניית אובייקט payment לפי סוג התשלום
        let payment: any = { method: receipt.paymentMethod, amount: receipt.amount };
        if (receipt.paymentMethod === 'cash' && receipt.cashDetails) {
            payment.amount = receipt.cashDetails.amount;
        } else if (receipt.paymentMethod === 'credit' && receipt.creditDetails) {
            payment.creditCard = {
                last4Digits: receipt.creditDetails.lastFourDigits,
                installments: receipt.creditDetails.installments
            };
            payment.amount = receipt.creditDetails.amount;
        } else if (receipt.paymentMethod === 'check' && receipt.checkDetails) {
            payment.check = {
                checkNumber: receipt.checkDetails.checkNumber,
                accountNumber: receipt.checkDetails.accountNumber,
                bankNumber: receipt.checkDetails.bankNumber,
                dueDate: receipt.checkDetails.dueDate
            };
            payment.amount = receipt.checkDetails.amount;
        } else if (receipt.paymentMethod === 'transfer' && receipt.transferDetails) {
            payment.transfer = {
                referenceNumber: '', // אם יש שדה כזה
                accountNumber: receipt.transferDetails.accountNumber,
                bankNumber: receipt.transferDetails.bankNumber
            };
            payment.amount = receipt.transferDetails.amount;
        }

        return {
            receiptNumber: receipt.receiptNumber,
            date: receipt.date,
            customer: customerId,
            amount: this.getCalculatedAmountForReceipt(receipt),
            vat: receipt.vatAmount,
            payment,
            details: receipt.details,
            receiptPrintedDate: receipt.printDate
        };
    }

    addIncome(receipt: Receipt) {
        const income = this.mapReceiptToIncome(receipt);

        this.incomeService.addIncome(income).subscribe({
            next: (createdIncome: any) => {
                this.showNotification(' ההכנסה נוספה בהצלחה לשרת', 'success');
                this.loadData(); // רענון רשימת הקבלות
            },
            error: (err: any) => {
                console.log("error", err);

                this.showNotification('שגיאה בהוספת הכנסה לשרת', 'error');
            }
        });
    }

    // עריכת קבלה
    editReceipt(receipt: Receipt) {
        this.showNotification(' עריכה בפיתוח', 'info');
    }

    // עריכת לקוח
    editClient(client: Client) {
        this.showNotification(' עריכה בפיתוח', 'info');
    }

    // קבלות מסוננות
    get filteredReceipts(): Receipt[] {
        if (!this.searchTerm) {
            return this.receipts;
        }

        const term = this.searchTerm.toLowerCase();
        return this.receipts.filter(receipt => {
            // חיפוש לפי מספר קבלה
            const receiptNumberMatch = receipt.receiptNumber.toLowerCase().includes(term);

            // חיפוש לפי שם לקוח
            const clientNameMatch = receipt.clientName.toLowerCase().includes(term);

            // חיפוש לפי תאריך (בפורמטים שונים)
            const receiptDate = new Date(receipt.date);
            const formattedDate1 = receiptDate.toLocaleDateString('he-IL'); // פורמט ישראלי
            const formattedDate2 = receiptDate.toLocaleDateString('en-GB'); // פורמט dd/mm/yyyy
            const formattedDate3 = receipt.date; // פורמט ISO (yyyy-mm-dd)
            const dateMatch = formattedDate1.includes(term) ||
                formattedDate2.includes(term) ||
                formattedDate3.includes(term);

            // חיפוש לפי פרטים
            const detailsMatch = receipt.details.toLowerCase().includes(term);

            return receiptNumberMatch || clientNameMatch || dateMatch || detailsMatch;
        });
    }

    // שם אופן תשלום
    getPaymentMethodName(method: string): string {
        const methods: { [key: string]: string } = {
            'cash': 'מזומן',
            'credit': 'אשראי',
            'check': 'צ\'ק',
            'transfer': 'העברה'
        };
        return methods[method] || method;
    }

    // יצירת ID ייחודי
    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    generateClientId(): number {
        // מחפש את ה-id הגבוה ביותר במערך הלקוחות ומחזיר את הבא בתור
        const maxId = this.clients
            .map(c => Number(c.id))
            .filter(n => !isNaN(n))
            .reduce((max, curr) => curr > max ? curr : max, 0);
        return maxId + 1;
    }


    // הצגת הודעה
    showNotification(message: string, type: 'success' | 'error' | 'info') {
        const notification: Notification = {
            id: this.generateId(),
            message,
            type,
            visible: false
        };

        this.notifications.push(notification);

        // הצגת ההודעה עם עיכוב קטן
        setTimeout(() => {
            notification.visible = true;
        }, 100);

        // הסרת ההודעה אחרי 2 שניות
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 2000);
    }

    // הסרת הודעה
    removeNotification(id: string) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index > -1) {
            this.notifications[index].visible = false;
            setTimeout(() => {
                this.notifications.splice(index, 1);
            }, 300);
        }
    }
}
