declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string | undefined;
    VITE_SUPABASE_URL: string | undefined;
    VITE_SUPABASE_ANON_KEY: string | undefined;
    [key: string]: string | undefined;
  }
}