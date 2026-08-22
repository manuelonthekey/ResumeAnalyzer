import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
  preferred_roles?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/v1/auth';
  
  // Using Angular 16+ Signals for global state
  public user = signal<User | null>(null);
  public token = signal<string | null>(null);
  public isAuthenticated = signal<boolean>(false);
  public isAuthLoading = signal<boolean>(true);

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuth();
  }

  checkAuth() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.user.set(JSON.parse(savedUser));
      this.isAuthenticated.set(true);
    }
    this.isAuthLoading.set(false);
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        const userObj = { id: res.id, email: res.email, name: res.name };
        this.user.set(userObj);
        this.token.set(res.token);
        this.isAuthenticated.set(true);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(userObj));
        this.router.navigate(['/dashboard']);
      })
    );
  }

  register(userData: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(() => this.login({ email: userData.email, password: userData.password }))
    );
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
