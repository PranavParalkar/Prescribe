package com.spring.boot.super30.backend.patient.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Setter
@Getter
public class PatientResponse {

    private String patientId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String profileImage;
    private java.time.LocalDate dob;
    private String gender;
    private String bloodGroup;
    private java.time.LocalDateTime createdAt;
    private Boolean smsNotificationsEnabled;
    private Boolean whatsappNotificationsEnabled;

}
