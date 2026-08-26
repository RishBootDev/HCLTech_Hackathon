package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.Email;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.repository.EmailRepository;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailRepository emailRepository;
    private final ProfileRepo profileRepo;

    @Transactional
    public Email sendEmail(Integer profileId, String subject, String content) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));

        Email email = Email.builder()
                .subject(subject)
                .content(content)
                .profile(profile)
                .build();

        log.info("Email recorded for profile {}: {}", profileId, subject);
        return emailRepository.save(email);
    }

    public List<Email> getEmailsForProfile(Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return emailRepository.findByProfile(profile);
    }

    @Transactional
    public void deleteEmail(Long emailId) {
        if (!emailRepository.existsById(Math.toIntExact(emailId))) {
            throw new ResourceNotFoundException("Email not found: " + emailId);
        }
        emailRepository.deleteById(Math.toIntExact(emailId));
    }
}
