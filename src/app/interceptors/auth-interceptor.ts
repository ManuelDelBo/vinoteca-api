import { HttpInterceptorFn } from '@angular/common/http';

const API_URL = 'http://localhost:8081';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url.startsWith(API_URL);
  
  const isAuthRequest = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')

  const token = localStorage.getItem('token')

  if(!isApiRequest || !token || isAuthRequest){
    return next(req)
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  })

  return next(authenticatedRequest)
};
