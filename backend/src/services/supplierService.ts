import { ISupplier, Supplier } from "../models/Supplier";

export const createSupplier = async (supplierData: ISupplier): Promise<ISupplier> => {
  const supplier = new Supplier(supplierData);
  return await supplier.save();
};

export const getSupplierById = async (id: string): Promise<ISupplier | null> => {
  return await Supplier.findById(id);
};

export const getAllSuppliers = async (): Promise<ISupplier[]> => {
  return await Supplier.find();
};

export const updateSupplier = async (id: string, supplierData: Partial<ISupplier>): Promise<ISupplier | null> => {
  return await Supplier.findByIdAndUpdate(id, supplierData, { new: true });
};

export const deleteSupplier = async (id: string): Promise<ISupplier | null> => {
  return await Supplier.findByIdAndDelete(id);
};

// מחיקת כל הספקים
export const deleteAllSuppliers = async (): Promise<{ deletedCount: number }> => {
  const result = await Supplier.deleteMany({});
  return { deletedCount: result.deletedCount };
};
