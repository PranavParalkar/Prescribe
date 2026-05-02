package com.spring.boot.super30.backend.shared.service;

import com.spring.boot.super30.backend.doctor.repository.DoctorRepository;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.shared.dto.DashboardStats;
import com.spring.boot.super30.backend.shared.enums.DoctorStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public DashboardService(PatientRepository patientRepository,
            DoctorRepository doctorRepository) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public DashboardStats getStats() {

        log.debug("Calculating dashboard statistics");
        DashboardStats stats = new DashboardStats();

        stats.setTotalPatients(patientRepository.count());
        stats.setTotalDoctors(doctorRepository.count());
        stats.setVerifiedDoctors(
                doctorRepository.findAll()
                        .stream()
                        .filter(d -> d.getStatus() == DoctorStatus.VERIFIED)
                        .count());

        log.info("Successfully calculated dashboard statistics: totalPatients={}, totalDoctors={}, verifiedDoctors={}",
                stats.getTotalPatients(), stats.getTotalDoctors(), stats.getVerifiedDoctors());
        return stats;
    }
}