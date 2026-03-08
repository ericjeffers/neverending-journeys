import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GithubService, BlogPost as Post } from '../../services/github.service';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './blog-post.html',
})
export class BlogPost implements OnInit {
  post = signal<Post | null>(null);
  loading = signal(true);

  constructor(private route: ActivatedRoute, private github: GithubService) {}

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.post.set(await this.github.getPost(slug));
    this.loading.set(false);
  }
}
