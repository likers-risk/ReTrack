import { useEffect, useRef, useState } from "react";
import { BarcodeDetector, prepareZXingModule } from "barcode-detector/ponyfill";
import zxingWasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

// Load the barcode engine from our own site instead of an outside CDN.
prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) =>
      path.endsWith(".wasm") ? zxingWasmUrl : prefix + path,
  },
});

const FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "itf",
  "codabar",
  "qr_code",
];

/**
 * Opens the camera and calls onDetected(code) once a barcode is read.
 * Works on phones and laptops. Needs https (or localhost) for camera access.
 */
export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream;
    let timer;
    let stopped = false;
    const detector = new BarcodeDetector({ formats: FORMATS });

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (stopped) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const scan = async () => {
          if (stopped) return;
          try {
            if (video.readyState >= 2) {
              const codes = await detector.detect(video);
              if (codes.length > 0 && codes[0].rawValue) {
                stopped = true;
                if (navigator.vibrate) navigator.vibrate(100);
                onDetected(codes[0].rawValue.trim());
                return;
              }
            }
          } catch {
            // ignore a bad frame and keep scanning
          }
          timer = setTimeout(scan, 250);
        };
        scan();
      } catch (err) {
        console.error("Camera error:", err);
        setError(
          err && err.name === "NotAllowedError"
            ? "Camera permission was blocked. Allow camera access in your browser settings and try again."
            : "Could not open the camera on this device."
        );
      }
    };

    start();

    return () => {
      stopped = true;
      clearTimeout(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-camera me-2"></i>Scan barcode
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body text-center">
            {error ? (
              <div className="alert alert-danger mb-0">{error}</div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ width: "100%", borderRadius: "8px", background: "#000" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "10%",
                      right: "10%",
                      top: "40%",
                      height: "20%",
                      border: "3px solid #22c55e",
                      borderRadius: "8px",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <small className="text-muted d-block mt-2">
                  Hold the barcode inside the green box.
                </small>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
