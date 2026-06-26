package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.FraudAlert;
import com.bankingfraud.backend.entity.FraudCase;
import com.bankingfraud.backend.repository.FraudCaseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FraudCaseService {

    private final FraudCaseRepository fraudCaseRepository;
    private final FraudAlertService fraudAlertService;

    public FraudCaseService(FraudCaseRepository fraudCaseRepository,
                            FraudAlertService fraudAlertService) {
        this.fraudCaseRepository = fraudCaseRepository;
        this.fraudAlertService = fraudAlertService;
    }

    public FraudCase createCase(Long alertId, String assignedAnalyst, String notes) {

        return fraudCaseRepository.findByFraudAlertId(alertId)
                .orElseGet(() -> {
                    FraudAlert alert = fraudAlertService.getAlertById(alertId);

                    FraudCase fraudCase = FraudCase.builder()
                            .caseNumber("FC-" + alertId)
                            .assignedAnalyst(assignedAnalyst)
                            .status("OPEN")
                            .notes(notes)
                            .fraudAlert(alert)
                            .build();

                    return fraudCaseRepository.save(fraudCase);
                });
    }

    public List<FraudCase> getAllCases() {
        return fraudCaseRepository.findAll();
    }

    public FraudCase getCaseById(Long id) {
        return fraudCaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fraud case not found"));
    }

    public FraudCase updateCaseStatus(Long id, String status) {
        FraudCase fraudCase = getCaseById(id);
        fraudCase.setStatus(status);
        return fraudCaseRepository.save(fraudCase);
    }

    public FraudCase updateCaseNotes(Long id, String notes) {
        FraudCase fraudCase = getCaseById(id);
        fraudCase.setNotes(notes);
        return fraudCaseRepository.save(fraudCase);
    }

    public FraudCase updateAssignedAnalyst(Long id, String assignedAnalyst) {
        FraudCase fraudCase = getCaseById(id);

        fraudCase.setAssignedAnalyst(assignedAnalyst);

        return fraudCaseRepository.save(fraudCase);
    }

    public FraudCase updateAnalystNotes(Long id, String notes) {
        FraudCase fraudCase = getCaseById(id);
        fraudCase.setAnalystNotes(notes);
        return fraudCaseRepository.save(fraudCase);
    }
}