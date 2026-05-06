package com.spring.boot.super30.backend.medical.service;

import com.spring.boot.super30.backend.medical.dto.*;
import com.spring.boot.super30.backend.medical.entity.InventoryItem;
import com.spring.boot.super30.backend.medical.entity.Medical;
import com.spring.boot.super30.backend.medical.repository.InventoryItemRepository;
import com.spring.boot.super30.backend.medical.repository.MedicalRepository;
import com.spring.boot.super30.backend.shared.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final MedicalRepository medicalRepository;

    // ─── CRUD ────────────────────────────────────────────────────────────────

    @Transactional
    public InventoryItemResponse addItem(InventoryItemRequest request, User currentUser) {
        Medical medical = getMedicalForUser(currentUser);

        InventoryItem item = new InventoryItem();
        item.setMedical(medical);
        applyRequest(item, request);

        return mapToResponse(inventoryItemRepository.save(item));
    }

    @Transactional
    public InventoryItemResponse updateItem(UUID itemId, InventoryItemRequest request, User currentUser) {
        Medical medical = getMedicalForUser(currentUser);
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (!item.getMedical().getId().equals(medical.getId())) {
            throw new RuntimeException("Not authorized to edit this item");
        }

        applyRequest(item, request);
        return mapToResponse(inventoryItemRepository.save(item));
    }

    @Transactional
    public void deleteItem(UUID itemId, User currentUser) {
        Medical medical = getMedicalForUser(currentUser);
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (!item.getMedical().getId().equals(medical.getId())) {
            throw new RuntimeException("Not authorized to delete this item");
        }

        // Soft-delete
        item.setActive(false);
        inventoryItemRepository.save(item);
    }

    public List<InventoryItemResponse> getInventory(User currentUser) {
        Medical medical = getMedicalForUser(currentUser);
        return inventoryItemRepository.findByMedicalAndActiveTrueOrderByMedicineNameAsc(medical)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── Alerts ──────────────────────────────────────────────────────────────

    public List<InventoryItemResponse> getLowStockItems(User currentUser) {
        Medical medical = getMedicalForUser(currentUser);
        return inventoryItemRepository.findLowStockItems(medical)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<InventoryItemResponse> getExpiringItems(User currentUser) {
        Medical medical = getMedicalForUser(currentUser);
        LocalDate now = LocalDate.now();
        LocalDate threshold = now.plusDays(30); // items expiring within 30 days

        List<InventoryItem> expiring = inventoryItemRepository.findExpiringSoonItems(medical, now, threshold);
        List<InventoryItem> expired = inventoryItemRepository.findExpiredItems(medical, now);

        List<InventoryItem> combined = new ArrayList<>();
        combined.addAll(expired);
        combined.addAll(expiring);

        return combined.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── Search (used by patients) ───────────────────────────────────────────

    public List<MedicineSearchResponse> searchMedicines(String query) {
        List<InventoryItem> items = inventoryItemRepository.searchByMedicineName(query);

        // Group by medicine name (case-insensitive) → list of stores
        Map<String, List<InventoryItem>> grouped = items.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getMedicineName().toLowerCase(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return grouped.entrySet().stream().map(entry -> {
            List<MedicineSearchResponse.StoreOption> stores = entry.getValue().stream()
                    .map(item -> MedicineSearchResponse.StoreOption.builder()
                            .medicalId(item.getMedical().getMedicalId())
                            .storeName(item.getMedical().getStoreName())
                            .inventoryItemId(item.getId())
                            .price(item.getPrice())
                            .availableQuantity(item.getQuantity())
                            .expiryDate(item.getExpiryDate())
                            .build())
                    .collect(Collectors.toList());

            return MedicineSearchResponse.builder()
                    .medicineName(entry.getValue().get(0).getMedicineName())
                    .stores(stores)
                    .build();
        }).collect(Collectors.toList());
    }

    // ─── Dashboard Stats ─────────────────────────────────────────────────────

    public DashboardStatsResponse getDashboardStats(User currentUser) {
        Medical medical = getMedicalForUser(currentUser);
        long totalItems = inventoryItemRepository.countActiveItems(medical);
        long lowStock = inventoryItemRepository.countLowStockItems(medical);
        LocalDate now = LocalDate.now();
        long expiring = inventoryItemRepository.findExpiringSoonItems(medical, now, now.plusDays(30)).size()
                + inventoryItemRepository.findExpiredItems(medical, now).size();

        return DashboardStatsResponse.builder()
                .totalInventoryItems(totalItems)
                .lowStockCount(lowStock)
                .expiringCount(expiring)
                .build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Medical getMedicalForUser(User user) {
        return medicalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Medical profile not found"));
    }

    private void applyRequest(InventoryItem item, InventoryItemRequest request) {
        item.setMedicineName(request.getMedicineName());
        item.setGenericName(request.getGenericName());
        item.setManufacturer(request.getManufacturer());
        item.setBatchNumber(request.getBatchNumber());
        item.setQuantity(request.getQuantity());
        item.setPrice(request.getPrice());
        item.setExpiryDate(request.getExpiryDate());
        item.setCategory(request.getCategory());
        if (request.getLowStockThreshold() != null) {
            item.setLowStockThreshold(request.getLowStockThreshold());
        }
    }

    private InventoryItemResponse mapToResponse(InventoryItem item) {
        LocalDate now = LocalDate.now();
        boolean expired = item.getExpiryDate() != null && !item.getExpiryDate().isAfter(now);
        boolean expiringSoon = !expired && item.getExpiryDate() != null
                && item.getExpiryDate().isBefore(now.plusDays(30));
        boolean lowStock = item.getQuantity() <= item.getLowStockThreshold();

        return InventoryItemResponse.builder()
                .id(item.getId())
                .medicineName(item.getMedicineName())
                .genericName(item.getGenericName())
                .manufacturer(item.getManufacturer())
                .batchNumber(item.getBatchNumber())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .expiryDate(item.getExpiryDate())
                .category(item.getCategory())
                .lowStockThreshold(item.getLowStockThreshold())
                .active(item.getActive())
                .lowStock(lowStock)
                .expiringSoon(expiringSoon)
                .expired(expired)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
