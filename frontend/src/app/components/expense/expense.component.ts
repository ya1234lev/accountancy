
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
        }, 5000);
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
        const noPdfFiles = files.filter(file => file.type !== 'application/pdf');
        
        if (pdfFiles.length === 0) {
            this.showNotification('נא לבחור קבצי PDF בלבד', 'error');
            return;
        }

        if (pdfFiles.length > 5) {
            this.showNotification('ניתן להעלות עד 5 קבצים בו-זמנית', 'error');
            return;
        }
         if (noPdfFiles.length > 0) {
            this.showNotification(`${noPdfFiles.length} מהקבצים שנבחרו אינם קבצי PDF. ניתן להעלות קבצי PDF בלבד`, 'error');
        }

        this.uploadedFiles = pdfFiles;
        this.uploadPdfFiles(pdfFiles);
    }

    async uploadPdfFiles(files: File[]): Promise<void> {
        this.isProcessingPdf = true;
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            for (const file of files) {                
                try {
                    await this.processPdfFile(file);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error('שגיאה בעיבוד קובץ:', file.name, error);
                    this.showNotification(`שגיאה בעיבוד קובץ: ${file.name}`, 'error');
                }
            }
            
            // הצגת הודעת סיכום
            if (successCount > 0 && errorCount === 0) {
                this.showNotification(`${successCount} קבצים עובדו בהצלחה`, 'success');
            } else if (successCount > 0 && errorCount > 0) {
                this.showNotification(`עובדו ${successCount} קבצים בהצלחה, ${errorCount} קבצים נכשלו`, 'info');
            } else if (errorCount > 0 && successCount === 0) {
                this.showNotification('כל הקבצים נכשלו בעיבוד', 'error');
            }
        } catch (error) {
            console.error('שגיאה כללית בעיבוד קבצי PDF:', error);
            this.showNotification('שגיאה כללית בעיבוד קבצי PDF', 'error');
        } finally {
            this.isProcessingPdf = false;
        }
    }

    async processPdfFile(file: File): Promise<void> {
        console.log('📁 מעבד קובץ:', file.name, 'גודל:', file.size);
        
        console.log('🚀 שולח בקשה לשרת...');
        
        try {
            // קריאה לשרת דרך השירות
            const result = await this.expenseService.uploadPdf(file).toPromise();
            
            console.log('📦 תוצאה מהשרת:', result);
            
            if (!result.success) {
                console.error('❌ השרת החזיר שגיאה:', result.message);
                throw new Error(result.message || 'שגיאה בעיבוד הקובץ');
            }
            
            // עיבוד הנתונים שהתקבלו מהקובץ
            if (result.data) {
                console.log('✅ מעבד נתונים שחולצו...');
                this.fillExpenseFormFromPdf(result.data, file.name);
            }
        } catch (error: any) {
            console.error('❌ שגיאה בהעלאת הקובץ:', error);
            
            if (error.status) {
                throw new Error(`שגיאה בהעלאת הקובץ לשרת: ${error.status} ${error.statusText || ''}`);
            } else {
                throw new Error(error.message || 'שגיאה בהעלאת הקובץ');
            }
        }
    }

    fillExpenseFormFromPdf(pdfData: any, fileName: string): void {
        console.log('🔄 מעבד נתונים מ-PDF:', pdfData);
        
        // השרת עכשיו מחזיר נתונים מובנים יותר
        const extractedData = pdfData.extractedData || {};        
        // מילוי תאריך
        if (extractedData.date) {
            console.log("extractedData.date",extractedData.date);
            
            this.newExpense.date = extractedData.date;
            console.log('📅 תאריך עודכן:', extractedData.date);
        }
        
        // מילוי סכום
        if (extractedData.amount && extractedData.amount > 0) {
            this.newExpense.totalAmount = extractedData.amount;
            this.calculateAmountFromTotal();
            console.log('💰 סכום עודכן:', extractedData.amount);
        }
        
        // מילוי מספר אסמכתא
        if (extractedData.documentNumber) {
            this.newExpense.referenceNumber = extractedData.documentNumber;
            console.log('🧾 מספר מסמך עודכן:', extractedData.documentNumber);
        }
        
        // מילוי שם ספק
        if (extractedData.supplier) {
            // ניסיון למצוא ספק קיים עם שם דומה
            const matchingSupplier = this.suppliers.find(supplier => 
                supplier.name.includes(extractedData.supplier) || 
                extractedData.supplier.includes(supplier.name)
            );
            
            if (matchingSupplier) {
                this.newExpense.supplierId = matchingSupplier.id;
                this.newExpense.supplierName = matchingSupplier.name;
                console.log('🏢 ספק קיים נמצא:', matchingSupplier.name);
            } else {
                // הוספת שם הספק לפרטים אם לא נמצא
                const supplierInfo = `ספק: ${extractedData.supplier}`;
                if (this.newExpense.details) {
                    this.newExpense.details += ` | ${supplierInfo}`;
                } else {
                    this.newExpense.details = supplierInfo;
                }
                console.log('🏢 ספק חדש נוסף לפרטים:', extractedData.supplier);
            }
        }
        
        // מילוי קטגוריה (מהרשימה הקיימת)
        if (extractedData.category && this.categories.includes(extractedData.category)) {
            this.newExpense.category = extractedData.category;
            console.log('📂 קטגוריה עודכנה:', extractedData.category);
        }
        
        // מילוי מע"מ
        if (extractedData.vatRate && extractedData.vatRate >= 0 && extractedData.vatRate <= 30) {
            this.newExpense.vatRate = extractedData.vatRate;
            if (this.newExpense.totalAmount) {
                this.calculateAmountFromTotal();
            }
            console.log('📊 מע"מ עודכן:', extractedData.vatRate + '%');
        }
        
        // מילוי אופן תשלום
        if (extractedData.paymentMethod) {
            const validPaymentMethods = ['cash', 'credit', 'check', 'transfer'];
            if (validPaymentMethods.includes(extractedData.paymentMethod)) {
                this.newExpense.paymentMethod = extractedData.paymentMethod;
                console.log('💳 אופן תשלום עודכן:', extractedData.paymentMethod);
            }
        }
        
        // הוספת שם הקובץ לפרטים
        const fileInfo = `מקור: ${fileName}`;
        if (this.newExpense.details) {
            this.newExpense.details += ` | ${fileInfo}`;
        } else {
            this.newExpense.details = fileInfo;
        }

        this.showNotification(`מידע חולץ מהקובץ: ${fileName}`, 'success');
        
        // לוג של כל השדות שעודכנו
        console.log('✅ טופס ההוצאה עודכן עם הנתונים הבאים:', {
            date: this.newExpense.date,
            amount: this.newExpense.amount,
            totalAmount: this.newExpense.totalAmount,
            supplier: this.newExpense.supplierName,
            category: this.newExpense.category,
            vatRate: this.newExpense.vatRate,
            paymentMethod: this.newExpense.paymentMethod,
            documentNumber: this.newExpense.referenceNumber
        });
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

    // ניווט לעמוד הראשי
    navigateToHome() {
        this.router.navigate(['/']);
    }
}
