package com.spring.boot.super30.backend.patient.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Data
@Setter
@Getter
public class CreatePatientRequest {

    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{2,50}$", message = "First name must be 2-50 letters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]{2,50}$", message = "Last name must be 2-50 letters")
    private String lastName;

    private LocalDate dob;
    private String gender;
    private String bloodGroup;

    @Pattern(regexp = "^$|^[0-9\\-\\+\\s]{10,15}$", message = "Invalid phone number")
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

}

