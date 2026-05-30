package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FraudDetectionService {

    private final TransactionRepository transactionRepository;

    public FraudDetectionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public Transaction analyzeTransaction(Transaction transaction) {
        int score = 0;
        List<String> reasons = new ArrayList<>();

        if (transaction.getAmount() != null && transaction.getAmount() > 5000) {
            score += 30;
            reasons.add("HIGH_AMOUNT");
        }

        if (transaction.getDeviceId() != null &&
                transaction.getDeviceId().toLowerCase().contains("new")) {
            score += 25;
            reasons.add("NEW_DEVICE");
        }

        if (transaction.getLocation() != null &&
                !transaction.getLocation().equalsIgnoreCase("Chicago")) {
            score += 20;
            reasons.add("UNUSUAL_LOCATION");
        }

        if (transaction.getTransactionType() != null &&
                transaction.getTransactionType().equalsIgnoreCase("INTERNATIONAL_TRANSFER")) {
            score += 15;
            reasons.add("INTERNATIONAL_TRANSFER");
        }

        if (transaction.getBankAccount() != null) {
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);

            List<Transaction> recentTransactions =
                    transactionRepository.findByBankAccountIdAndTransactionTimeAfter(
                            transaction.getBankAccount().getId(),
                            tenMinutesAgo
                    );

            if (recentTransactions.size() >= 3) {
                score += 25;
                reasons.add("RAPID_TRANSACTION_PATTERN");
            }
        }

        transaction.setRiskScore(score);
        transaction.setRiskLevel(calculateRiskLevel(score));
        transaction.setStatus("PROCESSED");
        transaction.setReasonCodes(String.join(",", reasons));
        transaction.setAiExplanation(generateExplanation(transaction, reasons));

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
                        readableReasons.add("the transaction amount exceeded the normal threshold");
                case "NEW_DEVICE" ->
                        readableReasons.add("the transaction came from a new or unrecognized device");
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
}