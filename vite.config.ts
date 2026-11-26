import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Mounts /api/razorpay/* handlers during local `vite` dev so Razorpay Checkout
 * can be tested end-to-end on localhost:5173 without needing `vercel dev`.
 * In production on Vercel, Vercel serves /api/* natively as Serverless Functions.
 */
function localRazorpayApiPlugin(): Plugin {
  return {
    name: 'local-razorpay-api',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '');
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];
        const routes: Record<string, string> = {
          '/api/razorpay/create-order': '/api/razorpay/create-order.ts',
          '/api/razorpay/verify-payment': '/api/razorpay/verify-payment.ts',
          '/api/razorpay/webhook': '/api/razorpay/webhook.ts',
          '/api/razorpay/entitlement': '/api/razorpay/entitlement.ts',
        };
        const target = routes[pathname];
        if (!target) return next();

        try {
          const mod = await server.ssrLoadModule(target);
          await mod.default(req, res);
        } catch (err) {
          console.error(`[local-api] ${pathname}`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localRazorpayApiPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ['@react-pdf/renderer'],
          pdfjs: ['pdfjs-dist'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
