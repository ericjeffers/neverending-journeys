import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  sha?: string;
}

@Injectable({ providedIn: 'root' })
export class GithubService {
  private readonly REPO = 'ericjeffers/neverending-journeys';
  private readonly POSTS_PATH = 'posts';
  private readonly API_BASE = 'https://api.github.com';

  isLoggedIn = signal(false);
  private token = signal('');

  constructor(private http: HttpClient) {
    // Restore session from sessionStorage
    const saved = sessionStorage.getItem('gh_token');
    if (saved) {
      this.token.set(saved);
      this.isLoggedIn.set(true);
    }
  }

  login(token: string): Promise<boolean> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    });
    return firstValueFrom(
      this.http.get<any>(`${this.API_BASE}/user`, { headers })
    ).then((user) => {
      this.token.set(token);
      this.isLoggedIn.set(true);
      sessionStorage.setItem('gh_token', token);
      return true;
    }).catch(() => false);
  }

  logout() {
    this.token.set('');
    this.isLoggedIn.set(false);
    sessionStorage.removeItem('gh_token');
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token()}`,
      Accept: 'application/vnd.github+json',
    });
  }

  async getAllPosts(): Promise<BlogPost[]> {
    try {
      const files = await firstValueFrom(
        this.http.get<any[]>(
          `${this.API_BASE}/repos/${this.REPO}/contents/${this.POSTS_PATH}`
        )
      );
      const posts = await Promise.all(
        files
          .filter((f: any) => f.name.endsWith('.md'))
          .map((f: any) => this.getPost(f.name.replace('.md', '')))
      );
      return posts
        .filter((p): p is BlogPost => p !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [];
    }
  }

  async getPost(slug: string): Promise<BlogPost | null> {
    try {
      const file = await firstValueFrom(
        this.http.get<any>(
          `${this.API_BASE}/repos/${this.REPO}/contents/${this.POSTS_PATH}/${slug}.md`
        )
      );
      const raw = atob(file.content.replace(/\n/g, ''));
      return { ...this.parseMarkdown(raw, slug), sha: file.sha };
    } catch {
      return null;
    }
  }

  async createPost(title: string, content: string, excerpt: string): Promise<boolean> {
    const date = new Date().toISOString().split('T')[0];
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `${date}-${slug}.md`;
    const body = `---\ntitle: ${title}\ndate: ${date}\nexcerpt: ${excerpt}\n---\n\n${content}`;
    const encoded = btoa(unescape(encodeURIComponent(body)));

    try {
      await firstValueFrom(
        this.http.put(
          `${this.API_BASE}/repos/${this.REPO}/contents/${this.POSTS_PATH}/${filename}`,
          { message: `Add blog post: ${title}`, content: encoded },
          { headers: this.headers }
        )
      );
      return true;
    } catch {
      return false;
    }
  }

  private parseMarkdown(raw: string, slug: string): BlogPost {
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      const fm = fmMatch[1];
      const content = fmMatch[2].trim();
      const get = (key: string) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
      return { slug, title: get('title'), date: get('date'), excerpt: get('excerpt'), content };
    }
    return { slug, title: slug, date: '', excerpt: '', content: raw };
  }
}
