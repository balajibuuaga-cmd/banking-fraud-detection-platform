package com.bankingfraud.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;



@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(unique = true)
    private String email;

    private String phoneNumber;

    private String address;

    private String riskLevel;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "customer")
    private List<BankAccount> bankAccounts;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}