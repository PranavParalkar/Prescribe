package com.spring.boot.super30.backend.exception.custom;

public class ResourceNotFoundException extends BaseCustomException {
    public ResourceNotFoundException(String message, String code) {
        super(message, code);
    }
}
