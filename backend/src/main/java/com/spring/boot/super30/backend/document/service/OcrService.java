package com.spring.boot.super30.backend.document.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {

    private final PatientDocumentService patientDocumentService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private final String OCR_SERVICE_URL = "http://localhost:8000/api/ocr";

    public String extractTextFromDocument(UUID documentId) {
        log.info("Requesting OCR for document: {}", documentId);
        
        // 1. Get a presigned download URL for the document from S3
        String imageUrl = patientDocumentService.getDownloadUrl(documentId);
        
        // 2. Call the Python OCR microservice
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("image_url", imageUrl);
        
        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(OCR_SERVICE_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                return jsonNode.path("extracted_text").asText();
            } else {
                log.error("OCR Service returned status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to extract text from image. Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error communicating with OCR microservice: {}", e.getMessage());
            throw new RuntimeException("OCR Service is unavailable or failed to process the image: " + e.getMessage());
        }
    }
}
