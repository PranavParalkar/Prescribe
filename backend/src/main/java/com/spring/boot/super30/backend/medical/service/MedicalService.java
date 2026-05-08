package com.spring.boot.super30.backend.medical.service;

import com.spring.boot.super30.backend.medical.dto.MedicalRegistrationRequest;
import com.spring.boot.super30.backend.medical.dto.MedicalResponse;
import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.medical.repository.MedicalRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.MedicalStatus;
import com.spring.boot.super30.backend.shared.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MedicalService {

    private final MedicalRepository medicalRepository;

    @Transactional
    public MedicalResponse registerMedical(MedicalRegistrationRequest request, User user) {
        if (user.getRole() != UserRole.MEDICAL) {
            user.setRole(UserRole.MEDICAL);
        }

        if (medicalRepository.findByUser(user).isPresent()) {
            throw new RuntimeException("Medical profile already exists for this user");
        }

        Medical medical = new Medical();
        medical.setUser(user);
        medical.setStoreName(request.getStoreName());
        medical.setLicenseNumber(request.getLicenseNumber());
        medical.setMedicalId("MED" + System.currentTimeMillis());
        medical.setLatitude(request.getLatitude());
        medical.setLongitude(request.getLongitude());
        medical.setStatus(MedicalStatus.VERIFIED);

        return mapToResponse(medicalRepository.save(medical));
    }

    public MedicalResponse getMedicalProfile(User user) {
        Medical medical = medicalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));
        return mapToResponse(medical);
    }

    public java.util.List<MedicalResponse> getAllMedicals() {
        return medicalRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private MedicalResponse mapToResponse(Medical medical) {
        MedicalResponse response = new MedicalResponse();
        response.setId(medical.getId());
        response.setMedicalId(medical.getMedicalId());
        response.setStoreName(medical.getStoreName());
        response.setLicenseNumber(medical.getLicenseNumber());
        response.setStatus(medical.getStatus());
        response.setLatitude(medical.getLatitude());
        response.setLongitude(medical.getLongitude());
        return response;
    }

    @Transactional
    public void deleteMedical(String medicalId) {
        Medical medical = medicalRepository.findByMedicalId(medicalId)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));
        medicalRepository.delete(medical);
    }
}
