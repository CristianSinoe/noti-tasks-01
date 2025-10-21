import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(FormsModule),

    // 👉 Forzar locale español (México) para pipes de fecha, números, etc.
    { provide: LOCALE_ID, useValue: 'es-MX' }
  ]
};
