package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.FraudCase;
import com.bankingfraud.backend.service.FraudCaseService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/investigation-assistant")
@CrossOrigin(origins = "http://localhost:5173")
public class InvestigationAssistantController {

    private final FraudCaseService fraudCaseService;

    public InvestigationAssistantController(FraudCaseService fraudCaseService) {
        this.fraudCaseService = fraudCaseService;
    }

    @GetMapping("/case/{caseId}/summary")
    public Map<String, Object> generateCaseSummary(@PathVariable Long caseId) {
        FraudCase fraudCase = fraudCaseService.getCaseById(caseId);

        Map<String, Object> response = new HashMap<>();

        response.put("caseId", fraudCase.getId());
        response.put("caseNumber", fraudCase.getCaseNumber());
        response.put("summary",
                "This case involves a high-risk fraud alert requiring analyst review. " +
                        "The account should remain restricted until customer verification is completed."
        );
        response.put("recommendedNextSteps",
                "Review transaction history, verify customer identity, contact the customer, " +
                        "and document the final investigation decision."
        );

        return response;
    }
}
