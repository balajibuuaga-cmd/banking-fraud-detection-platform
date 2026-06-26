import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import { askCopilot } from "../services/analyticsService";

export default function Copilot({ darkMode, setDarkMode }) {
    const [searchParams] = useSearchParams();
    const autoPromptSent = useRef(false);
    const context = (() => {
        const rawContext = searchParams.get("context");

        if (!rawContext) return {};

        try {
            return JSON.parse(rawContext);
        } catch {
            return {};
        }
    })();
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hi, I am FraudOps Copilot. Ask me why a transaction is risky, to summarize customer activity, or to recommend the next investigation step."
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const suggestedPrompts = [
        "Why is this transaction risky?",
        "Summarize customer activity.",
        "What next action should the analyst take?"
    ];

    const sendMessage = async (message = input) => {
        const trimmed = message.trim();
        if (!trimmed || loading) return;

        setInput("");
        setLoading(true);
        setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

        try {
            const data = await askCopilot(trimmed, context);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.answer,
                    model: data.model
                }
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I could not reach the Copilot service. Please confirm the backend is running and try again."
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const prompt = searchParams.get("prompt");

        if (prompt && !autoPromptSent.current) {
            autoPromptSent.current = true;
            sendMessage(prompt);
        }
    }, [searchParams]);

    return (
        <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Fraud Copilot
                    </Typography>
                    <Typography color="text.secondary">
                        Ask investigation questions and get context-aware fraud guidance.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    {context.type && (
                        <Chip label={`${context.type.toUpperCase()} CONTEXT`} color="secondary" />
                    )}
                    <Chip label="Mock LLM Ready" color="primary" />
                </Stack>
            </Stack>

            <Paper sx={{ p: 3, borderRadius: 3, minHeight: 620, display: "flex", flexDirection: "column", textAlign: "left" }}>
                <Stack spacing={2} sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
                    {messages.map((message, index) => (
                        <Box
                            key={index}
                            sx={{
                                alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                                maxWidth: "78%"
                            }}
                        >
                            <Paper
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 3,
                                    bgcolor: message.role === "user" ? "primary.main" : "background.default",
                                    color: message.role === "user" ? "primary.contrastText" : "text.primary",
                                    border: message.role === "assistant" ? "1px solid" : "none",
                                    borderColor: "divider",
                                    textAlign: "left"
                                }}
                            >
                                <Typography sx={{ whiteSpace: "pre-line", textAlign: "left", lineHeight: 1.55 }}>
                                    {message.content}
                                </Typography>
                                {message.model && message.model !== "FraudOps Copilot Mock LLM" && (
                                    <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.75, textAlign: "left" }}>
                                        {message.model}
                                    </Typography>
                                )}
                            </Paper>
                        </Box>
                    ))}
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={3}>
                    {suggestedPrompts.map((prompt) => (
                        <Chip
                            key={prompt}
                            label={prompt}
                            onClick={() => sendMessage(prompt)}
                            clickable
                            variant="outlined"
                        />
                    ))}
                </Stack>

                <Stack direction="row" spacing={2} mt={2}>
                    <TextField
                        fullWidth
                        placeholder="Ask Copilot about risk, customer activity, or next action..."
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        sx={{ px: 4 }}
                    >
                        {loading ? "Thinking" : "Send"}
                    </Button>
                </Stack>
            </Paper>
        </MainLayout>
    );
}
