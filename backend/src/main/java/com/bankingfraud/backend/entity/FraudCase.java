package com.bankingfraud.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String caseNumber;

    private String assignedAnalyst;

    private String status;

    @Column(length = 2000)
    private String notes;

    @Column(length = 2000)
    private String analystNotes;

    private LocalDateTime createdAt;

    @OneToOne
    @JoinColumn(name = "alert_id")
    private FraudAlert fraudAlert;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();

        if (this.status == null) {
            this.status = "OPEN";
        }
    }
}