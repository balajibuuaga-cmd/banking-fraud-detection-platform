package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.service.AnalyticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public Map<String, Object> getDashboardSummary() {
        return analyticsService.getDashboardSummary();
    }

    @GetMapping("/risk-distribution")
    public Map<String, Long> getRiskDistribution() {
        return analyticsService.getRiskDistribution();
    }

    @GetMapping("/alert-status")
    public Map<String, Long> getAlertStatusDistribution() {
        return analyticsService.getAlertStatusDistribution();
    }

    @GetMapping("/locations")
    public Map<String, Long> getTransactionsByLocation() {
        return analyticsService.getTransactionsByLocation();
    }

    @GetMapping("/severity")
    public Map<String, Long> getFraudSeverityAnalytics() {
        return analyticsService.getFraudSeverityAnalytics();
    }
}