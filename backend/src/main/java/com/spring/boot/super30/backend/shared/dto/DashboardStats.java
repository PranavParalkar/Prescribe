package com.spring.boot.super30.backend.shared.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Setter
@Getter
public class DashboardStats {

    private long totalPatients;
    private long totalDoctors;
    private long verifiedDoctors;

}