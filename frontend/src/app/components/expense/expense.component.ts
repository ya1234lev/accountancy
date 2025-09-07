
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService, Expense } from '../../services/expense.services';
import { SupplierService, Supplier } from '../../services/suppliers';
import { Router } from '@angular/router';

interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
}

@Component({
    selector: 'app-expense',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './expense.component.html',
    styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {
    @ViewChild('pdfFileInput') pdfFileInput!: ElementRef<HTMLInputElement>;
    
    currentTab = 'newExpense';
    //נתוני הוצאה חדשה 
    newExpense: Partial<Expense> = {
        id: '',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        supplierName: '',
        category: '',
        amount: 0,
        vatRate: 17,
        vatAmount: 0,
        totalAmount: 0,
        paymentMethod: 'cash',
        details: '',
        printDate: ''
    };

    expenses: Expense[] = [];
    suppliers: Supplier[] = [];
    showNewSupplierForm = false;
    newSupplier: Partial<Supplier> = { name: '', phone: '', email: '', address: '' };

    categories: string[] = ['ריהוט', 'נקיון', 'קופה קטנה', 'תחזוקה', 'משרד', 'רכב', 'שיווק', 'שירותים מקצועיים', 'ציוד', 'חשמל', 'אחר'];

    // PDF Upload
    isDragOverPdf = false;
    isProcessingPdf = false;
    uploadedFiles: File[] = [];
    parsedExpenseData: any = null;


    // הגדרות
    settings = {
        defaultVatRate: 17,
        expensePrefix: 'E-',
        nextExpenseNumber: 1001
    };

    searchTerm = '';

    constructor(private expenseService: ExpenseService, private supplierService: SupplierService, private router: Router) { }

    notifications: Notification[] = [];
    showNotification(message: string, type: 'success' | 'error' | 'info') {
        const notification: Notification = {
            id: this.generateId(),
            message,
            type,
            visible: false
        };
        this.notifications.push(notification);
        setTimeout(() => {
            notification.visible = true;
        }, 100);
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 2000);
    }

    removeNotification(id: string) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index > -1) {
            this.notifications[index].visible = false;
            setTimeout(() => {
                this.notifications.splice(index, 1);
            }, 300);
        }
    }

    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }




    ngOnInit() {
        this.loadData();
        this.generateExpenseNumber();
    }

    setCurrentTab(tab: string) {
        this.currentTab = tab;
    }

    loadData() {
        // טעינת הגדרות מה-localStorage (אם עדיין נדרש)
        const savedSettings = localStorage.getItem('bookkeeping_expense_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }

        // טעינת ספקים מהשרת
        this.supplierService.getSuppliers().subscribe({
            next: (data) => {
                // this.showNotification('טעינת ספקים מהשרת עברה בהצלחה', 'success')
                this.suppliers = data
                // לאחר טעינת ספקים, טען הוצאות כדי למפות שמות ספקים
                this.loadExpensesAndMapSuppliers();
            },
            error: () => {
                console.log('שגיאה בטעינת ספקים מהשרת');
                this.suppliers = []
                // גם במקרה של שגיאה, טען הוצאות (ללא ספקים)
                this.loadExpensesAndMapSuppliers();
            }
        });

        // עדכון שדה מע"מ לפי הגדרות
        this.newExpense.vatRate = this.settings.defaultVatRate;
    }

    loadExpensesAndMapSuppliers() {
        this.expenseService.getExpenses().subscribe({
            next: (data) => {
                // this.showNotification('טעינת הוצאות מהשרת עברה בהצלחה', 'success');
                
                    this.expenses = (Array.isArray(data) ? data : Object.values(data)).map(expRaw => {
                        const exp = expRaw as any;
                        // Normalize to Expense interface
                        const normalized: Expense = {
                            id: exp.id || '',
                            referenceNumber: exp.referenceNumber || '',
                            date: exp.date || '',
                            supplierId: exp.supplierId || exp.supplier || '',
                            supplierName: '', // will be set below
                            category: exp.category || '',
                            amount: exp.amount || 0,
                            vatRate: exp.vatRate || 0,
                            vatAmount: exp.vatAmount || 0,
                            totalAmount: exp.totalAmount || 0,
                            paymentMethod: exp.paymentMethod || '',
                            details: exp.details || '',
                            printDate: exp.printDate || ''
                        };
                        const supplier = this.suppliers.find(s => String(s.id) === String(normalized.supplierId));
                        normalized.supplierName = supplier ? supplier.name : normalized.supplierId;
                        return normalized;
                    });
                // עדכון nextExpenseNumber לפי referenceNumber האחרון
                if (data && data.length > 0) {
                    const lastExpense = data.reduce((prev, curr) => {
                        const prevNum = Number((prev.referenceNumber || '').replace(/\D/g, ''));
                        const currNum = Number((curr.referenceNumber || '').replace(/\D/g, ''));
                        return currNum > prevNum ? curr : prev;
                    });
                    const lastNum = Number((lastExpense.referenceNumber || '').replace(/\D/g, ''));
                    this.settings.nextExpenseNumber = lastNum + 1;
                } else {
                    this.settings.nextExpenseNumber = 1001;
                }
                this.generateExpenseNumber();
            },
            error: () => {
                console.log('שגיאה בטעינת הוצאות מהשרת');
                this.expenses = [];
                this.settings.nextExpenseNumber = 1001;
                this.generateExpenseNumber();
            }
        });

        // עדכון שדה מע"מ לפי הגדרות
        this.newExpense.vatRate = this.settings.defaultVatRate;
    }

    saveSettings() {
        localStorage.setItem('bookkeeping_expense_settings', JSON.stringify(this.settings));
        // עדכון שדה מע"מ בטופס ההכנסה בכל שינוי הגדרה
        this.newExpense.vatRate = this.settings.defaultVatRate;
    }

    generateExpenseNumber() {
        this.newExpense.referenceNumber = this.settings.expensePrefix + this.settings.nextExpenseNumber;
    }

    loadSuppliers() {
        this.supplierService.getSuppliers().subscribe({
            next: (data) => this.suppliers = data,
            error: () => this.suppliers = []
        });
    }


    saveExpense() {

        // const supplier = this.suppliers.find(s => s.id === this.newExpense.supplierId);

        // if (supplier) {
        //     this.newExpense.supplierName = supplier.name;
        // }
        const expense = this.mapExpense(this.newExpense);

        this.expenseService.addExpense(expense).subscribe({
            next: () => {
                this.settings.nextExpenseNumber++;
                this.saveSettings();
                this.showNotification(' ההוצאה נוספה בהצלחה לשרת', 'success');
                this.loadData();
                this.resetForm();
            },
            error: (err: any) => {
                console.log("error", err);

                this.showNotification('שגיאה בהוספת הוצאה לשרת', 'error');
            }


        });
    }

    resetForm() {
        this.newExpense = {
            referenceNumber: '',
            date: new Date().toISOString().split('T')[0],
            supplierId: '',
            supplierName: '',
            category: '',
            amount: 0,
            vatRate: 17,
            vatAmount: 0,
            totalAmount: 0,
            paymentMethod: 'cash',
            details: '',
            printDate: ''
        };
    }

    saveSupplier() {
        if (!this.newSupplier.id) {
            this.newSupplier.id = String(this.generateSupplierNumber());
        }

        this.supplierService.addSupplier(this.newSupplier).subscribe({
            next: () => {
                this.showNotification('הספק נוסף לשרת בהצלחה', 'success')

                this.loadSuppliers();
                this.showNewSupplierForm = false;
                this.newSupplier = { name: '', phone: '', email: '', address: '' };
            },
            error: (err: any) => {
                console.log("error", err);
                this.showNotification('שגיאה בהוספת ספק לשרת', 'error');

            }

        });
    }
    
    mapExpense(expense: Partial<Expense>): any {
        // ממיר אובייקט הוצאה מה-UI לאובייקט תואם סכמת השרת (IExpense)
        
        return {
            id: this.generateId(),
            referenceNumber: expense.referenceNumber,
            date: expense.date,
            supplier: expense.supplierId, // בהנחה שזה ObjectId או מחרוזת מזהה
            category: expense.category,
            amount: expense.amount,
            vat: expense.vatRate, // שדה ה-vat בשרת הוא סכום המע"M
            paymentMethod: expense.paymentMethod,
            details: expense.details,
            // attachment: expense.attachment, // אם יש תמיכה בקבצים
        };
    }
    generateSupplierNumber() {
        // מחפש את ה-id הגבוה ביותר במערך הלקוחות ומחזיר את הבא בתור
        const maxId = this.suppliers
            .map(s => Number(s.id))
            .filter(n => !isNaN(n))
            .reduce((max, curr) => curr > max ? curr : max, 0);
        return maxId + 1;

    }
    getPaymentMethodName(method: string): string {
        const methods: { [key: string]: string } = {
            'cash': 'מזומן',
            'credit': 'אשראי',
            'check': 'צ\'ק',
            'transfer': 'העברה'
        };
        return methods[method] || method;
    }

    editExpense(expense: Expense) {
        this.showNotification(' עריכה בפיתוח', 'info');
    }
    editSupplier(supplier: Supplier) {
        this.showNotification(' עריכה בפיתוח', 'info');
    }

    onSupplierChange() {
        if (this.newExpense.supplierId === 'new') {
            this.showNewSupplierForm = true;
            this.newExpense.supplierId = '';
        } else {
            const selectedSupplier = this.suppliers.find(c => c.id == this.newExpense.supplierId);
            if (selectedSupplier) {
                this.newExpense.supplierName = selectedSupplier.name;
                // הדפסת כל האובייקט לקונסול
                console.log('selectedSupplier:', selectedSupplier);
                // הדפסת מזהה הלקוח לקונסול (גם אם הוא מספר או מחרוזת)
                console.log('נבחר לקוח עם מזהה:', selectedSupplier.id, 'typeof:', typeof selectedSupplier.id);
                this.newExpense.supplierId = selectedSupplier.id;
            } else {

                console.log('לא נמצא לקוח מתאים עבור clientId:', this.newExpense.supplierId);
            }
        }
    }

    // PDF Upload Functions
    triggerPdfFileInput(): void {
        this.pdfFileInput.nativeElement.click();
    }

    onPdfDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOverPdf = true;
    }

    onPdfDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOverPdf = false;
    }

    onPdfDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOverPdf = false;
        
        const files = Array.from(event.dataTransfer?.files || []);
        this.handlePdfFiles(files);
    }

    onPdfFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const files = Array.from(input.files);
            this.handlePdfFiles(files);
        }
    }

    handlePdfFiles(files: File[]): void {
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            this.showNotification('נא לבחור קבצי PDF בלבד', 'error');
            return;
        }

        if (pdfFiles.length > 5) {
            this.showNotification('ניתן להעלות עד 5 קבצים בו-זמנית', 'error');
            return;
        }

        this.uploadedFiles = pdfFiles;
        this.uploadPdfFiles(pdfFiles);
    }

    async uploadPdfFiles(files: File[]): Promise<void> {
        this.isProcessingPdf = true;
        
        try {
            // בדיקת מספר הקבצים
            if (files.length > 10) {
                this.showNotification('ניתן להעלות מקסימום 10 קבצי PDF בו זמנית', 'error');
                return;
            }

            // הכנת FormData עם כל הקבצים
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('pdfFiles', file);
            });

            this.showNotification(`מעבד ${files.length} קבצי PDF...`, 'info');

            // שימוש ב-API החדש שמשמר ישירות
            const response = await this.expenseService.uploadMultiplePdfs(formData);
            
            if (response.success) {
                const { successfullyProcessed, errorsCount } = response.data;
                
                if (successfullyProcessed > 0) {
                    this.showNotification(
                        `הצלחה! נוצרו ${successfullyProcessed} הוצאות חדשות מתוך ${files.length} קבצים`,
                        'success'
                    );
                    
                    // רענון רשימת ההוצאות כדי להציג את החדשות
                    this.loadExpensesAndMapSuppliers();
                }
                
                if (errorsCount > 0) {
                    this.showNotification(
                        `${errorsCount} קבצים לא עובדו בהצלחה`,
                        'error'
                    );
                }

                // הצגת פרטים מפורטים בקונסול
                console.log('תוצאות עיבוד קבצי PDF:', response.data);
                
            } else {
                this.showNotification('שגיאה בעיבוד קבצי PDF', 'error');
            }
            
        } catch (error) {
            console.error('Error uploading PDF files:', error);
            this.showNotification('שגיאה בהעלאת קבצי PDF', 'error');
        } finally {
            this.isProcessingPdf = false;
        }
    }

    calculateAmountFromTotal(): void {
        if (this.newExpense.totalAmount && this.newExpense.vatRate) {
            // חישוב סכום לפני מע"מ מהסכום הכולל
            const vatMultiplier = 1 + (this.newExpense.vatRate / 100);
            this.newExpense.amount = this.newExpense.totalAmount / vatMultiplier;
            this.newExpense.vatAmount = this.newExpense.totalAmount - this.newExpense.amount;
        }
    }

    removePdfFile(index: number): void {
        this.uploadedFiles.splice(index, 1);
    }

    clearAllPdfFiles(): void {
        this.uploadedFiles = [];
        this.parsedExpenseData = null;
    }

    // הוצאות מסוננות
    get filteredExpenses(): any[] {
        if (!this.searchTerm) {
            return this.expenses;
        }

        const term = this.searchTerm.toLowerCase();
        return this.expenses.filter(expense => {
            // חיפוש לפי מספר הוצאה/אסמכתא
            const referenceNumberMatch = expense.referenceNumber?.toLowerCase().includes(term);

            // חיפוש לפי שם ספק
            const supplierNameMatch = expense.supplierName?.toLowerCase().includes(term);

            // חיפוש לפי תאריך (בפורמטים שונים)
            const expenseDate = new Date(expense.date);
            const formattedDate1 = expenseDate.toLocaleDateString('he-IL'); // פורמט ישראלי
            const formattedDate2 = expenseDate.toLocaleDateString('en-GB'); // פורמט dd/mm/yyyy
            const formattedDate3 = expense.date; // פורמט ISO (yyyy-mm-dd)
            const dateMatch = formattedDate1.includes(term) ||
                formattedDate2.includes(term) ||
                formattedDate3.includes(term);

            // חיפוש לפי קטגוריה
            const categoryMatch = expense.category?.toLowerCase().includes(term);

            // חיפוש לפי פרטים
            const detailsMatch = expense.details?.toLowerCase().includes(term);

            // חיפוש לפי סכום
            const amountMatch = expense.amount?.toString().includes(term) ||
                expense.totalAmount?.toString().includes(term);

            return referenceNumberMatch || supplierNameMatch || dateMatch || 
                   categoryMatch || detailsMatch || amountMatch;
        });
    }

    // ניווט לעמוד הראשי
    navigateToHome() {
        this.router.navigate(['/']);
    }
}
