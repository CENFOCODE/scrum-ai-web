import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { baseUrlInterceptor } from './interceptors/base-url.interceptor';
import { accessTokenInterceptor } from './interceptors/access-token.interceptor';
import { handleErrorsInterceptor } from './interceptors/handle-errors.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { importProvidersFrom } from '@angular/core';
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideMarkdown(),
    provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        accessTokenInterceptor,
        //handleErrorsInterceptor
      ])
    ), 
    provideAnimationsAsync(),
    importProvidersFrom(
      LoggerModule.forRoot({
        level: NgxLoggerLevel.DEBUG,
        serverLogLevel: NgxLoggerLevel.ERROR
      })
    )
  ]
};
