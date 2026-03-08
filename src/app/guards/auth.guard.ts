import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GithubService } from '../services/github.service';

export const authGuard: CanActivateFn = () => {
  const github = inject(GithubService);
  const router = inject(Router);

  if (github.isLoggedIn()) {
    return true;
  }
  router.navigate(['/admin/login']);
  return false;
};
