package com.hedgefund.controller;

import com.hedgefund.service.CompanyService;
import com.hedgefund.service.DocumentService;
import com.hedgefund.service.IdeaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DocumentService documentService;
    private final CompanyService companyService;
    private final IdeaService ideaService;

    public DashboardController(DocumentService documentService, CompanyService companyService, IdeaService ideaService) {
        this.documentService = documentService;
        this.companyService = companyService;
        this.ideaService = ideaService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("documents", documentService.count());
        stats.put("companies", companyService.count());
        stats.put("ideas", ideaService.count());
        return ResponseEntity.ok(stats);
    }
}
