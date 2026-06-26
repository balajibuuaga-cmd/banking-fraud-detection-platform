package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.BankAccount;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.BankAccountRepository;
import com.bankingfraud.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import com.bankingfraud.backend.kafka.TransactionProducer;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final FraudDetectionService fraudDetectionService;
    private final FraudAlertService fraudAlertService;
    private final TransactionProducer transactionProducer;
    public TransactionService(TransactionRepository transactionRepository,
                              BankAccountRepository bankAccountRepository,
                              FraudDetectionService fraudDetectionService,
                              FraudAlertService fraudAlertService,
                              TransactionProducer transactionProducer) {

        this.transactionRepository = transactionRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.fraudDetectionService = fraudDetectionService;
        this.fraudAlertService = fraudAlertService;
        this.transactionProducer = transactionProducer;
    }

    public Transaction createTransaction(Long accountId, Transaction transaction) {

        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));

        transaction.setBankAccount(account);

        Transaction analyzedTransaction =
                fraudDetectionService.analyzeTransaction(transaction);

        Transaction savedTransaction =
                transactionRepository.save(analyzedTransaction);

        if ("CRITICAL".equalsIgnoreCase(savedTransaction.getRiskLevel())) {
            account.setStatus("LOCKED");
            bankAccountRepository.save(account);
            System.out.println("Account locked due to CRITICAL fraud risk: " + account.getAccountNumber());
        }

        transactionProducer.publishTransaction(savedTransaction);

        if ("HIGH".equalsIgnoreCase(savedTransaction.getRiskLevel())
                || "CRITICAL".equalsIgnoreCase(savedTransaction.getRiskLevel())) {

            fraudAlertService.generateAlert(savedTransaction);
        }

        return savedTransaction;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public List<Transaction> getTransactionsByAccount(Long accountId) {
        return transactionRepository.findByBankAccountId(accountId);
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }
}