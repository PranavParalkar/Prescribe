package com.spring.boot.super30.backend.access.dto;

import com.spring.boot.super30.backend.document.dto.PatientDocumentResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OtpVerifyResponse {
    private boolean verified;
    private String category;
    private String patientName;
    private List<PatientDocumentResponse> documents;
}
