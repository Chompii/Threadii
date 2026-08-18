import { getToken } from "../auth.js";

const BASE = "/api";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed with ${res.status}`);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

function authHeaders(extra) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

function apiFetch(path, options = {}) {
  return fetch(`${BASE}${path}`, { ...options, headers: authHeaders(options.headers) }).then(handle);
}

// --- auth ---

export function signup(email, password) {
  return apiFetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function logoutRequest() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export function getMe() {
  return apiFetch("/auth/me");
}

// --- items ---

export function getItems() {
  return apiFetch("/items");
}

export function addItem(formData) {
  return apiFetch("/items", { method: "POST", body: formData });
}

export function updateItem(id, formData) {
  return apiFetch(`/items/${id}`, { method: "PATCH", body: formData });
}

export function deleteItem(id) {
  return apiFetch(`/items/${id}`, { method: "DELETE" });
}

export function getArchivedItems() {
  return apiFetch("/items?archived=true");
}

export function setLaundry(id, inLaundry) {
  return apiFetch(`/items/${id}/laundry`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inLaundry }),
  });
}

export function setArchived(id, archived) {
  return apiFetch(`/items/${id}/archive`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archived }),
  });
}

// --- outfits ---

export function suggestOutfits({ season, occasion, anchorIds, itemIds, count } = {}) {
  const params = new URLSearchParams();
  if (season) params.set("season", season);
  if (occasion) params.set("occasion", occasion);
  if (anchorIds && anchorIds.length > 0) params.set("anchorIds", anchorIds.join(","));
  if (itemIds && itemIds.length > 0) params.set("itemIds", itemIds.join(","));
  if (count) params.set("count", count);
  return apiFetch(`/outfits/suggest?${params.toString()}`);
}

export function getAccessorySuggestions(itemIds) {
  const params = new URLSearchParams();
  params.set("itemIds", itemIds.join(","));
  return apiFetch(`/outfits/accessories?${params.toString()}`);
}

// --- favorites ---

export function getFavorites() {
  return apiFetch("/favorites");
}

export function addFavorite(itemIds, collection) {
  return apiFetch("/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds, collection }),
  });
}

export function removeFavorite(id) {
  return apiFetch(`/favorites/${id}`, { method: "DELETE" });
}

export function updateFavoriteNote(id, note) {
  return apiFetch(`/favorites/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}

export function updateFavoriteCollection(id, collection) {
  return apiFetch(`/favorites/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection }),
  });
}

// --- worn ---

export function getWorn() {
  return apiFetch("/worn");
}

export function markWorn(itemIds) {
  return apiFetch("/worn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds }),
  });
}

export function unmarkWorn(id) {
  return apiFetch(`/worn/${id}`, { method: "DELETE" });
}

// --- dislikes ---

export function markDisliked(itemIds) {
  return apiFetch("/dislikes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds }),
  });
}

export function unmarkDisliked(id) {
  return apiFetch(`/dislikes/${id}`, { method: "DELETE" });
}

// --- export ---

export function exportData() {
  return apiFetch("/export");
}

// --- stats ---

export function getStats() {
  return apiFetch("/stats");
}

// --- calendar ---

export function getCalendar() {
  return apiFetch("/calendar");
}

export function setCalendarDay(date, itemIds) {
  return apiFetch(`/calendar/${date}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds }),
  });
}

export function removeCalendarDay(date) {
  return apiFetch(`/calendar/${date}`, { method: "DELETE" });
}

// --- packing lists ---

export function getPackingLists() {
  return apiFetch("/packing");
}

export function createPackingList(name, itemIds) {
  return apiFetch("/packing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, itemIds }),
  });
}

export function deletePackingList(id) {
  return apiFetch(`/packing/${id}`, { method: "DELETE" });
}
