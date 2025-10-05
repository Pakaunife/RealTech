import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<any[]>('/api/admin/users');
  }

  blockUser(id: number) {
    return this.http.patch(`/api/admin/users/${id}/block`, {});
  }

  setAdmin(id: number, makeAdmin: boolean) {
    return this.http.patch(`/api/admin/users/${id}/admin`, { makeAdmin });
  }
}