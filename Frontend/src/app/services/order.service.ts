import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  getOrdiniUtente(userId: number) {
    return this.http.get<any[]>(`http://localhost:3000/api/orders/user/${userId}`);
  }

  getDettaglioOrdine(orderId: number) {
    return this.http.get<any>(`http://localhost:3000/api/orders/${orderId}`);
  }
}