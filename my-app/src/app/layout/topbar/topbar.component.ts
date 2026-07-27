import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  constructor(public auth: AuthService) {}

  get initials(): string {
    const u = this.auth.currentUser;
    if (!u) return 'AU';
    return u.username.split(/[._]/).map(s => s[0]?.toUpperCase() || '').join('').slice(0, 2) || 'AU';
  }
}
