package com.spring.boot.super30.backend.document.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spring.boot.super30.backend.document.dto.OcrStructuredResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {

    private final PatientDocumentService patientDocumentService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private final String OCR_SERVICE_URL = "http://localhost:8000/api/ocr";
    private final String OCR_STRUCTURED_URL = "http://localhost:8000/api/ocr/structured";

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

    /**
     * Extract structured prescription data from a document using OCR + Gemini AI.
     * Falls back to raw text if structured parsing fails.
     */
    public OcrStructuredResponse extractStructuredTextFromDocument(UUID documentId) {
        log.info("Requesting structured OCR for document: {}", documentId);

        String imageUrl = patientDocumentService.getDownloadUrl(documentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("image_url", imageUrl);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(OCR_STRUCTURED_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());

                String rawText = root.path("raw_text").asText(null);
                JsonNode structuredNode = root.path("structured_data");

                OcrStructuredResponse.StructuredData structuredData = null;

                if (!structuredNode.isNull() && !structuredNode.isMissingNode()) {
                    structuredData = parseStructuredData(structuredNode);
                }

                return OcrStructuredResponse.builder()
                        .rawText(rawText)
                        .structuredData(structuredData)
                        .build();
            } else {
                log.error("Structured OCR Service returned status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to extract structured text. Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error communicating with structured OCR service: {}", e.getMessage());
            // Fallback: try the basic OCR endpoint
            try {
                String basicText = extractTextFromDocument(documentId);
                return OcrStructuredResponse.builder()
                        .rawText(basicText)
                        .structuredData(null)
                        .build();
            } catch (Exception fallbackError) {
                throw new RuntimeException("OCR Service is unavailable: " + e.getMessage());
            }
        }
    }

    /**
     * Parse the structured_data JSON node into the DTO.
     */
    private OcrStructuredResponse.StructuredData parseStructuredData(JsonNode node) {
        OcrStructuredResponse.StructuredData.StructuredDataBuilder builder =
                OcrStructuredResponse.StructuredData.builder();

        // Doctor info
        JsonNode doctorNode = node.path("doctor");
        if (!doctorNode.isMissingNode() && !doctorNode.isNull()) {
            builder.doctor(OcrStructuredResponse.DoctorInfo.builder()
                    .name(textOrNull(doctorNode, "name"))
                    .qualifications(textOrNull(doctorNode, "qualifications"))
                    .hospital(textOrNull(doctorNode, "hospital"))
                    .contact(textOrNull(doctorNode, "contact"))
                    .build());
        }

        // Patient info
        JsonNode patientNode = node.path("patient");
        if (!patientNode.isMissingNode() && !patientNode.isNull()) {
            builder.patient(OcrStructuredResponse.PatientInfo.builder()
                    .name(textOrNull(patientNode, "name"))
                    .age(textOrNull(patientNode, "age"))
                    .gender(textOrNull(patientNode, "gender"))
                    .build());
        }

        builder.prescriptionDate(textOrNull(node, "prescription_date"));
        builder.diagnosis(textOrNull(node, "diagnosis"));
        builder.followUp(textOrNull(node, "follow_up"));
        builder.notes(textOrNull(node, "notes"));

        // Medications
        JsonNode medsNode = node.path("medications");
        if (medsNode.isArray()) {
            List<OcrStructuredResponse.Medication> medications = StreamSupport
                    .stream(medsNode.spliterator(), false)
                    .map(m -> OcrStructuredResponse.Medication.builder()
                            .name(textOrNull(m, "name"))
                            .dosage(textOrNull(m, "dosage"))
                            .frequency(textOrNull(m, "frequency"))
                            .duration(textOrNull(m, "duration"))
                            .instructions(textOrNull(m, "instructions"))
                            .build())
                    .collect(Collectors.toList());
            builder.medications(medications);
        }

        // Lab tests
        JsonNode labNode = node.path("lab_tests");
        if (labNode.isArray()) {
            List<String> labTests = StreamSupport
                    .stream(labNode.spliterator(), false)
                    .map(JsonNode::asText)
                    .filter(t -> t != null && !t.isEmpty() && !t.equals("null"))
                    .collect(Collectors.toList());
            builder.labTests(labTests);
        }

        return builder.build();
    }

    private String textOrNull(JsonNode parent, String field) {
        JsonNode child = parent.path(field);
        if (child.isNull() || child.isMissingNode()) return null;
        String text = child.asText();
        return (text == null || text.isEmpty() || text.equals("null")) ? null : text;
    }
}
