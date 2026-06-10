package com.hedgefund.service;

import com.hedgefund.exception.ResourceNotFoundException;
import com.hedgefund.model.Company;
import com.hedgefund.repository.CompanyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public Company createCompany(Company company) {
        return companyRepository.save(company);
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAllByOrderByNameAsc();
    }

    public Company getCompany(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));
    }

    public List<Company> searchCompanies(String query) {
        return companyRepository.findByNameContainingIgnoreCaseOrTickerContainingIgnoreCase(query, query);
    }

    public Company updateCompany(Long id, Company updated) {
        Company company = getCompany(id);
        if (updated.getName() != null) company.setName(updated.getName());
        if (updated.getTicker() != null) company.setTicker(updated.getTicker());
        if (updated.getSector() != null) company.setSector(updated.getSector());
        if (updated.getDescription() != null) company.setDescription(updated.getDescription());
        return companyRepository.save(company);
    }

    public void deleteCompany(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Company", id);
        }
        companyRepository.deleteById(id);
    }

    public long count() {
        return companyRepository.count();
    }
}
