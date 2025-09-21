import { RenderMode, ServerRoute } from '@angular/ssr';

// Server-side rendering configuration.
// We prerender all static, non-parameterized routes via the catch-all below, but we must
// explicitly opt out dynamic parameter routes that cannot be enumerated at build time.
// The Angular build failed with:
//  "The 'dashboard/contracts/:id' route uses prerendering and includes parameters, but 'getPrerenderParams' is missing."
// For now we disable prerender for that route (serve it via client rendering) to unblock CI.
// If later we want to prerender a finite subset, we can either:
//  1. Replace this exclusion with a ServerRoute providing getPrerenderParams, or
//  2. Implement a data-driven enumeration (e.g., recent contract ids) during build.

export const serverRoutes: ServerRoute[] = [
  {
    path: 'dashboard/contracts/:id',
    renderMode: RenderMode.Client, // dynamic; skip prerender
  },
  {
    path: 'sign/:token',
    renderMode: RenderMode.Client, // dynamic public signing link; skip prerender
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
