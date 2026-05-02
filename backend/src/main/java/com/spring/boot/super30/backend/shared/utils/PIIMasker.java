package com.spring.boot.super30.backend.shared.utils;

public class PIIMasker {

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];

        if (username.length() <= 2) {
            return "***@" + domain;
        }

        String maskedUsername = username.charAt(0) + "***" + username.charAt(username.length() - 1);
        return maskedUsername + "@" + domain;
    }

    public static String maskId(String id) {
        if (id == null || id.length() <= 4) {
            return "***";
        }
        return "***" + id.substring(id.length() - 4);
    }
}
