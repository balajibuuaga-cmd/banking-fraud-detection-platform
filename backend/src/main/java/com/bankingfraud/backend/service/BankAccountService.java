package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.BankAccount;
import com.bankingfraud.backend.entity.Customer;
import com.bankingfraud.backend.repository.BankAccountRepository;
import com.bankingfraud.backend.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final CustomerRepository customerRepository;
    private final AuditLogService auditLogService;

    public BankAccountService(
            BankAccountRepository bankAccountRepository,
            CustomerRepository customerRepository,
            AuditLogService auditLogService) {

        this.bankAccountRepository = bankAccountRepository;
        this.customerRepository = customerRepository;
        this.auditLogService = auditLogService;
    }

    public BankAccount createAccount(Long customerId, BankAccount bankAccount) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        bankAccount.setCustomer(customer);

        if (bankAccount.getStatus() == null) {
            bankAccount.setStatus("ACTIVE");
        }

        return bankAccountRepository.save(bankAccount);
    }

    public List<BankAccount> getAllAccounts() {
        return bankAccountRepository.findAll();
    }

    public List<BankAccount> getAccountsByCustomer(Long customerId) {
        return bankAccountRepository.findByCustomerId(customerId);
    }

    public BankAccount getAccountById(Long id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));
    }

    public BankAccount updateAccountStatus(Long id, String status) {
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found"));

        account.setStatus(status);

        BankAccount updated = bankAccountRepository.save(account);

        auditLogService.logAction(
                "ACCOUNT_" + status,
                "Analyst",
                "BankAccount",
                updated.getId()
        );

        return updated;
    }
}