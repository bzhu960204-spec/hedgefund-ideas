package com.hedgefund.service;

import com.hedgefund.exception.BadRequestException;
import com.hedgefund.model.User;
import com.hedgefund.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class UserServiceTest {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @BeforeEach
    void wipe() {
        userRepository.deleteAll();
    }

    @Test
    void register_hashesPasswordAndPersistsUser() {
        User user = userService.register("alice", "secretpw", User.Role.USER);

        assertThat(user.getId()).isNotNull();
        assertThat(user.getPasswordHash()).isNotEqualTo("secretpw");
        assertThat(passwordEncoder.matches("secretpw", user.getPasswordHash())).isTrue();
        assertThat(user.getRole()).isEqualTo(User.Role.USER);
        assertThat(user.isEnabled()).isTrue();
    }

    @Test
    void register_rejectsDuplicateUsername() {
        userService.register("bob", "password1", User.Role.USER);
        assertThatThrownBy(() -> userService.register("bob", "password2", User.Role.USER))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exists");
    }
}
