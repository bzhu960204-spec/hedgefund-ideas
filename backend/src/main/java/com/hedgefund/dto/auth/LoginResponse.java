package com.hedgefund.dto.auth;

public class LoginResponse {
    private final String token;
    private final String username;
    private final String role;
    private final long expiresInMs;

    public LoginResponse(String token, String username, String role, long expiresInMs) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.expiresInMs = expiresInMs;
    }

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public long getExpiresInMs() { return expiresInMs; }
}
