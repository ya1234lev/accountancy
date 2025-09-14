import { Request, Response } from 'express';
import * as expenseService from '../../services/expenseService';
import * as supplierService from '../../services/supplierService';
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
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // מקסימום 10 קבצים
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

// עיבוד קבצי PDF מרובים ויצירת הוצאות אוטומטית
export const uploadMultiplePdfs = async (req: Request, res: Response) => {
  console.log('📁 התקבלה בקשה להעלאת קבצי PDF מרובים');
  console.log('📄 מספר קבצים:', req.files?.length || 0);
  
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      console.log('❌ לא הועלו קבצים');
      return res.status(400).json({ 
        success: false, 
        message: 'לא הועלו קבצים' 
      });
    }

    if (files.length > 10) {
      console.log('❌ יותר מדי קבצים');
      return res.status(400).json({ 
        success: false, 
        message: 'ניתן להעלות מקסימום 10 קבצים בו זמנית' 
      });
    }

    const processedFiles = [];
    const createdExpenses = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📄 מעבד קובץ ${i + 1}/${files.length}: ${file.originalname}`);
      
      try {
        const filePath = file.path;
        console.log(`📂 נתיב קובץ ${i + 1}:`, filePath);
        
        // קריאת קובץ PDF
        const dataBuffer = fs.readFileSync(filePath);
        console.log(`✅ קריאת קובץ ${i + 1} הושלמה, גודל:`, dataBuffer.length);
        
        // חילוץ טקסט מהקובץ
        console.log(`🔍 מתחיל חילוץ טקסט מקובץ ${i + 1}...`);
        const pdfData = await pdfParse(dataBuffer);
        console.log(`✅ חילוץ טקסט מקובץ ${i + 1} הושלם, אורך טקסט:`, pdfData.text.length);
        
        // ניתוח הטקסט וחילוץ מידע רלוונטי
        console.log(`🔍 מתחיל ניתוח נתונים מקובץ ${i + 1}...`);
        const extractedData = await extractExpenseDataFromText(pdfData.text);
        console.log(`✅ ניתוח נתונים מקובץ ${i + 1} הושלם:`, extractedData);
        
        // יצירת הוצאה חדשה עם הנתונים שחולצו
        const expenseData: CreateExpenseData = {
          id: generateUniqueId(), // נוסיף פונקציה ליצירת ID ייחודי
          referenceNumber: extractedData.documentNumber || generateReferenceNumber(),
          date: extractedData.date ? new Date(extractedData.date) : new Date(),
          supplier: extractedData.supplier ? await findOrCreateSupplierByName(extractedData.supplier) : getDefaultSupplierName(),
          category: extractedData.category || 'אחר',
          amount: extractedData.amount || 0,
          vat: extractedData.vatRate || 17,
          paymentMethod: extractedData.paymentMethod || 'credit',
          attachment: file.filename // שמירת שם הקובץ
        };

        console.log(`💾 יוצר הוצאה חדשה מקובץ ${i + 1}:`, expenseData);
        const newExpense = await expenseService.createExpense(expenseData as any);
        console.log(`✅ הוצאה חדשה נוצרה מקובץ ${i + 1}:`, newExpense._id);

        createdExpenses.push(newExpense);
        processedFiles.push({
          filename: file.originalname,
          extractedData,
          expenseId: newExpense._id,
          success: true
        });

        // 🗑️ מחיקת הקובץ לאחר עיבוד מוצלח
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ קובץ זמני ${i + 1} נמחק בהצלחה לאחר עיבוד`);
          }
        } catch (deleteError) {
          console.error(`⚠️ שגיאה במחיקת קובץ זמני ${i + 1}:`, deleteError);
          // לא נעצור את התהליך בגלל זה
        }

      } catch (fileError) {
        console.error(`❌ שגיאה בעיבוד קובץ ${i + 1} (${file.originalname}):`, fileError);
        
        // מחיקת הקובץ במקרה של שגיאה
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log(`�️ קובץ זמני ${i + 1} נמחק לאחר שגיאה`);
          } catch (deleteError) {
            console.error(`❌ שגיאה במחיקת קובץ זמני ${i + 1}:`, deleteError);
          }
        }

        errors.push({
          filename: file.originalname,
          error: fileError instanceof Error ? fileError.message : 'שגיאה לא ידועה'
        });

        processedFiles.push({
          filename: file.originalname,
          success: false,
          error: fileError instanceof Error ? fileError.message : 'שגיאה לא ידועה'
        });
      }
    }

    const response = {
      success: true,
      message: `עובדו ${files.length} קבצים`,
      data: {
        totalFiles: files.length,
        successfullyProcessed: createdExpenses.length,
        errorsCount: errors.length,
        createdExpenses,
        processedFiles,
        errors
      }
    };
    
    console.log('✅ עיבוד קבצים מרובים הושלם');
    res.json(response);
    
  } catch (error) {
    console.error('❌ שגיאה כללית בעיבוד קבצים מרובים:', error);
    
    // מחיקת כל הקבצים במקרה של שגיאה כללית
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach((file, index) => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log(`🗑️ קובץ זמני ${index + 1} נמחק לאחר שגיאה כללית`);
          } catch (deleteError) {
            console.error(`❌ שגיאה במחיקת קובץ זמני ${index + 1}:`, deleteError);
          }
        }
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה כללית בעיבוד הקבצים', 
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    });
  }
};

