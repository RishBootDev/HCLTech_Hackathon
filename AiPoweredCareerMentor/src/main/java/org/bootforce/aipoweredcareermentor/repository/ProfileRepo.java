package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProfileRepo extends JpaRepository<Profile, Integer> {
    Optional<Profile> findByUser(User user);
    Optional<Profile> findByEmail(String email);
    Optional<Profile> findByUserEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT p.humanMentor.user.id FROM Profile p WHERE p.user.id = :userId")
    Optional<Long> findMentorUserIdByStudentUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT p.humanMentor.id FROM Profile p WHERE p.user.id = :userId")
    Optional<Integer> findMentorIdByStudentUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
