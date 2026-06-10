package com.hedgefund.service;

import com.hedgefund.dto.IdeaImportItem;
import com.hedgefund.exception.BadRequestException;
import com.hedgefund.exception.ResourceNotFoundException;
import com.hedgefund.model.Company;
import com.hedgefund.model.Document;
import com.hedgefund.model.Idea;
import com.hedgefund.repository.CompanyRepository;
import com.hedgefund.repository.DocumentRepository;
import com.hedgefund.repository.IdeaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Import(IdeaService.class)
class IdeaServiceTest {

    @Autowired private IdeaService ideaService;
    @Autowired private IdeaRepository ideaRepository;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private CompanyRepository companyRepository;

    private Document document;

    @BeforeEach
    void setUp() {
        document = new Document();
        document.setTitle("Q1 2025 Letter");
        document.setFilePath("uuid_letter.pdf");
        document = documentRepository.save(document);
    }

    @Test
    void importIdeas_byTicker_createsCompanyWhenMissing() {
        IdeaImportItem item = new IdeaImportItem();
        item.setCompanyTicker("aapl");
        item.setCompanyName("Apple Inc");
        item.setAction("buy");
        item.setSummary("iPhone is great");

        List<Idea> saved = ideaService.importIdeas(document.getId(), List.of(item));

        assertThat(saved).hasSize(1);
        Idea idea = saved.get(0);
        assertThat(idea.getAction()).isEqualTo(Idea.Action.BUY);
        assertThat(idea.getCompany().getTicker()).isEqualTo("AAPL");
        assertThat(companyRepository.findByTickerIgnoreCase("AAPL")).isPresent();
    }

    @Test
    void importIdeas_byTicker_reusesExistingCompany() {
        Company existing = new Company();
        existing.setName("Microsoft");
        existing.setTicker("MSFT");
        companyRepository.save(existing);

        IdeaImportItem item = new IdeaImportItem();
        item.setCompanyTicker("msft");
        item.setAction("HOLD");

        List<Idea> saved = ideaService.importIdeas(document.getId(), List.of(item));

        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getCompany().getId()).isEqualTo(existing.getId());
        assertThat(companyRepository.count()).isEqualTo(1);
    }

    @Test
    void importIdeas_skipsItemsWithoutAction() {
        IdeaImportItem item = new IdeaImportItem();
        item.setCompanyTicker("AAPL");
        item.setAction("  ");

        List<Idea> saved = ideaService.importIdeas(document.getId(), List.of(item));
        assertThat(saved).isEmpty();
    }

    @Test
    void importIdeas_rejectsInvalidAction() {
        IdeaImportItem item = new IdeaImportItem();
        item.setCompanyTicker("AAPL");
        item.setAction("YOLO");

        assertThatThrownBy(() -> ideaService.importIdeas(document.getId(), List.of(item)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid action");
    }

    @Test
    void importIdeas_requiresCompanyIdentifier() {
        IdeaImportItem item = new IdeaImportItem();
        item.setAction("BUY");

        assertThatThrownBy(() -> ideaService.importIdeas(document.getId(), List.of(item)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createIdea_throwsWhenDocumentMissing() {
        Company c = new Company();
        c.setName("X");
        c = companyRepository.save(c);
        Long companyId = c.getId();

        assertThatThrownBy(() ->
                ideaService.createIdea(99_999L, companyId, Idea.Action.BUY, null, null, null)
        ).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteIdea_throwsWhenMissing() {
        assertThatThrownBy(() -> ideaService.deleteIdea(404L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
