package com.spring.boot.super30.backend.medical.service;

import com.spring.boot.super30.backend.medical.dto.*;
import com.spring.boot.super30.backend.medical.entity.*;
import com.spring.boot.super30.backend.medical.repository.*;
import com.spring.boot.super30.backend.patient.entity.Patient;
import com.spring.boot.super30.backend.patient.repository.PatientRepository;
import com.spring.boot.super30.backend.prescription.entity.Prescription;
import com.spring.boot.super30.backend.prescription.repository.PrescriptionRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FloatService {

    private final PrescriptionFloatRepository floatRepository;
    private final FloatQuoteRepository quoteRepository;
    private final MedicalRepository medicalRepository;
    private final MedicalOrderRepository medicalOrderRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionRepository prescriptionRepository;

    private static final double EARTH_RADIUS_KM = 6371.0;

    // ─── Patient floats a prescription ──────────────────────────────────────

    @Transactional
    public FloatPrescriptionResponse floatPrescription(FloatPrescriptionRequest request, User currentUser) {
        Patient patient = patientRepository.findByUserEmail(currentUser.getEmail())
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        PrescriptionFloat pf = new PrescriptionFloat();
        pf.setPatient(patient);
        pf.setLatitude(request.getLatitude());
        pf.setLongitude(request.getLongitude());
        pf.setMedicineList(request.getMedicineList());
        pf.setRadiusKm(3.0);

        if (request.getPrescriptionId() != null) {
            Prescription rx = prescriptionRepository.findById(request.getPrescriptionId()).orElse(null);
            pf.setPrescription(rx);
        }

        return mapToResponse(floatRepository.save(pf));
    }

    // ─── Patient gets their floats ──────────────────────────────────────────

    public List<FloatPrescriptionResponse> getPatientFloats(User currentUser) {
        Patient patient = patientRepository.findByUserEmail(currentUser.getEmail())
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        return floatRepository.findByPatientOrderByCreatedAtDesc(patient).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Medical store gets nearby open floats ──────────────────────────────

    public List<FloatPrescriptionResponse> getFloatsForMedical(User currentUser) {
        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        if (medical.getLatitude() == null || medical.getLongitude() == null) {
            return new ArrayList<>();
        }

        List<PrescriptionFloat> allOpen = floatRepository.findAllOpen();

        // Filter by distance
        return allOpen.stream()
                .filter(f -> {
                    double dist = haversine(medical.getLatitude(), medical.getLongitude(),
                            f.getLatitude(), f.getLongitude());
                    return dist <= f.getRadiusKm();
                })
                .map(f -> {
                    FloatPrescriptionResponse resp = mapToResponse(f);
                    // Check if this medical already submitted a quote
                    boolean alreadyQuoted = f.getQuotes().stream()
                            .anyMatch(q -> q.getMedical().getId().equals(medical.getId()));
                    return resp;
                })
                .collect(Collectors.toList());
    }

    // ─── Medical store submits a quote ───────────────────────────────────────

    @Transactional
    public FloatPrescriptionResponse submitQuote(UUID floatId, SubmitQuoteRequest request, User currentUser) {
        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        PrescriptionFloat pf = floatRepository.findById(floatId)
                .orElseThrow(() -> new RuntimeException("Float request not found"));

        if (pf.getStatus() != PrescriptionFloat.FloatStatus.OPEN) {
            throw new RuntimeException("This float request is no longer open");
        }

        // Check if already quoted
        if (quoteRepository.findByPrescriptionFloatAndMedical(pf, medical).isPresent()) {
            throw new RuntimeException("You have already submitted a quote for this request");
        }

        FloatQuote quote = new FloatQuote();
        quote.setPrescriptionFloat(pf);
        quote.setMedical(medical);
        quote.setAvailableItems(request.getAvailableItems());
        quote.setTotalCost(request.getTotalCost());
        quoteRepository.save(quote);

        return mapToResponse(floatRepository.findById(floatId).orElse(pf));
    }

    // ─── Patient selects a quote → creates REQUESTED order ──────────────────

    @Transactional
    public MedicalOrderResponse selectQuote(UUID floatId, UUID quoteId, User currentUser) {
        Patient patient = patientRepository.findByUserEmail(currentUser.getEmail())
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        PrescriptionFloat pf = floatRepository.findById(floatId)
                .orElseThrow(() -> new RuntimeException("Float request not found"));

        if (!pf.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Not authorized");
        }

        if (pf.getStatus() != PrescriptionFloat.FloatStatus.OPEN) {
            throw new RuntimeException("This float request is already closed");
        }

        FloatQuote selectedQuote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!selectedQuote.getPrescriptionFloat().getId().equals(floatId)) {
            throw new RuntimeException("Quote does not belong to this float");
        }

        // Close the float
        pf.setStatus(PrescriptionFloat.FloatStatus.CLOSED);
        floatRepository.save(pf);

        // Create a REQUESTED order
        MedicalOrder order = new MedicalOrder();
        order.setPatient(patient);
        order.setMedical(selectedQuote.getMedical());
        order.setPrescription(pf.getPrescription());
        order.setAvailableItems(selectedQuote.getAvailableItems());
        order.setTotalCost(selectedQuote.getTotalCost());
        order.setStatus(MedicalOrderStatus.REQUESTED);

        MedicalOrder saved = medicalOrderRepository.save(order);

        return MedicalOrderResponse.builder()
                .id(saved.getId())
                .prescriptionId(saved.getPrescription() != null ? saved.getPrescription().getId() : null)
                .patientId(saved.getPatient().getId())
                .medicalId(saved.getMedical().getId())
                .storeName(saved.getMedical().getStoreName())
                .medicalIdString(saved.getMedical().getMedicalId())
                .status(saved.getStatus())
                .availableItems(saved.getAvailableItems())
                .totalCost(saved.getTotalCost())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    // ─── Haversine distance calculation ─────────────────────────────────────

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ─── Mapper ─────────────────────────────────────────────────────────────

    private FloatPrescriptionResponse mapToResponse(PrescriptionFloat pf) {
        List<FloatPrescriptionResponse.FloatQuoteResponse> quoteResponses = pf.getQuotes().stream()
                .map(q -> FloatPrescriptionResponse.FloatQuoteResponse.builder()
                        .quoteId(q.getId())
                        .medicalId(q.getMedical().getId())
                        .medicalIdString(q.getMedical().getMedicalId())
                        .storeName(q.getMedical().getStoreName())
                        .availableItems(q.getAvailableItems())
                        .totalCost(q.getTotalCost())
                        .createdAt(q.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        String patientName = "";
        if (pf.getPatient() != null && pf.getPatient().getUser() != null) {
            User u = pf.getPatient().getUser();
            if (u.getFirstName() != null) {
                patientName = (u.getFirstName() + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
            } else {
                patientName = u.getEmail();
            }
        }

        return FloatPrescriptionResponse.builder()
                .id(pf.getId())
                .prescriptionId(pf.getPrescription() != null ? pf.getPrescription().getId() : null)
                .patientId(pf.getPatient().getId())
                .patientName(patientName)
                .medicineList(pf.getMedicineList())
                .status(pf.getStatus().name())
                .latitude(pf.getLatitude())
                .longitude(pf.getLongitude())
                .radiusKm(pf.getRadiusKm())
                .createdAt(pf.getCreatedAt())
                .quotes(quoteResponses)
                .build();
    }
}
