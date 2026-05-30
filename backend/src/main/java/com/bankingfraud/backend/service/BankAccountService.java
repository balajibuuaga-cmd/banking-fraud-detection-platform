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

    public BankAccountService(BankAccountRepository bankAccountRepository,
                              CustomerRepository customerRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.customerRepository = customerRepository;
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
}