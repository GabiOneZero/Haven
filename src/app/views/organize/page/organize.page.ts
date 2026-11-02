import { Component, OnInit } from '@angular/core';
import { AppLayoutComponent } from '../../../shared/app-layout/app-layout.component';

@Component({
  selector: 'app-organize',
  standalone: true,
  imports: [AppLayoutComponent],
  template: `<app-layout></app-layout>`,
})
export class OrganizePage implements OnInit {
  constructor(private layout: AppLayoutComponent) {}

  ngOnInit() {
    this.layout.setTitle('Organizar');
  }
}
