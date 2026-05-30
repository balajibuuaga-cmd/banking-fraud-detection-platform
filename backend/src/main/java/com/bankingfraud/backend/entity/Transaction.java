package com.bankingfraud.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;

    private String transactionType;

    private String location;

    private String deviceId;

    private String status;

    private Integer riskScore;

    private String riskLevel;

    private LocalDateTime transactionTime;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private BankAccount bankAccount;

    @PrePersist
    public void prePersist() {
        transactionTime = LocalDateTime.now();
    }

    @Column(length = 1000)
    private String reasonCodes;

    @Column(length = 2000)
    private String aiExplanation;
}
