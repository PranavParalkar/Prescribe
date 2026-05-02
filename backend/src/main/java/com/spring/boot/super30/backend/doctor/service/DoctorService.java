package com.spring.boot.super30.backend.doctor.service;

import com.spring.boot.super30.backend.doctor.dto.CreateDoctorRequest;
import com.spring.boot.super30.backend.doctor.dto.DoctorResponse;
import com.spring.boot.super30.backend.doctor.entity.Doctor;
import com.spring.boot.super30.backend.doctor.entity.DeletedDoctor;
import com.spring.boot.super30.backend.doctor.repository.DoctorRepository;
import com.spring.boot.super30.backend.doctor.repository.DeletedDoctorRepository;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.DoctorStatus;
import com.spring.boot.super30.backend.shared.enums.UserRole;
import com.spring.boot.super30.backend.shared.repository.UserRepository;
import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import com.spring.boot.super30.backend.document.service.S3StorageService;
import software.amazon.awssdk.services.s3.model.StorageClass;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;
    private final DeletedDoctorRepository deletedDoctorRepository;
    private final PrescriptionRepository prescriptionRepository;

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository, S3StorageService s3StorageService, DeletedDoctorRepository deletedDoctorRepository, PrescriptionRepository prescriptionRepository) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
        this.deletedDoctorRepository = deletedDoctorRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        DoctorResponse response = new DoctorResponse();
        response.setDoctorId(doctor.getDoctorId());
        response.setSpecialization(doctor.getSpecialization());
        response.setLicenseNumber(doctor.getLicenseNumber());
        response.setDob(doctor.getDob());
        response.setStatus(doctor.getStatus());
        response.setCreatedAt(doctor.getCreatedAt());
        response.setLicenseDocumentUrl(doctor.getLicenseDocumentUrl());
        
        if (doctor.getUser() != null) {
            response.setFirstName(doctor.getUser().getFirstName());
            response.setLastName(doctor.getUser().getLastName());
            response.setEmail(doctor.getUser().getEmail());
            response.setPhone(doctor.getUser().getPhone());
            response.setAddress(doctor.getUser().getAddress());
            response.setProfileImage(doctor.getUser().getProfileImage());
        }
        return response;
    }

    public DoctorResponse createDoctor(CreateDoctorRequest request) {

        User user = userRepository.findByEmail(request.getEmail()).orElseGet(User::new);
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(UserRole.DOCTOR);
        user = userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDoctorId("DOC-" + UUID.randomUUID().toString().substring(0, 8));
        doctor.setSpecialization(request.getSpecialization());
        doctor.setLicenseNumber(request.getLicenseNumber());
        doctor.setStatus(DoctorStatus.PENDING);

        log.debug("Saving new doctor details to database: {}", doctor.getDoctorId());
        Doctor saved = doctorRepository.save(doctor);
        log.info("Successfully saved doctor with ID: {}", saved.getDoctorId());

        DoctorResponse response = new DoctorResponse();
        response.setDoctorId(saved.getDoctorId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setSpecialization(saved.getSpecialization());
        response.setStatus(saved.getStatus());
        response.setLicenseDocumentUrl(saved.getLicenseDocumentUrl());

        return response;
    }

    public DoctorResponse updateDoctorProfile(String doctorId, com.spring.boot.super30.backend.doctor.dto.UpdateDoctorRequest request) {
        log.info("Updating doctor profile for ID: {}", doctorId);
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));

        if (request.getDob() != null) {
            java.time.LocalDate now = java.time.LocalDate.now();
            int age = java.time.Period.between(request.getDob(), now).getYears();
            if (age < 18) {
                throw new IllegalArgumentException("Doctor must be at least 18 years old.");
            }
            doctor.setDob(request.getDob());
        }

        if (request.getSpecialization() != null) doctor.setSpecialization(request.getSpecialization());
        if (request.getLicenseNumber() != null) doctor.setLicenseNumber(request.getLicenseNumber());

        User user = doctor.getUser();
        if (user != null) {
            if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
            if (request.getLastName() != null) user.setLastName(request.getLastName());
            if (request.getPhone() != null) user.setPhone(request.getPhone());
            if (request.getAddress() != null) user.setAddress(request.getAddress());
            if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
            userRepository.save(user);
        }

        Doctor updated = doctorRepository.save(doctor);
        return mapToResponse(updated);
    }

    public DoctorResponse verifyDoctor(String doctorId) {

        log.info("Executing doctor verification for ID: {}", doctorId);
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> {
                    log.error("Failed to verify doctor. Doctor with ID {} not found", doctorId);
                    return new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND");
                });

        doctor.setStatus(DoctorStatus.VERIFIED);

        doctorRepository.save(doctor);

        DoctorResponse response = new DoctorResponse();
        response.setDoctorId(doctor.getDoctorId());
        if (doctor.getUser() != null) {
            response.setFirstName(doctor.getUser().getFirstName());
            response.setLastName(doctor.getUser().getLastName());
        }
        response.setSpecialization(doctor.getSpecialization());
        response.setStatus(doctor.getStatus());
        response.setLicenseDocumentUrl(doctor.getLicenseDocumentUrl());

        return response;
    }

    public DoctorResponse getDoctorByEmail(String email) {
        log.info("Fetching doctor profile by email: {}", email);
        Doctor doctor = doctorRepository.findByUserEmail(email)
                .orElseThrow(() -> {
                    log.error("Doctor with email {} not found", email);
                    return new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND");
                });

        DoctorResponse response = new DoctorResponse();
        response.setDoctorId(doctor.getDoctorId());
        if (doctor.getUser() != null) {
            response.setFirstName(doctor.getUser().getFirstName());
            response.setLastName(doctor.getUser().getLastName());
        }
        response.setSpecialization(doctor.getSpecialization());
        response.setStatus(doctor.getStatus());
        response.setLicenseDocumentUrl(doctor.getLicenseDocumentUrl());

        return response;
    }

    public List<DoctorResponse> getPendingDoctors() {
        log.info("Fetching all pending doctors");
        return doctorRepository.findAll().stream()
                .filter(d -> d.getStatus() == DoctorStatus.PENDING)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DoctorResponse> getAllDoctors() {
        log.info("Fetching all doctors");
        return doctorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DoctorResponse getDoctorById(String doctorId) {
        log.info("Fetching doctor by ID: {}", doctorId);
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));
        return mapToResponse(doctor);
    }

    public DoctorResponse rejectDoctor(String doctorId) {
        log.info("Rejecting doctor ID: {}", doctorId);
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));

        doctor.setStatus(DoctorStatus.REJECTED);
        doctorRepository.save(doctor);
        return mapToResponse(doctor);
    }


    public DoctorResponse uploadLicense(String doctorId, MultipartFile file) {
        log.info("Uploading license for doctor ID: {}", doctorId);
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));

        String key = "doctor-licenses/" + doctorId + "/" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        try {
            s3StorageService.uploadFile(file, key, StorageClass.STANDARD);
            doctor.setLicenseDocumentUrl(key);
            doctorRepository.save(doctor);
            return mapToResponse(doctor);
        } catch (Exception e) {
            log.error("Failed to upload license for doctor: {}", doctorId, e);
            throw new RuntimeException("Failed to upload license", e);
        }
    }

    public void deleteDoctor(String doctorId) {
        log.info("Deleting doctor account: {}", doctorId);
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found", "DOCTOR_NOT_FOUND"));

        // Save to DeletedDoctor table
        DeletedDoctor deletedDoctor = new DeletedDoctor();
        deletedDoctor.setDoctorId(doctor.getDoctorId());
        deletedDoctor.setFirstName(doctor.getUser().getFirstName());
        deletedDoctor.setLastName(doctor.getUser().getLastName());
        deletedDoctor.setEmail(doctor.getUser().getEmail());
        deletedDoctor.setSpecialization(doctor.getSpecialization());
        deletedDoctorRepository.save(deletedDoctor);

        // Update all prescriptions to point to deleted_doctor
        List<Prescription> prescriptions = prescriptionRepository.findByDoctor(doctor);
        for (Prescription rx : prescriptions) {
            rx.setDoctor(null);
            rx.setDeletedDoctor(deletedDoctor);
            prescriptionRepository.save(rx);
        }

        // Delete doctor and user
        User user = doctor.getUser();
        doctorRepository.delete(doctor);
        if (user != null) {
            userRepository.delete(user);
        }
        log.info("Successfully deleted doctor and migrated prescriptions: {}", doctorId);
    }
}