package com.bankingfraud.backend.config;

import com.bankingfraud.backend.entity.AppUser;
import com.bankingfraud.backend.entity.BankAccount;
import com.bankingfraud.backend.entity.Customer;
import com.bankingfraud.backend.entity.FraudAlert;
import com.bankingfraud.backend.entity.FraudCase;
import com.bankingfraud.backend.entity.FraudRule;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.AppUserRepository;
import com.bankingfraud.backend.repository.BankAccountRepository;
import com.bankingfraud.backend.repository.CustomerRepository;
import com.bankingfraud.backend.repository.FraudAlertRepository;
import com.bankingfraud.backend.repository.FraudCaseRepository;
import com.bankingfraud.backend.repository.FraudRuleRepository;
import com.bankingfraud.backend.repository.TransactionRepository;
import com.bankingfraud.backend.service.FraudDetectionService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedDefaultUser(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> appUserRepository.findByEmail("balaji@test.com")
                .orElseGet(() -> appUserRepository.save(
                        AppUser.builder()
                                .fullName("Balaji Buraga")
                                .email("balaji@test.com")
                                .password(passwordEncoder.encode("password123"))
                                .role("ADMIN")
                                .build()
                ));
    }

    @Bean
    @Order(1)
    public CommandLineRunner seedFraudRules(FraudRuleRepository fraudRuleRepository) {
        return args -> {
            if (fraudRuleRepository.count() > 0) {
                return;
            }

            fraudRuleRepository.save(FraudRule.builder()
                    .ruleName("High Amount Transaction")
                    .ruleType("HIGH_AMOUNT")
                    .conditionValue("5000")
                    .riskPoints(30)
                    .active(true)
                    .build());

            fraudRuleRepository.save(FraudRule.builder()
                    .ruleName("New or Unknown Device")
                    .ruleType("NEW_DEVICE")
                    .conditionValue("new,unknown")
                    .riskPoints(25)
                    .active(true)
                    .build());

            fraudRuleRepository.save(FraudRule.builder()
                    .ruleName("Unusual Location")
                    .ruleType("UNUSUAL_LOCATION")
                    .conditionValue("Chicago")
                    .riskPoints(20)
                    .active(true)
                    .build());

            fraudRuleRepository.save(FraudRule.builder()
                    .ruleName("International Transfer")
                    .ruleType("INTERNATIONAL_TRANSFER")
                    .conditionValue("INTERNATIONAL_TRANSFER")
                    .riskPoints(15)
                    .active(true)
                    .build());

            fraudRuleRepository.save(FraudRule.builder()
                    .ruleName("Rapid Transaction Pattern")
                    .ruleType("RAPID_TRANSACTION_PATTERN")
                    .conditionValue("3")
                    .riskPoints(25)
                    .active(true)
                    .build());

            fraudRuleRepository.save(FraudRule.builder()
                    .ruleName("High Risk Country")
                    .ruleType("HIGH_RISK_COUNTRY")
                    .conditionValue("Nigeria,Russia,North Korea")
                    .riskPoints(35)
                    .active(true)
                    .build());
        };
    }

    @Bean
    @Order(2)
    public CommandLineRunner seedDemoDashboardData(
            CustomerRepository customerRepository,
            BankAccountRepository bankAccountRepository,
            TransactionRepository transactionRepository,
            FraudAlertRepository fraudAlertRepository,
            FraudCaseRepository fraudCaseRepository,
            FraudDetectionService fraudDetectionService
    ) {
        return args -> {
            if (transactionRepository.count() > 0) {
                return;
            }

            Customer customer = customerRepository.save(Customer.builder()
                    .fullName("Balaji Buraga")
                    .email("balaji.customer@test.com")
                    .phoneNumber("555-0101")
                    .address("Chicago, IL")
                    .riskLevel("MEDIUM")
                    .build());

            BankAccount account = bankAccountRepository.save(BankAccount.builder()
                    .accountNumber("ACC1001")
                    .accountType("CHECKING")
                    .balance(24500.00)
                    .status("LOCKED")
                    .customer(customer)
                    .build());

            Transaction criticalTransaction = saveAnalyzedTransaction(
                    transactionRepository,
                    fraudDetectionService,
                    account,
                    9800.00,
                    "INTERNATIONAL_TRANSFER",
                    "Nigeria",
                    "unknown-device-991"
            );

            Transaction highTransaction = saveAnalyzedTransaction(
                    transactionRepository,
                    fraudDetectionService,
                    account,
                    7200.00,
                    "WIRE_TRANSFER",
                    "New York",
                    "new-mobile-441"
            );

            saveAnalyzedTransaction(
                    transactionRepository,
                    fraudDetectionService,
                    account,
                    175.25,
                    "CARD_PURCHASE",
                    "Chicago",
                    "trusted-device-101"
            );

            FraudAlert criticalAlert = fraudAlertRepository.save(FraudAlert.builder()
                    .alertType("FRAUD_DETECTION")
                    .severity(criticalTransaction.getRiskLevel())
                    .description("Suspicious transaction detected with risk score "
                            + criticalTransaction.getRiskScore()
                            + " for account "
                            + account.getAccountNumber())
                    .status("OPEN")
                    .riskScore(criticalTransaction.getRiskScore())
                    .transaction(criticalTransaction)
                    .build());

            fraudAlertRepository.save(FraudAlert.builder()
                    .alertType("FRAUD_DETECTION")
                    .severity(highTransaction.getRiskLevel())
                    .description("Suspicious transaction detected with risk score "
                            + highTransaction.getRiskScore()
                            + " for account "
                            + account.getAccountNumber())
                    .status("OPEN")
                    .riskScore(highTransaction.getRiskScore())
                    .transaction(highTransaction)
                    .build());

            fraudCaseRepository.save(FraudCase.builder()
                    .caseNumber("CASE-1001")
                    .assignedAnalyst("Balaji")
                    .status("UNDER_REVIEW")
                    .notes("Critical alert opened for review after high-risk international transfer.")
                    .fraudAlert(criticalAlert)
                    .build());
        };
    }

    private Transaction saveAnalyzedTransaction(
            TransactionRepository transactionRepository,
            FraudDetectionService fraudDetectionService,
            BankAccount account,
            Double amount,
            String transactionType,
            String location,
            String deviceId
    ) {
        Transaction transaction = Transaction.builder()
                .amount(amount)
                .transactionType(transactionType)
                .location(location)
                .deviceId(deviceId)
                .bankAccount(account)
                .build();

        return transactionRepository.save(fraudDetectionService.analyzeTransaction(transaction));
    }
}
