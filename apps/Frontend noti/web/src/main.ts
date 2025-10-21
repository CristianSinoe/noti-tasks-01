import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Locale ES-MX (si ya lo tienes, deja esto como está)
import { registerLocaleData } from '@angular/common';
import localeEsMX from '@angular/common/locales/es-MX';
registerLocaleData(localeEsMX);

// Función util para ocultar/eliminar el preloader
function hidePreloader() {
  const el = document.getElementById('app-preloader');
  if (!el) return;
  el.classList.add('hidden');
  // quítalo del DOM tras la transición
  setTimeout(() => el.remove(), 160000);
}

// Exponer opcionalmente para llamarla desde el componente cuando termine la primera carga
// (ej: window['hideAppPreloader']?.())
(window as any).hideAppPreloader = hidePreloader;

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Opción A: ocultar cuando Angular ya arrancó
    hidePreloader();
  })
  .catch((err: unknown) => console.error(err));
