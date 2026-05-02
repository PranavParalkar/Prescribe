package com.spring.boot.super30.backend.shared.enums;

/**
 * PM-04: Reason codes for prescription revocation.
 * A revoke action requires a reason code and is irreversible.
 */
public enum RevokeReason {
    MEDICATION_CHANGE,
    ERROR,
    PATIENT_REQUEST,
    ADVERSE_REACTION,
    DUPLICATE,
    OTHER
}
