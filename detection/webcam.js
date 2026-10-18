
let cameraStream = null;
let cameraRequestId = 0;

export async function startWebcam(videoElement) {
    if (!videoElement) {
        throw new Error("Video element not found!");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is unavailable. Open this page over HTTPS or localhost in a browser that supports webcam access.");
    }

    // Stop any previously opened camera.
    stopWebcam();
    const requestId = ++cameraRequestId;

    console.log("Requesting camera permission...");

    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
        },
        audio: false
    });

    if (requestId !== cameraRequestId) {
        stream.getTracks().forEach(track => track.stop());
        throw new DOMException("Camera start cancelled.", "AbortError");
    }
    cameraStream = stream;

    console.log("Camera permission granted!");

    videoElement.srcObject = cameraStream;
    videoElement.muted = true;
    videoElement.playsInline = true;

    try {
        await videoElement.play();
    } catch (error) {
        stream.getTracks().forEach(track => track.stop());
        if (cameraStream === stream) cameraStream = null;
        if (videoElement.srcObject === stream) videoElement.srcObject = null;
        throw error;
    }

    console.log("Webcam started successfully!");

    return cameraStream;
}

export function stopWebcam() {
    cameraRequestId++;
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}
