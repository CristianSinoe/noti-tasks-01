import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueAt: string; // ISO string
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'DONE';
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private base = `${environment.API_URL}/tasks`;
  constructor(private http: HttpClient) {}
  list() { return this.http.get<Task[]>(this.base); }
  get(id: string) { return this.http.get<Task>(`${this.base}/${id}`); }
  create(dto: Partial<Task>) { return this.http.post<Task>(this.base, dto); }
  update(id: string, dto: Partial<Task>) { return this.http.put<Task>(`${this.base}/${id}`, dto); }
  remove(id: string) { return this.http.delete(`${this.base}/${id}`); }
  submit(id: string) { return this.http.post<Task>(`${this.base}/${id}/submit`, {}); }
}
