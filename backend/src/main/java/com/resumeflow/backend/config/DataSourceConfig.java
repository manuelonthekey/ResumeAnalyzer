package com.resumeflow.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() throws URISyntaxException {
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            // Fallback for local development if DATABASE_URL is not set
            return DataSourceBuilder.create()
                    .url("jdbc:postgresql://localhost:5433/ResumeFlow")
                    .username("postgres")
                    .password("1234567890")
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }

        // Parse postgresql://user:password@host:port/dbname format provided by Render/Neon
        // Remove 'jdbc:' if the user accidentally added it based on previous instructions
        String cleanUrl = databaseUrl.replaceFirst("^jdbc:", "");
        URI dbUri = new URI(cleanUrl);

        String username = dbUri.getUserInfo().split(":")[0];
        String password = dbUri.getUserInfo().split(":")[1];
        
        // Reconstruct the JDBC URL correctly without credentials embedded
        String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + 
                       (dbUri.getPort() != -1 ? ":" + dbUri.getPort() : "") + 
                       dbUri.getPath() + 
                       (dbUri.getQuery() != null ? "?" + dbUri.getQuery() : "");

        return DataSourceBuilder.create()
                .url(dbUrl)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
