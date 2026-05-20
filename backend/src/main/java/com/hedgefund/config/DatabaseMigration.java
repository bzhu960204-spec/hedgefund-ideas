package com.hedgefund.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Drops stale Hibernate-generated CHECK constraints on the ideas.action column.
 * Needed when the Action enum values change — ddl-auto:update does not modify
 * existing CHECK constraints, so old ones must be removed manually.
 */
@Component
public class DatabaseMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Drop any auto-named CHECK constraint on ideas.action (H2 names them CONSTRAINT_N)
        try {
            jdbcTemplate.execute(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
                "WHERE TABLE_NAME = 'IDEAS' AND CONSTRAINT_TYPE = 'CHECK'"
            );
            // Drop all CHECK constraints on the IDEAS table
            jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
                "WHERE TABLE_NAME = 'IDEAS' AND CONSTRAINT_TYPE = 'CHECK'",
                String.class
            ).forEach(name ->
                jdbcTemplate.execute("ALTER TABLE IDEAS DROP CONSTRAINT IF EXISTS \"" + name + "\"")
            );
        } catch (Exception ignored) {
            // Table may not exist yet on first run
        }
    }
}
