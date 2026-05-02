import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

const __rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Always load .env from the folder that contains this config (project root), not process.cwd()
  // (Tauri / nested cwd would otherwise miss .env → empty VITE_* → blank screen from supabase init).
  const env = loadEnv(mode, __rootDir, "");
  /** `.env` files + shell/CI env (GitHub Actions secrets must be merged here or release installers embed empty keys). */
  const pick = (name: string) =>
    String((env as Record<string, string | undefined>)[name] ?? process.env[name] ?? "");

  return {
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__rootDir, "./src"),
      stream: path.resolve(__rootDir, "./src/shims/stream.ts"),
    },
  },
  define: {
    // 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://ypdlbqrcxnugrvllbmsi.supabase.co'),
    // 'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZGxicXJjeG51Z3J2bGxibXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1OTI2MDcsImV4cCI6MjA4MzE2ODYwN30.7fc-jebaFfmCKEjC2RicQNlrXQc-iOq7ZSy46HQwM90'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(pick('VITE_SUPABASE_URL')),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(pick('VITE_SUPABASE_ANON_KEY')),
    'import.meta.env.VITE_APP_NAME': JSON.stringify('Engineering Project Management'),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('1.0.0'),
    // EmailJS Configuration - Loaded from .env file
    'import.meta.env.VITE_EMAILJS_SERVICE_ID': JSON.stringify(pick('VITE_EMAILJS_SERVICE_ID')),
    'import.meta.env.VITE_EMAILJS_TEMPLATE_ID': JSON.stringify(pick('VITE_EMAILJS_TEMPLATE_ID')),
    'import.meta.env.VITE_EMAILJS_PUBLIC_KEY': JSON.stringify(pick('VITE_EMAILJS_PUBLIC_KEY')),
  },
  };
});

