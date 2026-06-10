package com.hedgefund.controller;

import com.hedgefund.dto.DocumentUpdateRequest;
import com.hedgefund.model.Document;
import com.hedgefund.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Document> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "periodYear", required = false) Integer periodYear,
            @RequestParam(value = "periodQuarter", required = false) Integer periodQuarter,
            @RequestParam(value = "notes", required = false) String notes) throws IOException {
        Document document = documentService.uploadDocument(file, title, source, periodYear, periodQuarter, notes);
        return ResponseEntity.ok(document);
    }

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments(
            @RequestParam(value = "search", required = false) String search) {
        List<Document> documents;
        if (search != null && !search.isBlank()) {
            documents = documentService.searchDocuments(search);
        } else {
            documents = documentService.getAllDocuments();
        }
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getDocumentFile(@PathVariable Long id) throws IOException {
        Document document = documentService.getDocument(id);
        Path filePath = documentService.getDocumentFile(id);
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String fileName = document.getFileName() != null ? document.getFileName() : "document.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Document> updateDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentUpdateRequest request) {
        Document document = documentService.updateDocument(id,
                request.getTitle(), request.getSource(),
                request.getPeriodYear(), request.getPeriodQuarter(),
                request.getNotes());
        return ResponseEntity.ok(document);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("count", documentService.count());
        return ResponseEntity.ok(stats);
    }
}

