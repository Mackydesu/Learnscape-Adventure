import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(process.cwd(), "index.html"),
                cameraTest: resolve(process.cwd(), "camera-test.html")
            }
        }
    }
});
