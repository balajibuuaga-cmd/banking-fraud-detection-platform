import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, CircularProgress, Typography } from "@mui/material";
import Login from "./pages/Login";
import { isAdminRole } from "./utils/roles";
import "./App.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const FraudRules = lazy(() => import("./pages/FraudRules"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Investigations = lazy(() => import("./pages/Investigations"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Transactions = lazy(() => import("./pages/Transactions"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const Customer360 = lazy(() => import("./pages/Customer360"));
const WorkQueue = lazy(() => import("./pages/WorkQueue"));
const CaseDetails = lazy(() => import("./pages/CaseDetails"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Copilot = lazy(() => import("./pages/Copilot"));
const FraudMap = lazy(() => import("./pages/FraudMap"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const DatasetImport = lazy(() => import("./pages/DatasetImport"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));

function PageLoader() {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default"
            }}
        >
            <Box sx={{ textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={2} color="text.secondary" fontWeight={700}>
                    Loading FraudOps...
                </Typography>
            </Box>
        </Box>
    );
}

function App() {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem("token");

        if (!token) return null;

        return {
            token,
            role: localStorage.getItem("role"),
            fullName: localStorage.getItem("fullName")
        };
    });
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("fraudops-theme");

        if (savedTheme) {
            return savedTheme === "dark";
        }

        return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
    });

    useEffect(() => {
        localStorage.setItem("fraudops-theme", darkMode ? "dark" : "light");
    }, [darkMode]);
    const [dateRange, setDateRange] = useState("ALL");

    const pageProps = {
        user,
        darkMode,
        setDarkMode,
        dateRange,
        setDateRange
    };

    const theme = createTheme({
        palette: {
            mode: darkMode ? "dark" : "light",
            primary: {
                main: "#4f46e5",
            },
            background: {
                default: darkMode ? "#0f172a" : "#f8fafc",
                paper: darkMode ? "#111827" : "#ffffff",
            },
        },
    });

    if (!user) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Login onLogin={setUser} />
            </ThemeProvider>
        );
    }

    const adminPage = (Component) =>
        isAdminRole(user.role)
            ? <Component {...pageProps} />
            : <AccessDenied {...pageProps} />;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Dashboard {...pageProps} />} />
                        <Route path="/alerts" element={<Alerts {...pageProps} />} />
                        <Route path="/investigations" element={<Investigations {...pageProps} />} />
                        <Route path="/analytics" element={<Analytics {...pageProps} />} />
                        <Route path="/fraud-rules" element={adminPage(FraudRules)} />
                        <Route path="/settings" element={<Settings {...pageProps} />} />
                        <Route path="/transactions" element={<Transactions {...pageProps} />} />
                        <Route path="/audit-trail" element={<AuditTrail {...pageProps} />} />
                        <Route path="/customer-360/:customerId" element={<Customer360 {...pageProps} />} />
                        <Route path="/queue" element={<WorkQueue {...pageProps} />} />
                        <Route path="/cases/:caseId" element={<CaseDetails {...pageProps} />} />
                        <Route path="/notifications" element={<Notifications {...pageProps} />} />
                        <Route path="/copilot" element={<Copilot {...pageProps} />} />
                        <Route path="/fraud-map" element={<FraudMap {...pageProps} />} />
                        <Route path="/system-health" element={<SystemHealth {...pageProps} />} />
                        <Route path="/users" element={adminPage(UserManagement)} />
                        <Route path="/import" element={adminPage(DatasetImport)} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
