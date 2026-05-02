package com.spring.boot.super30.backend.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionStatusResponse {
    private boolean subscribed;
    private String planType;
    private String status;
    private String startDate;
    private String endDate;
    private int totalPrescriptions;
    private int freeLimit;
    private int premiumLimit;
    private int currentLimit;
    private boolean limitReached;
    private boolean requiresSubscription;
    private int daysRemaining;
}
