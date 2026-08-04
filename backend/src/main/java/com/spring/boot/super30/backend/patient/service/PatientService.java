package com.spring.boot.super30.backend.patient.service;

import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.patient.dto.CreatePatientRequest;
import com.spring.boot.super30.backend.patient.dto.PatientResponse;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.UserRole;
import com.spring.boot.super30.backend.shared.repository.UserRepository;
import com.spring.boot.super30.backend.shared.utils.PatientIdGenerator;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Service
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientIdGenerator patientIdGenerator;
    private final UserRepository userRepository;

    public PatientService(PatientRepository patientRepository,
            PatientIdGenerator patientIdGenerator, UserRepository userRepository) {
        this.patientRepository = patientRepository;
        this.patientIdGenerator = patientIdGenerator;
        this.userRepository = userRepository;
    }

    private PatientResponse mapToResponse(Patient patient) {
        PatientResponse response = new PatientResponse();
        response.setPatientId(patient.getPatientId());
        response.setDob(patient.getDob());
        response.setGender(patient.getGender());
        response.setBloodGroup(patient.getBloodGroup());
        response.setCreatedAt(patient.getCreatedAt());

        if (patient.getUser() != null) {
            response.setFirstName(patient.getUser().getFirstName());
            response.setLastName(patient.getUser().getLastName());
            response.setEmail(patient.getUser().getEmail());
            response.setPhone(patient.getUser().getPhone());
            response.setAddress(patient.getUser().getAddress());
            response.setProfileImage(patient.getUser().getProfileImage());
            response.setSmsNotificationsEnabled(patient.getUser().getSmsNotificationsEnabled());
            response.setWhatsappNotificationsEnabled(patient.getUser().getWhatsappNotificationsEnabled());
        }
        return response;
    }

    public PatientResponse createPatient(CreatePatientRequest request) {

        log.info("Executing logic to create patient: {} {}", request.getFirstName(), request.getLastName());
        User user = userRepository.findByEmail(request.getEmail()).orElseGet(User::new);
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(UserRole.PATIENT);
        user = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setPatientId(patientIdGenerator.generatePatientId());
        patient.setDob(request.getDob());
        patient.setGender(request.getGender());
        patient.setBloodGroup(request.getBloodGroup());

        log.debug("Generating new patient ID and saving to database");
        Patient savedPatient = patientRepository.save(patient);
        log.info("Patient saved successfully with ID: {}", savedPatient.getPatientId());

        return mapToResponse(savedPatient);
    }

    public PatientResponse updatePatientProfile(String patientId, com.spring.boot.super30.backend.patient.dto.UpdatePatientRequest request) {
        log.info("Updating patient profile for ID: {}", patientId);
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        if (request.getDob() != null) patient.setDob(request.getDob());
        if (request.getGender() != null) patient.setGender(request.getGender());
        if (request.getBloodGroup() != null) patient.setBloodGroup(request.getBloodGroup());

        User user = patient.getUser();
        if (user != null) {
            if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
            if (request.getLastName() != null) user.setLastName(request.getLastName());
            if (request.getPhone() != null) user.setPhone(request.getPhone());
            if (request.getAddress() != null) user.setAddress(request.getAddress());
            if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
            if (request.getSmsNotificationsEnabled() != null) user.setSmsNotificationsEnabled(request.getSmsNotificationsEnabled());
            if (request.getWhatsappNotificationsEnabled() != null) user.setWhatsappNotificationsEnabled(request.getWhatsappNotificationsEnabled());
            userRepository.save(user);
        }

        Patient updated = patientRepository.save(patient);
        return mapToResponse(updated);
    }

    public PatientResponse getPatientByEmail(String email) {
        log.info("Fetching patient profile by email: {}", email);
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> {
                    log.error("Patient with email {} not found", email);
                    return new com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException(
                            "Patient not found",
                            "PATIENT_NOT_FOUND"
                    );
                });

        return mapToResponse(patient);
    }

    public PatientResponse getPatientById(String patientId) {
        log.info("Fetching patient profile by ID: {}", patientId);
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> {
                    log.error("Patient with ID {} not found", patientId);
                    return new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND");
                });

        return mapToResponse(patient);
    }

    public List<PatientResponse> getAllPatients() {
        log.info("Fetching all patients");
        return patientRepository.findAll().stream()
                .map(patient -> {
                    PatientResponse res = new PatientResponse();
                    res.setPatientId(patient.getPatientId());
                    if (patient.getUser() != null) {
                        res.setFirstName(patient.getUser().getFirstName());
                        res.setLastName(patient.getUser().getLastName());
                        res.setPhone(patient.getUser().getPhone());
                        res.setEmail(patient.getUser().getEmail());
                    }
                    return res;
                })
                .collect(Collectors.toList());
    }

    public String exportPatientData(String patientId) {
        log.info("Exporting data for patient ID: {}", patientId);
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        PatientResponse profile = mapToResponse(patient);

        java.util.Map<String, Object> exportData = new java.util.HashMap<>();
        exportData.put("profile", profile);
        // Note: In a complete implementation, this would also fetch prescriptions and documents
        // But doing so here requires cross-service calls. We'll just export profile for now as MVP.
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(exportData);
        } catch (Exception e) {
            log.error("Failed to export patient data as JSON", e);
            throw new RuntimeException("Failed to generate data export", e);
        }
    }

    public void deletePatientAccount(String patientId) {
        log.info("Pseudonymizing patient data for Right to be Forgotten: {}", patientId);
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        User user = patient.getUser();
        if (user != null) {
            user.setFirstName("Anonymized");
            user.setLastName("User");
            user.setEmail("deleted_" + java.util.UUID.randomUUID() + "@anonymized.com");
            user.setPhone("0000000000");
            user.setAddress("Anonymized");
            user.setIsActive(false);
            user.setPasswordHash("DELETED");
            userRepository.save(user);
        }

        // Keep the patient record for foreign key integrity but wipe PII
        patient.setDob(null);
        patient.setBloodGroup(null);
        patientRepository.save(patient);
        log.info("Successfully pseudonymized patient ID: {}", patientId);
    }
}