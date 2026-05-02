package com.spring.boot.super30.backend.doctor.dto;

import com.spring.boot.super30.backend.shared.enums.DoctorStatus;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Setter
@Getter
public class DoctorResponse {

    private String doctorId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String profileImage;
    private java.time.LocalDate dob;
    private String specialization;
    private String licenseNumber;
    private DoctorStatus status;
    private String licenseDocumentUrl;
    private java.time.LocalDateTime createdAt;

}
