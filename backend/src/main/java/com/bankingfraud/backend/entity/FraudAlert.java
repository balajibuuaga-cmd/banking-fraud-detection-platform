package com.bankingfraud.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String alertType;

    private String severity;

    private String description;

    private String status;

    private Integer riskScore;

    private LocalDateTime createdAt;

    @OneToOne
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}