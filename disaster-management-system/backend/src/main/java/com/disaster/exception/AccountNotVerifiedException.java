package com.disaster.exception;

import lombok.Getter;

@Getter
public class AccountNotVerifiedException extends RuntimeException {
    private final String email;

    public AccountNotVerifiedException(String message, String email) {
        super(message);
        this.email = email;
    }
}
