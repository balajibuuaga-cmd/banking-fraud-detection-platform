package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.FraudAlert;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.FraudAlertRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FraudAlertService {

    private final FraudAlertRepository fraudAlertRepository;

    public FraudAlertService(FraudAlertRepository fraudAlertRepository) {
        this.fraudAlertRepository = fraudAlertRepository;
    }

    public FraudAlert generateAlert(Transaction transaction) {
        FraudAlert fraudAlert = FraudAlert.builder()
                .alertType("FRAUD_DETECTION")
                .severity(transaction.getRiskLevel())
                .description(buildDescription(transaction))
                .status("OPEN")
                .riskScore(transaction.getRiskScore())
                .transaction(transaction)
                .build();

        return fraudAlertRepository.save(fraudAlert);
    }

    public List<FraudAlert> getAllAlerts() {
        return fraudAlertRepository.findAll();
    }

    public FraudAlert getAlertById(Long id) {
        return fraudAlertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fraud alert not found"));
    }

    public FraudAlert updateStatus(Long id, String status) {
        FraudAlert alert = getAlertById(id);
        alert.setStatus(status);
        return fraudAlertRepository.save(alert);
    }

    private String buildDescription(Transaction transaction) {
        return "Suspicious transaction detected with risk score "
                + transaction.getRiskScore()
                + " for account "
                + transaction.getBankAccount().getAccountNumber();
    }
}