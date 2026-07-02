package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.FraudCase;
import com.bankingfraud.backend.service.FraudCaseService;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fraud-cases")
public class FraudCaseController {

    private final FraudCaseService fraudCaseService;

    public FraudCaseController(FraudCaseService fraudCaseService) {
        this.fraudCaseService = fraudCaseService;
    }

    @PostMapping("/alert/{alertId}")
    public FraudCase createCase(
            @PathVariable Long alertId,
            @RequestBody Map<String, String> request) {

        return fraudCaseService.createCase(
                alertId,
                request.get("assignedAnalyst"),
                request.get("notes")
        );
    }

    @GetMapping
    public List<Map<String, Object>> getAllCases() {

        return fraudCaseService.getAllCases()
                .stream()
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();

                    map.put("id", c.getId());
                    map.put("caseNumber", c.getCaseNumber());
                    map.put("assignedAnalyst", c.getAssignedAnalyst());
                    map.put("status", c.getStatus());
                    map.put("notes", c.getNotes());
                    map.put("createdAt", c.getCreatedAt());

                    if (c.getFraudAlert() != null) {
                        map.put("alertId", c.getFraudAlert().getId());
                        map.put("severity", c.getFraudAlert().getSeverity());
                        map.put("riskScore", c.getFraudAlert().getRiskScore());
                    }

                    return map;
                })
                .toList();
    }

    @GetMapping("/{id}")
    public FraudCase getCaseById(@PathVariable Long id) {
        return fraudCaseService.getCaseById(id);
    }

    @PutMapping("/{id}/status")
    public FraudCase updateCaseStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return fraudCaseService.updateCaseStatus(id, status);
    }

    @PutMapping("/{id}/notes")
    public FraudCase updateCaseNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        return fraudCaseService.updateCaseNotes(id, request.get("notes"));
    }
    @PutMapping("/{id}/assign")
    public FraudCase updateAssignedAnalyst(
            @PathVariable Long id,
            @RequestParam String analyst) {

        return fraudCaseService.updateAssignedAnalyst(id, analyst);
    }
}

