package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.BankAccount;
import com.bankingfraud.backend.service.BankAccountService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class BankAccountController {

    private final BankAccountService bankAccountService;

    public BankAccountController(BankAccountService bankAccountService) {
        this.bankAccountService = bankAccountService;
    }

    @PostMapping("/customer/{customerId}")
    public BankAccount createAccount(@PathVariable Long customerId,
                                     @RequestBody BankAccount bankAccount) {
        return bankAccountService.createAccount(customerId, bankAccount);
    }

    @GetMapping
    public List<BankAccount> getAllAccounts() {
        return bankAccountService.getAllAccounts();
    }

    @GetMapping("/{id}")
    public BankAccount getAccountById(@PathVariable Long id) {
        return bankAccountService.getAccountById(id);
    }

    @GetMapping("/customer/{customerId}")
    public List<BankAccount> getAccountsByCustomer(@PathVariable Long customerId) {
        return bankAccountService.getAccountsByCustomer(customerId);
    }

    @PutMapping("/{id}/status")
    public BankAccount updateAccountStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return bankAccountService.updateAccountStatus(id, status);
    }
}