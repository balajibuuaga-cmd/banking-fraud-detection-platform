package com.bankingfraud.backend.repository;

import com.bankingfraud.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}