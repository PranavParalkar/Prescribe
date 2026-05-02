package com.spring.boot.super30.backend.doctor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateDoctorRequest {
    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{2,50}$", message = "First name must be 2-50 characters (letters and spaces only)")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{2,50}$", message = "Last name must be 2-50 characters (letters and spaces only)")
    private String lastName;

    @Pattern(regexp = "^\\+?[\\d\\s-]{10,20}$", message = "Invalid phone number format")
    private String phone;

    private String specialization;
    private String licenseNumber;
    
    private LocalDate dob;
    private String address;
    private String profileImage; // Base64
}