// טיפוס לנתוני הוצאה חדשה
interface CreateExpenseData {
  id: string;
  referenceNumber: string;
  date: Date;
  supplier: string;
  category: 'ריהוט' | 'נקיון' | 'קופה קטנה' | 'תחזוקה' | 'משרד' | 'רכב' | 'שיווק' | 'שירותים מקצועיים' | 'ציוד' | 'אחר';
  amount: number;
  vat: number;
  paymentMethod: 'cash' | 'credit' | 'check' | 'transfer';
  attachment?: string;
}

// פונקציות עזר ליצירת הוצאות
function generateUniqueId(): string {
  return `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateReferenceNumber(): string {
  return `REF-${Date.now()}`;
}

function getSupplierIdByName(supplierName: string): number {
  // פונקציה זמנית - נשתמש בפונקציה האסינכרונית החדשה
  // TODO: להחליף את זה בפונקציה אסינכרונית
  return 1; // ספק ברירת מחדל
}

// פונקציה חדשה אסינכרונית לחיפוש או יצירת ספק
async function findOrCreateSupplierByName(supplierName: string): Promise<string> {
  try {
    if (!supplierName || supplierName.trim().length === 0) {
      console.log('⚠️ שם ספק ריק, משתמש בספק ברירת מחדל');
      return 'ספק לא ידוע';
    }

    console.log('🔍 מחפש או יוצר ספק:', supplierName);
    const supplier = await supplierService.findOrCreateSupplier(supplierName);
    
    console.log('✅ שם ספק:', supplier.name);
    
    return supplier.name;
  } catch (error) {
    console.error('❌ שגיאה בחיפוש/יצירת ספק:', error);
      return 'ספק לא ידוע';
  }
}

function getDefaultSupplierName(): string {
  return 'ספק לא ידוע'; // ספק ברירת מחדל
}

// שמירה על הפונקציה הקיימת לתאימות לאחור
export const uploadPdf = async (req: Request, res: Response) => {
  console.log('📁 התקבלה בקשה להעלאת PDF יחיד');
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
async function extractExpenseDataFromText(text: string): Promise<any> {
  console.log('🔍 מתחיל ניתוח מתקדם של הטקסט...');
  
  const extractedData: any = {
    // ערכי ברירת מחדל מעודכנים
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    supplier: '',
    category: 'אחר',
    description: '',
    vatRate: 0, // ברירת מחדל 0% (ללא מע"מ עד שמוכח אחרת)
    paymentMethod: 'credit',
    documentNumber: ''
  };
  
  // רשימת הקטגוריות הקיימות (מה-Frontend)
  const categories = ['ריהוט', 'נקיון', 'קופה קטנה', 'תחזוקה', 'משרד', 'רכב', 'שיווק', 'שירותים מקצועיים', 'ציוד', 'אחר'];
  
  try {
    // 1. חילוץ תאריך הדפסת קבלה (date) - משופר
    console.log('📅 מחפש תאריך הדפסת קבלה...');
    const datePatterns = [
      /(?:תאריך הדפסה|הודפס ב|הודפס|נפק ב)[\s\:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
      /(?:תאריך|דאטה|Date)[\s\:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
      /(?:נוצר ב|יצור|יום)[\s\:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
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
    
    // 2. חילוץ סה"כ כולל מע"מ או סה"כ לתשלום (amount) - משופר
    console.log('💰 מחפש סה"כ כולל מע"מ או סה"כ לתשלום...');
    const amountPatterns = [
      // תבניות לסה"כ כולל מע"מ - עדיפות גבוהה
      /(?:סה["']כ כולל מע["']מ|סך הכול כולל מע["']מ|סכום כולל מע["']מ)[\s\:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:Total including VAT|Total incl\. VAT)[\s\:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      
      // תבניות לסה"כ לתשלום - עדיפות בינונית
      /(?:סה["']כ לתשלום|סך לתשלום|לתשלום|סכום לתשלום)[\s\:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:Total to pay|Amount due|Total due)[\s\:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      
      // תבניות לסה"כ כללי - עדיפות נמוכה
      /(?:סה["']כ|סך הכול|סכום כולל|total|amount)[\s\:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      
      // תבניות עם סמלי מטבע
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*₪/g,
      /₪\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*שקל/g,
      /(\d+(?:\.\d{2})?)\s*NIS/gi
    ];
    
    const foundAmounts: Array<{amount: number, priority: number, context: string}> = [];
    
    for (let i = 0; i < amountPatterns.length; i++) {
      const pattern = amountPatterns[i];
      const matches = [...text.matchAll(pattern)];
      
      matches.forEach(match => {
        const amountStr = match[1] || match[0];
        const cleanAmount = amountStr.replace(/[^\d\.]/g, '');
        const amount = parseFloat(cleanAmount);
        
        if (!isNaN(amount) && amount > 0) {
          let priority = 10; // עדיפות נמוכה כברירת מחדל
          
          // קביעת עדיפות לפי התבנית
          if (i <= 1) priority = 1; // סה"כ כולל מע"מ - עדיפות גבוהה
          else if (i <= 3) priority = 2; // סה"כ לתשלום - עדיפות בינונית
          else if (i <= 5) priority = 3; // סה"כ כללי - עדיפות נמוכה
          else priority = 4; // סמלי מטבע - עדיפות נמוכה יותר
          
          foundAmounts.push({
            amount,
            priority,
            context: match[0]
          });
        }
      });
    }
    
    if (foundAmounts.length > 0) {
      // מיון לפי עדיפות ואז לפי סכום (הכי גבוה)
      foundAmounts.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.amount - a.amount;
      });
      
      extractedData.amount = foundAmounts[0].amount;
      console.log('✅ סכום נמצא:', foundAmounts[0].amount, 'הקשר:', foundAmounts[0].context);
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
    
    // 5. חילוץ מע"מ - בדיקה אם שולם עם מע"מ (vat) - משופר
    console.log('📊 בודק אם שולם עם מע"מ...');
    let vatFound = false;
    
    // בדיקה אם יש אזכור של מע"מ בקבלה
    const vatIndicators = [
      /מע["']מ/gi,
      /VAT/gi,
      /מס ערך מוסף/gi,
      /כולל מע["']מ/gi,
      /including VAT/gi,
      /\+\s*מע["']מ/gi
    ];
    
    for (const indicator of vatIndicators) {
      if (text.match(indicator)) {
        vatFound = true;
        break;
      }
    }
    
    // אם נמצא אזכור של מע"מ, נחפש את השיעור הספציפי
    if (vatFound) {
      const vatPatterns = [
        /מע["']מ[\s\:]*(\d{1,2}(?:\.\d{1,2})?)\s*%/gi,
        /(\d{1,2})\s*%\s*מע["']מ/gi,
        /VAT[\s\:]*(\d{1,2}(?:\.\d{1,2})?)\s*%/gi
      ];
      
      let specificVatRate = null;
      for (const pattern of vatPatterns) {
        const vatMatch = text.match(pattern);
        if (vatMatch && vatMatch[1]) {
          const vatRate = parseFloat(vatMatch[1]);
          if (vatRate >= 0 && vatRate <= 18) {
            specificVatRate = vatRate;
            console.log('✅ שיעור מע"מ ספציפי נמצא:', vatRate + '%');
            break;
          }
        }
      }
      
      // אם נמצא שיעור ספציפי, נשתמש בו, אחרת ברירת מחדל 17%
      extractedData.vatRate = specificVatRate !== null ? specificVatRate : 17;
      console.log('✅ מע"מ זוהה, שיעור:', extractedData.vatRate + '%');
    } else {
      // אם לא נמצא אזכור של מע"מ, נגדיר 0%
      extractedData.vatRate = 0;
      console.log('📊 לא נמצא אזכור של מע"מ, הוגדר 0%');
    }
    
    // 6. חילוץ מספר אסמכתא/חשבונית/קבלה (referenceNumber) - משופר
    console.log('🧾 מחפש מספר אסמכתא/חשבונית/קבלה...');
    const docPatterns = [
      /(?:אסמכתא|מספר אסמכתא)[\s\#\:\-]*(\d+)/gi,
      /(?:חשבונית|חשבונית מס|מספר חשבונית|חשבונית מספר)[\s\#\:\-]*(\d+)/gi,
      /(?:מס חשבונית|מס' חשבונית|מס״ח)[\s\#\:\-]*(\d+)/gi,
      /(?:קבלה|קבלה מס|מספר קבלה|קבלה מספר)[\s\#\:\-]*(\d+)/gi,
      /(?:מס קבלה|מס' קבלה|מס״ק)[\s\#\:\-]*(\d+)/gi,
      /(?:מספר|מס|מס')[\s\#\:\-]*(\d+)/gi,
      /(?:Invoice|Invoice No|Receipt|Receipt No|Ref)[\s\#\:\-]*(\d+)/gi,
      /(\d{6,12})/g // מספרים ארוכים של 6-12 ספרות
    ];
    
    for (const pattern of docPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const docNumber = match[1] || match[0].replace(/[^\d]/g, '');
        if (docNumber && docNumber.length >= 4 && docNumber.length <= 12) {
          extractedData.documentNumber = docNumber;
          console.log('✅ מספר אסמכתא/חשבונית/קבלה נמצא:', docNumber);
          break;
        }
      }
      if (extractedData.documentNumber) break;
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
        // יצירת תאריך ב-UTC כדי למנוע בעיות אזור זמן
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.toISOString().split('T')[0];
      }
    }
  } catch (error) {
    console.error('שגיאה בפרסור תאריך:', error);
  }
  return null;
}

// 🧹 פונקציה לניקוי קבצים ישנים מתיקיית uploads
export const cleanupOldFiles = async (req: Request, res: Response) => {
  console.log('🧹 מתחיל ניקוי קבצים ישנים מתיקיית uploads');
  
  try {
    const uploadsPath = path.join(__dirname, '../../../uploads');
    
    if (!fs.existsSync(uploadsPath)) {
      return res.json({
        success: true,
        message: 'תיקיית uploads לא קיימת',
        deletedFiles: 0
      });
    }
    
    const files = fs.readdirSync(uploadsPath);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 שעות במילישניות
    let deletedCount = 0;
    const deletedFiles: string[] = [];
    
    for (const file of files) {
      const filePath = path.join(uploadsPath, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtime.getTime();
      
      if (fileAge > maxAge) {
        try {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
          deletedCount++;
          console.log(`🗑️ נמחק קובץ ישן: ${file}`);
        } catch (deleteError) {
          console.error(`❌ שגיאה במחיקת קובץ ${file}:`, deleteError);
        }
      }
    }
    
    console.log(`✅ ניקוי הושלם: נמחקו ${deletedCount} קבצים ישנים`);
    
    res.json({
      success: true,
      message: `נמחקו ${deletedCount} קבצים ישנים (מעל 24 שעות)`,
      deletedFiles,
      deletedCount
    });
    
  } catch (error) {
    console.error('❌ שגיאה בניקוי קבצים ישנים:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בניקוי קבצים ישנים',
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    });
  }
};

// 🕐 פונקציה לניקוי אוטומטי (להרצה מתוזמנת)
export const scheduleCleanup = () => {
  // ניקוי כל 6 שעות
  setInterval(async () => {
    console.log('🕐 מריץ ניקוי אוטומטי מתוזמן');
    try {
      const uploadsPath = path.join(__dirname, '../../../uploads');
      
      if (!fs.existsSync(uploadsPath)) {
        return;
      }
      
      const files = fs.readdirSync(uploadsPath);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 שעות
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(uploadsPath, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAge) {
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`🗑️ ניקוי אוטומטי: נמחק קובץ ישן ${file}`);
          } catch (deleteError) {
            console.error(`❌ שגיאה בניקוי אוטומטי של קובץ ${file}:`, deleteError);
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`✅ ניקוי אוטומטי הושלם: נמחקו ${deletedCount} קבצים ישנים`);
      }
      
    } catch (error) {
      console.error('❌ שגיאה בניקוי אוטומטי:', error);
    }
  }, 6 * 60 * 60 * 1000); // 6 שעות
};