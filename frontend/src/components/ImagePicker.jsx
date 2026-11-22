import { useEffect, useRef, useState } from "react";

const MAX_SIDE = 1280; // longest side in pixels after shrinking
const JPEG_QUALITY = 0.85;

// Phones and tablets: use the phone's own camera app (better photos).
const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(pointer: coarse)").matches;

/**
 * Shrinks a photo to at most MAX_SIDE pixels and converts it to JPEG,
 * so big phone photos stay under the server's 2 MB limit.
 */
async function shrinkImage(file) {
  if (!file || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;
    const name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Laptop/desktop: live webcam preview with a "Take photo" button. */
function WebcamModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(async (s) => {
        stream = s;
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setError(
          err && err.name === "NotAllowedError"
            ? "Camera permission was blocked. Allow camera access in your browser settings and try again."
            : "Could not open the camera on this device."
        );
      });
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 2000 }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-camera me-2"></i>Take photo
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body text-center">
            {error ? (
              <div className="alert alert-danger mb-0">{error}</div>
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: "100%", borderRadius: "8px", background: "#000" }}
              />
            )}
          </div>
          {!error && (
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={takePhoto}>
                <i className="fa-solid fa-camera me-1"></i> Take photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Product photo field: preview + "Choose photo" + "Take photo".
 * - value: the selected File (or null)
 * - onChange(file): called with the new (already shrunk) File, or null when removed
 * - currentUrl: existing photo to show when nothing new is picked (optional)
 */
export default function ImagePicker({ value, onChange, currentUrl }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    onChange(await shrinkImage(file));
    setBusy(false);
  };

  const openCamera = () => {
    if (isTouchDevice()) cameraInputRef.current?.click();
    else setShowWebcam(true);
  };

  const shown = preview || currentUrl;

  return (
    <div>
      {shown && (
        <div className="mb-2 text-center">
          <img
            src={shown}
            alt="Product"
            style={{ maxHeight: "160px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }}
          />
        </div>
      )}

      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary flex-grow-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          <i className="fa-solid fa-image me-1"></i> Choose photo
        </button>
        <button
          type="button"
          className="btn btn-outline-primary flex-grow-1"
          onClick={openCamera}
          disabled={busy}
        >
          <i className="fa-solid fa-camera me-1"></i> Take photo
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => onChange(null)}
            title="Remove new photo"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>
      {busy && <small className="text-muted d-block mt-1">Preparing photo…</small>}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          handleFile(e.target.files[0]);
          e.target.value = "";
        }}
      />

      {showWebcam && (
        <WebcamModal
          onClose={() => setShowWebcam(false)}
          onCapture={(file) => {
            setShowWebcam(false);
            handleFile(file);
          }}
        />
      )}
    </div>
  );
}
