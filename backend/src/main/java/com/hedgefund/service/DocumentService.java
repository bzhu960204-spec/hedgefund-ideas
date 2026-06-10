package com.hedgefund.service;

import com.hedgefund.config.FileStorageConfig;
import com.hedgefund.exception.BadRequestException;
import com.hedgefund.exception.ResourceNotFoundException;
import com.hedgefund.model.Document;
import com.hedgefund.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("application/pdf");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf");

    private final DocumentRepository documentRepository;
    private final FileStorageConfig fileStorageConfig;

    public DocumentService(DocumentRepository documentRepository, FileStorageConfig fileStorageConfig) {
        this.documentRepository = documentRepository;
        this.fileStorageConfig = fileStorageConfig;
    }

    @Transactional
    public Document uploadDocument(MultipartFile file, String title, String source, Integer periodYear, Integer periodQuarter, String notes) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Filename is required");
        }
        // Block any path traversal in the original filename — we only use the basename anyway.
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\\\")) {
            throw new BadRequestException("Invalid filename");
        }
        String lower = originalFilename.toLowerCase();
        boolean extOk = ALLOWED_EXTENSIONS.stream().anyMatch(lower::endsWith);
        String contentType = file.getContentType();
        boolean ctOk = contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase());
        if (!extOk || !ctOk) {
            throw new BadRequestException("Only PDF uploads are allowed");
        }

        String storedFilename = UUID.randomUUID() + "_" + originalFilename;
        Path targetPath = fileStorageConfig.getUploadPath().resolve(storedFilename);
        Files.copy(file.getInputStream(), targetPath);

        try {
            Document document = new Document();
            document.setTitle(title != null ? title : originalFilename);
            document.setSource(source);
            document.setPeriodYear(periodYear);
            document.setPeriodQuarter(periodQuarter);
            document.setFileName(originalFilename);
            document.setFilePath(storedFilename);
            document.setFileSize(file.getSize());
            document.setNotes(notes);
            return documentRepository.save(document);
        } catch (RuntimeException ex) {
            // Roll the file back if the DB save fails
            try { Files.deleteIfExists(targetPath); } catch (IOException ignored) {}
            throw ex;
        }
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAllByOrderByUploadTimeDesc();
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", id));
    }

    public List<Document> searchDocuments(String query) {
        return documentRepository.findByTitleContainingIgnoreCaseOrSourceContainingIgnoreCase(query, query);
    }

    public Path getDocumentFile(Long id) {
        Document document = getDocument(id);
        return fileStorageConfig.getUploadPath().resolve(document.getFilePath());
    }

    public Document updateDocument(Long id, String title, String source, Integer periodYear, Integer periodQuarter, String notes) {
        Document document = getDocument(id);
        if (title != null) document.setTitle(title);
        if (source != null) document.setSource(source);
        if (periodYear != null) document.setPeriodYear(periodYear);
        if (periodQuarter != null) document.setPeriodQuarter(periodQuarter);
        if (notes != null) document.setNotes(notes);
        return documentRepository.save(document);
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = getDocument(id);
        Path filePath = fileStorageConfig.getUploadPath().resolve(document.getFilePath());
        // Delete the DB row first; only purge the file if the transaction commits.
        documentRepository.delete(document);
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file {} for document {}", filePath, id, e);
        }
    }

    public long count() {
        return documentRepository.count();
    }
}
