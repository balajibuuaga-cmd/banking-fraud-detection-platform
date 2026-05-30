package com.bankingfraud.backend.repository;

import com.bankingfraud.backend.entity.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findBySeverity(String severity);
    List<FraudAlert> findByStatus(String status);
}