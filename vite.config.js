import { defineConfig } from "vite";
import { cp, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function collectFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nestedFiles = await Promise.all(entries.map(async (entry) => {
        const entryPath = resolve(directory, entry.name);
        return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
    }));
    return nestedFiles.flat();
}

async function createRuntimeAssetList(projectRoot, modelPath) {
    const assetsRoot = resolve(projectRoot, "assets");
    const assetFiles = await collectFiles(assetsRoot);
    return [
        ...assetFiles.map((filePath) => `/assets/${filePath.slice(assetsRoot.length + 1).replaceAll("\\", "/")}`),
        modelPath
    ];
}

export default defineConfig(({ command }) => ({
    plugins: [
        ...(command === "build" ? [
        {
            name: "remove-static-server-import-map",
            transformIndexHtml(html) {
                return html.replace(/^[\t ]*<script type="importmap">[\s\S]*?<\/script>\r?\n/im, "");
            }
        }
        ] : []),
        {
            name: "copy-runtime-assets-and-manifest",
            configureServer(server) {
                server.middlewares.use("/runtime-assets.json", async (request, response, next) => {
                    if (request.method !== "GET") return next();
                    try {
                        const manifest = await createRuntimeAssetList(process.cwd(), "/models/final_model.onnx");
                        response.statusCode = 200;
                        response.setHeader("Content-Type", "application/json; charset=utf-8");
                        response.end(JSON.stringify(manifest));
                    } catch (error) {
                        next(error);
                    }
                });
            },
            async closeBundle() {
                const projectRoot = process.cwd();
                const assetsSource = resolve(projectRoot, "assets");
                const assetsOutput = resolve(projectRoot, "dist/assets");
                await cp(
                    assetsSource,
                    assetsOutput,
                    { recursive: true, force: true }
                );
                const [previewManifest, projectManifest] = await Promise.all([
                    createRuntimeAssetList(projectRoot, "/models/final_model.onnx"),
                    createRuntimeAssetList(projectRoot, "/public/models/final_model.onnx")
                ]);
                const manifestContents = JSON.stringify(previewManifest);
                await Promise.all([
                    writeFile(resolve(projectRoot, "dist/runtime-assets.json"), manifestContents, "utf8"),
                    writeFile(resolve(projectRoot, "runtime-assets.json"), JSON.stringify(projectManifest), "utf8")
                ]);
            }
        }
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(process.cwd(), "index.html"),
                cameraTest: resolve(process.cwd(), "camera-test.html")
            }
        }
    }
}));
