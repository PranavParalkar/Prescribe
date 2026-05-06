package com.spring.boot.super30.backend.medical.repository;

import com.spring.boot.super30.backend.medical.entity.InventoryItem;
import com.spring.boot.super30.backend.medical.entity.Medical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {

    List<InventoryItem> findByMedicalAndActiveTrue(Medical medical);

    List<InventoryItem> findByMedicalAndActiveTrueOrderByMedicineNameAsc(Medical medical);

    @Query("SELECT i FROM InventoryItem i WHERE i.active = true AND i.quantity > 0 " +
           "AND LOWER(i.medicineName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<InventoryItem> searchByMedicineName(@Param("name") String name);

    @Query("SELECT i FROM InventoryItem i WHERE i.medical = :medical AND i.active = true " +
           "AND i.quantity <= i.lowStockThreshold")
    List<InventoryItem> findLowStockItems(@Param("medical") Medical medical);

    @Query("SELECT i FROM InventoryItem i WHERE i.medical = :medical AND i.active = true " +
           "AND i.expiryDate IS NOT NULL AND i.expiryDate <= :date")
    List<InventoryItem> findExpiredItems(@Param("medical") Medical medical, @Param("date") LocalDate date);

    @Query("SELECT i FROM InventoryItem i WHERE i.medical = :medical AND i.active = true " +
           "AND i.expiryDate IS NOT NULL AND i.expiryDate > :now AND i.expiryDate <= :threshold")
    List<InventoryItem> findExpiringSoonItems(@Param("medical") Medical medical,
                                              @Param("now") LocalDate now,
                                              @Param("threshold") LocalDate threshold);

    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.medical = :medical AND i.active = true")
    long countActiveItems(@Param("medical") Medical medical);

    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.medical = :medical AND i.active = true " +
           "AND i.quantity <= i.lowStockThreshold")
    long countLowStockItems(@Param("medical") Medical medical);
}
