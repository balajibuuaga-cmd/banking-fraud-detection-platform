const getCaseCreatedAt = (item) => {
    const rawDate = item?.createdAt || item?.fraudAlert?.createdAt;
    const parsed = rawDate ? new Date(rawDate) : null;

    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

export const getCaseRiskScore = (item) =>
    Number(item?.riskScore || item?.fraudAlert?.riskScore || 0);

export const getCasePriority = (item) => {
    const riskScore = getCaseRiskScore(item);

    if (riskScore >= 100 || item?.status === "ESCALATED") {
        return { label: "Critical", color: "error", icon: "High" };
    }

    if (riskScore >= 75) {
        return { label: "High", color: "warning", icon: "High" };
    }

    return { label: "Medium", color: "primary", icon: "Med" };
};

export const getCaseSla = (item) => {
    if (item?.status === "CLOSED") {
        return {
            label: "Met",
            color: "success",
            detail: "Closed",
            hoursRemaining: 0
        };
    }

    if (item?.status === "ESCALATED") {
        return {
            label: "Overdue",
            color: "error",
            detail: "Escalated",
            hoursRemaining: 0
        };
    }

    const riskScore = getCaseRiskScore(item);
    const createdAt = getCaseCreatedAt(item);
    const slaHours = riskScore >= 100 ? 2 : riskScore >= 75 ? 4 : 24;

    if (!createdAt) {
        return {
            label: riskScore >= 100 ? "At Risk" : "On Track",
            color: riskScore >= 100 ? "warning" : "success",
            detail: `${slaHours}h SLA`,
            hoursRemaining: slaHours
        };
    }

    const ageHours = (Date.now() - createdAt.getTime()) / 36e5;
    const hoursRemaining = Math.max(0, Math.ceil(slaHours - ageHours));

    if (ageHours >= slaHours) {
        return {
            label: "Overdue",
            color: "error",
            detail: "Past SLA",
            hoursRemaining
        };
    }

    if (ageHours >= slaHours * 0.75) {
        return {
            label: "At Risk",
            color: "warning",
            detail: `${hoursRemaining}h left`,
            hoursRemaining
        };
    }

    return {
        label: "On Track",
        color: "success",
        detail: `${hoursRemaining}h left`,
        hoursRemaining
    };
};
