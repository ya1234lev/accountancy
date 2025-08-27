import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <div class="card-header">
        <h3 class="card-title">
          <svg class="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          העלאת קבצים
        </h3>
      </div>
      <div class="card-body">
        <!-- Upload Area -->
        <div 
          class="upload-area"
          [class.drag-over]="isDragOver"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="triggerFileInput()">
          
          <input 
            #fileInput
            type="file" 
            accept=".xlsx,.xls,.json"
            (change)="onFileSelected($event)"
            class="file-input">
          
          <div class="upload-content">
            <svg class="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <h4>העלה קובץ נתונים</h4>
            <p>לחץ כאן או גרור קובץ לאזור זה</p>
            <small>פורמטים נתמכים: Excel (.xlsx, .xls) ו-JSON</small>
            <small>גודל מקסימלי: 5MB</small>
          </div>
        </div>

        <!-- Processing State -->
        <div *ngIf="isProcessing" class="processing-state">
          <svg class="spinner" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
          <span>מעבד קובץ...</span>
        </div>

        <!-- File Format Info -->
        <div class="file-format-info">
          <details>
            <summary>פורמט קבצים נתמך</summary>
            <div class="format-details">
              <h5>קבצי Excel (.xlsx, .xls):</h5>
              <p>הקובץ צריך להכיל את העמודות הבאות:</p>
              <code>תאריך | תיאור | סכום | סוג | לקוח/ספק</code>
              
              <h6>דוגמה:</h6>
              <code>
2024-01-15 | מכירת מוצר | 1500 | הכנסה | לקוח א'
2024-01-16 | קניית חומרים | 500 | הוצאה | ספק ב'
              </code>

              <h5>קבצי JSON:</h5>
              <p>מערך של אובייקטי עסקאות:</p>
              <code>
[
  {{ '{' }}
    "date": "2024-01-15",
    "description": "מכירת מוצר",
    "amount": 1500,
    "type": "income",
    "client": "לקוח א'"
  {{ '}' }}
]
              </code>
            </div>
          </details>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon {
      color: var(--gray-500);
    }

    .card-body {
      padding: 1.5rem;
    }

    /* Upload Area */
    .upload-area {
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius);
      padding: 3rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
      background: var(--gray-50);
      position: relative;
    }

    .upload-area:hover {
      border-color: var(--accent-color);
      background: rgba(15, 43, 119, 0.05);
    }

    .upload-area.drag-over {
      border-color: var(--accent-color);
      background: rgba(15, 43, 119, 0.1);
      box-shadow: 0 0 0 3px rgba(15, 43, 119, 0.1);
      transform: scale(1.02);
    }

    .file-input {
      display: none;
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .upload-icon {
      color: var(--gray-400);
    }

    .upload-content h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-700);
      margin: 0;
    }

    .upload-content p {
      color: var(--gray-500);
      margin: 0;
    }

    .upload-content small {
      color: var(--gray-400);
      font-size: 0.75rem;
    }

    /* Processing State */
    .processing-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--gray-50);
      border-radius: var(--border-radius);
      margin-top: 1rem;
      color: var(--accent-color);
      font-weight: 500;
    }

    .spinner {
      color: var(--accent-color);
    }

    /* File Format Info */
    .file-format-info {
      margin-top: 1rem;
      text-align: right;
    }

    .file-format-info details {
      background: var(--gray-50);
      padding: 0.75rem;
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .file-format-info summary {
      cursor: pointer;
      font-weight: 500;
      color: var(--accent-color);
      font-size: 0.875rem;
    }

    .file-format-info summary:hover {
      color: var(--primary-color);
    }

    .format-details {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .format-details h5, .format-details h6 {
      margin: 0.5rem 0 0.25rem 0;
      color: var(--gray-700);
      font-size: 0.8125rem;
    }

    .format-details p {
      margin: 0.25rem 0;
      font-size: 0.8125rem;
      color: var(--gray-600);
    }

    .format-details code {
      display: block;
      background: var(--white);
      padding: 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      border: 1px solid var(--border-color);
      direction: ltr;
      text-align: left;
      overflow-x: auto;
      margin: 0.5rem 0;
      white-space: pre-wrap;
    }

    @media (max-width: 768px) {
      .upload-area {
        padding: 2rem 1rem;
      }

      .upload-content h4 {
        font-size: 1rem;
      }

      .upload-content p {
        font-size: 0.875rem;
      }
    }
  `]
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  isDragOver = false;
  isProcessing = false;

  constructor(private transactionService: TransactionService) {}

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private async handleFile(file: File): Promise<void> {
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
      'application/json' // .json
    ];

    const isValidType = validTypes.includes(file.type) || 
                       file.name.endsWith('.xlsx') || 
                       file.name.endsWith('.xls') || 
                       file.name.endsWith('.json');

    if (!isValidType) {
      this.transactionService.showNotification('סוג קובץ לא נתמך. יש להעלות קבצי Excel (.xlsx, .xls) או JSON', 'error');
      return;
    }

    this.isProcessing = true;

    try {
      if (file.name.endsWith('.json')) {
        await this.processJsonFile(file);
      } else {
        await this.processExcelFile(file);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      this.transactionService.showNotification('שגיאה בעיבוד הקובץ. אנא בדוק את הפורמט ונסה שוב', 'error');
    } finally {
      this.isProcessing = false;
      // Reset file input
      this.fileInput.nativeElement.value = '';
    }
  }

  private async processJsonFile(file: File): Promise<void> {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of transactions');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of data) {
        if (this.validateTransactionData(item)) {
          this.transactionService.addTransaction({
            date: item.date,
            description: item.description,
            amount: Number(item.amount),
            type: item.type,
            category: item.category || '',
            client: item.client
          });
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        this.transactionService.showNotification(`הוספו ${successCount} עסקאות בהצלחה`, 'success');
      }
      if (errorCount > 0) {
        this.transactionService.showNotification(`${errorCount} עסקאות נכשלו - פורמט לא תקין`, 'error');
      }
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  private async processExcelFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        throw new Error('קובץ ריק או חסרים נתונים');
      }

      let successCount = 0;
      let errorCount = 0;

      // Skip header row (index 0)
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (row.length >= 5) {
          try {
            const transaction = {
              date: this.parseExcelDate(row[0]),
              description: String(row[1] || ''),
              amount: Number(row[2] || 0),
              type: this.parseTransactionType(String(row[3] || '')),
              category: '',
              client: String(row[4] || '')
            };

            if (this.validateTransactionData(transaction)) {
              this.transactionService.addTransaction(transaction);
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
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

  private parseTransactionType(value: string): 'income' | 'expense' {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('הכנסה') || normalized === 'income') {
      return 'income';
    }
    return 'expense';
  }

  private validateTransactionData(item: any): boolean {
    return item && 
           typeof item.date === 'string' && item.date.trim() !== '' &&
           typeof item.description === 'string' && item.description.trim() !== '' &&
           (typeof item.amount === 'number' || !isNaN(Number(item.amount))) &&
           ['income', 'expense'].includes(item.type) &&
           typeof item.client === 'string' && item.client.trim() !== '';
  }
}
