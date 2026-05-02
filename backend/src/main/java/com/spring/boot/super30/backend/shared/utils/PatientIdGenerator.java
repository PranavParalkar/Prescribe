package com.spring.boot.super30.backend.shared.utils;


import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import org.springframework.stereotype.Component;
import java.time.Year;

@Component
public class PatientIdGenerator {

    private final PatientRepository patientRepository;

    public PatientIdGenerator(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public synchronized String generatePatientId() {
        long count = patientRepository.count() + 1;
        return "PAT-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }
}
