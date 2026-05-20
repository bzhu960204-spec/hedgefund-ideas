package com.hedgefund.service;

import com.hedgefund.config.FileStorageConfig;
import com.hedgefund.model.Document;
import com.hedgefund.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final FileStorageConfig fileStorageConfig;

    public DocumentService(DocumentRepository documentRepository, FileStorageConfig fileStorageConfig) {
        this.documentRepository = documentRepository;
        this.fileStorageConfig = fileStorageConfig;
    }

    public Document uploadDocument(MultipartFile file, String title, String source, Integer periodYear, Integer periodQuarter, String notes) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String storedFilename = UUID.randomUUID() + "_" + originalFilename;
        Path targetPath = fileStorageConfig.getUploadPath().resolve(storedFilename);
        Files.copy(file.getInputStream(), targetPath);

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
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAllByOrderByUploadTimeDesc();
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
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

    public void deleteDocument(Long id) {
        Document document = getDocument(id);
        Path filePath = fileStorageConfig.getUploadPath().resolve(document.getFilePath());
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't fail
        }
        documentRepository.delete(document);
    }

    public long count() {
        return documentRepository.count();
    }
}
