package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.FraudRule;
import com.bankingfraud.backend.service.FraudRuleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fraud-rules")
@CrossOrigin(origins = "http://localhost:5173")
public class FraudRuleController {

    private final FraudRuleService fraudRuleService;

    public FraudRuleController(FraudRuleService fraudRuleService) {
        this.fraudRuleService = fraudRuleService;
    }

    @PostMapping
    public FraudRule createRule(@RequestBody FraudRule rule) {
        return fraudRuleService.createRule(rule);
    }

    @GetMapping
    public List<FraudRule> getAllRules() {
        return fraudRuleService.getAllRules();
    }

    @GetMapping("/active")
    public List<FraudRule> getActiveRules() {
        return fraudRuleService.getActiveRules();
    }

    @PutMapping("/{id}/status")
    public FraudRule updateRuleStatus(
            @PathVariable Long id,
            @RequestParam Boolean active) {

        return fraudRuleService.updateRuleStatus(id, active);
    }

    @PutMapping("/{id}/risk-points")
    public FraudRule updateRiskPoints(
            @PathVariable Long id,
            @RequestParam Integer riskPoints) {

        return fraudRuleService.updateRiskPoints(id, riskPoints);
    }

    @DeleteMapping("/{id}")
    public void deleteRule(@PathVariable Long id) {
        fraudRuleService.deleteRule(id);
    }
}
