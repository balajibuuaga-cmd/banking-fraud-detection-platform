package com.bankingfraud.backend.controller;

import com.bankingfraud.backend.entity.AppUser;
import com.bankingfraud.backend.repository.AppUserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class AppUserController {

    private final AppUserRepository appUserRepository;

    public AppUserController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getUsers() {
        return appUserRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PutMapping("/{id}/role")
    public Map<String, Object> updateRole(
            @PathVariable Long id,
            @RequestParam String role) {

        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(role);
        return toResponse(appUserRepository.save(user));
    }

    @PutMapping("/{id}/active")
    public Map<String, Object> updateActive(
            @PathVariable Long id,
            @RequestParam Boolean active) {

        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(active);
        return toResponse(appUserRepository.save(user));
    }

    private Map<String, Object> toResponse(AppUser user) {
        Map<String, Object> response = new HashMap<>();

        response.put("id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("active", user.getActive() == null || user.getActive());

        return response;
    }
}
