package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.FraudAlert;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.FraudAlertRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FraudAlertService {

    private final FraudAlertRepository fraudAlertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public FraudAlertService(FraudAlertRepository fraudAlertRepository,
                             SimpMessagingTemplate messagingTemplate) {
        this.fraudAlertRepository = fraudAlertRepository;
        this.messagingTemplate = messagingTemplate;
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

        FraudAlert savedAlert = fraudAlertRepository.save(fraudAlert);

        Map<String, Object> alertMessage = new HashMap<>();
        alertMessage.put("id", savedAlert.getId());
        alertMessage.put("alertType", savedAlert.getAlertType());
        alertMessage.put("severity", savedAlert.getSeverity());
        alertMessage.put("description", savedAlert.getDescription());
        alertMessage.put("status", savedAlert.getStatus());
        alertMessage.put("riskScore", savedAlert.getRiskScore());
        alertMessage.put("createdAt", savedAlert.getCreatedAt());

        messagingTemplate.convertAndSend("/topic/fraud-alerts", (Object) alertMessage);

        System.out.println("WebSocket fraud alert sent: " + alertMessage);

        return savedAlert;
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