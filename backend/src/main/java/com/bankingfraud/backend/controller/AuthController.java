package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.dto.AuthResponse;
import com.bankingfraud.backend.dto.LoginRequest;
import com.bankingfraud.backend.dto.RegisterRequest;
import com.bankingfraud.backend.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(
            @RequestBody RegisterRequest request) {

        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @RequestBody LoginRequest request) {

        return authService.login(request);
    }
}