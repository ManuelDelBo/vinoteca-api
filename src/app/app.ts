import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { ModalHost } from './shared/modal/modal-host';

@Component({
  imports: [RouterOutlet, Header, Footer, ModalHost],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('vinoteca-api');
}
