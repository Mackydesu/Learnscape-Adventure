import { loadModel } from "./model.js";

async function initializeDetection() {
    try {
        console.log("Starting ONNX initialization...");

        const session = await loadModel();

        console.log("YOLO11n model is ready!");
        console.log("Input names:", session.inputNames);
        console.log("Output names:", session.outputNames);

    } catch (error) {
        console.error("ONNX initialization error:", error);
    }
}

initializeDetection();