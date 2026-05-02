package com.spring.boot.super30.backend.exception.custom;

public class ConflictException extends BaseCustomException {
    public ConflictException(String message, String code) {
        super(message, code);
    }
}
