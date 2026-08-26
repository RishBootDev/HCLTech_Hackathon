package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.Notification;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.repository.NotificationRepo;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepo notificationRepo;
    private final ProfileRepo profileRepo;

    @Transactional
    public Notification saveNotification(Profile profile, String title, String message) {
        Notification notification = Notification.builder()
                .profile(profile)
                .title(title)
                .message(message)
                .scheduledDate(LocalDate.now())
                .build();
        return notificationRepo.save(notification);
    }

    public List<Notification> getNotificationsForProfile(Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return notificationRepo.findByProfile(profile);
    }

    @Transactional
    public Notification createForProfile(Integer profileId, String title, String message) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return saveNotification(profile, title, message);
    }

    @Transactional
    public void deleteNotification(Integer notificationId) {
        if (!notificationRepo.existsById(notificationId)) {
            throw new ResourceNotFoundException("Notification not found: " + notificationId);
        }
        notificationRepo.deleteById(notificationId);
    }

    @Transactional
    public void deleteAllForProfile(Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        List<Notification> notifications = notificationRepo.findByProfile(profile);
        notificationRepo.deleteAll(notifications);
    }
}
