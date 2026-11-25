import { loadModel } from "./model.js";
import { initializeGameCameraDetection } from "./gameDetection.js?v=20261121-04";

console.log("Starting ONNX initialization...");
// The model and its WASM runtime are part of the startup asset package.
// Starting detection afterward lets it use the completed cache, including offline.
const modelReady = Promise.resolve(window.__learnscapeAssetsReady)
    .catch((error) => {
        // The cache warmer is optional. When a release briefly serves a stale
        // asset manifest, load the model from the network instead of disabling
        // camera detection along with the rest of the game.
        console.warn("Runtime asset cache failed; loading the detection model directly.", error);
    })
    .then(() => loadModel());
initializeGameCameraDetection(modelReady);

const signalDetectionReady = (ready, error = null) => {
    window.__learnscapeDetectionReady = true;
    window.dispatchEvent(new CustomEvent("learnscape:detectionready", {
        detail: { ready, error: error?.message || null }
    }));
};

modelReady.then(session => {
    console.log("YOLO11n model is ready!");
    console.log("Input names:", session.inputNames);
    console.log("Output names:", session.outputNames);
    signalDetectionReady(true);
}).catch(error => {
    console.error("ONNX initialization error:", error);
    signalDetectionReady(false, error);
});
