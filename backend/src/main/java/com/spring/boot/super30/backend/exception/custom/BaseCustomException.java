package com.spring.boot.super30.backend.exception.custom;

import lombok.Getter;

@Getter
public abstract class BaseCustomException extends RuntimeException {
    
    private final String code;

    public BaseCustomException(String message, String code) {
        super(message);
        this.code = code;
    }
}
