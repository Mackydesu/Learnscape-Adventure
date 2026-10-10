
let cameraStream = null;

export async function startWebcam(videoElement) {
    if (!videoElement) {
        throw new Error("Video element not found!");
    }

    // Stop any previously opened camera.
    stopWebcam();

    console.log("Requesting camera permission...");

    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
        },
        audio: false
    });

    console.log("Camera permission granted!");

    videoElement.srcObject = cameraStream;
    videoElement.muted = true;
    videoElement.playsInline = true;

    await videoElement.play();

    console.log("Webcam started successfully!");

    return cameraStream;
}

export function stopWebcam() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}
