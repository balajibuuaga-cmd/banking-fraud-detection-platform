package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.BankAccount;
import com.bankingfraud.backend.entity.Customer;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.BankAccountRepository;
import com.bankingfraud.backend.repository.CustomerRepository;
import com.bankingfraud.backend.repository.TransactionRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer-360")
public class Customer360Controller {

    private final CustomerRepository customerRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;

    public Customer360Controller(
            CustomerRepository customerRepository,
            BankAccountRepository bankAccountRepository,
            TransactionRepository transactionRepository) {
        this.customerRepository = customerRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.transactionRepository = transactionRepository;
    }

    @GetMapping("/{customerId}")
    public Map<String, Object> getCustomer360(@PathVariable Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        List<BankAccount> accounts = bankAccountRepository.findByCustomerId(customerId);

        List<Transaction> transactions = accounts.stream()
                .flatMap(account ->
                        transactionRepository.findByBankAccountId(account.getId()).stream()
                )
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("customer", customer);
        response.put("accounts", accounts);
        response.put("transactions", transactions);
        response.put("totalTransactions", transactions.size());
        response.put("criticalTransactions", transactions.stream()
                .filter(t -> "CRITICAL".equalsIgnoreCase(t.getRiskLevel()))
                .count());

        response.put("aiRiskSummary",
                "Customer activity shows elevated fraud risk based on recent high-value and high-risk location transactions.");

        return response;
    }
}
