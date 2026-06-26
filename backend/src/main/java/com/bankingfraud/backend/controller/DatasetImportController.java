package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.service.DatasetImportService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "http://localhost:5173")
public class DatasetImportController {

    private final DatasetImportService datasetImportService;

    public DatasetImportController(DatasetImportService datasetImportService) {
        this.datasetImportService = datasetImportService;
    }

    @PostMapping("/paysim")
    public Map<String, Object> importPaySim(@RequestParam("file") MultipartFile file)
            throws Exception {

        return datasetImportService.importPaySimCsv(file);
    }
}
