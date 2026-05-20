package com.hedgefund.service;

import com.hedgefund.dto.IdeaImportItem;
import com.hedgefund.model.Company;
import com.hedgefund.model.Document;
import com.hedgefund.model.Idea;
import com.hedgefund.repository.CompanyRepository;
import com.hedgefund.repository.DocumentRepository;
import com.hedgefund.repository.IdeaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class IdeaService {

    private final IdeaRepository ideaRepository;
    private final DocumentRepository documentRepository;
    private final CompanyRepository companyRepository;

    public IdeaService(IdeaRepository ideaRepository, DocumentRepository documentRepository, CompanyRepository companyRepository) {
        this.ideaRepository = ideaRepository;
        this.documentRepository = documentRepository;
        this.companyRepository = companyRepository;
    }

    public Idea createIdea(Long documentId, Long companyId, Idea.Action action, String summary, String thesis, String confidence) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));

        Idea idea = new Idea();
        idea.setDocument(document);
        idea.setCompany(company);
        idea.setAction(action);
        idea.setSummary(summary);
        idea.setThesis(thesis);
        idea.setConfidence(confidence);

        return ideaRepository.save(idea);
    }

    public List<Idea> getAllIdeas() {
        return ideaRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Idea> getIdeasByDocument(Long documentId) {
        return ideaRepository.findByDocumentId(documentId);
    }

    public List<Idea> getIdeasByCompany(Long companyId) {
        return ideaRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    public Idea updateIdea(Long id, Idea.Action action, String summary, String thesis, String confidence) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Idea not found: " + id));
        if (action != null) idea.setAction(action);
        if (summary != null) idea.setSummary(summary);
        if (thesis != null) idea.setThesis(thesis);
        if (confidence != null) idea.setConfidence(confidence);
        return ideaRepository.save(idea);
    }

    public void deleteIdea(Long id) {
        ideaRepository.deleteById(id);
    }

    public long count() {
        return ideaRepository.count();
    }

    @Transactional
    public List<Idea> importIdeas(Long documentId, List<IdeaImportItem> items) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        List<Idea> saved = new ArrayList<>();
        for (IdeaImportItem item : items) {
            if (item.getAction() == null || item.getAction().isBlank()) continue;

            Company company = resolveCompany(item);

            Idea idea = new Idea();
            idea.setDocument(document);
            idea.setCompany(company);
            idea.setAction(Idea.Action.valueOf(item.getAction().toUpperCase()));
            if (item.getSummary() != null && !item.getSummary().isBlank()) idea.setSummary(item.getSummary());
            if (item.getThesis() != null && !item.getThesis().isBlank()) idea.setThesis(item.getThesis());
            if (item.getConfidence() != null && !item.getConfidence().isBlank()) idea.setConfidence(item.getConfidence().toUpperCase());
            saved.add(ideaRepository.save(idea));
        }
        return saved;
    }

    private Company resolveCompany(IdeaImportItem item) {
        if (item.getCompanyId() != null) {
            return companyRepository.findById(item.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Company not found: " + item.getCompanyId()));
        }
        if (item.getCompanyTicker() != null && !item.getCompanyTicker().isBlank()) {
            return companyRepository.findByTickerIgnoreCase(item.getCompanyTicker())
                    .orElseGet(() -> {
                        Company c = new Company();
                        c.setTicker(item.getCompanyTicker().toUpperCase());
                        c.setName(item.getCompanyName() != null && !item.getCompanyName().isBlank()
                                ? item.getCompanyName() : item.getCompanyTicker().toUpperCase());
                        return companyRepository.save(c);
                    });
        }
        if (item.getCompanyName() != null && !item.getCompanyName().isBlank()) {
            Company c = new Company();
            c.setName(item.getCompanyName());
            return companyRepository.save(c);
        }
        throw new RuntimeException("Each idea must provide companyId, companyTicker, or companyName");
    }
}
