package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.FraudRule;
import com.bankingfraud.backend.repository.FraudRuleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FraudRuleService {

    private final FraudRuleRepository fraudRuleRepository;

    public FraudRuleService(FraudRuleRepository fraudRuleRepository) {
        this.fraudRuleRepository = fraudRuleRepository;
    }

    public FraudRule createRule(FraudRule rule) {
        return fraudRuleRepository.save(rule);
    }

    public List<FraudRule> getAllRules() {
        return fraudRuleRepository.findAll();
    }

    public List<FraudRule> getActiveRules() {
        return fraudRuleRepository.findByActiveTrue();
    }

    public FraudRule updateRuleStatus(Long id, Boolean active) {
        FraudRule rule = fraudRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fraud rule not found"));

        rule.setActive(active);
        return fraudRuleRepository.save(rule);
    }

    public FraudRule updateRiskPoints(Long id, Integer riskPoints) {
        FraudRule rule = fraudRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fraud rule not found"));

        rule.setRiskPoints(riskPoints);
        return fraudRuleRepository.save(rule);
    }

    public void deleteRule(Long id) {
        fraudRuleRepository.deleteById(id);
    }
}
