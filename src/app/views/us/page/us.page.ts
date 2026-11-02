import { Component, OnInit } from '@angular/core';
import { AppLayoutComponent } from '../../../shared/app-layout/app-layout.component';

@Component({
  selector: 'app-us',
  standalone: true,
  imports: [AppLayoutComponent],
  template: `<app-layout></app-layout>`,
})
export class USPage implements OnInit {
  constructor(private layout: AppLayoutComponent) {}

  ngOnInit() {
    this.layout.setTitle('Nosotros');
  }
}
