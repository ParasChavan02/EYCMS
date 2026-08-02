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

const unwrap = (response) => response?.data?.data ?? response?.data;

export const ucAdminService = {
  async listRecords() {
    const response = await api.get("/admin/uc");
    return Array.isArray(unwrap(response)) ? unwrap(response) : [];
  },

  async getRecord(recordId) {
    const response = await api.get(`/admin/uc/${recordId}`);
    return unwrap(response);
  },

  async createRecord(payload) {
    const response = await api.post("/admin/uc", payload);
    return unwrap(response);
  },

  async updateRecord(recordId, payload) {
    const response = await api.put(`/admin/uc/${recordId}`, payload);
    return unwrap(response);
  },

  async submitRecord(recordId) {
    const response = await api.post(`/admin/uc/${recordId}/submit`);
    return unwrap(response);
  },

  async listVersions(recordId) {
    const response = await api.get(`/admin/uc/${recordId}/versions`);
    return Array.isArray(unwrap(response)) ? unwrap(response) : [];
  },

  async uploadSupportingDocument(recordId, file, documentType) {
    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file);
    const response = await api.post(`/admin/uc/${recordId}/supporting-documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
  },

  async uploadGeneratedPdf(recordId, blob, fileName = "official_uc.pdf") {
    const formData = new FormData();
    formData.append("file", new File([blob], fileName, { type: "application/pdf" }));
    const response = await api.post(`/admin/uc/${recordId}/generated-pdf`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
  },

  async listSubmittedUCs() {
    const response = await api.get("/admin/uc/submitted");
    return Array.isArray(unwrap(response)) ? unwrap(response) : [];
  },

  async updateSubmittedUCStatus(ucId, status, adminNotes = null) {
    const response = await api.patch(`/admin/uc/submitted/${ucId}/status`, {
      status,
      admin_notes: adminNotes
    });
    return unwrap(response);
  },
};
