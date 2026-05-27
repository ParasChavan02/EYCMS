import { useState, useRef, useEffect } from "react";
import "./profileAvatarUpload.css";

function ProfileAvatarUpload() {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const fileInputRef = useRef(null);

  // Load saved image on mount
  useEffect(() => {
    const savedImage = localStorage.getItem("userProfileImage");
    if (savedImage) {
      setPreview(savedImage);
    }
  }, []);

  const showMessage = (message) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
        // Save to localStorage
        localStorage.setItem("userProfileImage", event.target.result);
        showMessage("✅ Image saved successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setFileName("");
    fileInputRef.current.value = "";
    localStorage.removeItem("userProfileImage");
    showMessage("✅ Image removed successfully!");
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="avatar-upload-card">
      <div className="card-header">
        <h2 className="card-title">🖼️ Profile Image</h2>
      </div>

      <div className="upload-container">
        <div className="preview-section">
          {preview ? (
            <div className="preview-image">
              <img src={preview} alt="Profile Preview" />
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="placeholder-icon">📸</div>
              <p className="placeholder-text">No image selected</p>
            </div>
          )}
          {fileName && <p className="file-name">📄 {fileName}</p>}
        </div>

        <div className="upload-actions">
          <button className="btn-upload" onClick={handleUploadClick}>
            📤 Upload Image
          </button>
          {preview && (
            <button className="btn-remove" onClick={handleRemoveImage}>
              🗑️ Remove
            </button>
          )}
          {saveMessage && <p className="save-message">{saveMessage}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        <div className="upload-info">
          <p className="info-text">
            📋 <strong>Supported formats:</strong> JPG, PNG, GIF, WebP
          </p>
          <p className="info-text">
            ⚠️ <strong>Max file size:</strong> 5MB
          </p>
          <p className="info-text">
            💡 <strong>Recommended:</strong> Square images (1:1 aspect ratio)
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfileAvatarUpload;
