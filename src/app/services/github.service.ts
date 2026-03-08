import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  image?: string;
  sha?: string;
}

@Injectable({ providedIn: 'root' })
export class GithubService {
  private readonly REPO = 'ericjeffers/neverending-journeys';
  private readonly POSTS_PATH = 'posts';
  private readonly IMAGES_PATH = 'assets/blog-images';
  private readonly API_BASE = 'https://api.github.com';
  private readonly RAW_BASE = 'https://raw.githubusercontent.com';
  readonly DEFAULT_IMAGE = `https://raw.githubusercontent.com/ericjeffers/neverending-journeys/main/assets/blog-images/default.jpg`;

  isLoggedIn = signal(false);
  private token = signal('');

  constructor(private http: HttpClient) {
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
    ).then(() => {
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

  async uploadImage(file: File): Promise<string | null> {
    try {
      const base64 = await this.fileToBase64(file);
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const filename = `${timestamp}-${safeName}`;

      await firstValueFrom(
        this.http.put(
          `${this.API_BASE}/repos/${this.REPO}/contents/${this.IMAGES_PATH}/${filename}`,
          { message: `Upload blog image: ${filename}`, content: base64 },
          { headers: this.headers }
        )
      );

      return `${this.RAW_BASE}/${this.REPO}/main/${this.IMAGES_PATH}/${filename}`;
    } catch {
      return null;
    }
  }

  async createPost(title: string, content: string, excerpt: string, imageUrl: string): Promise<boolean> {
    const date = new Date().toISOString().split('T')[0];
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `${date}-${slug}.md`;
    const imageLine = imageUrl ? `\nimage: ${imageUrl}` : '';
    const body = `---\ntitle: ${title}\ndate: ${date}\nexcerpt: ${excerpt}${imageLine}\n---\n\n${content}`;
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

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private parseMarkdown(raw: string, slug: string): BlogPost {
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      const fm = fmMatch[1];
      const content = fmMatch[2].trim();
      const get = (key: string) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
      return {
        slug,
        title: get('title'),
        date: get('date'),
        excerpt: get('excerpt'),
        image: get('image') || undefined,
        content,
      };
    }
    return { slug, title: slug, date: '', excerpt: '', content: raw };
  }
}
