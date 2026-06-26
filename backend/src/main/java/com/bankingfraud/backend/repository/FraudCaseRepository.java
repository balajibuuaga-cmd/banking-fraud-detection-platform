package com.bankingfraud.backend.repository;

import com.bankingfraud.backend.entity.FraudCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FraudCaseRepository extends JpaRepository<FraudCase, Long> {

    Optional<FraudCase> findByFraudAlertId(Long fraudAlertId);
}