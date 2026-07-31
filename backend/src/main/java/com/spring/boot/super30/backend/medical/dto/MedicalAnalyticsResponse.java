package com.spring.boot.super30.backend.medical.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MedicalAnalyticsResponse {

    private double totalRevenue;
    private long totalOrders;
    private double averageOrderValue;

    private List<WeeklyRevenueEntry> weeklyRevenue;
    private List<TopSellingMedicineEntry> topSellingMedicines;

    @Data
    @Builder
    public static class WeeklyRevenueEntry {
        private String week;
        private double revenue;
        private long orderCount;
    }

    @Data
    @Builder
    public static class TopSellingMedicineEntry {
        private String medicineName;
        private long quantitySold;
        private double revenue;
    }
}
