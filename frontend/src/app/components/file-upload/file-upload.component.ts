import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @ViewChild('incomeFileInput') incomeFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('expenseFileInput') expenseFileInput!: ElementRef<HTMLInputElement>;

  isDragOverIncome = false;
  isDragOverExpense = false;
  isProcessing = false;

  constructor(private transactionService: TransactionService) { }

  triggerFileInput(type: 'income' | 'expense'): void {
    if (type === 'income') {
      this.incomeFileInput.nativeElement.click();
    } else {
      this.expenseFileInput.nativeElement.click();
    }
  }

  onDragOver(event: DragEvent, type: 'income' | 'expense'): void {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'income') {
      this.isDragOverIncome = true;
    } else {
      this.isDragOverExpense = true;
    }
  }

  onDragLeave(event: DragEvent, type: 'income' | 'expense'): void {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'income') {
      this.isDragOverIncome = false;
    } else {
      this.isDragOverExpense = false;
    }
  }

  onDrop(event: DragEvent, type: 'income' | 'expense'): void {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'income') {
      this.isDragOverIncome = false;
    } else {
      this.isDragOverExpense = false;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0], type);
    }
  }

  onFileSelected(event: Event, type: 'income' | 'expense'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0], type);
    }
  }

  private async handleFile(file: File, type: 'income' | 'expense'): Promise<void> {
    // ניתן להוסיף לוגיקה שונה לפי סוג הקובץ (הכנסה/הוצאה) כאן במידת הצורך
    // לדוג' if (type === 'income') { ... } else { ... }
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.transactionService.showNotification('הקובץ גדול מדי. גודל מקסימלי: 5MB', 'error');
      return;
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    const isValidType = validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

    if (!isValidType) {
      this.transactionService.showNotification('סוג קובץ לא נתמך. יש להעלות קבצי Excel (.xlsx, .xls)', 'error');
      return;
    }

    this.isProcessing = true;

    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await this.processExcelFile(file, type);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      this.transactionService.showNotification('שגיאה בעיבוד הקובץ. אנא בדוק את הפורמט ונסה שוב', 'error');
    } finally {
      this.isProcessing = false;
      // Reset file input
      if (type === 'income') {
        this.incomeFileInput.nativeElement.value = '';
      } else {
        this.expenseFileInput.nativeElement.value = '';
      }
    }
  }

  private async processExcelFile(file: File, type: 'income' | 'expense'): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON with headers as keys
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (data.length < 1) {
        throw new Error('קובץ ריק או חסרים נתונים');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          const r: any = row;
          if (type === 'income') {
            const incomeTransaction = {
              transactionID: Number(1),
              date: this.parseExcelDate(r['תאריך'] || r['date']),
              client: String(r['לקוח'] || r['client'] || ''),
              amount: Number(r['סכום'] || r['amount'] || 0),
              VAT: Number(r['מע"מ'] || r['vat'] || 17),
              PaymentMethod: String(r['אופן התשלום'] || r['paymentmethod'] || ''),
              description: String(r['תיאור'] || r['description'] || ''),

            };
            if (this.validateIncomeTransactionData(incomeTransaction)) {
              this.addIncomeTransaction(incomeTransaction);
              successCount++;
            } else {

              errorCount++;
            }
          } else if (type === 'expense') {
            const expenseTransaction = {
              transactionID: Number(1),
              date: this.parseExcelDate(r['תאריך'] || r['date']),
              supplier: String(r['ספק'] || r['supplier']),
              category: String(r['קטגוריה'] || r['category'] || ''),
              amount: Number(r['סכום'] || r['amount']),
              VAT: Number(r['מע"מ'] || r['vat'] || 17),
              PaymentMethod: String(r['אופן התשלום'] || r['paymentmethod']),
            };
            if (this.validateExpenseTransactionData(expenseTransaction)) {
              this.addExpenseTransaction(expenseTransaction);
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            errorCount++;
          }
        } catch {

          errorCount++;
        }
      }

      if (successCount > 0) {
        this.transactionService.showNotification(`הוספו ${successCount} עסקאות מקובץ Excel`, 'success');
      }
      if (errorCount > 0) {
        this.transactionService.showNotification(`${errorCount} שורות נכשלו - בדוק פורמט הנתונים`, 'error');
      }
    } catch (error) {
      throw new Error('שגיאה בעיבוד קובץ Excel');
    }
  }

  private addIncomeTransaction(transaction: any): void {
    this.transactionService.addIncomeTransaction(transaction);
    // ניתן להוסיף כאן לוגיקה נוספת להוספת הכנסה בלבד
  }

  private addExpenseTransaction(transaction: any): void {
    this.transactionService.addExpenseTransaction(transaction);
    // ניתן להוסיף כאן לוגיקה נוספת להוספת הוצאה בלבד
  }

  //     if (successCount > 0) {
  //       this.transactionService.showNotification(`הוספו ${successCount} עסקאות מקובץ Excel`, 'success');
  //     }
  //     if (errorCount > 0) {
  //       this.transactionService.showNotification(`${errorCount} שורות נכשלו - בדוק פורמט הנתונים`, 'error');
  //     }
  //   } catch (error) {
  //     throw new Error('שגיאה בעיבוד קובץ Excel');
  //   }
  // }

  private parseExcelDate(value: any): string {
    if (typeof value === 'number') {
      // Excel date serial number
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    } else if (typeof value === 'string') {
      // Try to parse as date string
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0]; // Default to today
  }

  // private parseTransactionType(value: string): 'income' | 'expense' {
  //   const normalized = value.toLowerCase().trim();
  //   if (normalized.includes('הכנסה') || normalized === 'income') {
  //     return 'income';
  //   }
  //   return 'expense';
  // }

  private validateIncomeTransactionData(item: any): boolean {
    // בדיקת שדות חובה להכנסה
    if (!item) return false;
    if (typeof item.date !== 'string' || !item.date.trim()) return false;
    if (typeof item.client !== 'string' || !item.client.trim()) return false;
    if (typeof item.amount !== 'number' || isNaN(item.amount)) return false;
    if (typeof item.VAT !== 'number' || isNaN(item.VAT)) return false;
    if (typeof item.PaymentMethod !== 'string' || !item.PaymentMethod.trim()) return false;
    if (typeof item.description !== 'string' || !item.description.trim()) return false;
    return true;
  }
  private validateExpenseTransactionData(item: any): boolean {
    // בדיקת שדות חובה להוצאה
    if (!item) return false;
    console.log("1");
    if (typeof item.date !== 'string' || !item.date.trim()) return false;
    console.log("2");
    if (typeof item.supplier !== 'string' || !item.supplier.trim()) return false;
    console.log("3");
    if (typeof item.category !== 'string') return false;
    console.log("4");
    if (typeof item.amount !== 'number' || isNaN(item.amount)) return false;
    console.log("5");
    if (typeof item.VAT !== 'number' || isNaN(item.VAT)) return false;
    console.log("6");
    if (typeof item.PaymentMethod !== 'string' || !item.PaymentMethod.trim()) return false;
    console.log("7");
    // description לא חובה להוצאה, אם תרצה להוסיף: typeof item.description === 'string' && item.description.trim() !== ''
    return true;
  }

}
