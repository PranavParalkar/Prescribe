package com.spring.boot.super30.backend.medical.dto;

import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.UUID;
import java.util.List;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MedicalOrderResponse {
    private UUID id;
    private UUID prescriptionId;
    private UUID patientId;
    private UUID medicalId;
    private String storeName;
    private String medicalIdString;
    private MedicalOrderStatus status;
    private String availableItems;
    private Double totalCost;
    private String razorpayOrderId;
    private String razorpayKeyId;
    private List<OrderItemDetail> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItemDetail {
        private UUID id;
        private UUID inventoryItemId;
        private String medicineName;
        private Integer quantity;
        private Double unitPrice;
        private Double subtotal;
    }
}
