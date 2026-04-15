import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths so the build works whether served from the root
  // (user/org Pages) or a subpath (project Pages at /<repo>/).
  base: "./",
  plugins: [react()],
  server: { port: 5173 },
});
