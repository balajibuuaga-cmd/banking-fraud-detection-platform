package com.bankingfraud.backend.kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class TransactionConsumer {

    @KafkaListener(topics = "transaction-events", groupId = "fraud-group")
    public void consume(String message) {

        System.out.println("Consumed Kafka Event: " + message);
    }
}