import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GithubService } from '../../../services/github.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  tokenInput = '';
  loading = signal(false);
  error = signal(false);

  constructor(private github: GithubService, private router: Router) {}

  async login() {
    if (!this.tokenInput.trim()) return;
    this.loading.set(true);
    this.error.set(false);
    const success = await this.github.login(this.tokenInput.trim());
    if (success) {
      this.router.navigate(['/admin/new-post']);
    } else {
      this.error.set(true);
    }
    this.loading.set(false);
  }
}
