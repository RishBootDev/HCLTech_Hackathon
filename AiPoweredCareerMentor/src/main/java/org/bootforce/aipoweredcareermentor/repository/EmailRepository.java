package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.Email;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailRepository extends JpaRepository<Email, Integer> {
    List<Email> findByProfile(Profile profile);
    List<Email> findByProfileOrderBySentAtDesc(Profile profile);
}
