package com.hedgefund.controller;

import com.hedgefund.dto.IdeaDTO;
import com.hedgefund.dto.IdeaImportItem;
import com.hedgefund.model.Idea;
import com.hedgefund.service.IdeaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ideas")
public class IdeaController {

    private final IdeaService ideaService;

    public IdeaController(IdeaService ideaService) {
        this.ideaService = ideaService;
    }

    @PostMapping
    public ResponseEntity<IdeaDTO> createIdea(@RequestBody Map<String, Object> body) {
        Long documentId = Long.valueOf(body.get("documentId").toString());
        Long companyId = Long.valueOf(body.get("companyId").toString());
        Idea.Action action = Idea.Action.valueOf(body.get("action").toString());
        String summary = body.get("summary") != null ? body.get("summary").toString() : null;
        String thesis = body.get("thesis") != null ? body.get("thesis").toString() : null;
        String confidence = body.get("confidence") != null ? body.get("confidence").toString() : null;

        Idea idea = ideaService.createIdea(documentId, companyId, action, summary, thesis, confidence);
        return ResponseEntity.ok(IdeaDTO.from(idea));
    }

    @GetMapping
    public ResponseEntity<List<IdeaDTO>> getIdeas(
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "companyId", required = false) Long companyId) {
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
    public ResponseEntity<IdeaDTO> updateIdea(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Idea.Action action = body.get("action") != null ? Idea.Action.valueOf(body.get("action")) : null;
        String summary = body.get("summary");
        String thesis = body.get("thesis");
        String confidence = body.get("confidence");
        return ResponseEntity.ok(IdeaDTO.from(ideaService.updateIdea(id, action, summary, thesis, confidence)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIdea(@PathVariable Long id) {
        ideaService.deleteIdea(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import")
    public ResponseEntity<?> importIdeas(
            @RequestParam("documentId") Long documentId,
            @RequestBody List<IdeaImportItem> items) {
        try {
            List<IdeaDTO> result = ideaService.importIdeas(documentId, items)
                    .stream().map(IdeaDTO::from).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
