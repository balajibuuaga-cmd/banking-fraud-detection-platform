package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.service.DatasetImportService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/import")
public class DatasetImportController {

    private final DatasetImportService datasetImportService;

    public DatasetImportController(DatasetImportService datasetImportService) {
        this.datasetImportService = datasetImportService;
    }

    @PostMapping("/paysim")
    public Map<String, Object> importPaySim(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "0") int skipRows,
            @RequestParam(defaultValue = "1000") int rowLimit)
            throws Exception {

        return datasetImportService.importPaySimCsv(file, skipRows, rowLimit);
    }
}
