import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GithubService } from '../../services/github.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  isOpen = signal(false);

  constructor(public github: GithubService, private router: Router) {}

  isLoggedIn() {
    return this.github.isLoggedIn();
  }

  toggle() {
    this.isOpen.set(!this.isOpen());
  }

  logout() {
    this.github.logout();
    this.router.navigate(['/']);
  }
}
