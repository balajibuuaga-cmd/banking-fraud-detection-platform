package com.bankingfraud.backend.repository;

import com.bankingfraud.backend.entity.FraudRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FraudRuleRepository extends JpaRepository<FraudRule, Long> {
    List<FraudRule> findByActiveTrue();
}
