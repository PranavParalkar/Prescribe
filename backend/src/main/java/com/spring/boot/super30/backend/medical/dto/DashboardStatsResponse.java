package com.spring.boot.super30.backend.medical.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalInventoryItems;
    private long lowStockCount;
    private long expiringCount;
    private long newOrdersCount;
    private long activeOrdersCount;
    private long completedOrdersCount;
    private double totalRevenue;
}
