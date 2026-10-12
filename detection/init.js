import { loadModel } from "./model.js";
import { initializeGameCameraDetection } from "./gameDetection.js";

console.log("Starting ONNX initialization...");
const modelReady = loadModel();
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
