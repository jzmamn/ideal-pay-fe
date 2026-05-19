import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-employee-parent',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './employee-parent.html',
  styleUrl: './employee-parent.scss',
})
export class EmployeeParent {}
