// src/app/services/customer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`; // שנה לכתובת השרת שלך

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  addCustomer(customer: any): Observable<any> {
    
    return this.http.post<any>(this.apiUrl, customer);
  }
}