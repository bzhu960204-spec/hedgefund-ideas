package com.hedgefund.controller;

import com.hedgefund.dto.CompanyRequest;
import com.hedgefund.model.Company;
import com.hedgefund.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    public ResponseEntity<Company> createCompany(@Valid @RequestBody CompanyRequest request) {
        Company c = new Company();
        c.setName(request.getName());
        c.setTicker(request.getTicker());
        c.setSector(request.getSector());
        c.setDescription(request.getDescription());
        return ResponseEntity.ok(companyService.createCompany(c));
    }

    @GetMapping
    public ResponseEntity<List<Company>> getAllCompanies(
            @RequestParam(value = "search", required = false) String search) {
        List<Company> companies;
        if (search != null && !search.isBlank()) {
            companies = companyService.searchCompanies(search);
        } else {
            companies = companyService.getAllCompanies();
        }
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Company> getCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompany(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Company> updateCompany(@PathVariable Long id, @Valid @RequestBody CompanyRequest request) {
        Company c = new Company();
        c.setName(request.getName());
        c.setTicker(request.getTicker());
        c.setSector(request.getSector());
        c.setDescription(request.getDescription());
        return ResponseEntity.ok(companyService.updateCompany(id, c));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }
}

