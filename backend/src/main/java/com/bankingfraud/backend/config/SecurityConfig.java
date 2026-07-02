package com.bankingfraud.backend.config;

import org.springframework.http.HttpMethod;
import com.bankingfraud.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    String allowedOrigins = System.getenv().getOrDefault(
                            "FRONTEND_ALLOWED_ORIGINS",
                            "http://localhost:5173"
                    );

                    config.setAllowedOrigins(
                            Arrays.stream(allowedOrigins.split(","))
                                    .map(String::trim)
                                    .filter(origin -> !origin.isBlank())
                                    .toList()
                    );
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setExposedHeaders(List.of("Authorization"));
                    config.setAllowCredentials(true);
                    return config;
                }))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Public
                        .requestMatchers("/api/auth/**").permitAll()

                        // WebSocket / SockJS
                        .requestMatchers("/ws").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/ws/info").permitAll()
                        .requestMatchers("/ws/info/**").permitAll()

                        // Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/fraud-rules/**").hasRole("ADMIN")
                        .requestMatchers("/api/import/**").hasRole("ADMIN")

                        // Admin + Analyst
                        .requestMatchers("/api/transactions/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/accounts/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/fraud-alerts/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/fraud-cases/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/customer-360/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/audit-logs/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/audit-trail/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/copilot/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/investigation-assistant/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/high-risk-locations/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/ai-explanations/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers("/api/account-locks/**").hasAnyRole("ADMIN", "ANALYST")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
