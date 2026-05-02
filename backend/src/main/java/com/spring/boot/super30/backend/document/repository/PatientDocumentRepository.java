package com.spring.boot.super30.backend.document.repository;

import com.spring.boot.super30.backend.document.entity.PatientDocument;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.shared.enums.MedicalCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PatientDocumentRepository extends JpaRepository<PatientDocument, UUID> {

    List<PatientDocument> findByPatientOrderByUploadedAtDesc(Patient patient);

    List<PatientDocument> findByPatientAndCategoryOrderByUploadedAtDesc(Patient patient, MedicalCategory category);

    long countByPatient(Patient patient);

    List<PatientDocument> findByS3StorageClass(String storageClass);

    List<PatientDocument> findByPatientAndS3StorageClassNot(Patient patient, String storageClass);
}
