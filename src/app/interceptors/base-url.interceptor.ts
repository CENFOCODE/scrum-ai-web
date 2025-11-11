import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const base: string = environment.apiUrl;

  // Headers especiales para ngrok
  const headers: any = {
    Accept: 'application/json',
  };

  // Si estamos usando ngrok, agregar el header necesario
  if (base.includes('ngrok-free.app,') || base.includes('ngrok-free.dev')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const clonedRequest = req.clone({
    url: `${base}/${req.url}`,
    setHeaders: headers,
  });

  return next(clonedRequest);
};
