import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GithubService } from '../../../services/github.service';

@Component({
  selector: 'app-new-post',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './new-post.html',
})
export class NewPost {
  title = '';
  excerpt = '';
  content = '';
  loading = signal(false);
  success = signal(false);
  error = signal(false);

  constructor(private github: GithubService) {}

  async publish() {
    if (!this.title.trim() || !this.content.trim()) return;
    this.loading.set(true);
    this.success.set(false);
    this.error.set(false);

    const ok = await this.github.createPost(this.title, this.content, this.excerpt);
    if (ok) {
      this.success.set(true);
      this.title = '';
      this.excerpt = '';
      this.content = '';
    } else {
      this.error.set(true);
    }
    this.loading.set(false);
  }
}
