package com.hedgefund.controller;

import com.hedgefund.dto.IdeaCreateRequest;
import com.hedgefund.dto.IdeaDTO;
import com.hedgefund.dto.IdeaImportItem;
import com.hedgefund.dto.IdeaUpdateRequest;
import com.hedgefund.dto.PagedResponse;
import com.hedgefund.model.Idea;
import com.hedgefund.service.IdeaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ideas")
public class IdeaController {

    private static final int MAX_PAGE_SIZE = 200;

    private final IdeaService ideaService;

    public IdeaController(IdeaService ideaService) {
        this.ideaService = ideaService;
    }

    @PostMapping
    public ResponseEntity<IdeaDTO> createIdea(@Valid @RequestBody IdeaCreateRequest request) {
        Idea idea = ideaService.createIdea(
                request.getDocumentId(),
                request.getCompanyId(),
                request.getAction(),
                request.getSummary(),
                request.getThesis(),
                request.getConfidence()
        );
        return ResponseEntity.ok(IdeaDTO.from(idea));
    }

    /**
     * When `page` is provided, returns a paginated response.
     * Otherwise returns the full list (backward compatible).
     */
    @GetMapping
    public ResponseEntity<?> getIdeas(
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "50") Integer size) {

        if (page != null) {
            int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
            Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize,
                    Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Idea> result = ideaService.getIdeasPaged(documentId, companyId, pageable);
            return ResponseEntity.ok(PagedResponse.of(result, IdeaDTO::from));
        }

        List<Idea> ideas;
        if (documentId != null) {
            ideas = ideaService.getIdeasByDocument(documentId);
        } else if (companyId != null) {
            ideas = ideaService.getIdeasByCompany(companyId);
        } else {
            ideas = ideaService.getAllIdeas();
        }
        return ResponseEntity.ok(ideas.stream().map(IdeaDTO::from).collect(Collectors.toList()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IdeaDTO> updateIdea(@PathVariable Long id, @Valid @RequestBody IdeaUpdateRequest request) {
        Idea updated = ideaService.updateIdea(id,
                request.getAction(),
                request.getSummary(),
                request.getThesis(),
                request.getConfidence());
        return ResponseEntity.ok(IdeaDTO.from(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIdea(@PathVariable Long id) {
        ideaService.deleteIdea(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import")
    public ResponseEntity<List<IdeaDTO>> importIdeas(
            @RequestParam("documentId") Long documentId,
            @RequestBody List<IdeaImportItem> items) {
        List<IdeaDTO> result = ideaService.importIdeas(documentId, items)
                .stream().map(IdeaDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}

