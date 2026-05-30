package com.bankingfraud.backend.kafka;

import com.bankingfraud.backend.entity.Transaction;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class TransactionProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public TransactionProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishTransaction(Transaction transaction) {

        String message =
                "Transaction ID: " + transaction.getId()
                        + ", Risk Level: " + transaction.getRiskLevel()
                        + ", Amount: " + transaction.getAmount();

        kafkaTemplate.send("transaction-events", message);

        System.out.println("Published transaction event: " + message);
    }
}