package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.Notification;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepo extends JpaRepository<Notification, Integer> {
    List<Notification> findByProfile(Profile profile);
    List<Notification> findByProfileOrderByScheduledDateDesc(Profile profile);
}
