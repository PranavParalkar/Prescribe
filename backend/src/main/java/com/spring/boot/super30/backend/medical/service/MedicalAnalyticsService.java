package com.spring.boot.super30.backend.medical.service;

import com.spring.boot.super30.backend.medical.dto.MedicalAnalyticsResponse;
import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.medical.entity.MedicalOrder;
import com.spring.boot.super30.backend.medical.entity.OrderItem;
import com.spring.boot.super30.backend.medical.repository.MedicalOrderRepository;
import com.spring.boot.super30.backend.medical.repository.MedicalRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import com.spring.boot.super30.backend.shared.enums.MedicalOrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MedicalAnalyticsService {

    private final MedicalOrderRepository medicalOrderRepository;
    private final MedicalRepository medicalRepository;

    public MedicalAnalyticsResponse getAnalytics(User currentUser) {
        Medical medical = medicalRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));

        // Fetch completed orders for the last 12 weeks
        LocalDateTime twelveWeeksAgo = LocalDateTime.now().minusWeeks(12);
        List<MedicalOrder> completedOrders = medicalOrderRepository.findByMedicalAndStatusSince(
                medical, MedicalOrderStatus.COMPLETED, twelveWeeksAgo);

        // Also get all-time completed for totals
        List<MedicalOrder> allCompleted = medicalOrderRepository.findByMedicalAndStatus(
                medical, MedicalOrderStatus.COMPLETED);

        // ── Total stats ──
        double totalRevenue = allCompleted.stream()
                .mapToDouble(o -> o.getTotalCost() != null ? o.getTotalCost() : 0.0)
                .sum();
        long totalOrders = allCompleted.size();
        double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0.0;

        // ── Weekly revenue aggregation ──
        List<MedicalAnalyticsResponse.WeeklyRevenueEntry> weeklyRevenue = aggregateWeeklyRevenue(completedOrders);

        // ── Top selling medicines ──
        List<MedicalAnalyticsResponse.TopSellingMedicineEntry> topMedicines = aggregateTopMedicines(allCompleted);

        return MedicalAnalyticsResponse.builder()
                .totalRevenue(Math.round(totalRevenue * 100.0) / 100.0)
                .totalOrders(totalOrders)
                .averageOrderValue(Math.round(avgOrderValue * 100.0) / 100.0)
                .weeklyRevenue(weeklyRevenue)
                .topSellingMedicines(topMedicines)
                .build();
    }

    private List<MedicalAnalyticsResponse.WeeklyRevenueEntry> aggregateWeeklyRevenue(List<MedicalOrder> orders) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");

        // Group orders by week start (Monday)
        Map<LocalDate, List<MedicalOrder>> grouped = orders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(o -> {
                    LocalDate date = o.getCreatedAt().toLocalDate();
                    return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                }, TreeMap::new, Collectors.toList()));

        // Fill in missing weeks with zero revenue
        List<MedicalAnalyticsResponse.WeeklyRevenueEntry> result = new ArrayList<>();
        LocalDate weekStart = LocalDate.now().minusWeeks(11).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate today = LocalDate.now();

        while (!weekStart.isAfter(today)) {
            LocalDate weekEnd = weekStart.plusDays(6);
            String label = fmt.format(weekStart) + " – " + fmt.format(weekEnd);

            List<MedicalOrder> weekOrders = grouped.getOrDefault(weekStart, Collections.emptyList());
            double revenue = weekOrders.stream()
                    .mapToDouble(o -> o.getTotalCost() != null ? o.getTotalCost() : 0.0)
                    .sum();

            result.add(MedicalAnalyticsResponse.WeeklyRevenueEntry.builder()
                    .week(label)
                    .revenue(Math.round(revenue * 100.0) / 100.0)
                    .orderCount(weekOrders.size())
                    .build());

            weekStart = weekStart.plusWeeks(1);
        }

        return result;
    }

    private List<MedicalAnalyticsResponse.TopSellingMedicineEntry> aggregateTopMedicines(List<MedicalOrder> orders) {
        // Aggregate from order items
        Map<String, long[]> medicineStats = new LinkedHashMap<>(); // name -> [quantity, revenue_cents]

        for (MedicalOrder order : orders) {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    String name = item.getMedicineName();
                    medicineStats.computeIfAbsent(name, k -> new long[]{0, 0});
                    long[] stats = medicineStats.get(name);
                    stats[0] += item.getQuantity() != null ? item.getQuantity() : 0;
                    stats[1] += Math.round((item.getSubtotal() != null ? item.getSubtotal() : 0.0) * 100);
                }
            }
        }

        // If no line items, try to use available items text + total cost
        if (medicineStats.isEmpty()) {
            for (MedicalOrder order : orders) {
                String items = order.getAvailableItems();
                if (items != null && !items.isBlank()) {
                    medicineStats.computeIfAbsent(items.length() > 40 ? items.substring(0, 40) + "…" : items,
                            k -> new long[]{0, 0});
                    long[] stats = medicineStats.get(
                            items.length() > 40 ? items.substring(0, 40) + "…" : items);
                    stats[0] += 1;
                    stats[1] += Math.round((order.getTotalCost() != null ? order.getTotalCost() : 0.0) * 100);
                }
            }
        }

        return medicineStats.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(10)
                .map(e -> MedicalAnalyticsResponse.TopSellingMedicineEntry.builder()
                        .medicineName(e.getKey())
                        .quantitySold(e.getValue()[0])
                        .revenue(e.getValue()[1] / 100.0)
                        .build())
                .collect(Collectors.toList());
    }
}
