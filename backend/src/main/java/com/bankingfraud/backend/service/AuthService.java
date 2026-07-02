package com.bankingfraud.backend.service;

import com.bankingfraud.backend.dto.AuthResponse;
import com.bankingfraud.backend.dto.LoginRequest;
import com.bankingfraud.backend.dto.RegisterRequest;
import com.bankingfraud.backend.entity.AppUser;
import com.bankingfraud.backend.exception.ApplicationException;
import com.bankingfraud.backend.repository.AppUserRepository;
import com.bankingfraud.backend.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AppUserRepository appUserRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder) {

        this.appUserRepository = appUserRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (appUserRepository.findByEmail(email).isPresent()) {
            throw new ApplicationException(HttpStatus.CONFLICT, "Email is already registered");
        }

        String role = normalizeRole(request.getRole());

        AppUser user = AppUser.builder()
                .fullName(request.getFullName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        appUserRepository.save(user);

        String token =
                jwtUtil.generateToken(
                        user.getEmail(),
                        user.getRole());

        return new AuthResponse(
                token,
                user.getRole(),
                user.getFullName());
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        AppUser user =
                appUserRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new ApplicationException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordMatches(request.getPassword(), user.getPassword())) {
            throw new ApplicationException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new ApplicationException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        String role = normalizeRole(user.getRole());

        String token =
                jwtUtil.generateToken(
                        user.getEmail(),
                        role);

        return new AuthResponse(
                token,
                role,
                user.getFullName());
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null) {
            return false;
        }

        if (storedPassword.startsWith("$2a$")
                || storedPassword.startsWith("$2b$")
                || storedPassword.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        return storedPassword.equals(rawPassword);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "ANALYST";
        }

        String normalizedRole = role.trim().toUpperCase(Locale.ROOT);
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring("ROLE_".length());
        }

        return normalizedRole;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ApplicationException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }
}
