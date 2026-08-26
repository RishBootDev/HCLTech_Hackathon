package org.bootforce.aipoweredcareermentor.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.context.annotation.Scope;

import java.time.LocalDate;

@Entity
@Table(name = "emails")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Email {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subject;
    private String content;
    private LocalDate sentAt = LocalDate.now();

    @ManyToOne
    @JoinColumn(name = "profile_id")
    private Profile profile;
}
