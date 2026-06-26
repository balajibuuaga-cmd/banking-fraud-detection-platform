package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.FraudAlert;
import com.bankingfraud.backend.entity.FraudCase;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.FraudAlertRepository;
import com.bankingfraud.backend.repository.FraudCaseRepository;
import com.bankingfraud.backend.repository.TransactionRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/copilot")
@CrossOrigin(origins = "http://localhost:5173")
public class CopilotController {

    private final TransactionRepository transactionRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final FraudCaseRepository fraudCaseRepository;

    public CopilotController(
            TransactionRepository transactionRepository,
            FraudAlertRepository fraudAlertRepository,
            FraudCaseRepository fraudCaseRepository) {
        this.transactionRepository = transactionRepository;
        this.fraudAlertRepository = fraudAlertRepository;
        this.fraudCaseRepository = fraudCaseRepository;
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, Object> request) {
        String message = String.valueOf(request.getOrDefault("message", ""));
        String normalized = message.toLowerCase();
        Map<String, Object> context = getContext(request);

        List<Transaction> transactions = transactionRepository.findAll();
        List<FraudAlert> alerts = fraudAlertRepository.findAll();
        List<FraudCase> cases = fraudCaseRepository.findAll();

        long criticalAlerts = alerts.stream()
                .filter(alert -> "CRITICAL".equalsIgnoreCase(alert.getSeverity()))
                .count();
        long openCases = cases.stream()
                .filter(item -> !"CLOSED".equalsIgnoreCase(item.getStatus()))
                .count();
        long escalatedCases = cases.stream()
                .filter(item -> "ESCALATED".equalsIgnoreCase(item.getStatus()))
                .count();

        Transaction riskiestTransaction = transactions.stream()
                .max(Comparator.comparing(tx -> tx.getRiskScore() == null ? 0 : tx.getRiskScore()))
                .orElse(null);

        String answer;

        if (!context.isEmpty() && "case".equals(context.get("type"))) {
            answer = buildCaseContextAnswer(context, normalized);
        } else if (!context.isEmpty() && "customer".equals(context.get("type"))) {
            answer = buildCustomerContextAnswer(context, normalized);
        } else if (isGreeting(normalized)) {
            answer = "Hi, I am doing well and ready to help. Ask me about risky transactions, customer activity, investigation next steps, or why a case should be escalated.";
        } else if (isThanks(normalized)) {
            answer = "You are welcome. I can keep helping with fraud explanations, case summaries, customer risk, or recommended analyst actions.";
        } else if (normalized.contains("why") || normalized.contains("risky") || normalized.contains("flagged")) {
            answer = buildRiskExplanation(riskiestTransaction, criticalAlerts);
        } else if (normalized.contains("summarize") || normalized.contains("activity") || normalized.contains("customer")) {
            answer = "Customer activity shows " + transactions.size() + " processed transactions, "
                    + criticalAlerts + " critical alerts, and " + openCases
                    + " open investigations. The strongest signal is high-risk transaction behavior combined with alert severity and case status.";
        } else if (normalized.contains("next") || normalized.contains("recommend") || normalized.contains("action")) {
            answer = "Recommended next action: keep the account restricted, verify customer identity, review recent high-risk transactions, "
                    + "document analyst notes, and escalate if the customer cannot validate the activity. Current escalated cases: "
                    + escalatedCases + ".";
        } else {
            answer = "I reviewed the current fraud context: " + transactions.size() + " transactions, "
                    + alerts.size() + " alerts, " + openCases + " active cases, and " + escalatedCases
                    + " escalated cases. Ask me why a transaction is risky, to summarize customer activity, or to recommend the next action.";
        }

        Map<String, Object> response = new HashMap<>();
        response.put("answer", answer);
        response.put("model", "FraudOps Copilot Mock LLM");
        response.put("contextUsed", !context.isEmpty());
        response.put("suggestedPrompts", List.of(
                "Why is this transaction risky?",
                "Summarize customer activity.",
                "What next action should the analyst take?"
        ));

        return response;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getContext(Map<String, Object> request) {
        Object context = request.get("context");

        if (context instanceof Map<?, ?>) {
            return (Map<String, Object>) context;
        }

        return Map.of();
    }

    private String buildCaseContextAnswer(Map<String, Object> context, String normalized) {
        String caseNumber = value(context, "caseNumber", "this case");
        String status = value(context, "status", "UNKNOWN");
        String riskScore = value(context, "riskScore", "N/A");
        String notes = value(context, "notes", "No notes available");

        if (normalized.contains("why") || normalized.contains("risky") || normalized.contains("flagged")) {
            return caseNumber + " is risky because it has a risk score of " + riskScore
                    + ", status " + status + ", and analyst notes indicating: " + notes
                    + ". The strongest concern is that the case requires identity verification and transaction-history review before the customer is cleared.";
        }

        if (normalized.contains("next") || normalized.contains("recommend") || normalized.contains("action")) {
            return "Recommended action for " + caseNumber
                    + ": keep restrictions in place, verify customer identity, review linked transactions, update analyst notes, and escalate if the customer cannot validate the activity. Current status is "
                    + status + ".";
        }

        return "Summary for " + caseNumber + ": status is " + status + ", risk score is "
                + riskScore + ", and current notes say: " + notes
                + ". Suggested next step: verify the customer, review recent transactions, and document the final decision.";
    }

    private String buildCustomerContextAnswer(Map<String, Object> context, String normalized) {
        String customerName = value(context, "customerName", "this customer");
        String totalTransactions = value(context, "totalTransactions", "0");
        String criticalTransactions = value(context, "criticalTransactions", "0");
        String accountCount = value(context, "accountCount", "0");

        if (normalized.contains("why") || normalized.contains("risky") || normalized.contains("flagged")) {
            return customerName + " has elevated risk because their profile includes "
                    + criticalTransactions + " critical transactions across " + totalTransactions
                    + " total transactions and " + accountCount + " linked accounts. Review high-risk locations, transaction velocity, and device activity before clearing the customer.";
        }

        if (normalized.contains("next") || normalized.contains("recommend") || normalized.contains("action")) {
            return "Recommended next action for " + customerName
                    + ": verify identity, review all critical transactions, confirm account ownership, and keep restrictions active until suspicious activity is explained.";
        }

        return "Customer summary for " + customerName + ": " + totalTransactions
                + " transactions, " + criticalTransactions + " critical transactions, and "
                + accountCount + " accounts. This profile should be reviewed for high-risk transaction patterns, device changes, and unusual locations.";
    }

    private String value(Map<String, Object> context, String key, String fallback) {
        Object value = context.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String buildRiskExplanation(Transaction transaction, long criticalAlerts) {
        if (transaction == null) {
            return "No transaction data is available yet. Once transactions are processed, I can explain risk using amount, device, location, velocity, and rule hits.";
        }

        return "The highest-risk transaction is #" + transaction.getId()
                + " with risk score " + (transaction.getRiskScore() == null ? "N/A" : transaction.getRiskScore())
                + " and risk level " + (transaction.getRiskLevel() == null ? "UNKNOWN" : transaction.getRiskLevel())
                + ". Key drivers include amount $" + transaction.getAmount()
                + ", location " + transaction.getLocation()
                + ", transaction type " + transaction.getTransactionType()
                + ", and reason codes " + (transaction.getReasonCodes() == null ? "not provided" : transaction.getReasonCodes())
                + ". There are currently " + criticalAlerts + " critical alerts requiring priority review.";
    }

    private boolean isGreeting(String message) {
        String trimmed = message.trim();
        return trimmed.equals("hi")
                || trimmed.equals("hii")
                || trimmed.equals("hello")
                || trimmed.equals("hey")
                || trimmed.equals("how are you")
                || trimmed.equals("how are you?");
    }

    private boolean isThanks(String message) {
        String trimmed = message.trim();
        return trimmed.equals("thanks")
                || trimmed.equals("thank you")
                || trimmed.equals("thx");
    }
}
