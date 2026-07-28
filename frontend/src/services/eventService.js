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

function extractResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function normalizeEvent(event) {
  if (!event) {
    return null;
  }

  const normalizeStatus = (value) => {
    const status = String(value || "UPCOMING").toUpperCase();
    switch (status) {
      case "UPCOMING":
        return "Upcoming";
      case "ONGOING":
        return "Ongoing";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return String(value || "Upcoming");
    }
  };

  return {
    id: event.id,
    eventId: event.eventId || event.event_id || event.eventID || event.event_id,
    event_id: event.eventId || event.event_id || event.eventID || event.event_id,
    title: event.title || "",
    type: event.eventType || event.type || "",
    date: event.date || "",
    time: event.time || "",
    event_date: event.date && event.time ? `${event.date}T${event.time}Z` : (event.event_date || event.date || ""),
    venue: event.venue || "",
    coordinator: event.coordinator || event.coordinator_name || "",
    coordinator_name: event.coordinator || event.coordinator_name || "",
    description: event.description || "",
    status: normalizeStatus(event.status),
    createdBy: event.createdBy || event.created_by || "Unknown",
    createdAt: event.createdAt || event.created_at || null,
    updatedAt: event.updatedAt || event.updated_at || null,
    cancelledBy: event.cancelledBy || event.cancelled_by || null,
    cancelledAt: event.cancelledAt || event.cancelled_at || null,
    cancelReason: event.cancelReason || event.cancel_reason || null,
  };
}

function buildParams(filters = {}) {
  const params = {};
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.status && filters.status !== "All") {
    params.status = filters.status;
  }
  return params;
}

export const eventService = {
  async getEvents(filters = {}) {
    const response = await api.get("/events", { params: buildParams(filters) });
    const data = extractResponseData(response);
    return Array.isArray(data) ? data.map(normalizeEvent).filter(Boolean) : [];
  },

  async getEvent(id) {
    const response = await api.get(`/events/${id}`);
    return normalizeEvent(extractResponseData(response));
  },

  async createEvent(payload) {
    const response = await api.post("/events", payload);
    return normalizeEvent(extractResponseData(response));
  },

  async updateEvent(id, payload) {
    const response = await api.put(`/events/${id}`, payload);
    return normalizeEvent(extractResponseData(response));
  },

  async cancelEvent(id, reason) {
    const response = await api.patch(`/events/${id}/cancel`, {
      cancel_reason: reason,
    });
    return normalizeEvent(extractResponseData(response));
  },

  async deleteEvent(id) {
    const response = await api.delete(`/events/${id}`);
    return extractResponseData(response);
  },

  async adminGetEvents(filters = {}) {
    return this.getEvents(filters);
  },

  async userGetEvents(filters = {}) {
    return this.getEvents(filters);
  },

  async adminCreateEvent(payload) {
    let dateStr = "";
    let timeStr = "";
    if (payload.event_date) {
      const d = new Date(payload.event_date);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().split('T')[0];
        timeStr = d.toISOString().split('T')[1].substring(0, 5);
      }
    }

    const apiPayload = {
      event_id: payload.event_id || undefined,
      title: payload.title,
      type: payload.type,
      date: dateStr,
      time: timeStr,
      venue: payload.venue,
      coordinator: payload.coordinator_name || payload.coordinator || "",
      description: payload.description || undefined,
    };

    return this.createEvent(apiPayload);
  },

  async adminDeleteEvent(id) {
    return this.deleteEvent(id);
  },
};
