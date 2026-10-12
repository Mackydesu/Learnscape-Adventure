
import * as ort from "onnxruntime-web/wasm";

let session = null;

export async function loadModel() {
    if (session) return session;

    try {
        console.log("Loading YOLO11n ONNX model...");

        let loadError = null;
        for (const modelUrl of ["/models/final_model.onnx", "/public/models/final_model.onnx"]) {
            try {
                session = await ort.InferenceSession.create(modelUrl, {
                    executionProviders: ["wasm"]
                });
                break;
            } catch (error) {
                loadError = error;
            }
        }
        if (!session) throw loadError || new Error("The shape detection model could not be loaded.");

        console.log("ONNX model loaded successfully!");
        console.log("Input:", session.inputNames);
        console.log("Output:", session.outputNames);

        return session;

    } catch (error) {
        console.error("Failed to load ONNX model:", error);
        throw error;
    }
}
