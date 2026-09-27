export const API_BASE_URL = location.host?.includes("localhost") ? "http://192.168.31.93:8000" : "https://api.lxyy.fun";
export const API_TIMEOUT = 10000;

export const PASSPORT_SCAN_URL = location.host?.includes("localhost") ? "http://192.168.31.93:5173/passport/scan" : "https://tool.lxyy.fun/passport/scan";
export const ADMIN_APP_SCOPE = "admin_web";
