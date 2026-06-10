package com.hedgefund.controller;

import com.hedgefund.dto.auth.LoginRequest;
import com.hedgefund.dto.auth.LoginResponse;
import com.hedgefund.dto.auth.RegisterRequest;
import com.hedgefund.dto.auth.UserDTO;
import com.hedgefund.exception.ResourceNotFoundException;
import com.hedgefund.model.User;
import com.hedgefund.repository.UserRepository;
import com.hedgefund.security.JwtTokenProvider;
import com.hedgefund.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserService userService,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUsername()));

        String token = tokenProvider.createToken(user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(new LoginResponse(
                token, user.getUsername(), user.getRole().name(), tokenProvider.getExpirationMs()
        ));
    }

    /**
     * Self-service registration creates regular USER accounts only.
     * Disable or restrict this endpoint in production if you want invite-only signup.
     */
    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request.getUsername(), request.getPassword(), User.Role.USER);
        return ResponseEntity.ok(new UserDTO(user.getId(), user.getUsername(), user.getRole().name()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> me(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));
        return ResponseEntity.ok(new UserDTO(user.getId(), user.getUsername(), user.getRole().name()));
    }
}
