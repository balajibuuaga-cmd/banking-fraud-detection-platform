export const normalizeRole = (role) =>
    String(role || "")
        .replace("ROLE_", "")
        .trim()
        .toUpperCase();

export const isAdminRole = (role) => normalizeRole(role) === "ADMIN";

export const isAnalystRole = (role) => {
    const normalizedRole = normalizeRole(role);
    return normalizedRole === "ADMIN" || normalizedRole === "ANALYST";
};
