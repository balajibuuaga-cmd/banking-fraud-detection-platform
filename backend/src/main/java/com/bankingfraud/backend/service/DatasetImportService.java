package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.BankAccount;
import com.bankingfraud.backend.entity.Customer;
import com.bankingfraud.backend.entity.Transaction;
import com.bankingfraud.backend.repository.BankAccountRepository;
import com.bankingfraud.backend.repository.CustomerRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DatasetImportService {

    private static final int DEFAULT_IMPORT_ROWS = 1000;
    private static final int MAX_IMPORT_ROWS = 10000;

    private final CustomerRepository customerRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionService transactionService;

    public DatasetImportService(
            CustomerRepository customerRepository,
            BankAccountRepository bankAccountRepository,
            TransactionService transactionService) {

        this.customerRepository = customerRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.transactionService = transactionService;
    }

    public Map<String, Object> importPaySimCsv(MultipartFile file, int skipRows, int rowLimit)
            throws Exception {
        int normalizedSkipRows = Math.max(0, skipRows);
        int normalizedRowLimit = Math.max(1, Math.min(rowLimit, MAX_IMPORT_ROWS));
        int imported = 0;
        int failed = 0;
        int processed = 0;

        Map<String, BankAccount> accountCache = new HashMap<>();

        try (
                Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
                CSVParser csvParser = CSVFormat.DEFAULT
                        .builder()
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .setTrim(true)
                        .build()
                        .parse(reader)
        ) {
            for (CSVRecord record : csvParser) {
                if (processed++ < normalizedSkipRows) {
                    continue;
                }

                if (imported >= normalizedRowLimit) {
                    break;
                }

                try {
                    String sourceAccountNumber = record.get("nameOrig");
                    String transactionType = normalizeTransactionType(record.get("type"));
                    Double amount = Double.parseDouble(record.get("amount"));

                    BankAccount account = accountCache.computeIfAbsent(
                            sourceAccountNumber,
                            this::findOrCreateCustomerAndAccount
                    );

                    Transaction transaction = Transaction.builder()
                            .amount(amount)
                            .transactionType(transactionType)
                            .location(generateLocation(record))
                            .deviceId(generateDeviceId(record))
                            .status("NEW")
                            .transactionTime(LocalDateTime.now())
                            .build();

                    transactionService.createTransaction(account.getId(), transaction);
                    imported++;
                } catch (Exception exception) {
                    failed++;
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Dataset import completed");
        result.put("importedRows", imported);
        result.put("failedRows", failed);
        result.put("source", "PaySim CSV");
        result.put("skippedRows", normalizedSkipRows);
        result.put("rowLimit", normalizedRowLimit);
        result.put("maxRowLimit", MAX_IMPORT_ROWS);

        return result;
    }

    public Map<String, Object> importPaySimCsv(MultipartFile file) throws Exception {
        return importPaySimCsv(file, 0, DEFAULT_IMPORT_ROWS);
    }

    private BankAccount findOrCreateCustomerAndAccount(String accountNumber) {
        return bankAccountRepository.findByAccountNumber(accountNumber)
                .orElseGet(() -> createCustomerAndAccount(accountNumber));
    }

    private BankAccount createCustomerAndAccount(String accountNumber) {
        Customer customer = Customer.builder()
                .fullName("Customer " + accountNumber)
                .email(accountNumber.toLowerCase() + "@fraudops.demo")
                .phoneNumber("000-000-0000")
                .address("Synthetic Dataset")
                .riskLevel("UNKNOWN")
                .createdAt(LocalDateTime.now())
                .build();

        Customer savedCustomer = customerRepository.save(customer);

        BankAccount account = BankAccount.builder()
                .accountNumber(accountNumber)
                .accountType("CHECKING")
                .balance(25000.00)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .customer(savedCustomer)
                .build();

        return bankAccountRepository.save(account);
    }

    private String normalizeTransactionType(String paysimType) {
        if ("TRANSFER".equalsIgnoreCase(paysimType)) {
            return "INTERNATIONAL_TRANSFER";
        }

        return paysimType;
    }

    private String generateLocation(CSVRecord record) {
        String isFraud = record.get("isFraud");

        if ("1".equals(isFraud)) {
            return "Russia";
        }

        return "Chicago";
    }

    private String generateDeviceId(CSVRecord record) {
        String isFraud = record.get("isFraud");

        if ("1".equals(isFraud)) {
            return "new-device-import";
        }

        return "known-device";
    }
}
