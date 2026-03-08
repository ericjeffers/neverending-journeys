import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GithubService, BlogPost } from '../../services/github.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './blog.html',
})
export class Blog implements OnInit {
  posts = signal<BlogPost[]>([]);
  loading = signal(true);
  defaultImage: string;

  constructor(private github: GithubService) {
    this.defaultImage = this.github.DEFAULT_IMAGE;
  }

  async ngOnInit() {
    this.posts.set(await this.github.getAllPosts());
    this.loading.set(false);
  }
}
