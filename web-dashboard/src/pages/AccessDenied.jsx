import {
    Box,
    Button,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

export default function AccessDenied({ darkMode, setDarkMode }) {
    const navigate = useNavigate();

    return (
        <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 520 }}>
                <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 560, textAlign: "left" }}>
                    <Typography variant="h4" fontWeight={900}>
                        Access Denied
                    </Typography>
                    <Typography color="text.secondary" mt={1}>
                        This page is restricted to administrators. Your current role does not include permission to manage this area.
                    </Typography>

                    <Stack direction="row" spacing={2} mt={3}>
                        <Button variant="contained" onClick={() => navigate("/")}>
                            Go to Dashboard
                        </Button>
                        <Button variant="outlined" onClick={() => navigate("/queue")}>
                            Open Work Queue
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </MainLayout>
    );
}
