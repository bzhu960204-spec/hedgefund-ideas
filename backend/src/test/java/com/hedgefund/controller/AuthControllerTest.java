package com.hedgefund.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hedgefund.dto.auth.LoginRequest;
import com.hedgefund.dto.auth.RegisterRequest;
import com.hedgefund.model.User;
import com.hedgefund.repository.UserRepository;
import com.hedgefund.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;
    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;

    @BeforeEach
    void wipe() {
        userRepository.deleteAll();
    }

    @Test
    void login_returnsTokenForValidCredentials() throws Exception {
        userService.register("alice", "password1", User.Role.USER);
        LoginRequest req = new LoginRequest();
        req.setUsername("alice");
        req.setPassword("password1");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void login_rejectsBadPassword() throws Exception {
        userService.register("bob", "rightpass", User.Role.USER);
        LoginRequest req = new LoginRequest();
        req.setUsername("bob");
        req.setPassword("wrongpass");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void register_validatesPasswordLength() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("charlie");
        req.setPassword("123");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void protectedEndpoint_rejectsAnonymous() throws Exception {
        mvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_acceptsValidToken() throws Exception {
        userService.register("dave", "password1", User.Role.USER);
        LoginRequest req = new LoginRequest();
        req.setUsername("dave");
        req.setPassword("password1");

        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();
        String token = mapper.readTree(body).get("token").asText();

        mvc.perform(get("/api/dashboard/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
