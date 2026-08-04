package com.spring.boot.super30.backend.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdatePatientRequest {
    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{2,50}$", message = "First name must be 2-50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{2,50}$", message = "Last name must be 2-50 characters")
    private String lastName;

    @Pattern(regexp = "^\\+?[\\d\\s-]{10,20}$", message = "Invalid phone number")
    private String phone;

    private LocalDate dob;
    private String gender;
    private String bloodGroup;
    private String address;
    private String profileImage; // Base64
    private Boolean smsNotificationsEnabled;
    private Boolean whatsappNotificationsEnabled;
}
