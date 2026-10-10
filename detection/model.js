
import * as ort from "onnxruntime-web/wasm";

let session = null;

export async function loadModel() {
    if (session) return session;

    try {
        console.log("Loading YOLO11n ONNX model...");

        session = await ort.InferenceSession.create(
            "/models/final_model.onnx",
            {
                executionProviders: ["wasm"]
            }
        );

        console.log("ONNX model loaded successfully!");
        console.log("Input:", session.inputNames);
        console.log("Output:", session.outputNames);

        return session;

    } catch (error) {
        console.error("Failed to load ONNX model:", error);
        throw error;
    }
}
