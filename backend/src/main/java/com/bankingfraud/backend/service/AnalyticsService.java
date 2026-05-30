package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.FraudAlert;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.FraudAlertRepository;
import com.bankingfraud.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final FraudAlertRepository fraudAlertRepository;

    public AnalyticsService(TransactionRepository transactionRepository,
                            FraudAlertRepository fraudAlertRepository) {
        this.transactionRepository = transactionRepository;
        this.fraudAlertRepository = fraudAlertRepository;
    }

    public Map<String, Object> getDashboardSummary() {

        List<Transaction> transactions = transactionRepository.findAll();
        List<FraudAlert> fraudAlerts = fraudAlertRepository.findAll();

        long criticalAlerts = fraudAlerts.stream()
                .filter(alert -> "CRITICAL".equals(alert.getSeverity()))
                .count();

        double totalTransactionAmount = transactions.stream()
                .mapToDouble(Transaction::getAmount)
                .sum();

        Map<String, Object> summary = new HashMap<>();

        summary.put("totalTransactions", transactions.size());
        summary.put("totalFraudAlerts", fraudAlerts.size());
        summary.put("criticalAlerts", criticalAlerts);
        summary.put("totalTransactionAmount", totalTransactionAmount);

        return summary;
    }

    public Map<String, Long> getRiskDistribution() {

        List<Transaction> transactions = transactionRepository.findAll();

        Map<String, Long> distribution = new HashMap<>();

        distribution.put("LOW", transactions.stream()
                .filter(t -> "LOW".equals(t.getRiskLevel()))
                .count());

        distribution.put("MEDIUM", transactions.stream()
                .filter(t -> "MEDIUM".equals(t.getRiskLevel()))
                .count());

        distribution.put("HIGH", transactions.stream()
                .filter(t -> "HIGH".equals(t.getRiskLevel()))
                .count());

        distribution.put("CRITICAL", transactions.stream()
                .filter(t -> "CRITICAL".equals(t.getRiskLevel()))
                .count());

        return distribution;
    }

    public Map<String, Long> getAlertStatusDistribution() {

        List<FraudAlert> alerts = fraudAlertRepository.findAll();

        Map<String, Long> distribution = new HashMap<>();

        distribution.put("OPEN", alerts.stream()
                .filter(a -> "OPEN".equals(a.getStatus()))
                .count());

        distribution.put("IN_REVIEW", alerts.stream()
                .filter(a -> "IN_REVIEW".equals(a.getStatus()))
                .count());

        distribution.put("RESOLVED", alerts.stream()
                .filter(a -> "RESOLVED".equals(a.getStatus()))
                .count());

        return distribution;
    }

    public Map<String, Long> getTransactionsByLocation() {

        List<Transaction> transactions = transactionRepository.findAll();

        Map<String, Long> locationStats = new HashMap<>();

        for (Transaction transaction : transactions) {

            String location = transaction.getLocation();

            if (location == null || location.isBlank()) {
                location = "UNKNOWN";
            }

            locationStats.put(
                    location,
                    locationStats.getOrDefault(location, 0L) + 1
            );
        }

        return locationStats;
    }

    public Map<String, Long> getFraudSeverityAnalytics() {

        List<FraudAlert> alerts = fraudAlertRepository.findAll();

        Map<String, Long> severityStats = new HashMap<>();

        for (FraudAlert alert : alerts) {

            String severity = alert.getSeverity();

            severityStats.put(
                    severity,
                    severityStats.getOrDefault(severity, 0L) + 1
            );
        }

        return severityStats;
    }
}
