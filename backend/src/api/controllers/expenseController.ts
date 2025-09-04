import { Request, Response } from 'express';
import * as expenseService from '../../services/expenseService';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import path from 'path';
import fs from 'fs';

// הגדרת multer לטיפול בהעלאת קבצים
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `expense_${timestamp}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('רק קבצי PDF מורשים'), false);
  }
};

// הוספת middleware לטיפול בשגיאות multer
const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'הקובץ גדול מדי - מקסימום 50MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'שגיאה בהעלאת הקובץ: ' + error.message
    });
  }
  next(error);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

export const createExpense = async (req: Request, res: Response) => {
  try {

    const expense = await expenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense', error });
  }
};

export const getExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error getting expense', error });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount, 
      supplier,
      category 
    } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      startDate: startDate as string,
      endDate: endDate as string,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      supplier: supplier as string,
      category: category as string
    };

    const result = await expenseService.getAllExpenses(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error getting expenses', error });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.deleteExpense(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error });
  }
};

// מחיקת כל ההוצאות
export const deleteAllExpenses = async (req: Request, res: Response) => {
  try {
    const result = await expenseService.deleteAllExpenses();
    res.json({ message: 'All expenses deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all expenses', error });
  }
};

// עיבוד קובץ PDF והחזרת נתונים
export const uploadPdf = async (req: Request, res: Response) => {
  console.log('📁 התקבלה בקשה להעלאת PDF');
  console.log('📄 קובץ:', req.file?.originalname);
  console.log('📏 גודל:', req.file?.size);
  
  try {
    if (!req.file) {
      console.log('❌ לא הועלה קובץ');
      return res.status(400).json({ 
        success: false, 
        message: 'לא הועלה קובץ' 
      });
    }

    const filePath = req.file.path;
    console.log('📂 נתיב קובץ:', filePath);
    
    // קריאת קובץ PDF
    const dataBuffer = fs.readFileSync(filePath);
    console.log('✅ קריאת קובץ הושלמה, גודל:', dataBuffer.length);
    
    // חילוץ טקסט מהקובץ
    console.log('🔍 מתחיל חילוץ טקסט...');
    const pdfData = await pdfParse(dataBuffer);
    console.log('✅ חילוץ טקסט הושלם, אורך טקסט:', pdfData.text.length);
    console.log('📝 דוגמת טקסט:', pdfData.text.substring(0, 200));
    
    // ניתוח הטקסט וחילוץ מידע רלוונטי
    console.log('🔍 מתחיל ניתוח נתונים...');
    const extractedData = await extractExpenseDataFromText(pdfData.text);
    console.log('✅ ניתוח נתונים הושלם:', extractedData);
    
    // מחיקת הקובץ הזמני
    fs.unlinkSync(filePath);
    console.log('🗑️ קובץ זמני נמחק');
    
    const response = {
      success: true,
      data: {
        text: pdfData.text,
        extractedData,
        filename: req.file.originalname
      }
    };
    
    console.log('✅ החזרת תשובה מוצלחת');
    res.json(response);
    
  } catch (error) {
    console.error('❌ שגיאה בעיבוד PDF:', error);
    console.error('📊 פרטי שגיאה:', {
      message: error instanceof Error ? error.message : 'שגיאה לא ידועה',
      stack: error instanceof Error ? error.stack : 'אין stack trace',
      file: req.file?.originalname
    });
    
    // מחיקת הקובץ במקרה של שגיאה
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ קובץ זמני נמחק לאחר שגיאה');
      } catch (deleteError) {
        console.error('❌ שגיאה במחיקת קובץ זמני:', deleteError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בעיבוד הקובץ', 
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    });
  }
};

// פונקציה לחילוץ מידע רלוונטי מטקסט PDF
async function extractExpenseDataFromText(text: string): Promise<any> {
  console.log('🔍 מתחיל ניתוח מתקדם של הטקסט...');
  
  const extractedData: any = {
    // ערכי ברירת מחדל
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    supplier: '',
    category: '',
    description: '',
    vatRate: 17,
    paymentMethod: 'credit',
    documentNumber: ''
  };
  
  // רשימת הקטגוריות הקיימות (מה-Frontend)
  const categories = ['ריהוט', 'נקיון', 'קופה קטנה', 'תחזוקה', 'משרד', 'רכב', 'שיווק', 'שירותים מקצועיים', 'ציוד', 'אחר'];
  
  try {
    // 1. חילוץ התאריך הכי רלוונטי
    console.log('📅 מחפש תאריכים...');
    const datePatterns = [
      /(?:תאריך|דאטה|Date)[\s\:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/g, // DD/MM/YYYY או DD-MM-YYYY
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g  // YYYY/MM/DD
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch && dateMatch[0]) {
        const dateStr = dateMatch[0].replace(/[^\d\/\-\.]/g, '');
        const parsedDate = parseIsraeliDate(dateStr);
        if (parsedDate) {
          extractedData.date = parsedDate;
          console.log('✅ תאריך נמצא:', parsedDate);
          break;
        }
      }
    }
    
    // 2. חילוץ הסכום הכי גדול (כנראה הסכום הסופי)
    console.log('💰 מחפש סכומים...');
    const amountPatterns = [
      /(?:סה["']כ|סכום|total|amount)[\s\:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*₪/g,
      /₪\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*שקל/g,
      /(\d+(?:\.\d{2})?)\s*NIS/gi
    ];
    
    const amounts: number[] = [];
    for (const pattern of amountPatterns) {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const amountStr = match[1] || match[0];
        const cleanAmount = amountStr.replace(/[^\d\.]/g, '');
        const amount = parseFloat(cleanAmount);
        if (!isNaN(amount) && amount > 0) {
          amounts.push(amount);
        }
      });
    }
    
    if (amounts.length > 0) {
      // בוחר את הסכום הכי גדול (כנראה הסכום הסופי)
      extractedData.amount = Math.max(...amounts);
      console.log('✅ סכום נמצא:', extractedData.amount);
    }
    
    // 3. חילוץ שם הספק
    console.log('🏢 מחפש שם ספק...');
    const supplierPatterns = [
      /([א-ת]+(?:\s+[א-ת]+)*)\s*(?:בע"מ|בע״מ|לימיטד|בזק|ובניו|ושות)/gi,
      /(?:שם|ספק|עסק)[\s\:]*([א-ת\s]+)/gi,
      /^([א-ת]+(?:\s+[א-ת]+){0,3})/m // שורה שמתחילה בעברית
    ];
    
    for (const pattern of supplierPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const supplier = match[1].trim();
        if (supplier.length > 2 && supplier.length < 50) {
          extractedData.supplier = supplier;
          console.log('✅ ספק נמצא:', supplier);
          break;
        }
      }
    }
    
    // 4. זיהוי קטגוריה מהרשימה הקיימת
    console.log('📂 מנסה לזהות קטגוריה מהרשימה הקיימת...');
    const categoryKeywords = {
      'ריהוט': ['ריהוט', 'כסא', 'שולחן', 'ארון', 'מיטה', 'ספה', 'מזרן', 'כוורת'],
      'נקיון': ['נקיון', 'ניקוי', 'חומרי נקיון', 'סבון', 'דומקס', 'כביסה', 'ניקיון'],
      'קופה קטנה': ['קפה', 'תה', 'עוגה', 'חטיף', 'מים', 'משקה', 'עוגיות'],
      'תחזוקה': ['תחזוקה', 'תיקון', 'מכונאי', 'אחזקה', 'שבר', 'תיקונים'],
      'משרד': ['נייר', 'עטים', 'משרד', 'מדפסת', 'כלי כתיבה', 'סטיקרים', 'דיו'],
      'רכב': ['דלק', 'בנזין', 'סולר', 'רכב', 'ביטוח רכב', 'חניה', 'כביש'],
      'שיווק': ['פרסום', 'שיווק', 'מודעה', 'מודעות', 'פייסבוק', 'גוגל', 'קידום'],
      'שירותים מקצועיים': ['עורך דין', 'רואה חשבון', 'יועץ', 'שירותים מקצועיים', 'ייעוץ'],
      'ציוד': ['ציוד', 'מחשב', 'טלפון', 'מכונה', 'כלים', 'רכישת ציוד'],
      'חשמל': ['חשמל', 'תאורה', 'כבלים', 'שקע', 'מפסק'],
      'אחר': []
    };
    
    const lowerText = text.toLowerCase();
    let foundCategory = false;
    
    // בדיקה מול מילות מפתח
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        extractedData.category = category;
        console.log('✅ קטגוריה זוהתה:', category);
        foundCategory = true;
        break;
      }
    }
    
    // אם לא נמצאה קטגוריה ספציפית, נבדק אם יש התאמה ישירה לשם קטגוריה
    if (!foundCategory) {
      for (const category of categories) {
        if (lowerText.includes(category.toLowerCase())) {
          extractedData.category = category;
          console.log('✅ קטגוריה זוהתה ישירות:', category);
          foundCategory = true;
          break;
        }
      }
    }
    
    // אם עדיין לא נמצאה, ברירת מחדל
    if (!foundCategory) {
      extractedData.category = 'אחר';
      console.log('📂 לא זוהתה קטגוריה ספציפית, הוגדרה כ"אחר"');
    }
    
    // 5. חילוץ מע"מ
    console.log('📊 מחפש מע"מ...');
    const vatPatterns = [
      /מע["']מ[\s\:]*(\d{1,2}(?:\.\d{1,2})?)\s*%/gi,
      /(\d{1,2})\s*%\s*מע["']מ/gi,
      /VAT[\s\:]*(\d{1,2}(?:\.\d{1,2})?)\s*%/gi
    ];
    
    for (const pattern of vatPatterns) {
      const vatMatch = text.match(pattern);
      if (vatMatch && vatMatch[1]) {
        const vatRate = parseFloat(vatMatch[1]);
        if (vatRate >= 0 && vatRate <= 18) {
          extractedData.vatRate = vatRate;
          console.log('✅ מע"מ נמצא:', vatRate + '%');
          break;
        }
      }
    }
    
    // 6. חילוץ מספר מסמך
    console.log('🧾 מחפש מספר מסמך...');
    const docPatterns = [
      /(?:חשבונית|קבלה)[\s\#\:]*(\d+)/gi,
      /(?:מספר|מס)[\s\#\:]*(\d+)/gi,
      /(\d{6,})/g // מספרים ארוכים
    ];
    
    for (const pattern of docPatterns) {
      const docMatch = text.match(pattern);
      if (docMatch && docMatch[1]) {
        extractedData.documentNumber = docMatch[1];
        console.log('✅ מספר מסמך נמצא:', docMatch[1]);
        break;
      }
    }
    
    // 7. זיהוי אופן תשלום
    console.log('💳 מנסה לזהות אופן תשלום...');
    if (text.includes('מזומן') || text.includes('cash')) {
      extractedData.paymentMethod = 'cash';
    } else if (text.includes('המחאה') || text.includes('שיק') || text.includes('check')) {
      extractedData.paymentMethod = 'check';
    } else if (text.includes('העברה') || text.includes('בנק') || text.includes('transfer')) {
      extractedData.paymentMethod = 'transfer';
    } else {
      extractedData.paymentMethod = 'credit'; // ברירת מחדל
    }
    
    console.log('✅ ניתוח הושלם בהצלחה:', extractedData);
    
  } catch (error) {
    console.error('❌ שגיאה בניתוח טקסט:', error);
  }
  
  return extractedData;
}

// פונקציה עזר לפרסור תאריכים ישראליים
function parseIsraeliDate(dateStr: string): string | null {
  try {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      let day, month, year;
      
      // זיהוי פורמט
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        // DD/MM/YY
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]) + 2000;
      }
      
      // בדיקת תקינות
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
        const date = new Date(year, month - 1, day);
        return date.toISOString().split('T')[0];
      }
    }
  } catch (error) {
    console.error('שגיאה בפרסור תאריך:', error);
  }
  return null;
}