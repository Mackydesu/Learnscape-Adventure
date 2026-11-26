import { defineConfig } from "vite";
import { cp, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
    const detectionRoot = resolve(projectRoot, "detection");
    const detectionFiles = await collectFiles(detectionRoot);
    return [
        "index.html",
        "camera-test.html",
        "script.js",
        "style.css",
        "manifest.webmanifest",
        "service-worker.js",
        ...assetFiles.map((filePath) => `assets/${filePath.slice(assetsRoot.length + 1).replaceAll("\\", "/")}`),
        ...detectionFiles.map((filePath) => `detection/${filePath.slice(detectionRoot.length + 1).replaceAll("\\", "/")}`),
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

export default defineConfig(({ command }) => {
    const cacheControlHeaders = {
        // Asset filenames are deliberately human-readable, so never let the
        // local server keep an older audio or image after it is replaced.
        "Cache-Control": "no-store, max-age=0, must-revalidate"
    };
    const buildAssetRevision = `build-${Date.now().toString(36)}`;

    return {
    base: "./",
    plugins: [
        {
            name: "revision-local-media-urls",
            transformIndexHtml(html) {
                // A fresh revision is generated for every development page
                // request. Builds receive one revision that stays consistent
                // for the published release.
                const revision = command === "serve"
                    ? `dev-${Date.now().toString(36)}`
                    : buildAssetRevision;
                return html
                    .replace('content="__LEARNSCAPE_ASSET_REVISION__"', `content="${revision}"`)
                    .replace(/(style\.css|script\.js|detection\/init\.js)\?v=[^"'\s>]+/g, `$1?v=${revision}`);
            }
        },
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
                const outputRoot = resolve(projectRoot, "dist");
                const assetsSource = resolve(projectRoot, "assets");
                const assetsOutput = resolve(projectRoot, "dist/assets");
                await cp(
                    assetsSource,
                    assetsOutput,
                    { recursive: true, force: true }
                );
                await cp(resolve(projectRoot, "manifest.webmanifest"), resolve(projectRoot, "dist/manifest.webmanifest"));
                await cp(resolve(projectRoot, "service-worker.js"), resolve(projectRoot, "dist/service-worker.js"));
                // Vite serves files in public/ verbatim. Keep an old public
                // script from shadowing the current application script.
                await cp(resolve(projectRoot, "script.js"), resolve(outputRoot, "script.js"), { force: true });
                const outputFiles = (await collectFiles(outputRoot))
                    .filter((file) => !/[\\/]runtime-assets\.json$/.test(file))
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
    },
    server: {
        headers: cacheControlHeaders
    },
    preview: {
        headers: cacheControlHeaders
    }
};
});
