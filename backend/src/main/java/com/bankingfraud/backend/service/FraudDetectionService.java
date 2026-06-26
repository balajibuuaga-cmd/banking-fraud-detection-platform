package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.FraudRule;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.FraudRuleRepository;
import com.bankingfraud.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class FraudDetectionService {

    private final TransactionRepository transactionRepository;
    private final FraudRuleRepository fraudRuleRepository;

    public FraudDetectionService(
            TransactionRepository transactionRepository,
            FraudRuleRepository fraudRuleRepository) {

        this.transactionRepository = transactionRepository;
        this.fraudRuleRepository = fraudRuleRepository;
    }

    public Transaction analyzeTransaction(Transaction transaction) {
        int score = 0;
        List<String> reasons = new ArrayList<>();

        List<FraudRule> activeRules = fraudRuleRepository.findByActiveTrue();

        for (FraudRule rule : activeRules) {
            switch (rule.getRuleType()) {

                case "HIGH_AMOUNT" -> {
                    double threshold = Double.parseDouble(rule.getConditionValue());

                    if (transaction.getAmount() != null &&
                            transaction.getAmount() > threshold) {

                        score += rule.getRiskPoints();
                        reasons.add("HIGH_AMOUNT");
                    }
                }

                case "NEW_DEVICE" -> {
                    String deviceId = transaction.getDeviceId() == null
                            ? ""
                            : transaction.getDeviceId().toLowerCase();

                    if (deviceId.contains("new") || deviceId.contains("unknown")) {
                        score += rule.getRiskPoints();
                        reasons.add("NEW_DEVICE");
                    }
                }

                case "HIGH_RISK_COUNTRY" -> {
                    if (transaction.getLocation() != null) {
                        List<String> countries = Arrays.asList(
                                rule.getConditionValue().split(",")
                        );

                        boolean matched = countries.stream()
                                .map(String::trim)
                                .anyMatch(country ->
                                        country.equalsIgnoreCase(transaction.getLocation())
                                );

                        if (matched) {
                            score += rule.getRiskPoints();
                            reasons.add("HIGH_RISK_COUNTRY");
                        }
                    }
                }

                case "UNUSUAL_LOCATION" -> {
                    if (transaction.getLocation() != null &&
                            !transaction.getLocation().equalsIgnoreCase("Chicago")) {

                        score += rule.getRiskPoints();
                        reasons.add("UNUSUAL_LOCATION");
                    }
                }

                case "INTERNATIONAL_TRANSFER" -> {
                    if (transaction.getTransactionType() != null &&
                            transaction.getTransactionType().equalsIgnoreCase("INTERNATIONAL_TRANSFER")) {

                        score += rule.getRiskPoints();
                        reasons.add("INTERNATIONAL_TRANSFER");
                    }
                }

                case "RAPID_TRANSACTION_PATTERN" -> {
                    if (transaction.getBankAccount() != null) {
                        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);

                        List<Transaction> recentTransactions =
                                transactionRepository.findByBankAccountIdAndTransactionTimeAfter(
                                        transaction.getBankAccount().getId(),
                                        tenMinutesAgo
                                );

                        if (recentTransactions.size() >= 3) {
                            score += rule.getRiskPoints();
                            reasons.add("RAPID_TRANSACTION_PATTERN");
                        }
                    }
                }
            }
        }

        transaction.setRiskScore(score);
        transaction.setRiskLevel(calculateRiskLevel(score));
        transaction.setStatus("PROCESSED");
        transaction.setReasonCodes(String.join(",", reasons));
        transaction.setAiExplanation(generateExplanation(transaction, reasons));
        transaction.setRecommendedAction(generateRecommendedAction(transaction));

        return transaction;
    }

    private String calculateRiskLevel(int score) {
        if (score >= 80) {
            return "CRITICAL";
        } else if (score >= 60) {
            return "HIGH";
        } else if (score >= 30) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    private String generateExplanation(Transaction transaction, List<String> reasons) {
        if (reasons.isEmpty()) {
            return "This transaction appears low risk because no major suspicious behavior patterns were detected.";
        }

        StringBuilder explanation = new StringBuilder();

        explanation.append("This transaction was marked ")
                .append(transaction.getRiskLevel())
                .append(" because ");

        List<String> readableReasons = new ArrayList<>();

        for (String reason : reasons) {
            switch (reason) {
                case "HIGH_AMOUNT" ->
                        readableReasons.add("the transaction amount exceeded the configured threshold");
                case "NEW_DEVICE" ->
                        readableReasons.add("the transaction came from a new or unrecognized device");
                case "HIGH_RISK_COUNTRY" ->
                        readableReasons.add("the transaction originated from a configured high-risk country");
                case "UNUSUAL_LOCATION" ->
                        readableReasons.add("the transaction location differed from the customer's usual region");
                case "INTERNATIONAL_TRANSFER" ->
                        readableReasons.add("the transaction was an international transfer");
                case "RAPID_TRANSACTION_PATTERN" ->
                        readableReasons.add("multiple transactions occurred within a short time window");
            }
        }

        explanation.append(String.join(", ", readableReasons));
        explanation.append(".");

        return explanation.toString();
    }

    private String generateRecommendedAction(Transaction transaction) {
        if ("CRITICAL".equalsIgnoreCase(transaction.getRiskLevel())) {
            return "Block the account immediately, create a fraud investigation case, and contact the customer for verification.";
        }

        if ("HIGH".equalsIgnoreCase(transaction.getRiskLevel())) {
            return "Escalate to a fraud analyst, review recent transactions, and monitor the account for additional suspicious activity.";
        }

        if ("MEDIUM".equalsIgnoreCase(transaction.getRiskLevel())) {
            return "Monitor the account and flag future transactions from similar devices, locations, or transaction patterns.";
        }

        return "No immediate action required. Continue normal transaction monitoring.";
    }
}
