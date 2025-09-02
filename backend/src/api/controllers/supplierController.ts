import { Request, Response } from 'express';
import * as supplierService from '../../services/supplierService';

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error creating supplier', error });
  }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error getting supplier', error });
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  console.log("req.cody",req.body);
  
  try {
    const suppliers = await supplierService.getAllSuppliers();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error getting suppliers', error });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplier', error });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.deleteSupplier(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier', error });
  }
};

// מחיקת כל הספקים
export const deleteAllSuppliers = async (req: Request, res: Response) => {
  try {
    const result = await supplierService.deleteAllSuppliers();
    res.json({ message: 'All suppliers deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all suppliers', error });
  }
};
