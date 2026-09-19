import { identityProxy } from '@mercure/platform-frontend-identity-feature/auth';

export default identityProxy;

export const config = {
  matcher: [
    '/((?!api/auth(?:/|$)|auth/(?:sign-in|forbidden|error)(?:/|$)|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
