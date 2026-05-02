package com.spring.boot.super30.backend.shared.controller;

import com.spring.boot.super30.backend.shared.dto.DashboardStats;
import com.spring.boot.super30.backend.shared.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public DashboardStats getStats() {
        log.info("Fetching dashboard statistics");
        DashboardStats stats = dashboardService.getStats();
        log.debug("Fetched stats: {}", stats);
        return stats;
    }
}