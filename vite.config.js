import { defineConfig } from "vite";
import { cp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const CLOUDFLARE_MAX_ASSET_BYTES = 25 * 1024 * 1024;

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
    const detectionRoot = resolve(projectRoot, "detection");
    const detectionFiles = await collectFiles(detectionRoot);
    return [
        "index.html",
        "camera-test.html",
        "script.js",
        "style.css",
        "manifest.webmanifest",
        ...assetFiles.map((filePath) => `assets/${filePath.slice(assetsRoot.length + 1).replaceAll("\\", "/")}`),
        ...detectionFiles.map((filePath) => `detection/${filePath.slice(detectionRoot.length + 1).replaceAll("\\", "/")}`),
        "node_modules/onnxruntime-web/dist/ort.wasm.bundle.min.mjs",
        "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
        "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
        modelPath
    ];
}

async function createManifest(files, urls) {
    const hash = createHash("sha256");
    const sizes = {};
    const hashes = {};
    for (let index = 0; index < files.length; index++) {
        const contents = await readFile(files[index]);
        hash.update(urls[index]);
        hash.update(contents);
        sizes[urls[index]] = contents.byteLength;
        // Git can convert text files between CRLF locally and LF on the host.
        const fingerprintContents = /\.(?:html?|js|mjs|css|svg|webmanifest|json)$/i.test(urls[index])
            ? Buffer.from(contents.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
            : contents;
        hashes[urls[index]] = createHash("sha256").update(fingerprintContents).digest("hex");
    }
    return { version: hash.digest("hex").slice(0, 20), assets: urls, sizes, hashes };
}

async function createProjectManifest(projectRoot, modelFile, modelUrl = modelFile) {
    const urls = await createRuntimeAssetList(projectRoot, modelFile);
    const files = urls.map((url) => resolve(projectRoot, url));
    urls[urls.length - 1] = modelUrl;
    return createManifest(files, urls);
}

async function validateCloudflareAssetSizes(directory) {
    const files = await collectFiles(directory);
    const fileSizes = await Promise.all(files.map(async (filePath) => ({
        filePath,
        size: (await stat(filePath)).size
    })));
    const oversizedFiles = fileSizes.filter(({ size }) => size > CLOUDFLARE_MAX_ASSET_BYTES);
    if (!oversizedFiles.length) return;

    const details = oversizedFiles
        .map(({ filePath, size }) => `- ${filePath}: ${(size / 1024 / 1024).toFixed(2)} MiB`)
        .join("\n");
    throw new Error(
        `Cloudflare Workers limits each static asset to 25 MiB. Compress or remove:\n${details}`
    );
}

export default defineConfig(({ command }) => ({
    base: "./",
    plugins: [
        ...(command === "build" ? [
        {
            name: "remove-static-server-import-map",
            transformIndexHtml(html) {
                return html.replace(/^[\t ]*<script type="importmap">[\s\S]*?<\/script>\r?\n/im, "");
            }
        },
        {
            name: "keep-manifest-at-app-root",
            transformIndexHtml: {
                order: "post",
                handler(html) {
                    return html.replace(/<link rel="manifest" href="[^"]+">/i,
                        '<link rel="manifest" href="./manifest.webmanifest">');
                }
            }
        }
        ] : []),
        {
            name: "copy-runtime-assets-and-manifest",
            configureServer(server) {
                server.middlewares.use("/runtime-assets.json", async (request, response, next) => {
                    if (request.method !== "GET") return next();
                    try {
                        const manifest = await createProjectManifest(process.cwd(), "public/models/final_model.onnx", "models/final_model.onnx");
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
                await cp(resolve(projectRoot, "sw.js"), resolve(projectRoot, "dist/sw.js"));
                await cp(resolve(projectRoot, "manifest.webmanifest"), resolve(projectRoot, "dist/manifest.webmanifest"));
                const outputRoot = resolve(projectRoot, "dist");
                const outputFiles = (await collectFiles(outputRoot))
                    .filter((file) => !/[\\/](runtime-assets\.json|sw\.js)$/.test(file))
                    .sort();
                const outputUrls = outputFiles.map((file) => file.slice(outputRoot.length + 1).replaceAll("\\", "/"));
                const [previewManifest, projectManifest] = await Promise.all([
                    createManifest(outputFiles, outputUrls),
                    createProjectManifest(projectRoot, "public/models/final_model.onnx")
                ]);
                await Promise.all([
                    writeFile(resolve(projectRoot, "dist/runtime-assets.json"), JSON.stringify(previewManifest), "utf8"),
                    writeFile(resolve(projectRoot, "runtime-assets.json"), JSON.stringify(projectManifest), "utf8")
                ]);
                await validateCloudflareAssetSizes(resolve(projectRoot, "dist"));
            }
        }
    ],
    resolve: {
        alias: [
            { find: /^onnxruntime-web$/, replacement: "onnxruntime-web/wasm" }
        ]
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(process.cwd(), "index.html"),
                cameraTest: resolve(process.cwd(), "camera-test.html")
            }
        }
    }
}));
