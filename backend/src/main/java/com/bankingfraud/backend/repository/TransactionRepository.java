package com.bankingfraud.backend.repository;

import com.bankingfraud.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByBankAccountId(Long accountId);

    List<Transaction> findByBankAccountIdAndTransactionTimeAfter(
            Long accountId,
            LocalDateTime time
    );
}