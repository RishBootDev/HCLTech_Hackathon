package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Ensuring database table quiz_questions_mapping exists...");
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS quiz_questions_mapping (" +
                "quiz_id INT NOT NULL, " +
                "question_id INT NOT NULL, " +
                "PRIMARY KEY (quiz_id, question_id)" +
                ")"
            );
            log.info("quiz_questions_mapping table check completed successfully.");
        } catch (Exception e) {
            log.error("Error initializing quiz_questions_mapping table: {}", e.getMessage(), e);
        }
    }
}

