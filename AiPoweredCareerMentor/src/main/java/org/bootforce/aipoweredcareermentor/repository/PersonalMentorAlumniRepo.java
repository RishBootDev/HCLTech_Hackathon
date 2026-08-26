package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.PersonalMentorAlumni;
import org.bootforce.aipoweredcareermentor.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PersonalMentorAlumniRepo extends JpaRepository<PersonalMentorAlumni, Integer> {

    List<PersonalMentorAlumni> findByAvailable(boolean available);

    List<PersonalMentorAlumni> findByCourseId(Integer courseId);

    Optional<PersonalMentorAlumni> findByUser(User user);
    Optional<PersonalMentorAlumni> findByEmail(String email);
    Optional<PersonalMentorAlumni> findByUserEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT m.id FROM PersonalMentorAlumni m WHERE m.user.id = :userId")
    Optional<Integer> findMentorIdByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
