package com.spring.boot.super30.backend.exception.custom;

public class UnauthorizedException extends BaseCustomException {
    public UnauthorizedException(String message, String code) {
        super(message, code);
    }
}
