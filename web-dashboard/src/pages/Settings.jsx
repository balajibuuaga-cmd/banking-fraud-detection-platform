import {
    Box,
    Paper,
    Stack,
    Typography,
    Chip
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";

export default function Settings({ darkMode, setDarkMode }) {
    return (
        <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Box mb={3}>
                <Typography variant="h4" fontWeight={800}>
                    Settings
                </Typography>
                <Typography color="text.secondary">
                    Application configuration, roles, and system preferences.
                </Typography>
            </Box>

            <Stack spacing={2}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800}>
                        User Role
                    </Typography>
                    <Chip
                        label={localStorage.getItem("role") || "UNKNOWN"}
                        color="primary"
                        sx={{ mt: 1 }}
                    />
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Security
                    </Typography>
                    <Typography color="text.secondary">
                        JWT authentication and role-based access control are enabled.
                    </Typography>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Deployment
                    </Typography>
                    <Typography color="text.secondary">
                        Backend, PostgreSQL, Kafka, and Zookeeper are running with Docker Compose.
                    </Typography>
                </Paper>
            </Stack>
        </MainLayout>
    );
}
