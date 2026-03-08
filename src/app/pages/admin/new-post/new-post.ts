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

  imageFile: File | null = null;
  imagePreview = signal<string | null>(null);
  imageUploading = signal(false);
  uploadedImageUrl = signal<string | null>(null);

  loading = signal(false);
  success = signal(false);
  error = signal(false);

  constructor(private github: GithubService) {}

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.imageFile = file;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to GitHub in the background
    this.uploadImage(file);
  }

  async uploadImage(file: File) {
    this.imageUploading.set(true);
    const url = await this.github.uploadImage(file);
    if (url) {
      this.uploadedImageUrl.set(url);
    } else {
      this.imagePreview.set(null);
      this.imageFile = null;
      alert('Image upload failed. Please check your token has repo write access and try again.');
    }
    this.imageUploading.set(false);
  }

  removeImage() {
    this.imageFile = null;
    this.imagePreview.set(null);
    this.uploadedImageUrl.set(null);
  }

  async publish() {
    if (!this.title.trim() || !this.content.trim()) return;
    if (this.imageUploading()) return;

    this.loading.set(true);
    this.success.set(false);
    this.error.set(false);

    // If no image uploaded, pass empty string — service will omit it from front matter
    // and the blog pages will fall back to the default image
    const imageUrl = this.uploadedImageUrl() ?? '';
    const ok = await this.github.createPost(this.title, this.content, this.excerpt, imageUrl);

    if (ok) {
      this.success.set(true);
      this.title = '';
      this.excerpt = '';
      this.content = '';
      this.imageFile = null;
      this.imagePreview.set(null);
      this.uploadedImageUrl.set(null);
    } else {
      this.error.set(true);
    }
    this.loading.set(false);
  }
}
