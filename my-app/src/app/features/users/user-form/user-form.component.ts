import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-form',
  template: `<ng-container></ng-container>`
})
export class UserFormComponent {
  constructor(private router: Router) {
    this.router.navigate(['/users']);
  }
}
