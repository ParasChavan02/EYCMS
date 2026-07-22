import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getFileUrl = (filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const cleanPath = filePath.replace(/\\/g, "/");
  const slashPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  const backendHost = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${backendHost}${slashPath}`;
};

export const formatDateTime = (dateVal) => {
  if (!dateVal) return "N/A";
  let str = String(dateVal);
  if (str.includes("T") && !str.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(str)) {
    str += "Z";
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

export const reportService = {
  // Upload a document / image / bill / report / UC
  uploadFile: async (category, file, eventName = "", onUploadProgress = null) => {
    const formData = new FormData();
    formData.append("category", category);
    formData.append("file", file);
    if (eventName) {
      formData.append("event_name", eventName);
    }

    const response = await api.post("/reports/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });

    return response?.data?.data ?? response?.data;
  },

  // Get all files shared across the user's project/team
  getTeamFiles: async () => {
    try {
      const response = await api.get("/reports/team-files");
      const resData = response?.data?.data ?? response?.data;
      return Array.isArray(resData) ? resData : [];
    } catch (err) {
      console.error("Error in getTeamFiles:", err);
      return [];
    }
  },

  // Delete an uploaded file (before approval or if owned/admin)
  deleteFile: async (fileId) => {
    const response = await api.delete(`/reports/files/${fileId}`);
    return response?.data?.data ?? response?.data;
  },

  // Admin: Get all uploaded files across projects/teams
  getAdminFiles: async (category = null, status = null, search = null) => {
    try {
      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await api.get("/reports/admin-files", { params });
      const resData = response?.data?.data ?? response?.data;
      return Array.isArray(resData) ? resData : [];
    } catch (err) {
      console.error("Error in getAdminFiles:", err);
      return [];
    }
  },

  // Admin Gallery: Get event images in real time
  getGalleryImages: async (search = null) => {
    try {
      const params = {};
      if (search) params.search = search;

      const response = await api.get("/reports/gallery-images", { params });
      const resData = response?.data?.data ?? response?.data;
      return Array.isArray(resData) ? resData : [];
    } catch (err) {
      console.error("Error in getGalleryImages:", err);
      return [];
    }
  },

  // Admin/Finance: Approve or Reject a file upload
  updateFileStatus: async (fileId, status, adminNotes = null) => {
    const response = await api.patch(`/reports/files/${fileId}/status`, {
      status,
      admin_notes: adminNotes,
    });
    return response?.data?.data ?? response?.data;
  },
};
