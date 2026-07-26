package com.spring.boot.super30.backend.document.controller;

import com.spring.boot.super30.backend.document.dto.PatientDocumentResponse;
import com.spring.boot.super30.backend.document.service.PatientDocumentService;
import com.spring.boot.super30.backend.document.service.OcrService;
import com.spring.boot.super30.backend.shared.enums.MedicalCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.spring.boot.super30.backend.audit.annotation.Auditable;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class PatientDocumentController {

    private final PatientDocumentService documentService;
    private final OcrService ocrService;

    /**
     * Upload a document with category and optional metadata.
     * Accepts multipart/form-data.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientDocumentResponse> uploadDocument(
            @RequestParam String patientId,
            @RequestParam String category,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String documentDate) throws IOException {

        log.info("POST /api/documents/upload - patient: {}, category: {}, file: {}",
                patientId, category, file.getOriginalFilename());

        MedicalCategory cat = MedicalCategory.valueOf(category.toUpperCase());
        LocalDate docDate = documentDate != null && !documentDate.isEmpty()
                ? LocalDate.parse(documentDate)
                : null;

        PatientDocumentResponse response = documentService.uploadDocument(
                patientId, cat, file, description, docDate);

        return ResponseEntity.ok(response);
    }

    /**
     * List documents for a patient, optionally filtered by category.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<List<PatientDocumentResponse>> getDocuments(
            @RequestParam String patientId,
            @RequestParam(required = false) String category) {

        log.info("GET /api/documents - patient: {}, category: {}", patientId, category);

        MedicalCategory cat = (category != null && !category.isEmpty())
                ? MedicalCategory.valueOf(category.toUpperCase())
                : null;

        List<PatientDocumentResponse> docs = documentService.getDocuments(patientId, cat);
        return ResponseEntity.ok(docs);
    }

    /**
     * Get a presigned download URL for a document.
     */
    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    @Auditable(action = "DOWNLOAD_DOCUMENT", resourceType = "DOCUMENT")
    public ResponseEntity<Map<String, String>> getDownloadUrl(@PathVariable UUID id) {
        log.info("GET /api/documents/{}/download", id);
        String url = documentService.getDownloadUrl(id);
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Get a presigned URL for inline viewing (Content-Disposition: inline).
     * Allows PDFs and images to render directly in the browser.
     */
    @GetMapping("/{id}/view")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    @Auditable(action = "VIEW_DOCUMENT", resourceType = "DOCUMENT")
    public ResponseEntity<Map<String, String>> getViewUrl(@PathVariable UUID id) {
        log.info("GET /api/documents/{}/view", id);
        String url = documentService.getViewUrl(id);
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Stream document bytes for authenticated inline preview.
     */
    @GetMapping("/{id}/view-content")
    @Auditable(action = "VIEW_DOCUMENT_CONTENT", resourceType = "DOCUMENT")
    public ResponseEntity<byte[]> getViewContent(@PathVariable UUID id) {
        log.info("GET /api/documents/{}/view-content", id);
        PatientDocumentService.DocumentContent content = documentService.getViewContent(id);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(content.contentType());
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        String safeFileName = content.fileName().replace("\"", "");
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFileName + "\"")
                .body(content.data());
    }

    /**
     * Delete a document from S3 and database.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID id) {
        log.info("DELETE /api/documents/{}", id);
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Initiate restore for a document in Deep Archive.
     */
    @PostMapping("/{id}/restore")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientDocumentResponse> restoreDocument(@PathVariable UUID id) {
        log.info("POST /api/documents/{}/restore", id);
        PatientDocumentResponse response = documentService.initiateRestore(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Run OCR on a document.
     */
    @GetMapping("/{id}/ocr")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    @Auditable(action = "OCR_DOCUMENT", resourceType = "DOCUMENT")
    public ResponseEntity<Map<String, String>> extractDocumentText(@PathVariable UUID id) {
        log.info("GET /api/documents/{}/ocr", id);
        String extractedText = ocrService.extractTextFromDocument(id);
        return ResponseEntity.ok(Map.of("text", extractedText));
    }
}
