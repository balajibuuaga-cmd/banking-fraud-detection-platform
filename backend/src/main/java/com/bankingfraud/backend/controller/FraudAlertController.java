package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.FraudAlert;
import com.bankingfraud.backend.service.FraudAlertService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fraud-alerts")
public class FraudAlertController {

    private final FraudAlertService fraudAlertService;

    public FraudAlertController(FraudAlertService fraudAlertService) {
        this.fraudAlertService = fraudAlertService;
    }

    @GetMapping
    public List<Map<String, Object>> getAllAlerts() {
        return fraudAlertService.getAllAlerts()
                .stream()
                .map(alert -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", alert.getId());
                    map.put("alertType", alert.getAlertType());
                    map.put("severity", alert.getSeverity());
                    map.put("description", alert.getDescription());
                    map.put("status", alert.getStatus());
                    map.put("riskScore", alert.getRiskScore());
                    map.put("createdAt", alert.getCreatedAt());

                    if (alert.getTransaction() != null) {
                        map.put("transactionId", alert.getTransaction().getId());
                        map.put("reasonCodes", alert.getTransaction().getReasonCodes());
                        map.put("aiExplanation", alert.getTransaction().getAiExplanation());
                    }
                    return map;
                })
                .toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getAlertById(@PathVariable Long id) {
        FraudAlert alert = fraudAlertService.getAlertById(id);

        Map<String, Object> map = new HashMap<>();
        map.put("id", alert.getId());
        map.put("alertType", alert.getAlertType());
        map.put("severity", alert.getSeverity());
        map.put("description", alert.getDescription());
        map.put("status", alert.getStatus());
        map.put("riskScore", alert.getRiskScore());
        map.put("createdAt", alert.getCreatedAt());
        if (alert.getTransaction() != null) {
            map.put("transactionId", alert.getTransaction().getId());
            map.put("reasonCodes", alert.getTransaction().getReasonCodes());
            map.put("aiExplanation", alert.getTransaction().getAiExplanation());
        }

        return map;
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        FraudAlert alert = fraudAlertService.updateStatus(id, status);

        Map<String, Object> map = new HashMap<>();
        map.put("id", alert.getId());
        map.put("status", alert.getStatus());
        map.put("severity", alert.getSeverity());
        map.put("riskScore", alert.getRiskScore());

        return map;
    }
}