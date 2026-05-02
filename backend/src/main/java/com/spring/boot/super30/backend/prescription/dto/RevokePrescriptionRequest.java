package com.spring.boot.super30.backend.prescription.dto;

import com.spring.boot.super30.backend.shared.enums.RevokeReason;
import lombok.Data;

@Data
public class RevokePrescriptionRequest {
    private RevokeReason reason;
}
