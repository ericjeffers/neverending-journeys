import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { Quote } from './pages/quote/quote';
import { Blog } from './pages/blog/blog';
import { BlogPost } from './pages/blog-post/blog-post';
import { Login } from './pages/admin/login/login';
import { NewPost } from './pages/admin/new-post/new-post';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'quote', component: Quote },
  { path: 'blog', component: Blog },
  { path: 'blog/:slug', component: BlogPost },
  { path: 'admin/login', component: Login },
  { path: 'admin/new-post', component: NewPost, canActivate: [authGuard] },
];
