package com.spring.boot.super30.backend.patient.service;

import com.spring.boot.super30.backend.exception.custom.ResourceNotFoundException;
import com.spring.boot.super30.backend.patient.dto.VitalRecordRequest;
import com.spring.boot.super30.backend.patient.dto.VitalRecordResponse;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.entity.VitalRecord;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.patient.repository.VitalRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class VitalService {

    private final VitalRecordRepository vitalRecordRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public VitalRecordResponse addVitalRecord(String patientId, VitalRecordRequest request) {
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        VitalRecord record = new VitalRecord();
        record.setPatient(patient);
        record.setSystolicBp(request.getSystolicBp());
        record.setDiastolicBp(request.getDiastolicBp());
        record.setWeightKg(request.getWeightKg());
        record.setHeartRate(request.getHeartRate());
        record.setBloodSugar(request.getBloodSugar());
        record.setTemperature(request.getTemperature());
        record.setNotes(request.getNotes());
        record.setRecordedDate(request.getRecordedDate());

        VitalRecord saved = vitalRecordRepository.save(record);
        log.info("Saved vital record {} for patient {}", saved.getId(), patientId);
        return mapToResponse(saved);
    }

    public List<VitalRecordResponse> getVitalRecords(String patientId) {
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        return vitalRecordRepository.findByPatientOrderByRecordedDateAsc(patient)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteVitalRecord(String patientId, UUID recordId) {
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found", "PATIENT_NOT_FOUND"));

        VitalRecord record = vitalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Vital record not found", "VITAL_NOT_FOUND"));

        if (!record.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Not authorized to delete this vital record");
        }

        vitalRecordRepository.delete(record);
        log.info("Deleted vital record {} for patient {}", recordId, patientId);
    }

    private VitalRecordResponse mapToResponse(VitalRecord record) {
        return VitalRecordResponse.builder()
                .id(record.getId())
                .systolicBp(record.getSystolicBp())
                .diastolicBp(record.getDiastolicBp())
                .weightKg(record.getWeightKg())
                .heartRate(record.getHeartRate())
                .bloodSugar(record.getBloodSugar())
                .temperature(record.getTemperature())
                .notes(record.getNotes())
                .recordedDate(record.getRecordedDate())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
