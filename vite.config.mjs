import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      redux3: path.resolve(__dirname, "node_modules/redux3"),
      "react-redux5": path.resolve(__dirname, "node_modules/react-redux5"),
    },
  },
});
