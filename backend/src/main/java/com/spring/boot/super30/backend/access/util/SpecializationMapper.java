package com.spring.boot.super30.backend.access.util;

import com.spring.boot.super30.backend.shared.enums.MedicalCategory;

import java.util.Map;

/**
 * Maps doctor specialization strings (as stored in the Doctor entity)
 * to their corresponding MedicalCategory enum values.
 */
public final class SpecializationMapper {

    private static final Map<String, MedicalCategory> MAP = Map.ofEntries(
            Map.entry("general physician", MedicalCategory.GENERAL),
            Map.entry("cardiologist",      MedicalCategory.HEART),
            Map.entry("dermatologist",     MedicalCategory.DERMATOLOGY),
            Map.entry("neurologist",       MedicalCategory.NEUROLOGY),
            Map.entry("orthopedic",        MedicalCategory.ORTHOPEDIC),
            Map.entry("pediatrician",      MedicalCategory.PEDIATRIC),
            Map.entry("psychiatrist",      MedicalCategory.PSYCHIATRY),
            Map.entry("other",             MedicalCategory.OTHER)
    );

    private SpecializationMapper() {}

    /**
     * Convert a specialization string to a MedicalCategory.
     * Falls back to OTHER if no mapping is found.
     */
    public static MedicalCategory toCategory(String specialization) {
        if (specialization == null || specialization.isBlank()) {
            return MedicalCategory.OTHER;
        }
        return MAP.getOrDefault(specialization.trim().toLowerCase(), MedicalCategory.OTHER);
    }
}
