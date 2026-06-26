import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    LinearProgress,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import { importPaySimDataset } from "../services/analyticsService";

export default function DatasetImport({ darkMode, setDarkMode, dateRange, setDateRange }) {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const handleImport = async () => {
        if (!file) {
            setError("Please select a CSV file first.");
            return;
        }

        setImporting(true);
        setError("");
        setResult(null);

        try {
            const data = await importPaySimDataset(file);
            setResult(data);
        } catch (err) {
            setError("Import failed. Please check backend logs and CSV format.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <MainLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            dateRange={dateRange}
            setDateRange={setDateRange}
        >
            <Box mb={3}>
                <Typography variant="h4" fontWeight={800}>
                    Dataset Import
                </Typography>
                <Typography color="text.secondary">
                    Upload PaySim financial transaction data and run it through the fraud detection engine.
                </Typography>
            </Box>

            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Stack spacing={3}>
                    <Typography variant="h6" fontWeight={800}>
                        Upload PaySim CSV
                    </Typography>

                    <Button variant="outlined" component="label">
                        Choose CSV File
                        <input
                            type="file"
                            hidden
                            accept=".csv"
                            onChange={(event) => setFile(event.target.files?.[0] || null)}
                        />
                    </Button>

                    {file && (
                        <Typography>
                            Selected file: <strong>{file.name}</strong>
                        </Typography>
                    )}

                    {importing && <LinearProgress />}

                    <Button
                        variant="contained"
                        disabled={importing}
                        onClick={handleImport}
                    >
                        {importing ? "Importing..." : "Import Dataset"}
                    </Button>

                    {error && <Alert severity="error">{error}</Alert>}

                    {result && (
                        <Alert severity="success">
                            {result.message} - Imported: {result.importedRows}, Failed: {result.failedRows}
                        </Alert>
                    )}
                </Stack>
            </Paper>
        </MainLayout>
    );
}
