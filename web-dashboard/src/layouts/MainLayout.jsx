import { useEffect, useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Badge,
    Avatar,
    Menu,
    MenuItem,
    Select,
    TextField,
    InputAdornment
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useLocation, useNavigate } from "react-router-dom";
import { isAdminRole, normalizeRole } from "../utils/roles";
import { getAllAlerts, getAllFraudCases, getAuditLogs } from "../services/analyticsService";
import { getCaseSla } from "../utils/caseSla";

export default function MainLayout({
    children,
    darkMode,
    setDarkMode,
    searchTerm = "",
    setSearchTerm,
    selectedSeverity = "ALL",
    setSelectedSeverity,
    dateRange = "ALL",
    setDateRange,
    onRefresh
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [moreAnchorEl, setMoreAnchorEl] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const moreMenuOpen = Boolean(moreAnchorEl);
    const role = normalizeRole(localStorage.getItem("role"));
    const isAdmin = isAdminRole(role);

    useEffect(() => {
        let isMounted = true;

        const loadNotificationCount = async () => {
            const [alertData, caseData, auditData] = await Promise.allSettled([
                getAllAlerts(),
                getAllFraudCases(),
                getAuditLogs()
            ]);

            if (!isMounted) return;

            const criticalAlerts =
                alertData.status === "fulfilled" && Array.isArray(alertData.value)
                    ? alertData.value.filter((item) => item.severity === "CRITICAL" || item.status === "OPEN").length
                    : 0;
            const caseSlaItems =
                caseData.status === "fulfilled" && Array.isArray(caseData.value)
                    ? caseData.value.filter((item) => item.status === "ESCALATED" || getCaseSla(item).label === "Overdue").length
                    : 0;
            const recentAuditItems =
                auditData.status === "fulfilled" && Array.isArray(auditData.value)
                    ? Math.min(auditData.value.length, 5)
                    : 0;

            setNotificationCount(criticalAlerts + caseSlaItems + recentAuditItems);
        };

        loadNotificationCount();

        return () => {
            isMounted = false;
        };
    }, [location.pathname]);

    const navItems = [
        { label: "Dashboard", path: "/" },
        { label: "Alerts", path: "/alerts" },
        { label: "Investigations", path: "/investigations" },
        { label: "Analytics", path: "/analytics" },
        { label: "Settings", path: "/settings" }
    ];

    const moreItems = [
        { label: "Fraud Copilot", path: "/copilot" },
        { label: "Fraud Map", path: "/fraud-map" },
        { label: "Work Queue", path: "/queue" },
        { label: "Transactions", path: "/transactions" },
        ...(isAdmin ? [{ label: "Dataset Import", path: "/import" }] : []),
        { label: "Customer 360", path: "/customer-360/1" },
        { label: "Audit Trail", path: "/audit-trail" },
        { label: "System Health", path: "/system-health" },
        ...(isAdmin ? [
            { label: "User Management", path: "/users" },
            { label: "Fraud Rules", path: "/fraud-rules" }
        ] : []),
        { label: "Notification Center", path: "/notifications" }
    ];

    const navigateFromMenu = (path) => {
        setMoreAnchorEl(null);
        navigate(path);
    };

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh();
            return;
        }

        window.location.reload();
    };

    return (
        <Box
            className={darkMode ? "app-shell dark-mode" : "app-shell"}
            sx={{ minHeight: "100vh", bgcolor: "background.default" }}
        >
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: "background.paper",
                    color: "text.primary",
                    borderBottom: "1px solid",
                    borderColor: "divider"
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: "76px !important",
                        px: { xs: 2, lg: 3 },
                        gap: 2,
                        overflowX: "auto"
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 250 }}>
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 44,
                                height: 44,
                                bgcolor: "primary.main",
                                fontWeight: 900,
                                borderRadius: 2
                            }}
                        >
                            F
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
                                FraudOps
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Risk Command Center
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "stretch", gap: 1.5, height: 76 }}>
                        {navItems.map((item) => {
                            const active = location.pathname === item.path;

                            return (
                                <Button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        px: 1.5,
                                        minWidth: "auto",
                                        borderRadius: 0,
                                        color: active ? "primary.main" : "text.primary",
                                        fontWeight: 800,
                                        fontSize: 14,
                                        textTransform: "none",
                                        borderBottom: active ? "3px solid" : "3px solid transparent",
                                        borderColor: active ? "primary.main" : "transparent"
                                    }}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}

                        <Button
                            onClick={(event) => setMoreAnchorEl(event.currentTarget)}
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={{
                                px: 1.5,
                                minWidth: "auto",
                                borderRadius: 0,
                                color: moreItems.some((item) => location.pathname === item.path)
                                    ? "primary.main"
                                    : "text.primary",
                                fontWeight: 800,
                                fontSize: 14,
                                textTransform: "none",
                                borderBottom: moreItems.some((item) => location.pathname === item.path)
                                    ? "3px solid"
                                    : "3px solid transparent",
                                borderColor: moreItems.some((item) => location.pathname === item.path)
                                    ? "primary.main"
                                    : "transparent"
                            }}
                        >
                            More
                        </Button>
                    </Box>

                    <Box sx={{ flexGrow: 1, minWidth: 12 }} />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                        <TextField
                            size="small"
                            placeholder="Search alerts, cases, analysts..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm?.(event.target.value)}
                            sx={{ width: { xs: 240, xl: 330 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Select
                            size="small"
                            value={selectedSeverity}
                            onChange={(event) => setSelectedSeverity?.(event.target.value)}
                            sx={{ width: 170, fontWeight: 800 }}
                        >
                            <MenuItem value="ALL">All Severities</MenuItem>
                            <MenuItem value="CRITICAL">Critical</MenuItem>
                            <MenuItem value="HIGH">High</MenuItem>
                            <MenuItem value="MEDIUM">Medium</MenuItem>
                            <MenuItem value="LOW">Low</MenuItem>
                        </Select>

                        <Select
                            size="small"
                            value={dateRange}
                            onChange={(event) => setDateRange?.(event.target.value)}
                            sx={{ width: 150, fontWeight: 800 }}
                        >
                            <MenuItem value="ALL">All Time</MenuItem>
                            <MenuItem value="24H">Last 24h</MenuItem>
                            <MenuItem value="7D">Last 7d</MenuItem>
                            <MenuItem value="30D">Last 30d</MenuItem>
                        </Select>

                        <IconButton
                            onClick={handleRefresh}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                        >
                            <RefreshIcon />
                        </IconButton>

                        <IconButton
                            onClick={() => setDarkMode && setDarkMode(!darkMode)}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                        >
                            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>

                        <IconButton
                            onClick={() => navigate("/notifications")}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                        >
                            <Badge badgeContent={notificationCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>

                        <Button
                            onClick={() => {
                                localStorage.removeItem("token");
                                localStorage.removeItem("role");
                                localStorage.removeItem("fullName");
                                window.location.reload();
                            }}
                            sx={{
                                gap: 1,
                                px: 1,
                                color: "text.primary",
                                fontWeight: 800,
                                textTransform: "none"
                            }}
                        >
                            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontWeight: 800 }}>
                                A
                            </Avatar>
                            {role || "User"}
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Menu
                anchorEl={moreAnchorEl}
                open={moreMenuOpen}
                onClose={() => setMoreAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 220,
                        borderRadius: 2,
                        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)"
                    }
                }}
            >
                {moreItems.map((item) => (
                    <MenuItem
                        key={item.path}
                        selected={location.pathname === item.path}
                        onClick={() => navigateFromMenu(item.path)}
                        sx={{ fontWeight: 700 }}
                    >
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>

            <Box sx={{ p: 3 }}>
                {children}
            </Box>
        </Box>
    );
}
