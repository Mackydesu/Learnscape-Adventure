import { loadModel } from "./model.js";
import { initializeGameCameraDetection } from "./gameDetection.js";

console.log("Starting ONNX initialization...");
const modelReady = loadModel();
initializeGameCameraDetection(modelReady);

modelReady.then(session => {
    console.log("YOLO11n model is ready!");
    console.log("Input names:", session.inputNames);
    console.log("Output names:", session.outputNames);
}).catch(error => {
    console.error("ONNX initialization error:", error);
});
