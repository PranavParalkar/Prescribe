package com.spring.boot.super30.backend.exception.custom;

public class BadRequestException extends BaseCustomException {
    public BadRequestException(String message, String code) {
        super(message, code);
    }
}
