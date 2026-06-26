package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.service.TransactionService;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/account/{accountId}")
    public Transaction createTransaction(@PathVariable Long accountId,
                                         @RequestBody Transaction transaction) {
        return transactionService.createTransaction(accountId, transaction);
    }

    @GetMapping
    public List<Map<String, Object>> getAllTransactions() {
        return transactionService.getAllTransactions()
                .stream()
                .map(transaction -> {
                    Map<String, Object> map = new HashMap<>();

                    map.put("id", transaction.getId());
                    map.put("amount", transaction.getAmount());
                    map.put("transactionType", transaction.getTransactionType());
                    map.put("location", transaction.getLocation());
                    map.put("deviceId", transaction.getDeviceId());
                    map.put("status", transaction.getStatus());
                    map.put("riskScore", transaction.getRiskScore());
                    map.put("riskLevel", transaction.getRiskLevel());
                    map.put("transactionTime", transaction.getTransactionTime());

                    if (transaction.getBankAccount() != null) {
                        map.put("accountId", transaction.getBankAccount().getId());
                        map.put("accountNumber", transaction.getBankAccount().getAccountNumber());
                    }

                    return map;
                })
                .toList();
    }

    @GetMapping("/{id}")
    public Transaction getTransactionById(@PathVariable Long id) {
        return transactionService.getTransactionById(id);
    }

    @GetMapping("/account/{accountId}")
    public List<Transaction> getTransactionsByAccount(@PathVariable Long accountId) {
        return transactionService.getTransactionsByAccount(accountId);
    }
}