package com.hedgefund.config;

import com.hedgefund.model.User;
import com.hedgefund.repository.UserRepository;
import com.hedgefund.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(10)
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserRepository userRepository;
    private final UserService userService;

    @Value("${app.auth.default-admin.username}")
    private String adminUsername;

    @Value("${app.auth.default-admin.password}")
    private String adminPassword;

    public AdminAccountInitializer(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        userService.register(adminUsername, adminPassword, User.Role.ADMIN);
        log.warn("===========================================================");
        log.warn("Bootstrapped default ADMIN user '{}'.", adminUsername);
        log.warn("Change the password immediately or override via APP_ADMIN_USERNAME / APP_ADMIN_PASSWORD env vars.");
        log.warn("===========================================================");
    }
}
