import { Component, OnInit } from '@angular/core';
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
        receiptNumber: '',
        date: new Date().toISOString().split('T')[0],
        clientId: '',
        clientName: '',
        amount: 0,
        vatRate: 17,
        vatAmount: 0,
        totalAmount: 0,
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

    constructor(private router: Router) { }

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
        // טעינת נתונים מ-localStorage
        const savedReceipts = localStorage.getItem('bookkeeping_receipts');
        if (savedReceipts) {
            this.receipts = JSON.parse(savedReceipts);
        }

        const savedClients = localStorage.getItem('bookkeeping_clients');
        if (savedClients) {
            this.clients = JSON.parse(savedClients);
        }

        const savedSettings = localStorage.getItem('bookkeeping_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }

        // עדכון שדה מע"מ לפי הגדרות
        this.newReceipt.vatRate = this.settings.defaultVatRate;
    }

    // שמירת נתונים
    saveData() {
        localStorage.setItem('bookkeeping_receipts', JSON.stringify(this.receipts));
        localStorage.setItem('bookkeeping_clients', JSON.stringify(this.clients));
    }

    saveSettings() {
        localStorage.setItem('bookkeeping_settings', JSON.stringify(this.settings));
    }

    // יצירת מספר קבלה
    generateReceiptNumber() {
        this.newReceipt.receiptNumber = this.settings.receiptPrefix + this.settings.nextReceiptNumber;
    }

    // חישוב סך הכל
    calculateTotal() {
        if (this.newReceipt.amount && this.newReceipt.vatRate) {
            this.newReceipt.vatAmount = (this.newReceipt.amount * this.newReceipt.vatRate) / 100;
            this.newReceipt.totalAmount = this.newReceipt.amount + this.newReceipt.vatAmount;
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
        if (this.newReceipt.clientId === 'new') {
            this.showNewClientModal = true;
            this.newReceipt.clientId = '';
        } else {
            const selectedClient = this.clients.find(c => c.id === this.newReceipt.clientId);
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
        this.saveData();

        // עדכון מספר קבלה הבא
        this.settings.nextReceiptNumber++;
        this.saveSettings();

        this.showNotification('הקבלה נשמרה בהצלחה', 'success');
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
        this.showNotification('הלקוח נוסף בהצלחה', 'success');

        this.newClient = { name: '', phone: '', email: '', address: '' };
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

        this.showNotification('הלקוח נוסף בהצלחה', 'success');
        this.closeNewClientModal();
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

        // הסרת ההודעה אחרי 5 שניות
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
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
