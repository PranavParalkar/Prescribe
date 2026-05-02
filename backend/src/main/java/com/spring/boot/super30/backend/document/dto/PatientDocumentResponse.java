package com.spring.boot.super30.backend.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PatientDocumentResponse {
    private String id;
    private String category;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private String description;
    private String documentDate;
    private String uploadedAt;
    private String s3StorageClass;
    private String restoreStatus;
    private String downloadUrl;
}
