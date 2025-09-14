import { ISupplier, Supplier } from "../models/Supplier";

export const createSupplier = async (supplierData: Partial<ISupplier>): Promise<ISupplier> => {
  const supplier = new Supplier(supplierData);
  return await supplier.save();
};

export const getSupplierById = async (id: string): Promise<ISupplier | null> => {
  return await Supplier.findOne({ id: id });
};

export const getAllSuppliers = async (): Promise<ISupplier[]> => {
  return await Supplier.find();
};

export const updateSupplier = async (id: string, supplierData: Partial<ISupplier>): Promise<ISupplier | null> => {
  return await Supplier.findOneAndUpdate({ id: id }, supplierData, { new: true });
};

export const deleteSupplier = async (id: string): Promise<ISupplier | null> => {
  return await Supplier.findOneAndDelete({ id: id });
};

// מחיקת כל הספקים
export const deleteAllSuppliers = async (): Promise<{ deletedCount: number }> => {
  const result = await Supplier.deleteMany({});
  return { deletedCount: result.deletedCount };
};

// חיפוש ספק לפי שם
export const findSupplierByName = async (name: string): Promise<ISupplier | null> => {
  // חיפוש לא רגיש לאותיות גדולות/קטנות עם ביטוי רגולרי
  return await Supplier.findOne({ 
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
  });
};

// חיפוש או יצירת ספק חדש
export const findOrCreateSupplier = async (supplierName: string): Promise<ISupplier> => {
  const trimmedName = supplierName.trim();
  
  // חיפוש ספק קיים
  let supplier = await findSupplierByName(trimmedName);
  
  if (!supplier) {
    // יצירת ספק חדש אם לא קיים
    const newSupplierData: Partial<ISupplier> = {
      id: `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      contactPerson: '',
      email: '',
      phone: '',
      address: ''
    };
    
    supplier = await createSupplier(newSupplierData);
    console.log('✅ ספק חדש נוצר:', supplier.name);
  } else {
    console.log('✅ ספק קיים נמצא:', supplier.name);
  }
  
  return supplier;
};
