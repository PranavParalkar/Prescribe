package com.spring.boot.super30.backend.document.service;

import com.spring.boot.super30.backend.document.dto.PatientDocumentResponse;
import com.spring.boot.super30.backend.document.entity.PatientDocument;
import com.spring.boot.super30.backend.document.repository.PatientDocumentRepository;
import com.spring.boot.super30.backend.exception.custom.BadRequestException;
import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.shared.enums.MedicalCategory;
import com.spring.boot.super30.backend.shared.enums.SubscriptionStatus;
import com.spring.boot.super30.backend.subscription.entity.Subscription;
import com.spring.boot.super30.backend.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.StorageClass;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientDocumentService {

    private final PatientDocumentRepository documentRepository;
    private final PatientRepository patientRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final S3StorageService s3StorageService;

    @Value("${subscription.free-upload-limit:3}")
    private int freeUploadLimit;

    // ─── Upload ──────────────────────────────────────────────────────────────

    @Transactional
    public PatientDocumentResponse uploadDocument(
            String patientId,
            MedicalCategory category,
            MultipartFile file,
            String description,
            LocalDate documentDate) throws IOException {

        log.info("Upload request: patientId={}, category={}, file={}", patientId, category, file.getOriginalFilename());

        Patient patient = findPatient(patientId);

        // Check upload limits
        long currentCount = documentRepository.countByPatient(patient);
        boolean hasActiveSub = hasActiveSubscription(patient);

        if (!hasActiveSub && currentCount >= freeUploadLimit) {
            throw new BadRequestException(
                    "Free tier upload limit reached (" + freeUploadLimit + " files). Please subscribe to upload more.",
                    "UPLOAD_LIMIT_REACHED");
        }

        // Build S3 key: {patientName}-{patientId}/{category}/{uuid}_{filename}
        String patientFolder = buildPatientFolder(patient);
        String safeFileName = file.getOriginalFilename() != null
                ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "upload";
        String s3Key = patientFolder + "/" + category.name().toLowerCase() + "/"
                + UUID.randomUUID().toString().substring(0, 8) + "_" + safeFileName;

        // Upload to S3 Standard
        s3StorageService.uploadFile(file, s3Key, StorageClass.STANDARD);

        // Save metadata
        PatientDocument doc = new PatientDocument();
        doc.setPatient(patient);
        doc.setCategory(category);
        doc.setFileName(file.getOriginalFilename());
        doc.setFileSize(file.getSize());
        doc.setContentType(file.getContentType());
        doc.setS3Key(s3Key);
        doc.setS3StorageClass("STANDARD");
        doc.setRestoreStatus("NONE");
        doc.setDescription(description);
        doc.setDocumentDate(documentDate);

        PatientDocument saved = documentRepository.save(doc);
        log.info("Document saved with ID: {}", saved.getId());

        return toResponse(saved, true);
    }

    // ─── List Documents ──────────────────────────────────────────────────────

    public List<PatientDocumentResponse> getDocuments(String patientId, MedicalCategory category) {
        Patient patient = findPatient(patientId);
        List<PatientDocument> docs;

        if (category != null) {
            docs = documentRepository.findByPatientAndCategoryOrderByUploadedAtDesc(patient, category);
        } else {
            docs = documentRepository.findByPatientOrderByUploadedAtDesc(patient);
        }

        return docs.stream().map(d -> toResponse(d, canGenerateUrl(d))).toList();
    }

    // ─── Download URL ────────────────────────────────────────────────────────

    public String getDownloadUrl(UUID documentId) {
        PatientDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found", "DOCUMENT_NOT_FOUND"));

        if ("DEEP_ARCHIVE".equals(doc.getS3StorageClass()) && !"RESTORED".equals(doc.getRestoreStatus())) {
            throw new BadRequestException(
                    "File is in Deep Archive. Please initiate restore first.",
                    "FILE_IN_DEEP_ARCHIVE");
        }

        return s3StorageService.generatePresignedUrl(doc.getS3Key());
    }

    // ─── View URL (inline) ────────────────────────────────────────────────────

    public String getViewUrl(UUID documentId) {
        PatientDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found", "DOCUMENT_NOT_FOUND"));

        if ("DEEP_ARCHIVE".equals(doc.getS3StorageClass()) && !"RESTORED".equals(doc.getRestoreStatus())) {
            throw new BadRequestException(
                    "File is in Deep Archive. Please initiate restore first.",
                    "FILE_IN_DEEP_ARCHIVE");
        }

        return s3StorageService.generateViewUrl(doc.getS3Key(), resolveContentType(doc));
    }

    public DocumentContent getViewContent(UUID documentId) {
        PatientDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found", "DOCUMENT_NOT_FOUND"));

        if ("DEEP_ARCHIVE".equals(doc.getS3StorageClass()) && !"RESTORED".equals(doc.getRestoreStatus())) {
            throw new BadRequestException(
                    "File is in Deep Archive. Please initiate restore first.",
                    "FILE_IN_DEEP_ARCHIVE");
        }

        byte[] content = s3StorageService.getFileBytes(doc.getS3Key());
        String fileName = doc.getFileName() != null && !doc.getFileName().isBlank()
                ? doc.getFileName()
                : "document";

        return new DocumentContent(content, resolveContentType(doc), fileName);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    @Transactional
    public void deleteDocument(UUID documentId) {
        PatientDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found", "DOCUMENT_NOT_FOUND"));

        s3StorageService.deleteFile(doc.getS3Key());
        documentRepository.delete(doc);
        log.info("Document deleted: {}", documentId);
    }

    // ─── Restore from Deep Archive ───────────────────────────────────────────

    @Transactional
    public PatientDocumentResponse initiateRestore(UUID documentId) {
        PatientDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found", "DOCUMENT_NOT_FOUND"));

        if (!"DEEP_ARCHIVE".equals(doc.getS3StorageClass())) {
            throw new BadRequestException("File is not in Deep Archive", "NOT_IN_DEEP_ARCHIVE");
        }

        s3StorageService.initiateRestore(doc.getS3Key());
        doc.setRestoreStatus("IN_PROGRESS");
        documentRepository.save(doc);

        log.info("Restore initiated for document: {}", documentId);
        return toResponse(doc, false);
    }

    // ─── Storage Class Transitions (called by scheduler) ─────────────────────

    /**
     * Move all documents for a patient to a target storage class.
     */
    @Transactional
    public void transitionStorageClass(Patient patient, String targetClass) {
        List<PatientDocument> docs = documentRepository.findByPatientAndS3StorageClassNot(patient, targetClass);
        StorageClass sc = StorageClass.fromValue(targetClass);

        for (PatientDocument doc : docs) {
            try {
                if ("DEEP_ARCHIVE".equals(doc.getS3StorageClass())) {
                    // Need to restore first before changing class
                    s3StorageService.initiateRestore(doc.getS3Key());
                    doc.setRestoreStatus("IN_PROGRESS");
                } else {
                    s3StorageService.changeStorageClass(doc.getS3Key(), sc);
                    doc.setS3StorageClass(targetClass);
                    doc.setRestoreStatus("NONE");
                }
                documentRepository.save(doc);
                log.info("Transitioned doc {} to {}", doc.getId(), targetClass);
            } catch (Exception e) {
                log.error("Failed to transition doc {}: {}", doc.getId(), e.getMessage());
            }
        }
    }

    /**
     * Check pending restores and complete the transition to STANDARD.
     */
    @Transactional
    public void completePendingRestores() {
        List<PatientDocument> docs = documentRepository.findByS3StorageClass("DEEP_ARCHIVE");
        for (PatientDocument doc : docs) {
            if ("IN_PROGRESS".equals(doc.getRestoreStatus())) {
                if (s3StorageService.isRestoreComplete(doc.getS3Key())) {
                    try {
                        s3StorageService.changeStorageClass(doc.getS3Key(), StorageClass.STANDARD);
                        doc.setS3StorageClass("STANDARD");
                        doc.setRestoreStatus("NONE");
                        documentRepository.save(doc);
                        log.info("Restore completed, moved to STANDARD: {}", doc.getId());
                    } catch (Exception e) {
                        log.error("Failed to move restored doc to STANDARD: {}", doc.getId(), e);
                    }
                }
            }
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Patient findPatient(String patientId) {
        return patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));
    }

    private boolean hasActiveSubscription(Patient patient) {
        Optional<Subscription> sub = subscriptionRepository.findByPatientAndStatus(patient, SubscriptionStatus.ACTIVE);
        return sub.isPresent() && sub.get().getEndDate().isAfter(LocalDateTime.now());
    }

    private String buildPatientFolder(Patient patient) {
        String name = "patient";
        if (patient.getUser() != null) {
            String fn = patient.getUser().getFirstName();
            String ln = patient.getUser().getLastName();
            if (fn != null || ln != null) {
                name = ((fn != null ? fn : "") + (ln != null ? ln : "")).toLowerCase().replaceAll("[^a-z0-9]", "");
            }
        }
        return name + "-" + patient.getPatientId();
    }

    private String resolveContentType(PatientDocument doc) {
        if (doc.getContentType() != null && !doc.getContentType().isBlank()) {
            String normalized = doc.getContentType().toLowerCase();
            // Generic MIME types do not render inline reliably; fall back to extension-based detection.
            if (!"application/octet-stream".equals(normalized)
                    && !"binary/octet-stream".equals(normalized)
                    && !"application/x-download".equals(normalized)
                    && !"application/force-download".equals(normalized)) {
                return doc.getContentType();
            }
        }

        String source = doc.getFileName() != null && !doc.getFileName().isBlank()
                ? doc.getFileName().toLowerCase()
                : (doc.getS3Key() != null ? doc.getS3Key().toLowerCase() : "");

        if (source.endsWith(".pdf")) return "application/pdf";
        if (source.endsWith(".jpg") || source.endsWith(".jpeg")) return "image/jpeg";
        if (source.endsWith(".png")) return "image/png";
        if (source.endsWith(".gif")) return "image/gif";
        if (source.endsWith(".webp")) return "image/webp";
        if (source.endsWith(".svg")) return "image/svg+xml";

        return "application/octet-stream";
    }

    private boolean canGenerateUrl(PatientDocument doc) {
        return !"DEEP_ARCHIVE".equals(doc.getS3StorageClass())
                || "RESTORED".equals(doc.getRestoreStatus());
    }

    public record DocumentContent(byte[] data, String contentType, String fileName) {
    }

    private PatientDocumentResponse toResponse(PatientDocument doc, boolean includeUrl) {
        String url = null;
        if (includeUrl && canGenerateUrl(doc)) {
            try {
                url = s3StorageService.generatePresignedUrl(doc.getS3Key());
            } catch (Exception e) {
                log.warn("Could not generate presigned URL for doc {}: {}", doc.getId(), e.getMessage());
            }
        }

        return PatientDocumentResponse.builder()
                .id(doc.getId().toString())
                .category(doc.getCategory().name())
                .fileName(doc.getFileName())
                .fileSize(doc.getFileSize())
                .contentType(doc.getContentType())
                .description(doc.getDescription())
                .documentDate(doc.getDocumentDate() != null ? doc.getDocumentDate().toString() : null)
                .uploadedAt(doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : null)
                .s3StorageClass(doc.getS3StorageClass())
                .restoreStatus(doc.getRestoreStatus())
                .downloadUrl(url)
                .build();
    }
}
