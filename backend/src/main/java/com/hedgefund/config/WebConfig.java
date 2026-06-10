package com.hedgefund.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * MVC-level config placeholder. CORS is now configured in {@link SecurityConfig}
 * so the security filter chain honors it on both authenticated and pre-flight requests.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
}

